import type { ChatStoreState } from './types';

export function selectActiveChannel(state: ChatStoreState) {
  if (!state.activeChannelId) return undefined;
  return state.channels.find((c) => c.id === state.activeChannelId);
}

export function selectFilteredMessages(state: ChatStoreState) {
  if (!state.ui.searchQuery.trim()) return state.messages;
  const q = state.ui.searchQuery.toLowerCase();
  return state.messages.filter((m) => m.content?.toLowerCase().includes(q));
}

export function selectCanPost(state: ChatStoreState) {
  const activeChannel = selectActiveChannel(state);
  if (!activeChannel) return false;
  return !activeChannel.is_announcement_only || state.ui.isAdminOrMod;
}
