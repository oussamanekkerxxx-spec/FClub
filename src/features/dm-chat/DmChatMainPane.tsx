import { useState } from 'react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import {
  ArrowLeft, Search, X, MoreVertical, Layers, BellOff,
  Trash2, UserRound, ArrowDown, Loader2, ChevronUp, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import MessageItem from '@/components/club-chat/MessageItem';
import MessageInput from '@/components/club-chat/MessageInput';
import VirtualizedMessageList from '@/components/club-chat/VirtualizedMessageList';
import { parseMessageContent as cachedParseMessageContent } from '@/features/club-chat/lib/parseMessageContent';

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim().toUpperCase() || '?';
}

/** Translate DmMessage shape → the shape MessageItem expects (club-chat Message). */
function adaptToChatMessage(msg: any): any {
  return {
    ...msg,
    // MessageItem expects channel_id — supply conversation_id so data-message-id works
    channel_id: msg.conversation_id ?? msg.channel_id,
    content: msg.content ?? '',
  };
}

interface DmChatMainPaneProps {
  c: any;
}

export default function DmChatMainPane({ c }: DmChatMainPaneProps) {
  const selected = c.selectedConversation;
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  const parseMessageContent = (text: string, query: string) => cachedParseMessageContent(text, query);

  const filteredMessages = c.searchQuery.trim()
    ? c.messages.filter((m: any) => m.content?.toLowerCase().includes(c.searchQuery.toLowerCase()))
    : c.messages;

  return (
    <section
      className={`${c.mobileView === 'list' ? 'hidden md:flex' : 'flex'} min-h-0 flex-col bg-[rgba(255,252,248,0.92)] relative flex-1`}
    >
      {selected ? (
        <>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col bg-white border-b border-[var(--color-border)] z-10 shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-1.5 rounded-lg hover:bg-parchment -ml-1.5"
                  onClick={() => c.setMobileView('list')}
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5 text-navy" />
                </button>

                <Link to={`/app/member/${selected.other_user.id}`} className="flex items-center gap-3 group">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white/80 shadow-sm">
                      <AvatarImage
                        src={selected.other_user.avatar}
                        alt={`${selected.other_user.firstName} ${selected.other_user.lastName}`}
                      />
                      <AvatarFallback className="bg-[var(--color-plum)] text-sm font-semibold text-white">
                        {initials(selected.other_user.firstName, selected.other_user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="font-heading font-bold text-navy text-[15px] leading-tight group-hover:text-[var(--color-amber)] transition-colors">
                      {selected.other_user.firstName} {selected.other_user.lastName}
                    </div>
                    <div className="text-[12px] text-[var(--color-text-muted)]">
                      {selected.skill_title ? `📚 ${selected.skill_title}` : 'Direct message'}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Header actions */}
              <div className="flex items-center text-[var(--color-text-muted)] h-10 relative">
                {c.showSearch ? (
                  <div className="flex items-center gap-2 bg-[#F0F2F5] rounded-full px-3 py-1.5 w-48 sm:w-64 animate-in slide-in-from-right-4 mr-2">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={c.searchQuery}
                      onChange={(e) => c.setSearchQuery(e.target.value)}
                      placeholder="Search messages…"
                      className="bg-transparent text-[13px] text-navy outline-none w-full placeholder-[var(--color-text-muted)]"
                    />
                    {c.searchQuery && (
                      <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 whitespace-nowrap">
                        {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => { c.setShowSearch(false); c.setSearchQuery(''); }}
                      className="hover:text-navy hover:bg-black/5 p-1 rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link
                      to={`/app/member/${selected.other_user.id}`}
                      className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors hidden sm:flex items-center justify-center"
                      title="View profile"
                    >
                      <UserRound className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setIsPerformanceMode(!isPerformanceMode)}
                      className={`p-2 w-10 h-10 rounded-full transition-colors hidden sm:flex items-center justify-center ${isPerformanceMode ? 'bg-[var(--color-amber)]/20 text-[var(--color-amber)]' : 'hover:bg-parchment hover:text-navy text-[var(--color-text-muted)]'}`}
                      title="Toggle Performance Mode (Virtualization)"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => c.setShowSearch(true)}
                      className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => c.setShowOptionsMenu(!c.showOptionsMenu)}
                        className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {c.showOptionsMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => c.setShowOptionsMenu(false)} />
                          <div className="absolute top-12 right-2 w-56 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                            <button
                              onClick={() => { c.setShowOptionsMenu(false); c.setShowSearch(true); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left"
                            >
                              <Search className="w-4 h-4 opacity-70" /> Search Messages
                            </button>
                            <button
                              onClick={() => { c.setShowOptionsMenu(false); c.setShowSharedMedia(true); c.setSharedMediaTab('images'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left"
                            >
                              <Layers className="w-4 h-4 opacity-70" /> Shared Media
                            </button>
                            <button
                              onClick={() => { c.setShowOptionsMenu(false); toast.info('Notifications muted'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left"
                            >
                              <BellOff className="w-4 h-4 opacity-70" /> Mute Notifications
                            </button>

                            <div className="h-px bg-[var(--color-border)] my-1.5" />
                            <button
                              onClick={() => { c.setShowOptionsMenu(false); toast.info('Chat history cleared locally'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 font-medium hover:bg-red-50 transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4 opacity-70" /> Clear History
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Message list ────────────────────────────────────────────────── */}
          <div
            ref={c.messagesAreaRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-0 flex flex-col relative"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              c.setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 300);
            }}
          >
            {c.hasMore && (
              <div className="flex justify-center py-3">
                <button
                  onClick={c.loadMore}
                  disabled={c.loadingMore}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-navy transition-colors px-3 py-1.5 rounded-full hover:bg-black/5 disabled:opacity-40"
                >
                  {c.loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
                  {c.loadingMore ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}

            {filteredMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-10">
                <div className="text-5xl mb-3">💬</div>
                <h3 className="font-semibold text-navy">Start the conversation</h3>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto mt-1">
                  Send a first message to break the ice — you can share text, photos, voice notes and more.
                </p>
              </div>
            )}

            {isPerformanceMode ? (
              <VirtualizedMessageList
                messages={filteredMessages}
                user={c.user}
                adaptToChatMessage={adaptToChatMessage}
                onReply={c.handleReplyMessage}
                onEdit={c.handleEditMessage}
                onDelete={c.handleDeleteMessage}
                onPin={() => { toast.info('Pinning is available in club channels'); }}
                onToggleReaction={c.handleToggleReaction}
                onForward={() => {}}
                onViewImage={c.setViewingImageMsg}
                onApplyToProject={() => {}}
                onViewApplicants={() => {}}
                scrollContainerRef={c.messagesAreaRef}
              />
            ) : (
              filteredMessages.map((msg: any, i: number) => {
                const adapted = adaptToChatMessage(msg);
                const isOwn = msg.sender_id === c.user?.id;
                const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
                const nextMsg = i < filteredMessages.length - 1 ? filteredMessages[i + 1] : null;

                const msgDate = new Date(msg.created_at);
                const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
                const nextDate = nextMsg ? new Date(nextMsg.created_at) : null;

                const showDateDivider = !prevDate || !isSameDay(msgDate, prevDate);
                let dateDividerText = '';
                if (showDateDivider) {
                  if (isToday(msgDate)) dateDividerText = 'Today';
                  else if (isYesterday(msgDate)) dateDividerText = 'Yesterday';
                  else dateDividerText = format(msgDate, 'MMMM d, yyyy');
                }

                const gapMs = 5 * 60 * 1000;
                const isGroupFirst =
                  showDateDivider ||
                  !prevMsg ||
                  prevMsg.sender_id !== msg.sender_id ||
                  msgDate.getTime() - prevDate!.getTime() > gapMs;

                const isGroupLast =
                  !nextMsg ||
                  nextMsg.sender_id !== msg.sender_id ||
                  !isSameDay(msgDate, nextDate!) ||
                  nextDate!.getTime() - msgDate.getTime() > gapMs;

                let bubbleRadius: string;
                if (isOwn) {
                  if (isGroupFirst && isGroupLast) bubbleRadius = 'rounded-[20px] rounded-br-[5px]';
                  else if (isGroupFirst) bubbleRadius = 'rounded-[20px] rounded-br-[8px]';
                  else if (isGroupLast) bubbleRadius = 'rounded-[20px] rounded-tr-[8px] rounded-br-[5px]';
                  else bubbleRadius = 'rounded-[20px] rounded-r-[8px]';
                } else {
                  if (isGroupFirst && isGroupLast) bubbleRadius = 'rounded-[20px] rounded-bl-[5px]';
                  else if (isGroupFirst) bubbleRadius = 'rounded-[20px] rounded-bl-[8px]';
                  else if (isGroupLast) bubbleRadius = 'rounded-[20px] rounded-tl-[8px] rounded-bl-[5px]';
                  else bubbleRadius = 'rounded-[20px] rounded-l-[8px]';
                }

                const marginTopClass = isGroupFirst && i !== 0 ? 'mt-4' : 'mt-[3px]';

                return (
                  <MessageItem
                    key={msg.id}
                    msg={adapted}
                    isOwn={isOwn}
                    isGroupFirst={isGroupFirst}
                    isGroupLast={isGroupLast}
                    bubbleRadius={bubbleRadius}
                    marginTopClass={marginTopClass}
                    showDateDivider={showDateDivider}
                    dateDividerText={dateDividerText}
                    currentUserId={c.user?.id}
                    isAdminOrMod={false}
                    channelReads={[]}
                    allMessages={c.messages.map(adaptToChatMessage)}
                    searchQuery={c.searchQuery}
                    parseMessageContent={parseMessageContent}
                    onReply={c.handleReplyMessage}
                    onEdit={c.handleEditMessage}
                    onDelete={c.handleDeleteMessage}
                    onPin={() => { toast.info('Pinning is available in club channels'); }}
                    onToggleReaction={c.handleToggleReaction}
                    onForward={() => {}}
                    onViewImage={c.setViewingImageMsg}
                    onApplyToProject={() => {}}
                    onViewApplicants={() => {}}
                  />
                );
              })
            )}
            <div ref={c.messagesEndRef} className="h-4" />
          </div>

          {/* Scroll-to-bottom FAB */}
          {c.showScrollBottom && (
            <button
              onClick={() => c.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute right-6 bottom-24 p-3 bg-white border border-[var(--color-border)] rounded-full text-navy shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all z-20 animate-in fade-in slide-in-from-bottom-5 hidden sm:flex"
            >
              <ArrowDown className="w-5 h-5 opacity-70" />
            </button>
          )}

          {/* ── Composer ────────────────────────────────────────────────────── */}
          <MessageInput
            canPost={true}
            activeChannelName={`${selected.other_user.firstName}`}
            newMessage={c.newMessage}
            sending={c.sending}
            isRecording={c.isRecording}
            recordingTime={c.recordingTime}
            chatAttachment={c.chatAttachment}
            attachmentCaption={c.attachmentCaption}
            uploadProgress={c.uploadProgress}
            replyingTo={c.replyingTo}
            editingMessage={c.editingMessage}
            showAttachMenu={c.showAttachMenu}
            textareaRef={c.textareaRef}
            longPressTimerRef={c.longPressTimerRef}
            longPressFiredRef={c.longPressFiredRef}
            onNewMessageChange={c.setNewMessage}
            onSend={c.handleSend}
            onStartRecording={c.startRecording}
            onStopRecordingAndSend={c.stopRecordingAndSend}
            onCancelRecording={c.cancelRecording}
            onTypingStart={c.handleTypingStart}
            onSetComposerFocused={c.setComposerFocused}
            onSetShowAttachMenu={c.setShowAttachMenu}
            onSetChatAttachment={c.setChatAttachment}
            onSetAttachmentCaption={c.setAttachmentCaption}
            onClearReply={() => { c.setReplyingTo(null); c.setNewMessage(''); }}
            onClearEdit={() => { c.setEditingMessage(null); c.setNewMessage(''); }}
                  onShareLocation={c.handleShareLocation}
            fileInputRef={c.fileInputRef}
            pendingAttachTypeRef={c.pendingAttachTypeRef}
          />

          {/* Typing indicator (future presence) */}
          {c.typingUsers.length > 0 && (
            <div className="px-5 py-1.5 flex items-center gap-2.5 text-[12px] text-[var(--color-text-muted)] bg-white/60 backdrop-blur-sm border-t border-[var(--color-border)]/50 animate-in fade-in duration-200">
              <div className="flex gap-0.5 items-end h-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span>{selected.other_user.firstName} is typing…</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm rounded-[28px] border border-dashed border-[rgba(196,135,58,0.18)] bg-white/70 px-6 py-10 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <div className="mt-2 font-heading text-xl text-[var(--color-navy)]">No conversation selected</div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Choose a conversation from the left to start chatting.
            </p>
            <Link
              to="/app/board"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(225,107,59,0.18)]"
            >
              <Search className="h-4 w-4" />
              Find someone to message
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
