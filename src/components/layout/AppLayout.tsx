import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type TrustTier } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Compass,
  MessageCircle,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronUp,
  GraduationCap,
  Star,
  Shield,
  Sparkles,
  BookOpen,
  Map,
  Flame,
  Users,
} from 'lucide-react';

const TIER_COLORS: Record<TrustTier, string> = {
  0: 'trust-badge-explorer',
  1: 'trust-badge-member',
  2: 'trust-badge-verified',
  3: 'trust-badge-teacher',
  4: 'trust-badge-connector',
};

const TIER_ICONS: Record<TrustTier, React.ReactNode> = {
  0: <Compass className="w-2.5 h-2.5" />,
  1: <User className="w-2.5 h-2.5" />,
  2: <Shield className="w-2.5 h-2.5" />,
  3: <GraduationCap className="w-2.5 h-2.5" />,
  4: <Sparkles className="w-2.5 h-2.5" />,
};

interface NavItem {
  id: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  path: string;
  description: string;
  hide?: boolean;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { id: 'discover', icon: Flame,         label: 'Discover',     path: '/app/discover',  description: 'Community feed' },
  { id: 'clubs',    icon: Users,         label: 'Clubs',        path: '/app/clubs',     description: 'All clubs in Morocco' },
  { id: 'board',    icon: Map,           label: 'Board',         path: '/app/board',     description: 'Flares & skills' },
  { id: 'messages', icon: MessageCircle, label: 'Messages',      path: '/app/messages',       description: 'Your conversations' },
  { id: 'path',    icon: BookOpen,      label: 'Path',         path: '/app/path',          description: 'Share what you know' },
  { id: 'profile',  icon: User,          label: 'My Profile',    path: '/app/profile',        description: 'Your member card' },
];

export default function AppLayout() {
  const { user, logout, getTrustLabel } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tierLabel = user ? getTrustLabel(user.trust_tier) : 'Explorer';
  const tierClass = user ? TIER_COLORS[user.trust_tier] : TIER_COLORS[0];
  const tierIcon = user ? TIER_ICONS[user.trust_tier] : TIER_ICONS[0];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--color-navy)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/8">
          <Link to="/app/discover" className="flex items-center gap-2.5" onClick={() => setIsSidebarOpen(false)}>
            <img 
              src="/logo.png" 
              alt="Lumina Logo" 
              className="w-8 h-8 object-contain rounded-xl overflow-hidden" 
            />
            <div>
              <span className="font-heading font-semibold text-base text-white tracking-wide">
                Lumina
              </span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* City Badge */}
        <div className="px-5 py-3 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2 text-white/50 text-xs font-medium truncate">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="truncate">{user?.location || 'Morocco'} · Lumina</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const onDiscover = location.pathname.startsWith('/app/discover') || location.pathname.startsWith('/app/feed');
              const onClubsRoute = location.pathname.startsWith('/app/clubs') || location.pathname.startsWith('/club/');

              const isActive =
                item.id === 'discover'
                  ? onDiscover
                  : item.id === 'clubs'
                  ? onClubsRoute
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'text-white'
                      : 'text-white/55 hover:text-white hover:bg-white/8'
                  }`}
                  style={isActive ? { background: 'rgba(196,135,58,0.25)' } : {}}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? '' : 'group-hover:bg-white/10'
                    }`}
                    style={isActive ? { background: 'var(--color-amber)', boxShadow: '0 4px 12px rgba(196,135,58,0.4)' } : {}}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-none">{item.label}</div>
                    <div className="text-[11px] mt-0.5 text-white/35 leading-none truncate">{item.description}</div>
                  </div>
                  {item.badge && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: 'var(--color-amber)', fontSize: '10px' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin (if relevant) */}
          <div className="mt-6 border-t border-white/8 pt-4 space-y-0.5">
            <Link
              to="/app/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-white/45 hover:text-white hover:bg-white/8`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Settings</span>
            </Link>
          </div>
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-white/8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/8 transition-colors group"
              >
                <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-amber-sc/30">
                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                  <AvatarFallback
                    className="text-white text-sm font-semibold"
                    style={{ background: 'var(--color-amber)' }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-sm text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className={`trust-badge mt-0.5 w-fit`} style={{ padding: '1px 6px', fontSize: '10px' }}>
                    <span className="text-white/40 flex items-center gap-0.5">
                      {tierIcon}
                      <span style={{ color: user?.trust_score ? 'var(--color-amber)' : 'rgba(255,255,255,0.4)' }}>
                        {tierLabel}
                      </span>
                      {user?.trust_score ? (
                        <span className="text-white/40 text-[9px] ml-0.5">
                          ★ {user.trust_score}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
          style={{
            background: 'rgba(244, 240, 232, 0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-parchment-dark transition-colors -ml-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-navy" />
            </button>
            <Link to="/app/discover" className="lg:hidden flex items-center gap-2">
              <img src="/logo.png" alt="Lumina Logo" className="w-7 h-7 object-contain rounded-lg" />
              <span className="font-heading font-bold text-[var(--color-navy)]">Lumina</span>
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/app/profile" className="lg:hidden">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback style={{ background: 'var(--color-amber)' }} className="text-white text-xs font-semibold">
                  {user?.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="hidden lg:flex items-center gap-2">
              <div
                className={`trust-badge ${tierClass}`}
              >
                {tierIcon}
                {tierLabel}
                {user?.trust_score ? (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {user.trust_score}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
