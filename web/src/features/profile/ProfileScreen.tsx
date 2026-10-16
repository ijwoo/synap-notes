import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { synap } from '../../api/synap';
import { useAuthStore } from '../../store/useAuthStore';
import type { Profile } from '../../types';
import { formatRelative } from '../../lib/time';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Skeleton, CardSkeleton } from '../../components/ui/skeleton';
import { ChevronLeft, Globe } from '../../lib/icons';

export default function ProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const myId = useAuthStore((s) => s.user?.id);
  const isMe = profile != null && myId === profile.id;

  useEffect(() => {
    if (!id) return;
    synap
      .getProfile(Number(id))
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : '불러오기 실패'));
  }, [id]);

  return (
    <main className="screen">
      <header className="flex items-center border-b border-border px-2.5 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft />
        </Button>
        <span className="text-base font-bold">프로필</span>
      </header>

      <div className="px-[18px] py-5">
        {error && <p className="text-muted-foreground">{error}</p>}
        {!profile && !error && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </>
        )}
        {profile && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                  {profile.displayName[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-bold">{profile.displayName}{isMe ? ' (나)' : ''}</div>
                <div className="text-[13px] text-muted-foreground">공개 노트 {profile.publicNoteCount}개</div>
              </div>
            </div>

            {isMe && (
              <div className="mb-5 rounded-lg bg-secondary p-3 text-[13px] text-muted-foreground">
                다른 사람에게 보이는 공개 모습이에요. 공개 노트만 보입니다.
              </div>
            )}

            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground">
              <Globe size={14} /> 공개 노트
            </div>
            <div className="flex flex-col gap-2.5">
              {profile.notes.length === 0 && <p className="text-sm text-muted-foreground">아직 공개한 노트가 없어요.</p>}
              {profile.notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(`/notes/${n.id}`)}
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <span className="truncate text-base font-semibold">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(n.updatedAt)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
