package com.synap.embedding;

import com.synap.config.EmbeddingProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DummyEmbeddingClientTest {

    private final DummyEmbeddingClient client =
            new DummyEmbeddingClient(new EmbeddingProperties("dummy", 1536, null));

    private static double cosine(float[] a, float[] b) {
        double dot = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
        }
        return dot; // 벡터가 L2 정규화되어 있으므로 내적 = 코사인
    }

    private static double norm(float[] v) {
        double s = 0;
        for (float x : v) {
            s += (double) x * x;
        }
        return Math.sqrt(s);
    }

    @Test
    void producesVectorOfConfiguredDimension() {
        assertThat(client.dimensions()).isEqualTo(1536);
        assertThat(client.embed("커피와 카페인")).hasSize(1536);
    }

    @Test
    void isDeterministic() {
        float[] a = client.embed("머신러닝 임베딩 벡터");
        float[] b = client.embed("머신러닝 임베딩 벡터");
        assertThat(a).containsExactly(b);
    }

    @Test
    void vectorsAreL2Normalized() {
        assertThat(norm(client.embed("등산은 좋은 운동이다"))).isCloseTo(1.0, org.assertj.core.data.Offset.offset(1e-5));
    }

    @Test
    void blankTextYieldsZeroVector() {
        assertThat(norm(client.embed("   "))).isEqualTo(0.0);
    }

    @Test
    void relatedTextHasHigherSimilarityThanUnrelated() {
        float[] coffee1 = client.embed("커피 카페인 에스프레소 추출");
        float[] coffee2 = client.embed("카페인 함량과 에스프레소 원두");
        float[] hiking = client.embed("등산 배낭 등산화 정상");

        double related = cosine(coffee1, coffee2);
        double unrelated = cosine(coffee1, hiking);

        assertThat(related).isGreaterThan(unrelated);
        assertThat(related).isGreaterThan(0.0);
    }
}
