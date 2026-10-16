import { createPortal } from 'react-dom';
import { useConfirm } from '../../store/useConfirm';
import { Button } from './button';
import { cn } from '../../lib/utils';

export default function ConfirmDialog() {
  const { open, opts, respond } = useConfirm();
  if (!open || !opts) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={() => respond(false)} />
      <div className="relative w-full max-w-[330px] animate-in fade-in zoom-in-95 rounded-2xl bg-card p-5 shadow-xl">
        <div className="text-[17px] font-bold">{opts.title}</div>
        {opts.message && <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">{opts.message}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => respond(false)}>
            취소
          </Button>
          <Button
            className={cn('flex-1', opts.danger && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            onClick={() => respond(true)}
          >
            {opts.confirmText ?? '확인'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
