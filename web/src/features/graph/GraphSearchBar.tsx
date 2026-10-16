import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from '../../lib/icons';

export default function GraphSearchBar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <form
      onSubmit={submit}
      className="absolute left-4 right-[66px] z-20 flex h-[46px] items-center gap-2 rounded-xl border border-border bg-background/85 px-3.5 shadow-sm backdrop-blur"
      style={{ top: 'calc(12px + env(safe-area-inset-top))' }}
    >
      <Search size={18} className="text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="의미로 노트 검색"
        enterKeyHint="search"
        className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}
