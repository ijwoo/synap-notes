import { displayScore } from '../../lib/score';

/** value = 원시 코사인(0~1). 표시는 베이스라인 보정된 점수로. */
export default function SimilarityBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.round(displayScore(value) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color ?? 'hsl(var(--primary))' }}
        />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}
