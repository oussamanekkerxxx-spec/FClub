import { useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getChatStore } from '@/features/club-chat/store/chatStore';

export function useChatUi() {
  return useMemo(() => {
    const handleDeleteMessage = async (msgId: string) => {
      if (!window.confirm('Delete this message?')) return;
      const store = getChatStore();
      store.setMessages((prev: any[]) => prev.map(m => (m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m)));
      await supabase.from('club_messages').update({ deleted_at: new Date().toISOString() }).eq('id', msgId);
    };

    const handleEditMessage = (msg: any) => {
      const store = getChatStore();
      store.setComposerEditing(msg);
      store.setComposerReplyingTo(null);
      store.setComposerText(msg.content || '');
    };

    const handleReplyMessage = (msg: any) => {
      const store = getChatStore();
      store.setComposerReplyingTo(msg);
      store.setComposerEditing(null);
    };

    const handleToggleReaction = async (msgId: string, emoji: string) => {
      const store = getChatStore();
      if (!store.user) return;
      const msg = store.messages.find((m: any) => m.id === msgId);
      if (!msg) return;
      const existing = msg.reactions?.find((r: any) => r.user_id === store.user!.id && r.emoji === emoji);
      if (existing) {
        await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('message_reactions').insert({ message_id: msgId, user_id: store.user.id, emoji });
      }
    };

    const handlePinMessage = async (msg: any) => {
      const store = getChatStore();
      if (!store.activeChannelId) return;
      await supabase.from('club_channels').update({ pinned_message_id: msg.id }).eq('id', store.activeChannelId);
      store.setChannels((prev: any[]) => prev.map(c => (c.id === store.activeChannelId ? { ...c, pinned_message_id: msg.id } : c)));
      store.setPinnedMessage(msg);
      toast.success('Message pinned');
    };

    const handleUnpinMessage = async () => {
      const store = getChatStore();
      if (!store.activeChannelId) return;
      await supabase.from('club_channels').update({ pinned_message_id: null }).eq('id', store.activeChannelId);
      store.setChannels((prev: any[]) => prev.map(c => (c.id === store.activeChannelId ? { ...c, pinned_message_id: null } : c)));
      store.setPinnedMessage(null);
      toast.success('Message unpinned');
    };

    const handleForwardMessage = async (targetChannelId: string) => {
      const store = getChatStore();
      if (!store.ui.forwardingMessage || !store.user) return;
      const msg = store.ui.forwardingMessage;
      await supabase.from('club_messages').insert({
        channel_id: targetChannelId, sender_id: store.user.id, content: msg.content || '',
        image_url: msg.image_url ?? null, video_url: msg.video_url ?? null, pdf_url: msg.pdf_url ?? null,
        forwarded_from_id: msg.id,
        forwarded_from_name: msg.sender?.first_name
          ? `${msg.sender.first_name}${msg.sender.last_name ? ` ${msg.sender.last_name}` : ''}`
          : 'Member',
      });
      toast.success('Message forwarded');
      store.setUi({ forwardingMessage: null, showForwardModal: false });
    };

    const updatePreference = async (key: string, value: any) => {
      const store = getChatStore();
      if (!store.user) return;
      store.setPreferences(store.preferences ? { ...store.preferences, [key]: value } : store.preferences);
      await supabase.from('user_chat_preferences').update({ [key]: value }).eq('user_id', store.user.id);
    };

    return {
      handleDeleteMessage,
      handleEditMessage,
      handleReplyMessage,
      handleToggleReaction,
      handlePinMessage,
      handleUnpinMessage,
      handleForwardMessage,
      updatePreference,
    };
  }, []);
}
