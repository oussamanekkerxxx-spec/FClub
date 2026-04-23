
import { useState, useRef, useEffect } from 'react';
import { Search, Settings, Menu, Palette, Share2, UserPlus } from 'lucide-react';
import { type StudentTabId, STUDENT_TABS_META } from './StudentClubConstants';

interface StudentTopBarProps {
  activeTab: StudentTabId;
  club?: any;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onSettingsSelect?: (action: 'wallpapers' | 'share' | 'invite') => void;
}

export default function StudentTopBar({ activeTab, club, onMenuClick, onSearchClick, onSettingsSelect }: StudentTopBarProps) {
  const baseMeta = STUDENT_TABS_META[activeTab] || { icon: '📄', title: activeTab, subtitle: '' };
  // For the chat tab, replace the static "128 members" with the real count from the club object
  const meta = (activeTab === 'chat' && club?.member_count != null)
    ? { ...baseMeta, subtitle: `${club.member_count} member${club.member_count !== 1 ? 's' : ''}` }
    : baseMeta;
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3.5 px-6 py-3.5 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] relative z-20 flex-shrink-0">
      
      {onMenuClick && (
        <button className="lg:hidden p-1.5 -ml-2 text-[var(--color-text-secondary)] hover:text-navy" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </button>
      )}

      <span className="text-[18px]">{meta.icon}</span>
      <div className="flex-1 min-w-0">
         <h1 className="text-[16px] font-bold text-navy leading-tight truncate">{meta.title}</h1>
         {meta.subtitle && (
           <div className="text-[11px] font-medium text-[var(--color-text-muted)] truncate">{meta.subtitle}</div>
         )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button onClick={onSearchClick} className="w-[34px] h-[34px] rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] bg-gray-50 border border-[var(--color-border)] hover:bg-parchment hover:text-navy transition-colors" title="Global Search">
          <Search className="w-4 h-4" />
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className={`w-[34px] h-[34px] rounded-xl flex items-center justify-center transition-colors ${showSettingsMenu ? 'bg-navy text-white' : 'text-[var(--color-text-secondary)] bg-gray-50 border border-[var(--color-border)] hover:bg-parchment hover:text-navy'}`} title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          
          {showSettingsMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-[var(--color-border)] py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
              <button onClick={() => { setShowSettingsMenu(false); onSettingsSelect?.('wallpapers'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy hover:bg-gray-50 text-left">
                <Palette className="w-4 h-4 opacity-70" /> Wallpapers
              </button>
              <button onClick={() => { setShowSettingsMenu(false); onSettingsSelect?.('share'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy hover:bg-gray-50 text-left">
                <Share2 className="w-4 h-4 opacity-70" /> Share Club
              </button>
              <button onClick={() => { setShowSettingsMenu(false); onSettingsSelect?.('invite'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy hover:bg-gray-50 text-left">
                <UserPlus className="w-4 h-4 opacity-70" /> Invite Members
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
