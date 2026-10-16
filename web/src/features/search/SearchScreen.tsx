import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { synap } from '../../api/synap';
import type { SearchResult, SearchScope } from '../../types';
import { SEARCH_MIN_COS } from '../../lib/score';
import SimilarityBar from '../../components/ui/SimilarityBar';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { CardSkeleton } from '../../components/ui/skeleton';
import NotificationBell from '../notifications/NotificationBell';
import { Search as SearchIcon } from '../../lib/icons';

export default function SearchScreen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [scope, setScope] = useState<SearchScope>('mine');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (term: string, sc: SearchScope) => {
    const t = term.trim();
    if (!t) return;
    setLoading(true);
    try {
      const rows = await synap.search(t, sc);
      setResults(rows.filter((r) => r.similarity >= SEARCH_MIN_COS));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const incoming = params.get('q');
    if (incoming) {
      setQ(incoming);
      run(incoming, scope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(q.trim() ? { q: q.trim() } : {});
    run(q, scope);
  };

  const onScope = (sc: SearchScope) => {
    setScope(sc);
    if (q.trim()) run(q, sc);
  };

  return (
    <main className="screen screen-pad">
      <div className="mb-1 flex items-start justify-between">
        <h1 className="text-2xl font-bold tracking-tight">검색</h1>
        <NotificationBell />
      </div>
      <p className="mb-4 text-[13.5px] font-medium text-muted-foreground">키워드가 아니라 의미로 찾습니다 · 임베딩 기반</p>

      <form className="mb-3 flex h-12 items-center gap-2.5 rounded-xl border border-border bg-secondary px-4" onSubmit={submit}>
        <SearchIcon size={18} className="text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 문서를 벡터로 바꿔 가까운 글 찾기"
          enterKeyHint="search"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </form>

      <Tabs value={scope} onValueChange={(v) => onScope(v as SearchScope)} className="mb-4">
        <TabsList>
          <TabsTrigger value="mine">내 노트</TabsTrigger>
          <TabsTrigger value="spaces">스페이스</TabsTrigger>
          <TabsTrigger value="public">공개</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {!loading && results && results.length === 0 && <p className="text-muted-foreground">결과가 없어요.</p>}

      <div className="flex flex-col gap-2.5">
        {!loading &&
          results?.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/notes/${r.id}`)}
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3.5 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <span className="truncate text-[15px] font-semibold">{r.title}</span>
              <SimilarityBar value={r.similarity} />
              {!r.mine && (
                <span
                  className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${r.ownerId}`);
                  }}
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[9px]">{r.ownerName?.[0] ?? '?'}</AvatarFallback>
                  </Avatar>
                  {r.ownerName}
                </span>
              )}
            </button>
          ))}
      </div>
    </main>
  );
}
