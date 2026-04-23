import { useState, useRef, useEffect } from 'react';
import { Hash, Megaphone, Plus, Loader2, MessageSquare, ArrowLeft, MoreVertical, Edit2, Trash2, Pin, PinOff, Archive, ArchiveRestore, ChevronDown, ChevronRight, Check, X } from 'lucide-react';

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
  isEmbedded?: boolean;
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
  addingChannel?: boolean;
  userChannelPrefs?: any[];
  onNavigateBack: () => void;
  onSelectChannel: (channelId: string) => void;
  onToggleAddChannel: () => void;
  onNewChannelNameChange: (value: string) => void;
  onNewChannelDescChange: (value: string) => void;
  onIsAnnouncementsChange: (value: boolean) => void;
  onAddChannel: () => void;
  onRenameChannel?: (channelId: string, newName: string) => void;
  onDeleteChannel?: (channelId: string) => void;
  onTogglePinChannel?: (channelId: string) => void;
  onToggleArchiveChannel?: (channelId: string) => void;
  onCancelAddChannel: () => void;
}

export default function ChannelList({
  isEmbedded,
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
  userChannelPrefs = [],
  onNavigateBack,
  onSelectChannel,
  onToggleAddChannel,
  onNewChannelNameChange,
  onNewChannelDescChange,
  onIsAnnouncementsChange,
  onAddChannel,
  onRenameChannel,
  onDeleteChannel,
  onTogglePinChannel,
  onToggleArchiveChannel,
  onCancelAddChannel,
}: ChannelListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pinnedIds = new Set(userChannelPrefs.filter(p => p.is_pinned).map(p => p.channel_id));
  const archivedIds = new Set(userChannelPrefs.filter(p => p.is_archived).map(p => p.channel_id));

  const pinnedChannels = channels.filter(c => pinnedIds.has(c.id) && !archivedIds.has(c.id));
  const activeChannels = channels.filter(c => !pinnedIds.has(c.id) && !archivedIds.has(c.id));
  const archivedChannels = channels.filter(c => archivedIds.has(c.id));

  const startEditing = (channel: Channel, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChannelId(channel.id);
    setEditingChannelName(channel.name);
    setOpenMenuId(null);
  };

  const saveRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingChannelId && onRenameChannel && editingChannelName.trim()) {
      onRenameChannel(editingChannelId, editingChannelName);
    }
    setEditingChannelId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChannelId(null);
  };

  const renderChannel = (chan: Channel, isPinned: boolean = false) => {
    const isActive = chan.id === activeChannelId;
    const Icon = chan.is_announcement_only ? Megaphone : Hash;
    const isArchived = archivedIds.has(chan.id);
    const isEditing = editingChannelId === chan.id;

    if (isEditing) {
      return (
        <div key={chan.id} className="flex items-center gap-1 px-2 py-1.5 bg-white border border-[var(--color-amber)] rounded-xl">
          <Icon className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 ml-1" />
          <input
            autoFocus
            value={editingChannelName}
            onChange={e => setEditingChannelName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(e); if (e.key === 'Escape') cancelRename(e as any); }}
            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
          />
          <button onClick={saveRename} className="p-1 text-green-500 hover:bg-green-50 rounded-md">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={cancelRename} className="p-1 text-red-500 hover:bg-red-50 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div key={chan.id} className="relative group">
        <button
          onClick={() => onSelectChannel(chan.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            isActive ? 'bg-[var(--color-navy)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[#F0F0F0] hover:text-navy'
          }`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`} />
          <span className="truncate flex-1 text-left">{chan.name}</span>
          {(channelUnreads[chan.id] ?? 0) > 0 && !isActive && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0 bg-[var(--color-amber)] text-white`}>
              {channelUnreads[chan.id] > 99 ? '99+' : channelUnreads[chan.id]}
            </span>
          )}
          {isPinned && !isActive && <Pin className="w-3 h-3 text-[var(--color-text-muted)] opacity-50" />}
        </button>

        {/* Options button (visible on hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chan.id ? null : chan.id); }}
          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
            openMenuId === chan.id ? 'opacity-100 bg-black/10' : 'opacity-0 group-hover:opacity-100 hover:bg-black/10'
          } ${isActive ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Context Menu */}
        {openMenuId === chan.id && (
          <div ref={menuRef} className="absolute right-2 top-8 w-40 bg-white rounded-xl shadow-lg border border-[var(--color-border)] py-1 z-50">
            {onTogglePinChannel && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePinChannel(chan.id); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-navy hover:bg-gray-50 text-left"
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                {isPinned ? 'Unpin' : 'Pin'}
              </button>
            )}
            {onToggleArchiveChannel && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleArchiveChannel(chan.id); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-navy hover:bg-gray-50 text-left"
              >
                {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                {isArchived ? 'Unarchive' : 'Archive'}
              </button>
            )}
            {isAdminOrMod && onRenameChannel && (
              <button
                onClick={(e) => startEditing(chan, e)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-navy hover:bg-gray-50 text-left border-t border-[var(--color-border)]"
              >
                <Edit2 className="w-3.5 h-3.5" /> Rename
              </button>
            )}
            {isAdminOrMod && onDeleteChannel && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteChannel(chan.id); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 border-r border-[var(--color-border)] bg-[#FAFAFA]`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--color-border)] bg-white">
        {!isEmbedded && (
          <button onClick={onNavigateBack} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-navy mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Club
          </button>
        )}
        <h2 className="font-heading text-navy text-lg font-bold truncate">{clubName}</h2>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 mb-2 flex items-center justify-between">
          <span>Channels</span>
          <button onClick={onToggleAddChannel} className="hover:text-[var(--color-amber)] transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add Channel Inline Form */}
        {showAddChannel && (
          <div className="sc-card p-3 mb-3 bg-white border border-[var(--color-amber)]/30">
            <input value={newChannelName} onChange={e => onNewChannelNameChange(e.target.value)}
              placeholder="channel-name" className="sc-input text-xs px-2 py-1.5 mb-2 w-full"
              onKeyDown={e => { if (e.key === 'Enter') onAddChannel(); }} autoFocus />
            <input value={newChannelDesc} onChange={e => onNewChannelDescChange(e.target.value)}
              placeholder="Description (optional)" className="sc-input text-xs px-2 py-1.5 mb-2 w-full" />
            {isAdminOrMod && (
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-3 cursor-pointer">
                <input type="checkbox" checked={isAnnouncements} onChange={e => onIsAnnouncementsChange(e.target.checked)} />
                Announcements only
              </label>
            )}
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

        {/* Pinned Channels */}
        {pinnedChannels.length > 0 && (
          <div className="mb-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 mb-1 flex items-center gap-1">
              <Pin className="w-3 h-3" /> Pinned
            </div>
            {pinnedChannels.map(c => renderChannel(c, true))}
          </div>
        )}

        {/* Active Channels */}
        <div className="space-y-1">
          {activeChannels.map(c => renderChannel(c, false))}
        </div>

        {/* Archived Channels */}
        {archivedChannels.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 py-1 hover:text-[var(--color-navy)] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Archive className="w-3 h-3" /> Archived ({archivedChannels.length})
              </div>
              {showArchived ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showArchived && (
              <div className="space-y-1 mt-1 opacity-70">
                {archivedChannels.map(c => renderChannel(c, false))}
              </div>
            )}
          </div>
        )}

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
