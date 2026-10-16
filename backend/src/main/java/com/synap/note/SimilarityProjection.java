package com.synap.note;

/** kNN 결과의 노트 id 와 유사도(0~1). */
public interface SimilarityProjection {
    Long getId();

    double getSimilarity();
}
