import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type StudentTabId } from './StudentClubConstants';
import StudentSidebar from './StudentSidebar';
import StudentTopBar from './StudentTopBar';
import StudentViews from './StudentViews';
import GlobalMessageSearchModal from '@/components/club-chat/GlobalMessageSearchModal';
import InviteModal from '@/components/club/InviteModal';
import ShareClubModal from '@/components/club/ShareClubModal';
import { useNavigate } from 'react-router-dom';

interface StudentClubHomeProps {
  club: any;
  user: any;
  isMember: boolean;
  canModerate: boolean;
}

export default function StudentClubHome({ club, user, isMember, canModerate }: StudentClubHomeProps) {
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTabId>('chat');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [liveMemberCount, setLiveMemberCount] = useState<number | null>(club?.member_count ?? null);
  const navigate = useNavigate();

  // Keep member count live via a real-time subscription on club_memberships
  useEffect(() => {
    if (!club?.id) return;
    // Initial accurate count
    supabase
      .from('club_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', club.id)
      .eq('status', 'active')
      .then(({ count }) => { if (count !== null) setLiveMemberCount(count); });

    // Subscribe to changes
    const channel = supabase
      .channel(`club-members-${club.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_memberships', filter: `club_id=eq.${club.id}` }, () => {
        supabase
          .from('club_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', club.id)
          .eq('status', 'active')
          .then(({ count }) => { if (count !== null) setLiveMemberCount(count); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [club?.id]);

  const handleTabChange = (tab: StudentTabId) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close mobile sidebar on navigation
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      document.body.classList.add('hide-app-navs');
      return () => document.body.classList.remove('hide-app-navs');
    }
  }, [activeTab]);

  const handleSettingsSelect = (action: 'wallpapers' | 'share' | 'invite') => {
    if (action === 'wallpapers') {
      window.dispatchEvent(new CustomEvent('open-chat-settings'));
    } else if (action === 'share') {
      setShowShare(true);
    } else if (action === 'invite') {
      setShowInvite(true);
    }
  };

  return (
    <div className={`flex overflow-hidden bg-gray-50/50 relative rounded-tl-xl ${
      activeTab === 'chat' 
        ? 'h-[100dvh] md:h-[calc(100vh-56px)] m-0 md:-m-4 lg:-m-6' 
        : 'h-[calc(100vh-56px)] -m-4 lg:-m-6'
    }`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`
        absolute md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 h-full
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <StudentSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          club={club}
          user={user}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 relative h-full ${activeTab === 'chat' ? 'bg-white' : 'bg-parchment'}`}>
        {/* Glow effect matching FightClub but adapted from the HTML design's orange blur */}
        <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-amber-400/10 to-orange-500/5 blur-[80px] pointer-events-none" />

        <StudentTopBar 
          activeTab={activeTab}
          club={{ ...club, member_count: liveMemberCount ?? club?.member_count }}
          onMenuClick={() => setIsSidebarOpen(true)}
          onSearchClick={() => setShowGlobalSearch(true)}
          onSettingsSelect={handleSettingsSelect}
        />
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent relative z-10">
          <StudentViews
            activeTab={activeTab}
            clubId={club.id}
            isMember={isMember}
            canModerate={canModerate}
            userId={user?.id}
          />
        </div>
      </div>
      
      {showGlobalSearch && (
        <GlobalMessageSearchModal
          clubId={club.id}
          onClose={() => setShowGlobalSearch(false)}
          onSelectMessage={(channelId, messageId) => {
            // Need to pass this info to ClubChatWorkspace to focus it.
            // A simple way is to use window.dispatchEvent or location state
            navigate(`/app/club/${club.id}/chat`, { 
              state: { focusChannelId: channelId, focusMessageId: messageId },
              replace: true 
            });
            setActiveTab('chat');
            window.dispatchEvent(new CustomEvent('focus-chat-message', {
              detail: { channelId, messageId }
            }));
          }}
        />
      )}

      {showShare && (
        <ShareClubModal club={club} onClose={() => setShowShare(false)} />
      )}

      {showInvite && (
        <InviteModal club={club} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
