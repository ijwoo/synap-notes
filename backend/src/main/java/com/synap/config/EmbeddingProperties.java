package com.synap.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.embedding")
public record EmbeddingProperties(
        String provider,
        int dimensions,
        OpenAi openai
) {
    public record OpenAi(String apiKey, String model, String baseUrl) {
    }
}
