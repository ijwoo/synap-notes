import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { synap } from '../../api/synap';
import { toast } from '../../store/useToast';
import type { Note } from '../../types';
import { formatRelative } from '../../lib/time';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { ChevronLeft, Eye, Plus } from '../../lib/icons';
import { Markdown } from '../../lib/markdown';
import VisibilityBadge from './VisibilityBadge';
import CommentsSection from './CommentsSection';

export default function NoteView({ note }: { note: Note }) {
  const navigate = useNavigate();
  const author = note.ownerName ?? '다른 사용자';
  const [saving, setSaving] = useState(false);

  const saveToGraph = async () => {
    setSaving(true);
    try {
      const copy = await synap.saveNote(note.id);
      toast('내 노트로 담았어요');
      navigate(`/notes/${copy.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="screen">
      <header className="flex items-center justify-between border-b border-border px-2.5 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft />
        </Button>
        <span className="inline-flex items-center gap-1.5 pr-2 text-[13px] font-semibold text-muted-foreground">
          <Eye size={15} /> 읽기 전용
        </span>
      </header>

      <div className="px-[18px] py-4">
        <div className="mb-3 flex items-center gap-2">
          <button
            className="flex items-center gap-2"
            onClick={() => note.ownerId && navigate(`/profile/${note.ownerId}`)}
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[11px]">{author[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold underline-offset-2 hover:underline">{author}</span>
          </button>
          <VisibilityBadge visibility={note.visibility} />
          <span className="text-xs text-muted-foreground">· {formatRelative(note.updatedAt)}</span>
        </div>

        <h1 className="mb-3 text-[22px] font-bold leading-snug tracking-tight">{note.title}</h1>
        <Markdown text={note.body} />

        <Button className="mt-6 h-11 w-full" variant="secondary" disabled={saving} onClick={saveToGraph}>
          <Plus size={16} /> {saving ? '담는 중…' : '내 그래프에 담기'}
        </Button>

        {note.visibility === 'space' && <CommentsSection noteId={note.id} />}
      </div>
    </main>
  );
}
