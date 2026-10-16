import { useEffect, useState } from 'react';
import { synap } from '../../api/synap';
import type { Comment } from '../../types';
import { formatRelative } from '../../lib/time';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Trash } from '../../lib/icons';

export default function CommentsSection({ noteId }: { noteId: number }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    synap.listComments(noteId).then((c) => alive && setComments(c)).catch(() => alive && setComments([]));
    return () => {
      alive = false;
    };
  }, [noteId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const c = await synap.addComment(noteId, body);
      setComments((prev) => [...(prev ?? []), c]);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await synap.deleteComment(id);
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
  };

  return (
    <section className="mt-7 border-t border-border pt-4">
      <div className="mb-3 text-sm font-bold tracking-tight">
        댓글 {comments ? `· ${comments.length}` : ''}
      </div>

      <div className="flex flex-col gap-3">
        {comments?.length === 0 && <p className="text-sm text-muted-foreground">첫 댓글을 남겨보세요.</p>}
        {comments?.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar className="mt-0.5 h-7 w-7 shrink-0">
              <AvatarFallback className="text-[11px]">{c.authorName?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">{c.mine ? '나' : c.authorName}</span>
                <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
                {c.mine && (
                  <button className="ml-auto text-muted-foreground" onClick={() => remove(c.id)} aria-label="삭제">
                    <Trash size={14} />
                  </button>
                )}
              </div>
              <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{c.body}</div>
            </div>
          </div>
        ))}
      </div>

      <form className="mt-3 flex items-center gap-2" onSubmit={add}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="댓글 달기" />
        <Button size="sm" type="submit" disabled={!text.trim() || busy}>등록</Button>
      </form>
    </section>
  );
}
