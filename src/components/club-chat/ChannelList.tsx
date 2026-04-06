import { Hash, Megaphone, Plus, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';

interface Channel {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  is_announcement_only: boolean;
  order_index: number;
  slow_mode_delay?: number;
  pinned_message_id?: string | null;
}

interface ChannelListProps {
  clubName: string;
  channels: Channel[];
  activeChannelId: string | null;
  channelUnreads: Record<string, number>;
  isAdminOrMod: boolean;
  mobileView: 'channels' | 'chat';
  showAddChannel: boolean;
  newChannelName: string;
  newChannelDesc: string;
  isAnnouncements: boolean;
  addingChannel: boolean;
  onNavigateBack: () => void;
  onSelectChannel: (channelId: string) => void;
  onToggleAddChannel: () => void;
  onNewChannelNameChange: (value: string) => void;
  onNewChannelDescChange: (value: string) => void;
  onIsAnnouncementsChange: (value: boolean) => void;
  onAddChannel: () => void;
  onCancelAddChannel: () => void;
}

export default function ChannelList({
  clubName,
  channels,
  activeChannelId,
  channelUnreads,
  isAdminOrMod,
  mobileView,
  showAddChannel,
  newChannelName,
  newChannelDesc,
  isAnnouncements,
  addingChannel,
  onNavigateBack,
  onSelectChannel,
  onToggleAddChannel,
  onNewChannelNameChange,
  onNewChannelDescChange,
  onIsAnnouncementsChange,
  onAddChannel,
  onCancelAddChannel,
}: ChannelListProps) {
  return (
    <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 border-r border-[var(--color-border)] bg-[#FAFAFA]`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--color-border)] bg-white">
        <button onClick={onNavigateBack} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-navy mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Club
        </button>
        <h2 className="font-heading text-navy text-lg font-bold truncate">{clubName}</h2>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 mb-2 flex items-center justify-between">
          <span>Channels</span>
          {isAdminOrMod && (
            <button onClick={onToggleAddChannel} className="hover:text-[var(--color-amber)] transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Add Channel Inline Form */}
        {showAddChannel && isAdminOrMod && (
          <div className="sc-card p-3 mb-3 bg-white border border-[var(--color-amber)]/30">
            <input value={newChannelName} onChange={e => onNewChannelNameChange(e.target.value)}
              placeholder="channel-name" className="sc-input text-xs px-2 py-1.5 mb-2 w-full"
              onKeyDown={e => { if (e.key === 'Enter') onAddChannel(); }} autoFocus />
            <input value={newChannelDesc} onChange={e => onNewChannelDescChange(e.target.value)}
              placeholder="Description (optional)" className="sc-input text-xs px-2 py-1.5 mb-2 w-full" />
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-3 cursor-pointer">
              <input type="checkbox" checked={isAnnouncements} onChange={e => onIsAnnouncementsChange(e.target.checked)} />
              Announcements only
            </label>
            <div className="flex gap-1.5">
              <button onClick={onAddChannel} disabled={addingChannel || !newChannelName.trim()}
                className="btn-amber text-xs py-1.5 px-3 flex-1 disabled:opacity-50">
                {addingChannel ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Create'}
              </button>
              <button onClick={onCancelAddChannel}
                className="btn-ghost text-xs py-1.5 px-2">Cancel</button>
            </div>
          </div>
        )}

        {channels.map(chan => {
          const isActive = chan.id === activeChannelId;
          const Icon = chan.is_announcement_only ? Megaphone : Hash;
          return (
            <button
              key={chan.id}
              onClick={() => onSelectChannel(chan.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-[var(--color-navy)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[#F0F0F0] hover:text-navy'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`} />
              <span className="truncate flex-1 text-left">{chan.name}</span>
              {(channelUnreads[chan.id] ?? 0) > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0
                  ${isActive ? 'bg-white/25 text-white' : 'bg-[var(--color-amber)] text-white'}`}>
                  {channelUnreads[chan.id] > 99 ? '99+' : channelUnreads[chan.id]}
                </span>
              )}
            </button>
          );
        })}

        {channels.length === 0 && (
          <div className="text-center py-6 px-4">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
            <p className="text-xs text-[var(--color-text-secondary)]">No channels yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
