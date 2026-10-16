package com.synap.note.dto;

/** related / search 응답 항목. similarity 는 0~1. */
public record RelatedNote(
        Long id,
        String title,
        String topic,
        double similarity
) {
}
