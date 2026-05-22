import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { toast } from 'sonner';
import { springs } from '@/lib/animation';
import {
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
  ChevronDown,
} from 'lucide-react';
import MessageInput from '@/components/club-chat/MessageInput';
import VirtualizedMessageList from '@/components/club-chat/VirtualizedMessageList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClubChatMainPaneProps {
  c: any;
}

const ClubChatMainPane = React.memo(function ClubChatMainPane({ c }: ClubChatMainPaneProps) {
  return (
    <div className={`${c.mobileView === 'channels' ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full ${c.preferences?.wallpaper_class || 'wall-default'} ${c.preferences?.is_dark_mode ? 'bg-[#121212]' : ''} relative`}>
      {c.activeChannel ? (
        <>
          <div className="flex flex-col bg-white border-b border-[var(--color-border)] z-10 shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Desktop view channel header */}
                <div className="hidden md:flex items-center gap-3">
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

                {/* Mobile view dropdown selector */}
                <div className="flex md:hidden items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-parchment p-1.5 -ml-1.5 rounded-xl transition-colors">
                        <div className="w-9 h-9 rounded-full bg-[var(--color-navy)] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          {c.activeChannel.is_announcement_only ? <Megaphone className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="font-heading font-bold text-navy text-[15px] leading-tight flex items-center gap-1">
                            {c.activeChannel.name}
                            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] ml-1" />
                          </div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] leading-tight flex items-center gap-1 mt-0.5 truncate max-w-[150px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                            <span className="truncate">{c.clubName || 'Club Chat'}</span>
                          </div>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 max-h-[60vh] overflow-y-auto rounded-2xl shadow-xl p-2 border-[var(--color-border)]">
                      <DropdownMenuLabel className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider px-2">
                        Channels
                      </DropdownMenuLabel>
                      <div className="space-y-1 mt-1">
                        {c.channels.map((chan: any) => {
                          const isActive = chan.id === c.activeChannelId;
                          const unreads = c.channelUnreads?.[chan.id] || 0;
                          return (
                            <DropdownMenuItem
                              key={chan.id}
                              onClick={() => {
                                c.setActiveChannelId(chan.id);
                                if (c.setChannelUnreads) c.setChannelUnreads((prev: any) => ({ ...prev, [chan.id]: 0 }));
                              }}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                isActive ? 'bg-[var(--color-navy)] text-white focus:bg-[var(--color-navy)] focus:text-white' : 'text-navy hover:bg-parchment focus:bg-parchment'
                              }`}
                            >
                              {chan.is_announcement_only ? <Megaphone className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`} /> : <Hash className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`} />}
                              <span className="flex-1 truncate font-medium text-sm">{chan.name}</span>
                              {unreads > 0 && !isActive && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0 bg-[var(--color-amber)] text-white">
                                  {unreads > 99 ? '99+' : unreads}
                                </span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center text-[var(--color-text-muted)] h-10 relative">
                {c.showSearch ? (
                  <motion.div
                    className="flex items-center gap-2 bg-[#F0F2F5] rounded-full px-3 py-1.5 w-48 sm:w-64 relative mr-2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={springs.menu}
                  >
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
                    <button onClick={() => { c.setShowSearch(false); c.setSearchQuery(''); }} aria-label="Clear search" className="hover:text-navy hover:bg-black/5 p-1 rounded-full transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center gap-1 sm:gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={springs.fade}
                  >
                    <button onClick={() => c.setShowSearch(true)} aria-label="Search messages" className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </button>
                    <button onClick={() => c.setShowDetailsPanel((p: boolean) => !p)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment transition-colors hidden lg:flex items-center justify-center" title="Channel details" aria-label="Toggle channel details">
                      {c.showDetailsPanel ? <PanelRightClose className="w-5 h-5 text-[var(--color-navy)]" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                    <div className="relative">
                      <button onClick={() => c.setShowOptionsMenu(!c.showOptionsMenu)} aria-label="More options" className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center">
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {c.showOptionsMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => c.setShowOptionsMenu(false)} />
                            <motion.div
                              className="absolute top-12 right-2 w-60 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50 origin-top-right"
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={springs.menu}
                            >
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
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
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
                  <button onClick={(e) => { e.stopPropagation(); c.handleUnpinMessage(); }} className="p-1 rounded-lg hover:bg-black/5 text-[var(--color-text-muted)] flex-shrink-0 ml-4" title="Unpin" aria-label="Unpin message">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div ref={c.messagesAreaRef} className={`flex-1 overflow-y-auto px-5 py-4 space-y-0 flex flex-col relative`} onScroll={(e) => {
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

            <VirtualizedMessageList
              messages={c.filteredMessages}
              user={c.user}
              adaptToChatMessage={(msg) => msg}
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
              onViewVideo={c.setViewingVideoMsg}
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
              scrollContainerRef={c.messagesAreaRef}
            />
            <div ref={c.messagesEndRef} className="h-4" />
          </div>

          <AnimatePresence>
            {c.showScrollBottom && (
              <motion.button
                onClick={() => c.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Scroll to bottom"
                className="absolute right-6 bottom-24 p-3 bg-white border border-[var(--color-border)] rounded-full text-navy shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all z-20 hidden sm:flex"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={springs.scrollButton}
              >
                <ArrowDown className="w-5 h-5 opacity-70" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {c.typingUsers.length > 0 && (
              <motion.div
                className="px-5 py-1.5 flex items-center gap-2.5 text-[12px] text-[var(--color-text-muted)] bg-white/60 backdrop-blur-sm border-t border-[var(--color-border)]/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springs.fade}
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          <MessageInput
            canPost={Boolean(c.canPost)}
            activeChannelName={c.activeChannel.name}
            textareaRef={c.textareaRef}
            longPressTimerRef={c.longPressTimerRef}
            longPressFiredRef={c.longPressFiredRef}
            onSend={() => c.handleSend()}
            onStartRecording={c.startRecording}
            onStopRecordingAndSend={c.stopRecordingAndSend}
            onCancelRecording={c.cancelRecording}
            onTypingStart={c.handleTypingStart}
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
});

export default ClubChatMainPane;
