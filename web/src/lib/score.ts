// OpenAI 임베딩은 무관한 텍스트도 코사인 ~0.3 베이스라인이 깔린다.
// 표시용 점수를 [FLOOR, CEIL] → [0, 1] 로 재스케일해 "40% 인데 무관" 문제를 없앤다.
export const SIM_FLOOR = 0.3;
export const SIM_CEIL = 0.8;

/** 원시 코사인 → 직관적 표시 점수(0~1) */
export function displayScore(cos: number): number {
  const v = (cos - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR);
  return Math.max(0, Math.min(1, v));
}

/** 검색 등에서 무관한 결과를 거를 최소 코사인 */
export const SEARCH_MIN_COS = SIM_FLOOR;
