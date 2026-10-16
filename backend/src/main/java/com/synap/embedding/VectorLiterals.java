package com.synap.embedding;

import java.math.BigDecimal;

/** float[] 임베딩을 pgvector 가 파싱하는 텍스트 리터럴("[a,b,c]")로 변환한다. */
public final class VectorLiterals {

    private VectorLiterals() {
    }

    public static String toLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 8 + 2);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            // toPlainString 으로 지수 표기(1.0E-4 등)를 피해 pgvector 파싱 오류를 방지
            sb.append(new BigDecimal(Float.toString(vector[i])).toPlainString());
        }
        sb.append(']');
        return sb.toString();
    }
}
