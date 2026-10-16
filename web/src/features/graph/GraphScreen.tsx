import { useNavigate } from 'react-router-dom';
import GraphCanvas from './GraphCanvas';
import GraphSearchBar from './GraphSearchBar';
import NodeSheet from './NodeSheet';
import NotificationBell from '../notifications/NotificationBell';
import { useGraph } from './useGraph';
import { Plus, Users } from '../../lib/icons';
import './Graph.css';

export default function GraphScreen() {
  const { graph, loading, error } = useGraph();
  const hasNodes = graph && graph.nodes.length > 0;
  const navigate = useNavigate();

  const Status = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{children}</div>
  );

  return (
    <main className="graph-screen">
      {loading && <Status>그래프 불러오는 중…</Status>}
      {error && <Status>{error}</Status>}
      {graph && graph.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-sm text-muted-foreground">노트를 추가하면 의미가 가까운 노트끼리 자동으로 이어져요.</p>
          <button
            onClick={() => navigate('/notes/new')}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-lg shadow-primary/30 active:brightness-95"
          >
            <Plus size={16} /> 첫 노트 쓰기
          </button>
        </div>
      )}
      {hasNodes && (
        <>
          <GraphCanvas graph={graph} />
          <GraphSearchBar />
          {graph.edges.length === 0 && (
            <div
              className="pointer-events-none absolute inset-x-4 z-20 rounded-xl bg-foreground/85 px-3.5 py-2.5 text-center text-[12.5px] font-medium text-background shadow-sm backdrop-blur"
              style={{ top: 'calc(70px + env(safe-area-inset-top))' }}
            >
              비슷한 노트를 몇 개 더 쓰면 의미가 가까운 것끼리 자동으로 이어져요 ✨
            </div>
          )}
          <div className="absolute right-4 z-20" style={{ top: 'calc(12px + env(safe-area-inset-top))' }}>
            <NotificationBell />
          </div>
          <NodeSheet graph={graph} />
          <button
            onClick={() => navigate('/community')}
            className="absolute right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-lg shadow-primary/30 active:brightness-95"
            style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 14px)' }}
          >
            <Users size={16} /> 커뮤니티
          </button>
        </>
      )}
    </main>
  );
}
