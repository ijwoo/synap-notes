import { useCallback, useEffect, useRef, useState } from 'react';
import { synap } from '../../api/synap';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { GOOGLE_CLIENT_ID, KAKAO_JS_KEY, loadGoogle, loginWithKakao } from '../../lib/oauth';
import type { AuthResponse } from '../../api/synap';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback((res: AuthResponse) => setAuth(res.token, res.user), [setAuth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === 'login'
          ? await synap.login(email.trim(), password)
          : await synap.register(email.trim(), password, displayName.trim());
      apply(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const onKakao = async () => {
    setError(null);
    try {
      const token = await loginWithKakao();
      apply(await synap.kakaoLogin(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : '카카오 로그인 실패');
    }
  };

  const fillDemo = () => {
    setMode('login');
    setEmail('me@synap.dev');
    setPassword('synap1234');
  };

  const hasSocial = Boolean(GOOGLE_CLIENT_ID || KAKAO_JS_KEY);

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-secondary px-5">
      <Card className="w-full max-w-[360px] p-7 text-center shadow-md">
        <div className="text-3xl font-extrabold tracking-tight text-primary">Synap</div>
        <p className="mb-7 mt-1.5 text-sm text-muted-foreground">메모가 의미로 연결되는 노트</p>

        <form className="flex flex-col gap-2.5" onSubmit={submit}>
          {mode === 'register' && (
            <Input placeholder="이름" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          )}
          <Input type="email" placeholder="이메일" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-left text-[13px] text-destructive">{error}</div>}
          <Button className="mt-1" disabled={busy} type="submit">
            {busy ? '...' : mode === 'login' ? '로그인' : '가입하기'}
          </Button>
        </form>

        <Button variant="link" className="mt-3 text-sm text-muted-foreground" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '계정이 없나요? 가입하기' : '이미 계정이 있나요? 로그인'}
        </Button>

        {hasSocial && (
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-5">
            {GOOGLE_CLIENT_ID && <GoogleButton onToken={async (t) => apply(await synap.googleLogin(t))} onError={setError} />}
            {KAKAO_JS_KEY && (
              <button
                onClick={onKakao}
                className="flex h-11 w-full max-w-[300px] items-center justify-center gap-2 rounded-full text-[15px] font-bold"
                style={{ backgroundColor: '#FEE500', color: '#191600' }}
              >
                <KakaoMark /> 카카오로 계속
              </button>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <Button variant="link" className="text-[13px]" onClick={fillDemo}>
            데모 계정으로 체험 (me@synap.dev)
          </Button>
        </div>
      </Card>
    </div>
  );
}

function GoogleButton({ onToken, onError }: { onToken: (idToken: string) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogle()
      .then((google) => {
        if (cancelled || !ref.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp: { credential?: string }) => resp.credential && onToken(resp.credential),
        });
        google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 300,
        });
      })
      .catch(() => onError('구글 로그인을 불러오지 못했어요.'));
    return () => {
      cancelled = true;
    };
  }, [onToken, onError]);

  return <div ref={ref} className="flex min-h-[44px] justify-center" />;
}

function KakaoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.6-2.5.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
    </svg>
  );
}
