package com.synap.comment;

import com.synap.auth.User;
import com.synap.auth.UserRepository;
import com.synap.comment.dto.CommentDtos.CommentDto;
import com.synap.note.Note;
import com.synap.note.NoteRepository;
import com.synap.notification.NotificationService;
import com.synap.space.SpaceMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final NoteCommentRepository comments;
    private final NoteRepository notes;
    private final SpaceMemberRepository spaceMembers;
    private final UserRepository users;
    private final NotificationService notifications;

    public CommentService(NoteCommentRepository comments, NoteRepository notes,
                          SpaceMemberRepository spaceMembers, UserRepository users,
                          NotificationService notifications) {
        this.comments = comments;
        this.notes = notes;
        this.spaceMembers = spaceMembers;
        this.users = users;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<CommentDto> list(long uid, long noteId) {
        requireCommentable(noteId, uid);
        var list = comments.findByNoteIdOrderByIdAsc(noteId);
        Map<Long, String> names = users.findAllById(list.stream().map(NoteComment::getAuthorId).toList())
                .stream().collect(Collectors.toMap(User::getId, User::getDisplayName));
        return list.stream()
                .map(c -> new CommentDto(c.getId(), c.getBody(),
                        names.getOrDefault(c.getAuthorId(), "?"), c.getAuthorId() == uid, c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public CommentDto add(long uid, long noteId, String body) {
        Note note = requireCommentable(noteId, uid);
        NoteComment c = comments.save(new NoteComment(noteId, uid, body.trim()));
        String name = users.findById(uid).map(User::getDisplayName).orElse("?");
        // 노트 주인에게 알림 (본인 노트면 create()가 스킵)
        if (note.getUserId() != null) {
            notifications.create(note.getUserId(), uid, "comment", name,
                    name + "님이 '" + note.getTitle() + "'에 댓글을 남겼어요", "/notes/" + noteId);
        }
        return new CommentDto(c.getId(), c.getBody(), name, true, c.getCreatedAt());
    }

    @Transactional
    public void delete(long uid, long commentId) {
        NoteComment c = comments.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글이 없어요."));
        boolean noteOwner = notes.findById(c.getNoteId()).map(n -> isOwner(n, uid)).orElse(false);
        if (c.getAuthorId() != uid && !noteOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "삭제 권한이 없어요.");
        }
        comments.deleteById(commentId);
    }

    /** 댓글 가능 = 노트 소유자거나, 스페이스 공유 노트의 멤버. (공개 글로벌 노트는 댓글 불가) */
    private Note requireCommentable(long noteId, long uid) {
        Note n = notes.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "노트가 없어요."));
        boolean ok = isOwner(n, uid)
                || ("space".equals(n.getVisibility()) && n.getSpaceId() != null
                && spaceMembers.existsByIdSpaceIdAndIdUserId(n.getSpaceId(), uid));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "노트가 없어요.");
        }
        return n;
    }

    private boolean isOwner(Note n, long uid) {
        return n.getUserId() != null && n.getUserId() == uid;
    }
}
