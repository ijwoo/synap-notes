/** degree(연결 수) → 노드 반지름 */
export function nodeRadius(degree: number): number {
  return Math.min(9 + Math.sqrt(Math.max(0, degree)) * 4.5, 24);
}
