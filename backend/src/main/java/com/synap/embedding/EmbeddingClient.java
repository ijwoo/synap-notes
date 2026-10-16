package com.synap.embedding;

/**
 * 텍스트를 고정 차원의 임베딩 벡터로 변환하는 추상화.
 * 기본 구현은 키가 필요 없는 {@link DummyEmbeddingClient}이며,
 * {@code app.embedding.provider=openai} 로 전환하면 {@link OpenAiEmbeddingClient} 가 쓰인다.
 */
public interface EmbeddingClient {

    /**
     * @param text 임베딩할 텍스트
     * @return 길이 {@link #dimensions()} 의 벡터 (L2 정규화됨)
     */
    float[] embed(String text);

    /** 임베딩 벡터 차원 (예: 1536) */
    int dimensions();
}
