package com.synap.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.linking")
public record LinkingProperties(
        int topK,
        double threshold
) {
}
