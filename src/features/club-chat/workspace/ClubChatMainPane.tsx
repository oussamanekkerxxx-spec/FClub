import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Megaphone,
  Hash,
  Search,
  X,
  PanelRightClose,
  PanelRightOpen,
  MoreVertical,
  Settings,
  Layers,
  BellOff,
  Trash2,
  Pin,
  MessageSquare,
  ArrowDown,
  Loader2,
  ChevronUp,
} from 'lucide-react';
import MessageItem from '@/components/club-chat/MessageItem';
import MessageInput from '@/components/club-chat/MessageInput';

interface ClubChatMainPaneProps {
  c: any;
}

export default function ClubChatMainPane({ c }: ClubChatMainPaneProps) {
  return (
    <div className={`${c.mobileView === 'channels' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[var(--color-parchment)] relative`}>
      {c.activeChannel ? (
        <>
          <div className="flex flex-col bg-white border-b border-[var(--color-border)] z-10 shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button className="md:hidden p-1.5 rounded-lg hover:bg-parchment -ml-1.5" onClick={() => c.setMobileView('channels')}>
                  <ArrowLeft className="w-5 h-5 text-navy" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-navy)] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {c.activeChannel.is_announcement_only ? <Megaphone className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-heading font-bold text-navy text-[15px] leading-tight flex items-center gap-1.5">
                      {c.activeChannel.name}
                    </div>
                    <div className="text-[13px] text-[var(--color-text-secondary)] leading-tight flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {c.activeChannel.is_announcement_only ? 'Announcements' : 'Club Channel'}
                      {c.activeChannel.description && <span className="hidden sm:inline"> • {c.activeChannel.description}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center text-[var(--color-text-muted)] h-10 relative">
                {c.showSearch ? (
                  <div className="flex items-center gap-2 bg-[#F0F2F5] rounded-full px-3 py-1.5 w-48 sm:w-64 animate-in slide-in-from-right-4 relative mr-2">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={c.searchQuery}
                      onChange={(e) => c.setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="bg-transparent text-[13px] text-navy outline-none w-full placeholder-[var(--color-text-muted)]"
                    />
                    {c.searchQuery && (
                      <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 whitespace-nowrap">
                        {c.filteredMessages.length} result{c.filteredMessages.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button onClick={() => { c.setShowSearch(false); c.setSearchQuery(''); }} className="hover:text-navy hover:bg-black/5 p-1 rounded-full transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2 animate-in fade-in duration-200">
                    <button onClick={() => c.setShowSearch(true)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </button>
                    <button onClick={() => c.setShowDetailsPanel((p: boolean) => !p)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment transition-colors hidden lg:flex items-center justify-center" title="Channel details">
                      {c.showDetailsPanel ? <PanelRightClose className="w-5 h-5 text-[var(--color-navy)]" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                    <div className="relative">
                      <button onClick={() => c.setShowOptionsMenu(!c.showOptionsMenu)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center">
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {c.showOptionsMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => c.setShowOptionsMenu(false)} />
                          <div className="absolute top-12 right-2 w-60 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                            <button onClick={() => { c.setShowOptionsMenu(false); c.setShowSearch(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                              <Search className="w-4 h-4 opacity-70" /> Search Messages
                            </button>
                            <button onClick={() => { c.setShowOptionsMenu(false); c.setShowChatSettings(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                              <Settings className="w-4 h-4 opacity-70" /> Chat Settings
                            </button>
                            <button onClick={() => { c.setShowOptionsMenu(false); c.setShowSharedMedia(true); c.setSharedMediaTab('images'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                              <Layers className="w-4 h-4 opacity-70" /> Shared Media
                            </button>
                            <button onClick={() => { c.setShowOptionsMenu(false); toast.info('Notifications muted'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                              <BellOff className="w-4 h-4 opacity-70" /> Mute Notifications
                            </button>
                            <div className="h-px bg-[var(--color-border)] my-1.5" />
                            <button onClick={() => { c.setShowOptionsMenu(false); toast.info('History cleared locally'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 font-medium hover:bg-red-50 transition-colors text-left">
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

            {c.pinnedMessage && (
              <div className="px-5 py-2 border-t border-[var(--color-border)] bg-[#FAFAFA] flex items-center justify-between cursor-pointer hover:bg-[#F0F2F5] transition-colors" onClick={() => {
                const el = document.querySelector(`[data-message-id="${c.pinnedMessage.id}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-8 w-1 bg-[var(--color-amber)] rounded-full flex-shrink-0" />
                  <Pin className="w-3 h-3 text-[var(--color-amber)] flex-shrink-0 hidden sm:block" />
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] font-bold text-[var(--color-amber)] uppercase tracking-wider leading-tight">
                      Pinned · {(c.pinnedMessage.sender as any)?.first_name || 'Message'}
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)] truncate">
                      {c.pinnedMessage.content || 'Media message'}
                    </span>
                  </div>
                </div>
                {c.isAdminOrMod && (
                  <button onClick={(e) => { e.stopPropagation(); c.handleUnpinMessage(); }} className="p-1 rounded-lg hover:bg-black/5 text-[var(--color-text-muted)] flex-shrink-0 ml-4" title="Unpin">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div ref={c.messagesAreaRef} className={`flex-1 overflow-y-auto px-5 py-4 space-y-0 flex flex-col relative ${c.preferences?.wallpaper_class || 'wall-default'} ${c.preferences?.is_dark_mode ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`} onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            c.setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 300);
          }}>
            {c.hasMore && (
              <div className="flex justify-center py-3">
                <button onClick={c.loadMore} disabled={c.loadingMore} className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-navy transition-colors px-3 py-1.5 rounded-full hover:bg-black/5 disabled:opacity-40">
                  {c.loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
                  {c.loadingMore ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}

            {c.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-10">
                {c.activeChannel.is_announcement_only ? <Megaphone className="w-10 h-10 mb-3" /> : <MessageSquare className="w-10 h-10 mb-3" />}
                <h3 className="font-semibold text-navy">Welcome to #{c.activeChannel.name}</h3>
                <p className="text-sm font-body text-[var(--color-text-secondary)] max-w-xs mx-auto mt-1">
                  {c.activeChannel.is_announcement_only
                    ? 'This is an announcement channel. Only admins and mods can post here.'
                    : 'This is the start of the channel. Send a message to say hello!'}
                </p>
              </div>
            )}

            {c.filteredMessages.map((msg: any, i: number) => {
              const isOwn = msg.sender_id === c.user?.id;
              const prevMsg = i > 0 ? c.filteredMessages[i - 1] : null;
              const nextMsg = i < c.filteredMessages.length - 1 ? c.filteredMessages[i + 1] : null;

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
                  msg={msg}
                  isOwn={isOwn}
                  isGroupFirst={isGroupFirst}
                  isGroupLast={isGroupLast}
                  bubbleRadius={bubbleRadius}
                  marginTopClass={marginTopClass}
                  showDateDivider={showDateDivider}
                  dateDividerText={dateDividerText}
                  currentUserId={c.user?.id}
                  isAdminOrMod={c.isAdminOrMod}
                  channelReads={c.channelReads}
                  allMessages={c.messages}
                  searchQuery={c.searchQuery}
                  parseMessageContent={c.parseMessageContent}
                  onReply={c.handleReplyMessage}
                  onEdit={c.handleEditMessage}
                  onDelete={c.handleDeleteMessage}
                  onPin={c.handlePinMessage}
                  onToggleReaction={c.handleToggleReaction}
                  onForward={(message) => {
                    c.setForwardingMessage(message);
                    c.setShowForwardModal(true);
                  }}
                  onViewImage={c.setViewingImageMsg}
                  onApplyToProject={(project) => {
                    if (project.creator_id === c.user?.id) {
                      toast.info("You're the project creator");
                      return;
                    }
                    const already = project.applications?.some((a: any) => a.user_id === c.user?.id);
                    if (already) {
                      const status = project.applications?.find((a: any) => a.user_id === c.user?.id)?.status;
                      toast.info(`Your application is ${status}`);
                      return;
                    }
                    c.setApplyingToProject(project as any);
                  }}
                  onViewApplicants={(project) => {
                    if (project.creator_id === c.user?.id) {
                      c.setViewingApplicants(project as any);
                      return;
                    }
                    const already = project.applications?.some((a: any) => a.user_id === c.user?.id);
                    if (already) {
                      const status = project.applications?.find((a: any) => a.user_id === c.user?.id)?.status;
                      toast.info(`Your application is ${status}`);
                    } else {
                      c.setApplyingToProject(project as any);
                    }
                  }}
                />
              );
            })}
            <div ref={c.messagesEndRef} className="h-4" />
          </div>

          {c.showScrollBottom && (
            <button onClick={() => c.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} className="absolute right-6 bottom-24 p-3 bg-white border border-[var(--color-border)] rounded-full text-navy shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all z-20 animate-in fade-in slide-in-from-bottom-5 hidden sm:flex">
              <ArrowDown className="w-5 h-5 opacity-70" />
            </button>
          )}

          {c.typingUsers.length > 0 && (
            <div className="px-5 py-1.5 flex items-center gap-2.5 text-[12px] text-[var(--color-text-muted)] bg-white border-t border-[var(--color-border)]/50 animate-in fade-in duration-200">
              <div className="flex gap-0.5 items-end h-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span>
                {c.typingUsers.length === 1
                  ? `${c.typingUsers[0].name} is typing…`
                  : c.typingUsers.length === 2
                    ? `${c.typingUsers[0].name} and ${c.typingUsers[1].name} are typing…`
                    : `${c.typingUsers[0].name} and ${c.typingUsers.length - 1} others are typing…`}
              </span>
            </div>
          )}

          <MessageInput
            canPost={Boolean(c.canPost)}
            activeChannelName={c.activeChannel.name}
            newMessage={c.newMessage}
            sending={c.sending}
            isRecording={c.isRecording}
            recordingTime={c.recordingTime}
            chatAttachment={c.chatAttachment}
            attachmentCaption={c.attachmentCaption}
            uploadProgress={c.uploadProgress}
            replyingTo={c.replyingTo}
            editingMessage={c.editingMessage}
            composerFocused={c.composerFocused}
            showAttachMenu={c.showAttachMenu}
            textareaRef={c.textareaRef}
            longPressTimerRef={c.longPressTimerRef}
            longPressFiredRef={c.longPressFiredRef}
            onNewMessageChange={c.setNewMessage}
            onSend={() => c.handleSend()}
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
            onShowScheduleModal={() => c.setShowScheduleModal(true)}
            onOpenVideoWizard={() => {
              c.setVideoWizardFile(null);
              c.setVideoWizardPreview('');
              c.setVideoTitle('');
              c.setShowVideoWizard(true);
            }}
            onOpenProjectWizard={() => c.setShowProjectWizard(true)}
            onOpenEventWizard={() => {
              c.setEvtTitle('');
              c.setEvtDesc('');
              c.setEvtDate('');
              c.setEvtOnline(true);
              c.setEvtStyle('workshop');
              c.setEvtLink('');
              c.setEvtDuration('');
              c.setShowEventWizard(true);
            }}
            onOpenPollWizard={() => {
              c.setPollQuestion('');
              c.setPollOptions(['', '']);
              c.setShowPollWizard(true);
            }}
            onOpenStartRoomModal={
              c.allowStartRoomFromComposer && c.composerRoomHostId
                ? () => c.setShowStartRoomModal(true)
                : undefined
            }
            onShareLocation={c.handleShareLocation}
            onApplyFormat={c.applyFormat}
            fileInputRef={c.fileInputRef}
            pendingAttachTypeRef={c.pendingAttachTypeRef}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Hash className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
            <div className="font-heading text-xl text-navy mb-2">No channel selected</div>
            <p className="text-sm font-body text-[var(--color-text-secondary)]">
              Choose a channel from the left sidebar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
