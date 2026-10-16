import { NavLink, useLocation } from 'react-router-dom';
import { FileText, Network, Search, Settings } from '../../lib/icons';
import { cn } from '../../lib/utils';

const TABS = [
  { to: '/graph', label: '그래프', Icon: Network },
  { to: '/notes', label: '노트', Icon: FileText },
  { to: '/search', label: '검색', Icon: Search },
  { to: '/settings', label: '설정', Icon: Settings },
];

export default function TabBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    to === '/notes' ? pathname.startsWith('/notes') : pathname === to;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-4 border-t border-border bg-background/90 backdrop-blur md:hidden"
      style={{ height: 'calc(64px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, Icon }) => {
        const active = isActive(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
