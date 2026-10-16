import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { synap } from '../../api/synap';
import { shareMindMap } from '../../lib/shareCard';
import { confirm } from '../../store/useConfirm';
import { toast } from '../../store/useToast';
import { Card } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import NotificationBell from '../notifications/NotificationBell';
import { ChevronLeft, LogOut, Moon } from '../../lib/icons';

export default function SettingsScreen() {
  const { viewThreshold, autoConnect, modelLabel, setViewThreshold, setAutoConnect } = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const navigate = useNavigate();
  const pct = Math.round(viewThreshold * 100);

  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(user?.displayName ?? '');

  const submitName = async () => {
    const next = name.trim();
    if (!next || next === user?.displayName) {
      setNameOpen(false);
      return;
    }
    try {
      const updated = await synap.changeName(next);
      setUser(updated);
      setNameOpen(false);
      toast('이름을 변경했어요');
    } catch (e) {
      toast(e instanceof Error ? e.message : '변경 실패', 'error');
    }
  };

  const shareMap = async () => {
    setSharing(true);
    try {
      const r = await shareMindMap(user?.displayName ?? '나');
      if (r === 'downloaded') toast('생각 지도 이미지를 저장했어요');
    } finally {
      setSharing(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const notes = await synap.exportNotes();
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), notes }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synap-notes-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('노트를 JSON으로 내보냈어요');
    } finally {
      setExporting(false);
    }
  };

  const submitPw = async () => {
    setPwMsg(null);
    try {
      await synap.changePassword(curPw || null, newPw);
      setCurPw('');
      setNewPw('');
      setPwOpen(false);
      toast('비밀번호를 변경했어요');
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : '변경 실패');
    }
  };

  const deleteAccount = async () => {
    const ok = await confirm({
      title: '계정을 삭제할까요?',
      message: '모든 노트가 영구 삭제되며 되돌릴 수 없어요.',
      confirmText: '계정 삭제',
      danger: true,
    });
    if (!ok) return;
    await synap.deleteAccount();
    logout();
  };

  return (
    <main className="screen screen-pad">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <NotificationBell />
      </div>

      <Card className="mb-3 p-4">
        <div className="flex items-center gap-3">
          <button
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() => user && navigate(`/profile/${user.id}`)}
          >
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {user?.displayName?.[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-base font-bold">
                {user?.displayName ?? '사용자'}
                <ChevronLeft size={16} className="-scale-x-100 text-muted-foreground" />
              </div>
              <div className="truncate text-[13px] text-muted-foreground">내 프로필 보기</div>
            </div>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setName(user?.displayName ?? '');
              setNameOpen((v) => !v);
            }}
          >
            {nameOpen ? '닫기' : '이름 변경'}
          </Button>
          <Button variant="secondary" size="pill" onClick={logout}>
            <LogOut size={15} /> 로그아웃
          </Button>
        </div>
        {nameOpen && (
          <div className="mt-3 flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="표시 이름" maxLength={20} />
            <Button onClick={submitName} disabled={!name.trim()}>저장</Button>
          </div>
        )}
      </Card>

      <Card className="mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-base font-semibold">내 생각 지도 공유</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">내 그래프를 이미지 카드로 공유</div>
        </div>
        <Button size="pill" disabled={sharing} onClick={shareMap}>
          {sharing ? '만드는 중…' : '이미지로 공유'}
        </Button>
      </Card>

      <Card className="mb-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">연결 임계값</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">이 유사도 이상만 그래프에 연결로 표시</div>
          </div>
          <div className="text-[17px] font-bold tabular-nums text-primary">{pct}%</div>
        </div>
        <Slider
          className="mt-4"
          value={[viewThreshold]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => setViewThreshold(v[0])}
        />
      </Card>

      <Card className="mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-base font-semibold">자동 연결</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">끄면 그래프 연결과 백링크를 숨깁니다</div>
        </div>
        <Switch checked={autoConnect} onCheckedChange={setAutoConnect} />
      </Card>

      <Card className="mb-3 flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          <Moon size={18} className="text-muted-foreground" />
          <div>
            <div className="text-base font-semibold">다크 모드</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">어두운 테마로 전환</div>
          </div>
        </div>
        <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
      </Card>

      <Card className="mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-base font-semibold">임베딩 모델</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">노트를 벡터로 변환하는 모델</div>
        </div>
        <div className="rounded-full bg-secondary px-2.5 py-1.5 text-[13px] font-semibold text-muted-foreground">{modelLabel}</div>
      </Card>

      <Card className="mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-base font-semibold">내 데이터 내보내기</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">모든 노트를 JSON 파일로 백업</div>
        </div>
        <Button variant="secondary" size="pill" disabled={exporting} onClick={exportData}>
          {exporting ? '내보내는 중…' : 'JSON 다운로드'}
        </Button>
      </Card>

      <Card className="mb-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">비밀번호 변경</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">소셜 로그인 계정은 비밀번호를 새로 설정해요</div>
          </div>
          <Button variant="secondary" size="pill" onClick={() => setPwOpen((v) => !v)}>
            {pwOpen ? '닫기' : '변경'}
          </Button>
        </div>
        {pwOpen && (
          <div className="mt-3 flex flex-col gap-2">
            <Input type="password" placeholder="현재 비밀번호 (소셜 계정은 비움)" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
            <Input type="password" placeholder="새 비밀번호 (6자 이상)" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <Button disabled={newPw.length < 6} onClick={submitPw}>저장</Button>
          </div>
        )}
        {pwMsg && <div className="mt-2 text-[13px] text-muted-foreground">{pwMsg}</div>}
      </Card>

      <Card className="mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-base font-semibold text-destructive">계정 삭제</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">모든 노트가 영구 삭제돼요</div>
        </div>
        <Button variant="ghost" size="pill" className="text-destructive" onClick={deleteAccount}>
          삭제
        </Button>
      </Card>

      <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
        임계값과 자동연결은 이 기기의 보기 설정입니다. 서버의 실제 자동 링크는 노트 저장 시 수행됩니다.
      </p>
    </main>
  );
}
