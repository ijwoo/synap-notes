import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { synap } from '../../api/synap';
import type { SearchResult } from '../../types';
import { SEARCH_MIN_COS } from '../../lib/score';
import SimilarityBar from '../../components/ui/SimilarityBar';
import { Sparkles } from '../../lib/icons';

/**
 * 쓰는 동안 드래프트를 임베딩해 의미가 가까운 내 노트를 실시간 제안.
 * 이미 연결된(백링크) 노트와 현재 노트는 제외 → "아직 안 이어진 관련 노트"만.
 */
export default function RelatedSuggestions({
  title,
  body,
  excludeIds,
}: {
  title: string;
  body: string;
  excludeIds: Set<number>;
}) {
  const [raw, setRaw] = useState<SearchResult[]>([]);
  const seq = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const text = `${title}\n${body}`.trim();
    if (body.trim().length < 15) {
      setRaw([]);
      return;
    }
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const rows = await synap.search(text, 'mine');
        if (mine !== seq.current) return; // 최신 입력만 반영
        setRaw(rows.filter((r) => r.similarity >= SEARCH_MIN_COS));
      } catch {
        /* 무시 */
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [title, body]);

  // 제외(백링크/자기자신)는 렌더 시점에 적용 → 백링크가 늦게 로드돼도 즉시 반영
  const items = raw.filter((r) => !excludeIds.has(r.id)).slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles size={15} className="text-primary" />
        <span className="text-[13px] font-semibold">비슷한 노트</span>
        <span className="text-[12px] text-muted-foreground">· 쓰는 동안 자동 탐색</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => navigate(`/notes/${r.id}`)}
            className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-card/60 p-3 text-left transition-colors active:bg-secondary"
          >
            <span className="truncate text-[14.5px] font-semibold">{r.title}</span>
            <SimilarityBar value={r.similarity} />
          </button>
        ))}
      </div>
    </section>
  );
}
