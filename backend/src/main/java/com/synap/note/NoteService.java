package com.synap.note;

import com.synap.auth.CurrentUser;
import com.synap.auth.User;
import com.synap.auth.UserRepository;
import com.synap.config.LinkingProperties;
import com.synap.embedding.EmbeddingClient;
import com.synap.embedding.VectorLiterals;
import com.synap.note.dto.NoteRequest;
import com.synap.note.dto.NoteResponse;
import com.synap.note.dto.NoteSummary;
import com.synap.note.dto.RelatedNote;
import com.synap.space.SpaceMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class NoteService {

    private static final Set<String> VISIBILITIES = Set.of("private", "space", "public");

    private final NoteRepository noteRepository;
    private final NoteLinkRepository noteLinkRepository;
    private final NoteManualLinkRepository manualLinks;
    private final SpaceMemberRepository spaceMembers;
    private final UserRepository users;
    private final EmbeddingClient embeddingClient;
    private final LinkingProperties linking;

    public NoteService(NoteRepository noteRepository,
                       NoteLinkRepository noteLinkRepository,
                       NoteManualLinkRepository manualLinks,
                       SpaceMemberRepository spaceMembers,
                       UserRepository users,
                       EmbeddingClient embeddingClient,
                       LinkingProperties linking) {
        this.noteRepository = noteRepository;
        this.noteLinkRepository = noteLinkRepository;
        this.manualLinks = manualLinks;
        this.spaceMembers = spaceMembers;
        this.users = users;
        this.embeddingClient = embeddingClient;
        this.linking = linking;
    }

    // ---- 수동 링크 ----

    @Transactional(readOnly = true)
    public List<LinkDto> listLinks(long noteId) {
        requireOwnerById(noteId, CurrentUser.id());
        return manualLinks.findLinked(noteId).stream().map(l -> new LinkDto(l.getId(), l.getTitle())).toList();
    }

    @Transactional
    public void addLink(long noteId, long targetId) {
        long uid = CurrentUser.id();
        if (noteId == targetId) return;
        requireOwnerById(noteId, uid);
        requireOwnerById(targetId, uid);
        if (!manualLinks.existsEitherWay(noteId, targetId)) {
            manualLinks.save(new NoteManualLink(noteId, targetId));
        }
    }

    @Transactional
    public void removeLink(long noteId, long targetId) {
        requireOwnerById(noteId, CurrentUser.id());
        manualLinks.deleteEitherWay(noteId, targetId);
    }

    private void requireOwnerById(long noteId, long uid) {
        requireOwner(noteRepository.findById(noteId).orElseThrow(NoteService::notFound), uid);
    }

    public record LinkDto(Long id, String title) {
    }

    @Transactional(readOnly = true)
    public List<NoteSummary> list() {
        return noteRepository.findByUserIdOrderByUpdatedAtDesc(CurrentUser.id()).stream()
                .map(NoteSummary::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse get(long id) {
        long uid = CurrentUser.id();
        Note note = noteRepository.findById(id).orElseThrow(NoteService::notFound);
        if (!canView(note, uid)) {
            throw notFound(); // 존재 누설 방지: 권한 없으면 404
        }
        String ownerName = users.findById(note.getUserId()).map(User::getDisplayName).orElse(null);
        String sourceAuthorName = note.getSourceAuthorId() == null ? null
                : users.findById(note.getSourceAuthorId()).map(User::getDisplayName).orElse(null);
        return NoteResponse.from(note, isOwner(note, uid), ownerName, sourceAuthorName);
    }

    @Transactional
    public NoteResponse create(NoteRequest request) {
        long uid = CurrentUser.id();
        String visibility = normalizeVisibility(request.visibility());
        Long spaceId = resolveSpace(visibility, request.spaceId(), uid);
        Note note = noteRepository.saveAndFlush(
                new Note(uid, resolveTitle(request.title(), request.body()), request.body(), request.topic(), visibility, spaceId));
        embedAndRelink(note);
        return NoteResponse.from(note, true, null, null);
    }

    @Transactional
    public NoteResponse update(long id, NoteRequest request) {
        long uid = CurrentUser.id();
        Note note = noteRepository.findById(id).orElseThrow(NoteService::notFound);
        requireOwner(note, uid);
        String visibility = normalizeVisibility(request.visibility());
        // 가져온 노트(출처 있음)는 공개 불가 — 같은 내용의 커뮤니티 중복 방지
        if (note.getSourceNoteId() != null && "public".equals(visibility)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "가져온 노트는 커뮤니티에 공개할 수 없어요.");
        }
        Long spaceId = resolveSpace(visibility, request.spaceId(), uid);
        note.update(resolveTitle(request.title(), request.body()), request.body(), request.topic(), visibility, spaceId);
        noteRepository.saveAndFlush(note);
        embedAndRelink(note);
        return NoteResponse.from(note, true, null, null);
    }

    /** 남의(또는 공개/스페이스) 노트를 내 노트로 복제해 담는다 → 내 개인 그래프에 자동 연결. */
    @Transactional
    public NoteResponse saveCopy(long id) {
        long uid = CurrentUser.id();
        Note src = noteRepository.findById(id).orElseThrow(NoteService::notFound);
        if (!canView(src, uid)) {
            throw notFound();
        }
        Note copy = new Note(uid, src.getTitle(), src.getBody(), src.getTopic(), "private", null);
        copy.markImportedFrom(src.getId(), src.getUserId());
        copy = noteRepository.saveAndFlush(copy);
        embedAndRelink(copy);
        return NoteResponse.from(copy, true, null, null);
    }

    @Transactional
    public void delete(long id) {
        long uid = CurrentUser.id();
        Note note = noteRepository.findById(id).orElseThrow(NoteService::notFound);
        requireOwner(note, uid);
        noteRepository.deleteById(id);
    }

    /** 개인 백링크: 소유자 본인만. */
    @Transactional(readOnly = true)
    public List<RelatedNote> related(long id) {
        long uid = CurrentUser.id();
        Note note = noteRepository.findById(id).orElseThrow(NoteService::notFound);
        requireOwner(note, uid);
        return noteLinkRepository.findRelated(id).stream()
                .map(p -> new RelatedNote(p.getId(), p.getTitle(), p.getTopic(), clamp(p.getSimilarity())))
                .toList();
    }

    /** 본문 임베딩 후, 같은 소유자 노트 중 임계값 이상 이웃과 양방향 링크 재생성. */
    private void embedAndRelink(Note note) {
        long id = note.getId();
        float[] vector = embeddingClient.embed(note.getTitle() + "\n" + note.getBody());
        String literal = VectorLiterals.toLiteral(vector);
        noteRepository.updateEmbedding(id, literal);

        noteLinkRepository.deleteAllInvolving(id);

        List<SimilarityProjection> neighbors =
                noteRepository.findNearestForUser(literal, note.getUserId(), id, linking.topK());
        for (SimilarityProjection n : neighbors) {
            double sim = clamp(n.getSimilarity());
            if (sim < linking.threshold()) {
                continue;
            }
            long other = n.getId();
            noteLinkRepository.upsert(id, other, (float) sim);
            noteLinkRepository.upsert(other, id, (float) sim);
        }
    }

    // ---- visibility helpers ----

    private boolean isOwner(Note n, long uid) {
        return n.getUserId() != null && n.getUserId() == uid;
    }

    private boolean canView(Note n, long uid) {
        if (isOwner(n, uid)) return true;
        if ("public".equals(n.getVisibility())) return true;
        return "space".equals(n.getVisibility())
                && n.getSpaceId() != null
                && spaceMembers.existsByIdSpaceIdAndIdUserId(n.getSpaceId(), uid);
    }

    private void requireOwner(Note n, long uid) {
        if (!isOwner(n, uid)) {
            throw notFound();
        }
    }

    private String normalizeVisibility(String v) {
        String vis = (v == null || v.isBlank()) ? "private" : v;
        if (!VISIBILITIES.contains(vis)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid visibility: " + vis);
        }
        return vis;
    }

    private Long resolveSpace(String visibility, Long spaceId, long uid) {
        if (!"space".equals(visibility)) {
            return null;
        }
        if (spaceId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "spaceId required for visibility=space");
        }
        if (!spaceMembers.existsByIdSpaceIdAndIdUserId(spaceId, uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of space " + spaceId);
        }
        return spaceId;
    }

    /** 제목이 비면 본문 첫 줄로 자동 생성. */
    private static String resolveTitle(String title, String body) {
        if (title != null && !title.isBlank()) {
            return title.trim();
        }
        String first = body == null ? "" : body.strip().lines().findFirst().orElse("").strip();
        if (first.isBlank()) {
            return "무제";
        }
        return first.length() > 60 ? first.substring(0, 60) : first;
    }

    private static double clamp(double v) {
        if (v < 0.0) return 0.0;
        return Math.min(v, 1.0);
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
    }
}
