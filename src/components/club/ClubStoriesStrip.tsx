import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import StoryViewerModal from '@/components/stories/StoryViewerModal';
import StoryComposerModal from '@/components/stories/StoryComposerModal';

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

interface ClubStoriesStripProps {
  clubId: string;
  clubName: string;
  isMember: boolean;
}

export default function ClubStoriesStrip({ clubId, clubName, isMember }: ClubStoriesStripProps) {
  const { user } = useAuth();
  const { storyGroups } = useStories({ clubId });
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const currentUserGroup = storyGroups.find(g => g.author_id === user?.id);

  if (storyGroups.length === 0) return null;

  return (
    <>
      <div className="mb-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {/* Current User */}
        <button
          onClick={() => {
            if (currentUserGroup) {
              setSelectedGroupIdx(storyGroups.findIndex(g => g.author_id === user?.id));
            } else {
              setIsComposerOpen(true);
            }
          }}
          className="group flex w-[84px] flex-shrink-0 flex-col items-center text-center cursor-pointer"
        >
          <div className={`relative mb-2 flex h-[74px] w-[74px] items-center justify-center rounded-full p-[3px] transition duration-200 group-hover:scale-[1.03] ${
            currentUserGroup
              ? 'bg-[linear-gradient(135deg,rgba(196,135,58,0.4),rgba(196,135,58,0.1))]'
              : 'border border-dashed border-[rgba(196,135,58,0.3)] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(248,232,212,0.95))]'
          }`}>
            <Avatar className="h-full w-full border-[3px] border-[rgba(255,250,245,0.95)]">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.firstName} />
              <AvatarFallback className="bg-[var(--color-plum)] text-sm font-semibold text-white">
                {initials(user?.firstName || 'Y')}
              </AvatarFallback>
            </Avatar>
            <div
              className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-amber)] text-white border-2 border-white shadow-sm hover:scale-110 transition-transform"
              onClick={(e) => { e.stopPropagation(); setIsComposerOpen(true); }}
            >
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full truncate text-xs font-semibold text-[var(--color-navy)]">Your story</div>
          <div className="mt-0.5 w-full truncate text-[11px] text-[var(--color-text-muted)]">Share</div>
        </button>

        {/* Other Members */}
        {storyGroups.filter(g => g.author_id !== user?.id).map((group) => {
          const groupIdx = storyGroups.findIndex(g => g.author_id === group.author_id);
          return (
            <button
              key={group.author_id}
              onClick={() => setSelectedGroupIdx(groupIdx)}
              className="group flex w-[84px] flex-shrink-0 flex-col items-center text-center cursor-pointer"
            >
              <div className={`relative mb-2 flex h-[74px] w-[74px] items-center justify-center rounded-full p-[3px] transition duration-200 group-hover:scale-[1.03] ${
                group.has_unread
                  ? 'bg-[linear-gradient(135deg,#F7D1A4_0%,#E88863_55%,#D85B73_100%)]'
                  : 'bg-[rgba(196,135,58,0.2)]'
              }`}>
                <Avatar className="h-full w-full border-[3px] border-[rgba(255,250,245,0.95)]">
                  <AvatarImage src={group.author.avatar_url} alt={group.author.first_name} />
                  <AvatarFallback className="bg-[var(--color-plum)] text-sm font-semibold text-white">
                    {initials(group.author.first_name + ' ' + (group.author.last_name || ''))}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="w-full truncate text-xs font-semibold text-[var(--color-navy)]">{group.author.first_name}</div>
              <div className="mt-0.5 w-full truncate text-[11px] text-[var(--color-text-muted)]">
                {group.has_unread ? 'New' : 'Viewed'}
              </div>
            </button>
          );
        })}
      </div>

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
          clubId={clubId}
        />
      )}
    </>
  );
}