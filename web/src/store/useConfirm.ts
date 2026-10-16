import { create } from 'zustand';

export interface ConfirmOpts {
  title: string;
  message?: string;
  confirmText?: string;
  danger?: boolean;
}
interface ConfirmState {
  open: boolean;
  opts: ConfirmOpts | null;
  resolve: ((v: boolean) => void) | null;
  ask: (opts: ConfirmOpts) => Promise<boolean>;
  respond: (v: boolean) => void;
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  open: false,
  opts: null,
  resolve: null,
  ask: (opts) => new Promise<boolean>((resolve) => set({ open: true, opts, resolve })),
  respond: (v) => {
    get().resolve?.(v);
    set({ open: false, resolve: null });
  },
}));

/** 어디서든 호출: if (await confirm({ title: '삭제할까요?', danger: true })) ... */
export const confirm = (opts: ConfirmOpts) => useConfirm.getState().ask(opts);
