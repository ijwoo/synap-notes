import { useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import TabBar from './components/layout/TabBar';
import Sidebar from './components/layout/Sidebar';
import GraphScreen from './features/graph/GraphScreen';
import NotesScreen from './features/notes/NotesScreen';
import NoteEditor from './features/notes/NoteEditor';
import SearchScreen from './features/search/SearchScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import CommunityScreen from './features/community/CommunityScreen';
import ProfileScreen from './features/profile/ProfileScreen';
import LoginScreen from './features/auth/LoginScreen';
import Toaster from './components/ui/Toaster';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { useAuthStore } from './store/useAuthStore';
import { synap } from './api/synap';

// 노트가 바뀌면 NoteEditor를 리마운트(key) → 노트 간 이동 시 상태가 새로 로드됨
function NoteEditorRoute() {
  const { id } = useParams();
  return <NoteEditor key={id ?? 'new'} />;
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  // 로그인 상태면 토큰 유효성 확인 + 사용자 정보 갱신 (401이면 client가 자동 로그아웃)
  useEffect(() => {
    if (token) synap.me().then(setUser).catch(() => {});
  }, [token, setUser]);

  if (!token) {
    return (
      <>
        <LoginScreen />
        <Toaster />
        <ConfirmDialog />
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <div className="relative mx-auto flex h-full w-full max-w-[480px] flex-1 flex-col overflow-hidden md:mx-0 md:max-w-none">
      <Routes>
        <Route path="/" element={<Navigate to="/graph" replace />} />
        <Route path="/graph" element={<GraphScreen />} />
        <Route path="/notes" element={<NotesScreen />} />
        <Route path="/notes/new" element={<NoteEditorRoute />} />
        <Route path="/notes/:id" element={<NoteEditorRoute />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/community" element={<CommunityScreen />} />
        <Route path="/profile/:id" element={<ProfileScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/graph" replace />} />
      </Routes>
      <TabBar />
      </div>
      <Toaster />
      <ConfirmDialog />
    </div>
  );
}
