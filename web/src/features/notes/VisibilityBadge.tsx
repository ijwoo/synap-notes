import type { Visibility } from '../../types';
import { Globe, Lock, Users } from '../../lib/icons';

const MAP: Record<Visibility, { Icon: (p: { size?: number }) => React.JSX.Element; label: string }> = {
  private: { Icon: Lock, label: '나만' },
  space: { Icon: Users, label: '스페이스' },
  public: { Icon: Globe, label: '공개' },
};

export default function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const { Icon, label } = MAP[visibility];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon size={13} />
      {label}
    </span>
  );
}
