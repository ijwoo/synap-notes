import { useNavigate } from 'react-router-dom';
import type { RelatedNote } from '../../types';
import SimilarityBar from '../../components/ui/SimilarityBar';

export default function BacklinkSection({ related }: { related: RelatedNote[] | null }) {
  const navigate = useNavigate();
  if (related === null) return null;

  return (
    <section className="mt-7 border-t border-border pt-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-bold tracking-tight">임베딩 유사도로 자동 연결됨</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
          {related.length}
        </span>
      </div>
      {related.length === 0 ? (
        <p className="text-sm text-muted-foreground">저장하면 의미가 가까운 노트가 여기에 자동으로 연결됩니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {related.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/notes/${r.id}`)}
              className="flex flex-col gap-2.5 rounded-md bg-secondary p-3 text-left transition-colors active:bg-border"
            >
              <span className="truncate text-[15px] font-semibold">{r.title}</span>
              <SimilarityBar value={r.similarity} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
