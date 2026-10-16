package com.synap.embedding;

import com.synap.config.EmbeddingProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * OpenAI text-embedding-3-small (기본 1536차원) 구현.
 * {@code app.embedding.provider=openai} 이고 OPENAI_API_KEY 가 설정됐을 때 활성.
 */
@Component
@ConditionalOnProperty(name = "app.embedding.provider", havingValue = "openai")
public class OpenAiEmbeddingClient implements EmbeddingClient {

    private final RestClient restClient;
    private final String model;
    private final int dimensions;

    public OpenAiEmbeddingClient(EmbeddingProperties properties) {
        EmbeddingProperties.OpenAi cfg = properties.openai();
        if (cfg == null || cfg.apiKey() == null || cfg.apiKey().isBlank()) {
            throw new IllegalStateException(
                    "OPENAI_API_KEY is required when app.embedding.provider=openai");
        }
        this.model = cfg.model();
        this.dimensions = properties.dimensions();
        this.restClient = RestClient.builder()
                .baseUrl(cfg.baseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + cfg.apiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public float[] embed(String text) {
        EmbeddingResponse response = restClient.post()
                .uri("/embeddings")
                .body(Map.of(
                        "model", model,
                        "input", text,
                        "dimensions", dimensions
                ))
                .retrieve()
                .body(EmbeddingResponse.class);

        if (response == null || response.data() == null || response.data().isEmpty()) {
            throw new IllegalStateException("Empty embedding response from OpenAI");
        }
        return response.data().get(0).embedding();
    }

    @Override
    public int dimensions() {
        return dimensions;
    }

    private record EmbeddingResponse(List<Data> data) {
        private record Data(float[] embedding) {
        }
    }
}
