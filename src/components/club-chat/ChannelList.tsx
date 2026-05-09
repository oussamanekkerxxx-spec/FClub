import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Hash, Megaphone, Plus, Loader2, MessageSquare, ArrowLeft, MoreVertical, Edit2, Trash2, Pin, PinOff, Archive, ArchiveRestore, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/features/club-chat/store/chatStore';
import type { Channel } from '@/features/club-chat/workspace/types';

interface ChannelListProps {
  isEmbedded?: boolean;
  clubName: string;
  onNavigateBack: () => void;
}

const ChannelList = React.memo(function ChannelList({
  isEmbedded,
  clubName,
  onNavigateBack,
}: ChannelListProps) {
  // ── Store selectors ──
  const channels = useChatStore((s) => s.channels);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const channelUnreads = useChatStore((s) => s.channelUnreads);
  const isAdminOrMod = useChatStore((s) => s.ui.isAdminOrMod);
  const mobileView = useChatStore((s) => s.ui.mobileView);
  const userChannelPrefs = useChatStore((s) => s.userChannelPrefs);
  const user = useChatStore((s) => s.user);
  const clubId = useChatStore((s) => s.clubId);

  const setActiveChannelId = useChatStore((s) => s.setActiveChannelId);
  const setChannelUnreads = useChatStore((s) => s.setChannelUnreads);
  const setChannels = useChatStore((s) => s.setChannels);
  const setUserChannelPrefs = useChatStore((s) => s.setUserChannelPrefs);
  const setUi = useChatStore((s) => s.setUi);

  // ── Local UI state ──
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // ── Add channel form state ──
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isAnnouncements, setIsAnnouncements] = useState(false);
  const [addingChannel, setAddingChannel] = useState(false);

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

  const pinnedIds = useMemo(() => new Set(userChannelPrefs.filter((p: any) => p.is_pinned).map((p: any) => p.channel_id)), [userChannelPrefs]);
  const archivedIds = useMemo(() => new Set(userChannelPrefs.filter((p: any) => p.is_archived).map((p: any) => p.channel_id)), [userChannelPrefs]);

  const pinnedChannels = useMemo(() => channels.filter((c) => pinnedIds.has(c.id) && !archivedIds.has(c.id)), [channels, pinnedIds, archivedIds]);
  const activeChannels = useMemo(() => channels.filter((c) => !pinnedIds.has(c.id) && !archivedIds.has(c.id)), [channels, pinnedIds, archivedIds]);
  const archivedChannels = useMemo(() => channels.filter((c) => archivedIds.has(c.id)), [channels, archivedIds]);

  // ── Actions ──
  const handleSelectChannel = useCallback((channelId: string) => {
    setActiveChannelId(channelId);
    setUi((prev) => ({ ...prev, mobileView: 'chat' }));
    setChannelUnreads((prev) => ({ ...prev, [channelId]: 0 }));
  }, [setActiveChannelId, setUi, setChannelUnreads]);

  const handleToggleAddChannel = useCallback(() => {
    setShowAddChannel((prev) => !prev);
  }, []);

  const handleCancelAddChannel = useCallback(() => {
    setShowAddChannel(false);
    setNewChannelName('');
    setNewChannelDesc('');
    setIsAnnouncements(false);
  }, []);

  const handleAddChannel = useCallback(async () => {
    if (!newChannelName.trim() || !clubId) return;
    setAddingChannel(true);
    const cleanName = newChannelName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const { data, error } = await supabase.from('club_channels').insert({
      club_id: clubId,
      name: cleanName,
      description: newChannelDesc.trim() || null,
      is_announcement_only: isAnnouncements,
      order_index: channels.length,
    }).select().single();

    if (error) {
      toast.error('Failed to create channel.');
    } else {
      setChannels((prev) => [...prev, data]);
      setActiveChannelId(data.id);
      setUi((prev) => ({ ...prev, mobileView: 'chat' }));
      handleCancelAddChannel();
    }
    setAddingChannel(false);
  }, [newChannelName, newChannelDesc, isAnnouncements, clubId, channels.length, setChannels, setActiveChannelId, setUi, handleCancelAddChannel]);

  const handleRenameChannel = useCallback(async (channelId: string, newName: string) => {
    if (!newName.trim()) return;
    const cleanName = newName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { error } = await supabase.from('club_channels').update({ name: cleanName }).eq('id', channelId);
    if (error) {
      toast.error('Failed to rename channel');
    } else {
      setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, name: cleanName } : c)));
      toast.success('Channel renamed');
    }
  }, [setChannels]);

  const handleDeleteChannel = useCallback(async (channelId: string) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    const { error } = await supabase.from('club_channels').delete().eq('id', channelId);
    if (error) {
      toast.error('Failed to delete channel');
    } else {
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      if (activeChannelId === channelId) {
        const remaining = channels.filter((c) => c.id !== channelId);
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success('Channel deleted');
    }
  }, [activeChannelId, channels, setChannels, setActiveChannelId]);

  const handleTogglePinChannel = useCallback(async (channelId: string) => {
    if (!user) return;
    setUserChannelPrefs((prev: any[]) => {
      const existing = prev.find((p: any) => p.channel_id === channelId);
      if (existing) {
        supabase.from('user_channel_preferences').update({ is_pinned: !existing.is_pinned }).eq('user_id', user.id).eq('channel_id', channelId).then();
        return prev.map((p: any) => (p.channel_id === channelId ? { ...p, is_pinned: !existing.is_pinned } : p));
      } else {
        supabase.from('user_channel_preferences').insert({ user_id: user.id, channel_id: channelId, is_pinned: true }).then();
        return [...prev, { user_id: user.id, channel_id: channelId, is_pinned: true, is_archived: false }];
      }
    });
  }, [user, setUserChannelPrefs]);

  const handleToggleArchiveChannel = useCallback(async (channelId: string) => {
    if (!user) return;
    setUserChannelPrefs((prev: any[]) => {
      const existing = prev.find((p: any) => p.channel_id === channelId);
      if (existing) {
        supabase.from('user_channel_preferences').update({ is_archived: !existing.is_archived }).eq('user_id', user.id).eq('channel_id', channelId).then();
        return prev.map((p: any) => (p.channel_id === channelId ? { ...p, is_archived: !existing.is_archived } : p));
      } else {
        supabase.from('user_channel_preferences').insert({ user_id: user.id, channel_id: channelId, is_archived: true }).then();
        return [...prev, { user_id: user.id, channel_id: channelId, is_pinned: false, is_archived: true }];
      }
    });
  }, [user, setUserChannelPrefs]);

  const startEditing = useCallback((channel: Channel, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChannelId(channel.id);
    setEditingChannelName(channel.name);
    setOpenMenuId(null);
  }, []);

  const saveRename = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingChannelId && editingChannelName.trim()) {
      handleRenameChannel(editingChannelId, editingChannelName);
    }
    setEditingChannelId(null);
  }, [editingChannelId, editingChannelName, handleRenameChannel]);

  const cancelRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChannelId(null);
  }, []);

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
            onChange={(e) => setEditingChannelName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(e); if (e.key === 'Escape') cancelRename(e as any); }}
            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
          />
          <button onClick={saveRename} aria-label="Save rename" className="p-1 text-green-500 hover:bg-green-50 rounded-md">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={cancelRename} aria-label="Cancel rename" className="p-1 text-red-500 hover:bg-red-50 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div key={chan.id} className="relative group">
        <button
          onClick={() => handleSelectChannel(chan.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all ${
            isActive
              ? 'bg-[var(--color-navy)] text-white rounded-full shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-navy rounded-xl'
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
          aria-label="Channel options"
          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
            openMenuId === chan.id ? 'opacity-100 bg-black/10' : 'opacity-0 group-hover:opacity-100 hover:bg-black/10'
          } ${isActive ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Context Menu */}
        {openMenuId === chan.id && (
          <div ref={menuRef} className="absolute right-2 top-8 w-40 bg-white rounded-xl shadow-lg border border-[var(--color-border)] py-1 z-50">
            <button
              onClick={(e) => { e.stopPropagation(); handleTogglePinChannel(chan.id); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-navy hover:bg-gray-50 text-left"
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              {isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleArchiveChannel(chan.id); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-navy hover:bg-gray-50 text-left"
            >
              {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              {isArchived ? 'Unarchive' : 'Archive'}
            </button>
            {isAdminOrMod && (
              <button
                onClick={(e) => startEditing(chan, e)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-navy hover:bg-gray-50 text-left border-t border-[var(--color-border)]"
              >
                <Edit2 className="w-3.5 h-3.5" /> Rename
              </button>
            )}
            {isAdminOrMod && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteChannel(chan.id); setOpenMenuId(null); }}
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

  const renderCompactChannel = (chan: Channel) => {
    const isActive = chan.id === activeChannelId;
    const Icon = chan.is_announcement_only ? Megaphone : Hash;
    const unreads = channelUnreads[chan.id] ?? 0;

    return (
      <div key={chan.id} className="relative">
        <button
          onClick={() => handleSelectChannel(chan.id)}
          title={chan.name}
          className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${
            isActive
              ? 'bg-[var(--color-navy)] text-white shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-navy hover:bg-black/5'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
        {unreads > 0 && !isActive && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-amber)] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {unreads > 99 ? '99' : unreads}
          </span>
        )}
      </div>
    );
  };

  /* ---------- Compact embedded rail ---------- */
  if (isEmbedded) {
    return (
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-14 border-r border-[var(--color-border)] bg-white items-center py-3 gap-2 overflow-y-auto`}>
        {channels.map((c) => renderCompactChannel(c))}
        {isAdminOrMod && (
          <button
            onClick={handleToggleAddChannel}
            aria-label="Add channel"
            className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-amber)] hover:bg-black/5 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        {channels.length === 0 && (
          <div className="text-center py-4 px-1">
            <MessageSquare className="w-5 h-5 mx-auto text-[var(--color-text-muted)] opacity-50" />
          </div>
        )}
      </div>
    );
  }

  /* ---------- Full sidebar (non-embedded) ---------- */
  return (
    <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 border-r border-[var(--color-border)] bg-white`}>
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
          <button onClick={handleToggleAddChannel} aria-label="Add channel" className="hover:text-[var(--color-amber)] transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add Channel Inline Form */}
        {showAddChannel && (
          <div className="sc-card p-3 mb-3 bg-white border border-[var(--color-amber)]/30">
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="channel-name"
              className="sc-input text-xs px-2 py-1.5 mb-2 w-full"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddChannel(); }}
              autoFocus
            />
            <input
              value={newChannelDesc}
              onChange={(e) => setNewChannelDesc(e.target.value)}
              placeholder="Description (optional)"
              className="sc-input text-xs px-2 py-1.5 mb-2 w-full"
            />
            {isAdminOrMod && (
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-3 cursor-pointer">
                <input type="checkbox" checked={isAnnouncements} onChange={(e) => setIsAnnouncements(e.target.checked)} />
                Announcements only
              </label>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={handleAddChannel}
                disabled={addingChannel || !newChannelName.trim()}
                className="btn-amber text-xs py-1.5 px-3 flex-1 disabled:opacity-50"
              >
                {addingChannel ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Create'}
              </button>
              <button onClick={handleCancelAddChannel} className="btn-ghost text-xs py-1.5 px-2">Cancel</button>
            </div>
          </div>
        )}

        {/* Pinned Channels */}
        {pinnedChannels.length > 0 && (
          <div className="mb-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 mb-1 flex items-center gap-1">
              <Pin className="w-3 h-3" /> Pinned
            </div>
            {pinnedChannels.map((c) => renderChannel(c, true))}
          </div>
        )}

        {/* Active Channels */}
        <div className="space-y-1">
          {activeChannels.map((c) => renderChannel(c, false))}
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
                {archivedChannels.map((c) => renderChannel(c, false))}
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
});

export default ChannelList;
