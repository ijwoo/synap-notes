package com.synap.note;

/** 검색 결과 행(소유자 포함). */
public interface SearchRow {
    Long getId();

    String getTitle();

    String getTopic();

    double getSimilarity();

    Long getOwnerId();

    String getOwnerName();
}
