import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Graph, RelatedNote } from '../../types';
import { synap } from '../../api/synap';
import { useUiStore } from '../../store/useUiStore';
import SimilarityBar from '../../components/ui/SimilarityBar';
import { Button } from '../../components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '../../components/ui/drawer';

export default function NodeSheet({ graph }: { graph: Graph }) {
  const selectedId = useUiStore((s) => s.selectedNodeId);
  const clear = useUiStore((s) => s.clearSelection);
  const navigate = useNavigate();

  const [related, setRelated] = useState<RelatedNote[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedId === null) return;
    let alive = true;
    setLoading(true);
    setRelated(null);
    synap
      .getRelated(selectedId)
      .then((r) => alive && setRelated(r))
      .catch(() => alive && setRelated([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [selectedId]);

  const node = selectedId != null ? graph.nodes.find((n) => n.id === selectedId) : undefined;

  return (
    <Drawer open={selectedId !== null} onOpenChange={(o) => !o && clear()}>
      <DrawerContent>
        {node && (
          <>
            <DrawerTitle className="mb-4 leading-snug">{node.title}</DrawerTitle>

            <div className="mb-2 text-[13px] font-semibold text-muted-foreground">
              연결된 노트 {related ? `· ${related.length}` : ''}
            </div>

            <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
              {loading && <div className="py-4 text-center text-sm text-muted-foreground">불러오는 중…</div>}
              {related && related.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">아직 자동 연결된 노트가 없어요.</div>
              )}
              {related?.map((r) => (
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

            <Button className="mt-3.5 h-12" onClick={() => navigate(`/notes/${node.id}`)}>
              노트 열기
            </Button>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
