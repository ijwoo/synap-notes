import { createPortal } from 'react-dom';
import { useToast } from '../../store/useToast';
import { cn } from '../../lib/utils';

export default function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 18px)' }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto max-w-[90%] animate-in fade-in slide-in-from-bottom-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold shadow-lg',
            t.type === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-foreground text-background',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
