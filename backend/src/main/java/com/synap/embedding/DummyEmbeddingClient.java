package com.synap.embedding;

import com.synap.config.EmbeddingProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * 키 없이 동작하는 결정적 더미 임베딩.
 *
 * <p>bag-of-hashed-words + 문자 트라이그램 방식: 텍스트를 토큰화하여 각 단어와 단어의
 * 문자 3-gram 을 해시 버킷에 누적한 뒤 L2 정규화한다. 따라서</p>
 * <ul>
 *   <li>같은 입력 → 항상 같은 벡터 (결정적)</li>
 *   <li>겹치는 단어/형태가 많을수록 코사인 유사도가 높아짐 (의미 기반 링크 흉내)</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(name = "app.embedding.provider", havingValue = "dummy", matchIfMissing = true)
public class DummyEmbeddingClient implements EmbeddingClient {

    private final int dimensions;

    public DummyEmbeddingClient(EmbeddingProperties properties) {
        this.dimensions = properties.dimensions();
    }

    @Override
    public float[] embed(String text) {
        float[] vec = new float[dimensions];
        if (text == null || text.isBlank()) {
            return vec;
        }

        String normalized = text.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{Nd}]+", " ")
                .trim();

        for (String token : normalized.split("\\s+")) {
            if (token.isEmpty()) {
                continue;
            }
            // 단어 자체를 하나의 피처로
            addFeature(vec, token);
            // 형태 변형(임베딩/임베딩으로 등)도 겹치도록 문자 3-gram 추가
            if (token.length() >= 3) {
                for (int i = 0; i + 3 <= token.length(); i++) {
                    addFeature(vec, token.substring(i, i + 3));
                }
            }
        }

        normalizeL2(vec);
        return vec;
    }

    private void addFeature(float[] vec, String feature) {
        int bucket = Math.floorMod(stableHash(feature), dimensions);
        vec[bucket] += 1.0f;
    }

    /** String.hashCode 는 JVM 간 안정적이지만 명시적으로 구현해 결정성을 분명히 한다. */
    private int stableHash(String s) {
        int h = 0;
        for (int i = 0; i < s.length(); i++) {
            h = 31 * h + s.charAt(i);
        }
        return h;
    }

    private void normalizeL2(float[] vec) {
        double sumSq = 0.0;
        for (float v : vec) {
            sumSq += (double) v * v;
        }
        if (sumSq == 0.0) {
            return;
        }
        float norm = (float) Math.sqrt(sumSq);
        for (int i = 0; i < vec.length; i++) {
            vec[i] /= norm;
        }
    }

    @Override
    public int dimensions() {
        return dimensions;
    }
}
