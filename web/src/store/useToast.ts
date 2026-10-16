import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let nid = 0;
export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = ++nid;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismiss(id), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** 어디서든 호출: toast('저장됐어요') */
export const toast = (message: string, type?: ToastType) => useToast.getState().show(message, type);
