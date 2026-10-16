package com.synap.comment.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public final class CommentDtos {

    public record CommentRequest(@NotBlank String body) {
    }

    public record CommentDto(Long id, String body, String authorName, boolean mine, Instant createdAt) {
    }

    private CommentDtos() {
    }
}
