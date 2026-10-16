import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/** 768px 이상이면 데스크탑(가운데 모달), 미만이면 모바일(바텀시트). */
function useIsDesktop() {
  const [desktop, setDesktop] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

interface DrawerCtx {
  desktop: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}
const Ctx = React.createContext<DrawerCtx>({ desktop: false, open: false, onOpenChange: () => {} });

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  shouldScaleBackground?: boolean;
  children: React.ReactNode;
}

const Drawer = ({ open = false, onOpenChange = () => {}, shouldScaleBackground = false, children }: DrawerProps) => {
  const desktop = useIsDesktop();
  const value = React.useMemo(() => ({ desktop, open, onOpenChange }), [desktop, open, onOpenChange]);
  if (desktop) {
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }
  return (
    <Ctx.Provider value={value}>
      <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={shouldScaleBackground}>
        {children}
      </DrawerPrimitive.Root>
    </Ctx.Provider>
  );
};
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerClose = DrawerPrimitive.Close;
const DrawerPortal = DrawerPrimitive.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-[60] bg-black/40', className)} {...props} />
));
DrawerOverlay.displayName = 'DrawerOverlay';

const DrawerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { desktop, open, onOpenChange } = React.useContext(Ctx);

    // 데스크탑 모달: Esc 로 닫기
    React.useEffect(() => {
      if (!desktop || !open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onOpenChange(false);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [desktop, open, onOpenChange]);

    if (desktop) {
      if (!open) return null;
      return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 animate-in fade-in bg-black/40" onClick={() => onOpenChange(false)} />
          <div
            ref={ref}
            role="dialog"
            className={cn(
              'relative flex max-h-[82vh] w-full max-w-[460px] animate-in fade-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl',
              className,
            )}
            {...props}
          >
            <div className="flex flex-col overflow-y-auto px-[20px] py-5">{children}</div>
          </div>
        </div>,
        document.body,
      );
    }

    return (
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          ref={ref}
          className={cn(
            'fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[88%] w-full max-w-[480px] flex-col rounded-t-[22px] border border-border bg-background',
            className,
          )}
          {...props}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border" />
          <div className="flex flex-col overflow-y-auto px-[18px] pb-[calc(18px+env(safe-area-inset-bottom))] pt-3">
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    );
  },
);
DrawerContent.displayName = 'DrawerContent';

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { desktop } = React.useContext(Ctx);
    const cls = cn('text-lg font-bold tracking-tight', className);
    if (desktop) return <h2 ref={ref} className={cls} {...props} />;
    return <DrawerPrimitive.Title ref={ref as React.Ref<HTMLHeadingElement>} className={cls} {...props} />;
  },
);
DrawerTitle.displayName = 'DrawerTitle';

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle };
