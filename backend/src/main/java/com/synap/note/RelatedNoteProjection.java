package com.synap.note;

/** related 조회 결과: 연결된 노트의 요약 + 유사도(0~1). */
public interface RelatedNoteProjection {
    Long getId();

    String getTitle();

    String getTopic();

    double getSimilarity();
}
