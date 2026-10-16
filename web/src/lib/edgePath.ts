/**
 * 두 점을 잇는 부드러운 곡선(quadratic bezier) path.
 * 중점을 수직 방향으로 살짝 밀어 곡률을 준다.
 */
export function curvePath(x1: number, y1: number, x2: number, y2: number, curvature = 0.18): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // 수직 단위벡터 * 거리 비례 오프셋
  const offset = Math.hypot(dx, dy) * curvature;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/** curvePath와 동일한 곡선의 제어점(canvas quadraticCurveTo 용). */
export function curveControl(x1: number, y1: number, x2: number, y2: number, curvature = 0.18) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const offset = len * curvature;
  return { cx: mx + (-dy / len) * offset, cy: my + (dx / len) * offset };
}

export function edgeWidth(similarity: number): number {
  return 1 + similarity * 3;
}

export function edgeOpacity(similarity: number): number {
  return 0.15 + similarity * 0.5;
}
