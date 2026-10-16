import { create } from 'zustand';

interface UiState {
  /** 그래프에서 선택된 노드 (하단 시트/디밍 기준) */
  selectedNodeId: number | null;
  selectNode: (id: number) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedNodeId: null,
  selectNode: (id) => set({ selectedNodeId: id }),
  clearSelection: () => set({ selectedNodeId: null }),
}));
