import { NavLink } from 'react-router-dom';
import { FileText, Network, Search, Settings } from '../../lib/icons';
import { cn } from '../../lib/utils';

const TABS = [
  { to: '/graph', label: '그래프', Icon: Network },
  { to: '/notes', label: '노트', Icon: FileText },
  { to: '/search', label: '검색', Icon: Search },
  { to: '/settings', label: '설정', Icon: Settings },
];

/** 데스크탑 전용 좌측 내비 (모바일은 하단 TabBar). */
export default function Sidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col gap-1 border-r border-border bg-card/30 px-3 py-5 md:flex">
      <div className="px-3 pb-5 text-[26px] font-extrabold tracking-tight text-primary">Synap</div>
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary',
            )
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
