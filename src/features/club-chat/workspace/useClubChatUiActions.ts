import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export function useClubChatUiActions(ctx: any) {
  const {
    user,
    clubId,
    channels,
    messages,
    activeChannelId,
    forwardingMessage,
    newChannelName,
    newChannelDesc,
    isAnnouncements,
    setMessages,
    setEditingMessage,
    setReplyingTo,
    setNewMessage,
    textareaRef,
    setAddingChannel,
    setChannels,
    setActiveChannelId,
    setPinnedMessage,
    setShowForwardModal,
    setForwardingMessage,
    setShowAddChannel,
    setNewChannelName,
    setNewChannelDesc,
    setIsAnnouncements,
    setMobileView,
    setPreferences,
    setUserChannelPrefs,
  } = ctx;

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    setMessages((prev: any[]) => prev.map(m => (m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m)));
    await supabase.from('club_messages').update({ deleted_at: new Date().toISOString() }).eq('id', msgId);
  };

  const handleEditMessage = (msg: any) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setNewMessage(msg.content || '');
    textareaRef.current?.focus();
  };

  const handleReplyMessage = (msg: any) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    textareaRef.current?.focus();
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const msg = messages.find((m: any) => m.id === msgId);
    if (!msg) return;
    const existing = msg.reactions?.find((r: any) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji });
    }
  };

  const handleAddChannel = async () => {
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
      setChannels((prev: any[]) => [...prev, data]);
      setActiveChannelId(data.id);
      setShowAddChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setIsAnnouncements(false);
      setMobileView('chat');
    }
    setAddingChannel(false);
  };

  const handleRenameChannel = async (channelId: string, newName: string) => {
    if (!newName.trim()) return;
    const cleanName = newName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { error } = await supabase.from('club_channels').update({ name: cleanName }).eq('id', channelId);
    if (error) toast.error('Failed to rename channel');
    else {
      setChannels((prev: any[]) => prev.map(c => c.id === channelId ? { ...c, name: cleanName } : c));
      toast.success('Channel renamed');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    const { error } = await supabase.from('club_channels').delete().eq('id', channelId);
    if (error) toast.error('Failed to delete channel');
    else {
      setChannels((prev: any[]) => prev.filter(c => c.id !== channelId));
      if (activeChannelId === channelId) {
        const remaining = channels.filter((c: any) => c.id !== channelId);
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success('Channel deleted');
    }
  };

  const handleTogglePinChannel = async (channelId: string) => {
    if (!user) return;
    setUserChannelPrefs((prev: any[]) => {
      const existing = prev.find(p => p.channel_id === channelId);
      if (existing) {
        supabase.from('user_channel_preferences').update({ is_pinned: !existing.is_pinned }).eq('user_id', user.id).eq('channel_id', channelId).then();
        return prev.map(p => p.channel_id === channelId ? { ...p, is_pinned: !existing.is_pinned } : p);
      } else {
        supabase.from('user_channel_preferences').insert({ user_id: user.id, channel_id: channelId, is_pinned: true }).then();
        return [...prev, { user_id: user.id, channel_id: channelId, is_pinned: true, is_archived: false }];
      }
    });
  };

  const handleToggleArchiveChannel = async (channelId: string) => {
    if (!user) return;
    setUserChannelPrefs((prev: any[]) => {
      const existing = prev.find(p => p.channel_id === channelId);
      if (existing) {
        supabase.from('user_channel_preferences').update({ is_archived: !existing.is_archived }).eq('user_id', user.id).eq('channel_id', channelId).then();
        return prev.map(p => p.channel_id === channelId ? { ...p, is_archived: !existing.is_archived } : p);
      } else {
        supabase.from('user_channel_preferences').insert({ user_id: user.id, channel_id: channelId, is_archived: true }).then();
        return [...prev, { user_id: user.id, channel_id: channelId, is_pinned: false, is_archived: true }];
      }
    });
  };

  const handlePinMessage = async (msg: any) => {
    if (!activeChannelId) return;
    await supabase.from('club_channels').update({ pinned_message_id: msg.id }).eq('id', activeChannelId);
    setChannels((prev: any[]) => prev.map(c => (c.id === activeChannelId ? { ...c, pinned_message_id: msg.id } : c)));
    setPinnedMessage(msg);
    toast.success('Message pinned');
  };

  const handleUnpinMessage = async () => {
    if (!activeChannelId) return;
    await supabase.from('club_channels').update({ pinned_message_id: null }).eq('id', activeChannelId);
    setChannels((prev: any[]) => prev.map(c => (c.id === activeChannelId ? { ...c, pinned_message_id: null } : c)));
    setPinnedMessage(null);
    toast.success('Message unpinned');
  };

  const handleForwardMessage = async (targetChannelId: string) => {
    if (!forwardingMessage || !user) return;
    await supabase.from('club_messages').insert({
      channel_id: targetChannelId,
      sender_id: user.id,
      content: forwardingMessage.content || '',
      image_url: forwardingMessage.image_url ?? null,
      video_url: forwardingMessage.video_url ?? null,
      pdf_url: forwardingMessage.pdf_url ?? null,
      forwarded_from_id: forwardingMessage.id,
      forwarded_from_name: forwardingMessage.sender?.first_name
        ? `${forwardingMessage.sender.first_name}${forwardingMessage.sender.last_name ? ` ${forwardingMessage.sender.last_name}` : ''}`
        : 'Member',
    });
    toast.success('Message forwarded');
    setForwardingMessage(null);
    setShowForwardModal(false);
  };

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    setPreferences((prev: any) => (prev ? { ...prev, [key]: value } : prev));
    await supabase.from('user_chat_preferences').update({ [key]: value }).eq('user_id', user.id);
  };

  return {
    handleDeleteMessage,
    handleEditMessage,
    handleReplyMessage,
    handleToggleReaction,
    handleAddChannel,
    handleRenameChannel,
    handleDeleteChannel,
    handleTogglePinChannel,
    handleToggleArchiveChannel,
    handlePinMessage,
    handleUnpinMessage,
    handleForwardMessage,
    updatePreference,
  };
}
