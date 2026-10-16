package com.synap.search;

import com.synap.auth.CurrentUser;
import com.synap.config.LinkingProperties;
import com.synap.embedding.EmbeddingClient;
import com.synap.embedding.VectorLiterals;
import com.synap.note.NoteRepository;
import com.synap.note.SearchRow;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final EmbeddingClient embeddingClient;
    private final NoteRepository noteRepository;
    private final LinkingProperties linking;

    public SearchController(EmbeddingClient embeddingClient, NoteRepository noteRepository,
                           LinkingProperties linking) {
        this.embeddingClient = embeddingClient;
        this.noteRepository = noteRepository;
        this.linking = linking;
    }

    @PostMapping
    @Transactional(readOnly = true)
    public List<SearchResult> search(@Valid @RequestBody SearchRequest request) {
        long uid = CurrentUser.id();
        String literal = VectorLiterals.toLiteral(embeddingClient.embed(request.q()));
        int k = linking.topK();
        String scope = request.scope() == null ? "mine" : request.scope();

        List<SearchRow> rows = switch (scope) {
            case "spaces" -> noteRepository.searchSpaces(literal, uid, k);
            case "public" -> noteRepository.searchPublic(literal, k);
            default -> noteRepository.searchMine(literal, uid, k);
        };

        return rows.stream()
                .map(r -> new SearchResult(r.getId(), r.getTitle(), r.getTopic(), clamp(r.getSimilarity()),
                        r.getOwnerId(), r.getOwnerName(), r.getOwnerId() != null && r.getOwnerId() == uid))
                .toList();
    }

    private static double clamp(double v) {
        if (v < 0.0) return 0.0;
        return Math.min(v, 1.0);
    }
}
