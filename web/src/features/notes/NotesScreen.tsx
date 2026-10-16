import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { synap } from '../../api/synap';
import type { NoteSummary } from '../../types';
import { formatRelative } from '../../lib/time';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CardSkeleton } from '../../components/ui/skeleton';
import NotificationBell from '../notifications/NotificationBell';
import { Plus } from '../../lib/icons';
import VisibilityBadge from './VisibilityBadge';

type Filter = 'all' | 'mine' | 'imported';

export default function NotesScreen() {
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();

  useEffect(() => {
    synap
      .listNotes()
      .then(setNotes)
      .catch((e) => setError(e instanceof Error ? e.message : '불러오기 실패'));
  }, []);

  return (
    <main className="screen">
      <div className="flex items-center justify-between px-[18px] pb-2 pt-5">
        <h1 className="text-2xl font-bold tracking-tight">노트</h1>
        <div className="flex items-center gap-1.5">
          <Button size="pill" variant="secondary" onClick={() => navigate('/notes/new')}>
            <Plus size={16} /> 새 노트
          </Button>
          <NotificationBell />
        </div>
      </div>

      <div className="px-[18px] pt-1">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-3">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="mine">내가 쓴</TabsTrigger>
            <TabsTrigger value="imported">가져온</TabsTrigger>
          </TabsList>
        </Tabs>
        {error && <p className="text-muted-foreground">{error}</p>}
        {notes === null && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}
        {notes && notes.length === 0 && <p className="text-muted-foreground">첫 노트를 작성해보세요.</p>}
        <div className="flex flex-col gap-2.5">
          {notes
            ?.filter((n) => (filter === 'all' ? true : filter === 'imported' ? n.imported : !n.imported))
            .map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(`/notes/${n.id}`)}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <span className="truncate text-base font-semibold">{n.title}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <VisibilityBadge visibility={n.visibility} />
                <span>{formatRelative(n.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
