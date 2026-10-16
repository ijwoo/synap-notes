package com.synap.note.dto;

import com.synap.note.Note;

import java.time.Instant;

/** 노트 응답(임베딩 벡터는 노출하지 않음). */
public record NoteResponse(
        Long id,
        String title,
        String body,
        String topic,
        String visibility,
        Long spaceId,
        Long ownerId,
        boolean mine,
        String ownerName,
        Long sourceNoteId,
        Long sourceAuthorId,
        String sourceAuthorName,
        Instant createdAt,
        Instant updatedAt
) {
    public static NoteResponse from(Note note, boolean mine, String ownerName, String sourceAuthorName) {
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getBody(),
                note.getTopic(),
                note.getVisibility(),
                note.getSpaceId(),
                note.getUserId(),
                mine,
                ownerName,
                note.getSourceNoteId(),
                note.getSourceAuthorId(),
                sourceAuthorName,
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
