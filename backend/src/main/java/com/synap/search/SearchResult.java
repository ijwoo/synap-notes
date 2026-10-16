package com.synap.search;

/** 검색 결과(작성자 포함). similarity 0~1. */
public record SearchResult(
        Long id,
        String title,
        String topic,
        double similarity,
        Long ownerId,
        String ownerName,
        boolean mine
) {
}
