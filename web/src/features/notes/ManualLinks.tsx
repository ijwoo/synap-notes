import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { synap } from '../../api/synap';
import { toast } from '../../store/useToast';
import type { NoteSummary } from '../../types';
import { Drawer, DrawerContent, DrawerTitle } from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { FileText, Link, Plus, X } from '../../lib/icons';

interface Linked {
  id: number;
  title: string;
}

/** 본문과 분리된 "연결된 노트" — 노트 검색해서 칩으로 직접 연결(문법 없음). 그래프에도 엣지로 반영. */
export default function ManualLinks({ noteId, allNotes }: { noteId: number; allNotes: NoteSummary[] }) {
  const [links, setLinks] = useState<Linked[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const load = () => synap.listLinks(noteId).then(setLinks).catch(() => {});
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const linkedIds = useMemo(() => new Set(links.map((l) => l.id)), [links]);
  const candidates = useMemo(() => {
    const t = q.trim().toLowerCase();
    return allNotes
      .filter((n) => n.id !== noteId && !linkedIds.has(n.id) && (t === '' || n.title.toLowerCase().includes(t)))
      .slice(0, 30);
  }, [allNotes, noteId, linkedIds, q]);

  const add = async (id: number) => {
    await synap.addLink(noteId, id);
    setQ('');
    await load();
    toast('노트를 연결했어요');
  };
  const remove = async (id: number) => {
    await synap.removeLink(noteId, id);
    await load();
  };

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-1.5">
        <Link size={15} className="text-muted-foreground" />
        <span className="text-[13px] font-semibold">연결된 노트</span>
        {links.length > 0 && <span className="text-[12px] text-muted-foreground">· {links.length}</span>}
        <button
          onClick={() => setOpen(true)}
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12.5px] font-semibold text-muted-foreground active:bg-border"
        >
          <Plus size={13} /> 연결
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">관련 노트를 직접 연결해보세요. (그래프에도 이어져요)</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {links.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-accent py-1 pl-3 pr-1.5 text-[13px] font-semibold text-accent-foreground">
              <button className="max-w-[180px] truncate" onClick={() => navigate(`/notes/${l.id}`)}>
                {l.title}
              </button>
              <button onClick={() => remove(l.id)} aria-label="연결 해제" className="rounded-full p-0.5 text-accent-foreground/70 hover:text-accent-foreground">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerTitle>노트 연결</DrawerTitle>
          <Input className="mt-3" autoFocus placeholder="노트 제목 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-2 flex max-h-[50vh] flex-col gap-0.5 overflow-y-auto">
            {candidates.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">연결할 노트가 없어요.</div>}
            {candidates.map((n) => (
              <button
                key={n.id}
                onClick={() => add(n.id)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] active:bg-secondary"
              >
                <FileText size={15} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{n.title}</span>
                <Plus size={15} className="ml-auto shrink-0 text-primary" />
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
