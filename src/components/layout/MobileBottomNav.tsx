import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '@/lib/t';
import { Home, Flame, Map, MessageCircle, User } from 'lucide-react';

interface BottomNavItem {
  id: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  path: string;
}

function useNavItems(): BottomNavItem[] {
  const { t } = useT();
  return [
    { id: 'home', icon: Home, label: t('Home'), path: '/app/home' },
    { id: 'discover', icon: Flame, label: t('Discover'), path: '/app/discover' },
    { id: 'board', icon: Map, label: t('Board'), path: '/app/board' },
    { id: 'messages', icon: MessageCircle, label: t('Messages'), path: '/app/messages' },
    { id: 'profile', icon: User, label: t('Profile'), path: '/app/profile' },
  ];
}

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = useNavItems();

  return (
    <nav
      className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 h-16 md:hidden"
      style={{
        background: 'rgba(244, 240, 232, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="grid h-full grid-cols-5 items-center">
        {navItems.map((item) => {
          const onDiscover =
            location.pathname.startsWith('/app/discover') ||
            location.pathname.startsWith('/app/feed');

          const isActive =
            item.id === 'discover'
              ? onDiscover
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isActive) navigate(item.path);
              }}
              className="flex h-full flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <item.icon
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? 'text-[var(--color-amber)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              />
              <span
                className={`text-[10px] font-medium leading-none ${
                  isActive
                    ? 'font-semibold text-[var(--color-navy)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
