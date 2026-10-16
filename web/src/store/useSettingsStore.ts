import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  /** 그래프 뷰에서 이 유사도 이상의 엣지만 표시 (클라이언트 필터) */
  viewThreshold: number;
  /** 자동연결(백링크/엣지) 표시 여부 — 뷰 프리퍼런스 */
  autoConnect: boolean;
  /** 표시용 임베딩 모델 라벨 */
  modelLabel: string;
  setViewThreshold: (v: number) => void;
  setAutoConnect: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // OpenAI 임베딩 스케일 기준 기본 뷰 임계값 (같은 토픽 군집이 이어지게)
      viewThreshold: 0.35,
      autoConnect: true,
      modelLabel: import.meta.env.VITE_EMBEDDING_MODEL ?? 'text-embedding-3-small · 1536d',
      setViewThreshold: (v) => set({ viewThreshold: v }),
      setAutoConnect: (v) => set({ autoConnect: v }),
    }),
    {
      name: 'synap-settings',
      version: 2,
      // 저장된 뷰 임계값을 최신 기본값(0.35)으로 보정
      migrate: (persisted: unknown, version: number) => {
        const s = (persisted ?? {}) as Partial<SettingsState>;
        if (version < 2) return { ...s, viewThreshold: 0.35 } as SettingsState;
        return s as SettingsState;
      },
    },
  ),
);
