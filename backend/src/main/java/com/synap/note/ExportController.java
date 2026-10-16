package com.synap.note;

import com.synap.auth.CurrentUser;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/** 데이터 내보내기(데이터 소유권). 내 노트 전체를 본문까지 JSON으로. */
@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final NoteRepository notes;

    public ExportController(NoteRepository notes) {
        this.notes = notes;
    }

    @GetMapping("/notes")
    public List<ExportNote> notes() {
        return notes.findByUserIdOrderByUpdatedAtDesc(CurrentUser.id()).stream()
                .map(ExportNote::from)
                .toList();
    }

    public record ExportNote(
            Long id, String title, String body, String topic,
            String visibility, Long spaceId, boolean imported,
            Instant createdAt, Instant updatedAt
    ) {
        static ExportNote from(Note n) {
            return new ExportNote(n.getId(), n.getTitle(), n.getBody(), n.getTopic(),
                    n.getVisibility(), n.getSpaceId(), n.getSourceNoteId() != null,
                    n.getCreatedAt(), n.getUpdatedAt());
        }
    }
}
