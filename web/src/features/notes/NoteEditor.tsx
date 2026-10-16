import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { synap } from '../../api/synap';
import { useSettingsStore } from '../../store/useSettingsStore';
import { confirm } from '../../store/useConfirm';
import { toast } from '../../store/useToast';
import type { Note, NoteSummary, RelatedNote, SpaceDto, Visibility } from '../../types';
import { extractConcepts } from '../../lib/concepts';
import { cn } from '../../lib/utils';
import { ChevronLeft, Eye, Globe, Lock, SpaceIcon } from '../../lib/icons';
import { Markdown } from '../../lib/markdown';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import BacklinkSection from './BacklinkSection';
import CommentsSection from './CommentsSection';
import ManualLinks from './ManualLinks';
import RelatedSuggestions from './RelatedSuggestions';
import NoteView from './NoteView';
import { Skeleton } from '../../components/ui/skeleton';

type Status = 'idle' | 'saving' | 'saved' | 'error';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const autoConnect = useSettingsStore((s) => s.autoConnect);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [related, setRelated] = useState<RelatedNote[] | null>(null);
  const [loaded, setLoaded] = useState<Note | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(id ? Number(id) : null);
  const [loading, setLoading] = useState(!!id);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [preview, setPreview] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [allNotes, setAllNotes] = useState<NoteSummary[]>([]);

  // 동기 참조 (자동저장 경쟁/스테일 클로저 방지)
  const idRef = useRef<number | null>(id ? Number(id) : null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const latest = useRef({ title, body, visibility, spaceId });
  latest.current = { title, body, visibility, spaceId };

  useEffect(() => {
    synap.listSpaces().then(setSpaces).catch(() => {});
    synap.listNotes().then(setAllNotes).catch(() => {});
  }, []);

  useEffect(() => {
    if (idRef.current === null) return;
    let alive = true;
    setLoading(true);
    synap
      .getNote(idRef.current)
      .then((n) => {
        if (!alive) return;
        setLoaded(n);
        setTitle(n.title);
        setBody(n.body);
        setVisibility(n.visibility);
        setSpaceId(n.spaceId);
        if (n.mine) synap.getRelated(n.id).then((r) => alive && setRelated(r)).catch(() => {});
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const persist = useCallback(async () => {
    if (savingRef.current) return;
    const cur = latest.current;
    const b = cur.body.trim();
    if (!b) return; // 본문이 비면 저장 안 함(서버도 거부)
    savingRef.current = true;
    setStatus('saving');
    try {
      const input = { title: cur.title.trim(), body: b, visibility: cur.visibility, spaceId: cur.spaceId };
      if (idRef.current === null) {
        const created = await synap.createNote(input);
        idRef.current = created.id;
        setCurrentId(created.id);
        setLoaded(created);
        window.history.replaceState(null, '', `/notes/${created.id}`);
      } else {
        const updated = await synap.updateNote(idRef.current, input);
        setLoaded(updated);
      }
      dirtyRef.current = false;
      setDirty(false);
      setStatus('saved');
      if (idRef.current !== null) synap.getRelated(idRef.current).then(setRelated).catch(() => {});
    } catch {
      setStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, []);

  // 디바운스 자동저장
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => void persist(), 1000);
    return () => clearTimeout(t);
  }, [title, body, visibility, spaceId, dirty, persist]);

  // 언마운트 시 미저장분 flush + 탭 닫기 경고
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      if (dirtyRef.current) void persist();
    };
  }, [persist]);

  const touch = () => {
    dirtyRef.current = true;
    setDirty(true);
    setStatus('idle');
  };

  const concepts = useMemo(() => extractConcepts(body), [body]);
  const rangeKey = visibility === 'space' ? `space:${spaceId}` : visibility;
  const imported = loaded?.sourceNoteId != null;
  const excludeIds = useMemo(() => {
    const s = new Set<number>();
    if (currentId != null) s.add(currentId);
    related?.forEach((r) => s.add(r.id));
    return s;
  }, [currentId, related]);

  const selectRange = async (key: string) => {
    if (key === 'public' && visibility !== 'public') {
      const ok = await confirm({
        title: '커뮤니티에 공개할까요?',
        message: '공개하면 다른 사람도 이 노트를 보고 자기 그래프에 담을 수 있어요.',
        confirmText: '공개',
      });
      if (!ok) return;
    }
    if (key === 'private' || key === 'public') {
      setVisibility(key);
      setSpaceId(null);
    } else {
      setVisibility('space');
      setSpaceId(Number(key.slice(6)));
    }
    touch();
  };

  const remove = async () => {
    if (idRef.current === null) return;
    if (!(await confirm({ title: '노트를 삭제할까요?', message: '되돌릴 수 없어요.', confirmText: '삭제', danger: true }))) return;
    dirtyRef.current = false; // 삭제 시 flush 막기
    await synap.deleteNote(idRef.current);
    toast('노트를 삭제했어요');
    navigate('/notes', { replace: true });
  };

  if (loading) {
    return (
      <main className="screen screen-pad">
        <Skeleton className="mb-4 h-8 w-3/4" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="screen">
        <header className="flex items-center border-b border-border px-2.5 py-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/notes')} aria-label="뒤로">
            <ChevronLeft />
          </Button>
        </header>
        <div className="flex flex-col items-center justify-center gap-4 px-8 pt-24 text-center">
          <p className="text-sm text-muted-foreground">노트를 찾을 수 없어요.<br />삭제되었거나 접근 권한이 없어요.</p>
          <Button variant="secondary" size="pill" onClick={() => navigate('/notes')}>노트 목록으로</Button>
        </div>
      </main>
    );
  }

  // 남의 노트는 읽기 전용
  if (loaded && !loaded.mine) {
    return <NoteView note={loaded} />;
  }

  const chip = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
      active ? 'border-primary/30 bg-accent text-accent-foreground' : 'border-transparent bg-secondary text-muted-foreground',
    );

  const statusText =
    status === 'saving' ? '저장 중…' : status === 'error' ? '저장 실패' : dirty ? '변경됨' : status === 'saved' ? '저장됨' : '';

  return (
    <main className="screen">
      <header className="flex items-center justify-between border-b border-border px-2.5 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/notes')} aria-label="뒤로">
          <ChevronLeft />
        </Button>
        <div className="flex items-center gap-1 pr-1">
          <span className={cn('mr-1 text-[13px] font-medium', status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
            {statusText}
          </span>
          {body.trim() && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setPreview((p) => !p)}>
              <Eye size={15} /> {preview ? '편집' : '읽기'}
            </Button>
          )}
          {currentId !== null && (
            <Button variant="ghost" className="text-destructive" onClick={remove}>
              삭제
            </Button>
          )}
        </div>
      </header>

      <div className="px-[18px] py-4">
        {imported && loaded?.sourceAuthorId && (
          <button
            onClick={() => navigate(`/profile/${loaded.sourceAuthorId}`)}
            className="mb-3 flex w-full items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-left text-[13px] font-semibold text-muted-foreground"
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">{(loaded.sourceAuthorName ?? '?')[0]}</AvatarFallback>
            </Avatar>
            <span className="flex-1">
              <span className="text-foreground">{loaded.sourceAuthorName ?? '다른 사용자'}</span>님의 노트에서 담음
            </span>
            <ChevronLeft size={15} className="-scale-x-100" />
          </button>
        )}
        <input
          className="mb-3 w-full bg-transparent text-[22px] font-bold tracking-tight outline-none placeholder:text-muted-foreground"
          placeholder="제목 (비우면 본문 첫 줄로)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            touch();
          }}
        />

        <div className="mb-3.5">
          <div className="mb-2 text-xs font-bold text-muted-foreground">공유</div>
          <div className="flex flex-wrap gap-1.5">
            <button className={chip(rangeKey === 'private')} onClick={() => selectRange('private')}>
              <Lock size={14} /> 나만
            </button>
            {spaces.map((s) => (
              <button key={s.id} className={chip(rangeKey === `space:${s.id}`)} onClick={() => selectRange(`space:${s.id}`)}>
                <SpaceIcon name={s.icon} size={14} /> {s.name}
              </button>
            ))}
            {!imported && (
              <button className={chip(rangeKey === 'public')} onClick={() => selectRange('public')}>
                <Globe size={14} /> 커뮤니티
              </button>
            )}
          </div>
        </div>

        {preview ? (
          <div className="min-h-[220px]">
            <Markdown text={body} />
          </div>
        ) : (
          <textarea
            className="min-h-[220px] w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground"
            placeholder="내용을 입력하면 의미가 가까운 노트와 자동으로 연결됩니다."
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              touch();
            }}
          />
        )}

        {concepts.length > 0 && (
          <section className="mt-4">
            <span className="text-[13px] font-semibold text-muted-foreground">발견된 개념</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {concepts.map((c) => (
                <span key={c} className="rounded-full bg-secondary px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground">
                  {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {currentId !== null && <ManualLinks noteId={currentId} allNotes={allNotes} />}

        {autoConnect && <RelatedSuggestions title={title} body={body} excludeIds={excludeIds} />}

        {autoConnect && currentId !== null && <BacklinkSection related={related} />}
        {currentId !== null && visibility === 'space' && <CommentsSection noteId={currentId} />}
      </div>
    </main>
  );
}
