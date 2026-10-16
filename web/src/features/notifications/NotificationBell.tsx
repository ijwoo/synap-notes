import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { synap } from '../../api/synap';
import type { Notif } from '../../types';
import { formatRelative } from '../../lib/time';
import { Drawer, DrawerContent, DrawerTitle } from '../../components/ui/drawer';
import { Bell, FileText, Users } from '../../lib/icons';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    synap.notificationsUnread().then(setUnread).catch(() => {});
  }, []);

  const openDrawer = async () => {
    setOpen(true);
    setItems(null);
    try {
      const list = await synap.listNotifications();
      setItems(list);
      if (list.some((n) => !n.read)) {
        await synap.markNotificationsRead();
      }
      setUnread(0);
    } catch {
      setItems([]);
    }
  };

  const go = (link: string | null) => {
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <>
      <button
        onClick={openDrawer}
        aria-label="알림"
        className="relative flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-border bg-background/85 shadow-sm backdrop-blur active:bg-secondary"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerTitle>알림</DrawerTitle>
          <div className="mt-3 flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
            {items === null && <div className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</div>}
            {items?.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">알림이 없어요.</div>}
            {items?.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.link)}
                className={`flex items-start gap-3 rounded-lg p-3 text-left transition-colors active:bg-border ${
                  n.read ? 'bg-transparent' : 'bg-accent'
                }`}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  {n.type === 'invite' ? <Users size={16} /> : <FileText size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-snug">{n.message}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
