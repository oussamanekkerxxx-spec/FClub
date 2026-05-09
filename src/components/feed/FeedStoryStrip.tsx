import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import StoryViewerModal from '@/components/stories/StoryViewerModal';
import StoryComposerModal from '@/components/stories/StoryComposerModal';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function FeedStoryStrip() {
  const { user } = useAuth();
  const { storyGroups } = useStories();
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Wait for loading or at least have something minimal.
  // Real implementation gracefully fades in
  
  // Find current user's group to determine if they already posted
  const currentUserGroup = storyGroups.find(g => g.author_id === user?.id);

  return (
    <>
      <section className="rounded-2xl border border-[rgba(196,135,58,0.14)] bg-[rgba(255,250,245,0.96)] p-2 shadow-[0_12px_30px_rgba(196,135,58,0.07)] md:rounded-[28px] md:p-4">
        <div className="mb-2 hidden md:flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-navy)]">People in motion</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              A quick pulse of who has been active lately.
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none md:gap-3 md:pb-1">
          {/* Current User specific node (Always first) */}
          <button
            onClick={() => {
               if (currentUserGroup) {
                 // They have a story, view it
                 const idx = storyGroups.findIndex(g => g.author_id === user?.id);
                 setSelectedGroupIdx(idx);
               } else {
                 setIsComposerOpen(true);
               }
            }}
            className="group flex w-[66px] flex-shrink-0 flex-col items-center text-center cursor-pointer md:w-[84px]"
          >
            <div
              className={`relative mb-1.5 flex h-[56px] w-[56px] items-center justify-center rounded-full p-[2px] transition duration-200 group-hover:scale-[1.03] md:mb-2 md:h-[74px] md:w-[74px] md:p-[3px] ${
                currentUserGroup
                  ? 'bg-[linear-gradient(135deg,rgba(196,135,58,0.4),rgba(196,135,58,0.1))]'
                  : 'border border-dashed border-[rgba(196,135,58,0.3)] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(248,232,212,0.95))]'
              }`}
            >
                <Avatar className="h-full w-full border-2 border-[rgba(255,250,245,0.95)] md:border-[3px]">
                  <AvatarImage src={user?.avatar ?? undefined} alt={user?.firstName} />
                  <AvatarFallback className="bg-[var(--color-plum)] text-[11px] font-semibold text-white md:text-sm">
                    {initials(user?.firstName || 'Y')}
                  </AvatarFallback>
                </Avatar>

                {/* Plus Icon overlay for adding */}
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--color-amber)] text-white border-2 border-white shadow-sm hover:scale-110 transition-transform md:w-6 md:h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposerOpen(true);
                  }}
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                </div>
            </div>

            <div className="w-full truncate text-[11px] font-semibold text-[var(--color-navy)] md:text-xs">
              Your story
            </div>
            <div className="mt-0.5 hidden w-full truncate text-[11px] text-[var(--color-text-muted)] md:block">
              Share
            </div>
          </button>

          {/* Other Users */}
          {storyGroups.filter(g => g.author_id !== user?.id).map((group) => {
            // Find its index in the full array so modal works right
            const groupIdx = storyGroups.findIndex(g => g.author_id === group.author_id);
            
            return (
              <button
                key={group.author_id}
                onClick={() => setSelectedGroupIdx(groupIdx)}
                className="group flex w-[66px] flex-shrink-0 flex-col items-center text-center cursor-pointer md:w-[84px]"
              >
                <div
                  className={`relative mb-1.5 flex h-[56px] w-[56px] items-center justify-center rounded-full p-[2px] transition duration-200 group-hover:scale-[1.03] md:mb-2 md:h-[74px] md:w-[74px] md:p-[3px] ${
                    group.has_unread
                      ? 'bg-[linear-gradient(135deg,#F7D1A4_0%,#E88863_55%,#D85B73_100%)]'
                      : 'bg-[rgba(196,135,58,0.2)]' // Read state subtle ring
                  }`}
                >
                  <Avatar className="h-full w-full border-2 border-[rgba(255,250,245,0.95)] md:border-[3px]">
                    <AvatarImage src={group.author.avatar_url} alt={group.author.first_name} />
                    <AvatarFallback className="bg-[var(--color-plum)] text-[11px] font-semibold text-white md:text-sm">
                      {initials(group.author.first_name + ' ' + (group.author.last_name || ''))}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="w-full truncate text-[11px] font-semibold text-[var(--color-navy)] md:text-xs">
                  {group.author.first_name}
                </div>
                <div className="mt-0.5 hidden w-full truncate text-[11px] text-[var(--color-text-muted)] md:block">
                  {group.has_unread ? 'New' : 'Viewed'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedGroupIdx !== null && (
        <StoryViewerModal 
          groups={storyGroups} 
          initialGroupIndex={selectedGroupIdx} 
          onClose={() => setSelectedGroupIdx(null)} 
        />
      )}
      
      {isComposerOpen && (
        <StoryComposerModal 
          isOpen={isComposerOpen} 
          onClose={() => setIsComposerOpen(false)} 
        />
      )}
    </>
  );
}
