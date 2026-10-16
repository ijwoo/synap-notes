package com.synap.note.dto;

import jakarta.validation.constraints.NotBlank;

/** 노트 생성/수정 요청. 제목은 비우면 본문 첫 줄로 자동 생성. visibility: private|space|public(기본 private). */
public record NoteRequest(
        String title,
        @NotBlank String body,
        String topic,
        String visibility,
        Long spaceId
) {
}
