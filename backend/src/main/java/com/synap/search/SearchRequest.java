package com.synap.search;

import jakarta.validation.constraints.NotBlank;

/** scope: mine | spaces | public (기본 mine). */
public record SearchRequest(@NotBlank String q, String scope) {
}
