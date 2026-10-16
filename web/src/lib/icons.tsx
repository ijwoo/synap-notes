import * as React from 'react';

type P = React.SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      {children}
    </svg>
  );
}

export const ChevronLeft = (p: P) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const Check = (p: P) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
export const Plus = (p: P) => <Svg {...p}><path d="M5 12h14M12 5v14" /></Svg>;
export const X = (p: P) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const Lock = (p: P) => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>;
export const Globe = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 0 0 18 14 14 0 0 0 0-18Z" /></Svg>;
export const Users = (p: P) => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
export const UserPlus = (p: P) => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></Svg>;
export const Search = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
export const Settings = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></Svg>;
export const FileText = (p: P) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" /></Svg>;
export const Network = (p: P) => <Svg {...p}><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M11 7.3 6.3 16.7M12.8 7.4l4.5 9.2M7.5 19h9" /></Svg>;
export const Bell = (p: P) => <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Svg>;
export const Moon = (p: P) => <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>;
export const Sun = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const LogOut = (p: P) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>;
export const Trash = (p: P) => <Svg {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></Svg>;
export const Eye = (p: P) => <Svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const Sparkles = (p: P) => <Svg {...p}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" /><path d="M19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7L19 14Z" /></Svg>;
export const Link = (p: P) => <Svg {...p}><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" /></Svg>;
export const Share = (p: P) => <Svg {...p}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></Svg>;

// space icons
export const Flask = (p: P) => <Svg {...p}><path d="M9 3h6M10 3v6.5L4.5 19A2 2 0 0 0 6.3 22h11.4a2 2 0 0 0 1.8-3L14 9.5V3M7.5 15h9" /></Svg>;
export const Pen = (p: P) => <Svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;
export const Book = (p: P) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></Svg>;
export const Idea = (p: P) => <Svg {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" /></Svg>;
export const Rocket = (p: P) => <Svg {...p}><path d="M5 13s-2 1-2 4c3 0 4-2 4-2M14.5 9.5 12 12l3 3 2.5-2.5C20 10 21 5 21 3c-2 0-7 1-9.5 3.5L9 9M9 15l-3-3" /></Svg>;
export const Target = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></Svg>;
export const Brain = (p: P) => <Svg {...p}><path d="M9.5 3A2.5 2.5 0 0 1 12 5.5v13A2.5 2.5 0 0 1 7 18a2.5 2.5 0 0 1-2-4 2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 1.5-4A2.5 2.5 0 0 1 9.5 3ZM14.5 3A2.5 2.5 0 0 0 12 5.5v13a2.5 2.5 0 0 0 5-.5 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0-1.5-4A2.5 2.5 0 0 0 14.5 3Z" /></Svg>;
export const Coffee = (p: P) => <Svg {...p}><path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2" /></Svg>;
export const Folder = (p: P) => <Svg {...p}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></Svg>;

export const SPACE_ICON_OPTIONS = ['flask', 'pen', 'book', 'idea', 'rocket', 'target', 'brain', 'coffee'] as const;

const SPACE_ICONS: Record<string, (p: P) => React.JSX.Element> = {
  flask: Flask, pen: Pen, book: Book, idea: Idea, rocket: Rocket, target: Target, brain: Brain, coffee: Coffee, folder: Folder,
  // 구 이모지 데이터 폴백
  '🔬': Flask, '✍️': Pen, '📚': Book, '💡': Idea, '🚀': Rocket, '🎯': Target, '🧠': Brain, '☕': Coffee,
};

export function SpaceIcon({ name, ...p }: Omit<P, 'name'> & { name: string | null }) {
  const C = (name && SPACE_ICONS[name]) || Folder;
  return <C {...p} />;
}
