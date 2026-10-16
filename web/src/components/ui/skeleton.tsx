import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

/** 노트/결과 카드 형태의 스켈레톤 */
export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
