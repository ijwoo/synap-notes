package com.synap.note.dto;

import com.synap.note.Note;

import java.time.Instant;

/** 노트 목록 항목(본문 제외). imported = 다른 사람 노트를 담아온 것. */
public record NoteSummary(
        Long id,
        String title,
        String topic,
        String visibility,
        Long spaceId,
        boolean imported,
        Instant updatedAt
) {
    public static NoteSummary from(Note note) {
        return new NoteSummary(note.getId(), note.getTitle(), note.getTopic(),
                note.getVisibility(), note.getSpaceId(), note.getSourceNoteId() != null, note.getUpdatedAt());
    }
}
