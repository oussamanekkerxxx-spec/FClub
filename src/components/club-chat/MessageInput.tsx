import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip, Send, Mic, StopCircle, Loader2, X, FileText, Reply, Edit2,
  ImageIcon, PlayCircle, Code2, Calendar, MapPin, BarChart2, AlertCircle, Mic2,
  File, Trash2, Pause
} from 'lucide-react';
import { springs } from '@/lib/animation';
import { useChatStore } from '@/features/club-chat/store/chatStore';

import type { ChatAttachment } from '@/features/club-chat/workspace/types';

type ChatAttachType = 'image' | 'video' | 'pdf' | 'voice' | 'document';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  sender?: { first_name: string; last_name: string; avatar_url: string };
}

interface MessageInputProps {
  canPost: boolean;
  activeChannelName: string;
  newMessage?: string;
  sending?: boolean;
  isRecording?: boolean;
  recordingTime?: number;
  chatAttachment?: ChatAttachment | null;
  attachmentCaption?: string;
  uploadProgress?: number;
  replyingTo?: Message | null;
  editingMessage?: Message | null;
  showAttachMenu?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  longPressTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  longPressFiredRef: React.RefObject<boolean>;
  onNewMessageChange?: (value: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecordingAndSend: () => void;
  onCancelRecording: () => void;
  onTypingStart: () => void;
  onSetComposerFocused?: (focused: boolean) => void;
  onSetShowAttachMenu?: (show: boolean) => void;
  onSetChatAttachment?: (attachment: ChatAttachment | null) => void;
  onSetAttachmentCaption?: (caption: string) => void;
  onClearReply?: () => void;
  onClearEdit?: () => void;
  onShowScheduleModal?: () => void;
  onOpenVideoWizard?: () => void;
  onOpenProjectWizard?: () => void;
  onOpenEventWizard?: () => void;
  onOpenPollWizard?: () => void;
  onOpenStartRoomModal?: () => void;
  onShareLocation: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pendingAttachTypeRef: React.RefObject<ChatAttachType>;
}

const MessageInput = React.memo(function MessageInputInternal({
  canPost,
  activeChannelName,
  newMessage: propNewMessage,
  sending: propSending,
  isRecording: propIsRecording,
  recordingTime: propRecordingTime,
  chatAttachment: propChatAttachment,
  attachmentCaption: propAttachmentCaption,
  uploadProgress: propUploadProgress,
  replyingTo: propReplyingTo,
  editingMessage: propEditingMessage,
  showAttachMenu: propShowAttachMenu,
  textareaRef,
  longPressTimerRef,
  longPressFiredRef,
  onNewMessageChange: propOnNewMessageChange,
  onSend,
  onStartRecording,
  onStopRecordingAndSend,
  onCancelRecording,
  onTypingStart,
  onSetComposerFocused: propOnSetComposerFocused,
  onSetShowAttachMenu: propOnSetShowAttachMenu,
  onSetChatAttachment: propOnSetChatAttachment,
  onSetAttachmentCaption: propOnSetAttachmentCaption,
  onClearReply: propOnClearReply,
  onClearEdit: propOnClearEdit,
  onShowScheduleModal,
  onOpenVideoWizard,
  onOpenProjectWizard,
  onOpenEventWizard,
  onOpenPollWizard,
  onOpenStartRoomModal,
  onShareLocation,
  fileInputRef,
  pendingAttachTypeRef,
}: MessageInputProps) {
  // ── Store fallbacks for composer state (club-chat path) ──
  const storeComposerText = useChatStore((s) => s.composer.text);
  const storeComposerSending = useChatStore((s) => s.composer.sending);
  const storeComposerIsRecording = useChatStore((s) => s.composer.isRecording);
  const storeComposerRecordingTime = useChatStore((s) => s.composer.recordingTime);
  const storeComposerAttachment = useChatStore((s) => s.composer.attachment);
  const storeComposerCaption = useChatStore((s) => s.composer.caption);
  const storeComposerUploadProgress = useChatStore((s) => s.composer.uploadProgress);
  const storeComposerReplyingTo = useChatStore((s) => s.composer.replyingTo);
  const storeComposerEditing = useChatStore((s) => s.composer.editing);
  const storeComposerShowAttachMenu = useChatStore((s) => s.composer.showAttachMenu);

  // ── Store fallbacks for composer actions ──
  const storeSetComposerText = useChatStore((s) => s.setComposerText);
  const storeSetComposerFocused = useChatStore((s) => s.setComposerFocused);
  const storeSetComposerShowAttachMenu = useChatStore((s) => s.setComposerShowAttachMenu);
  const storeSetComposerAttachment = useChatStore((s) => s.setComposerAttachment);
  const storeSetComposerCaption = useChatStore((s) => s.setComposerCaption);
  const storeSetComposerReplyingTo = useChatStore((s) => s.setComposerReplyingTo);
  const storeSetComposerEditing = useChatStore((s) => s.setComposerEditing);

  // ── Resolved values (prop overrides store for DM-chat compatibility) ──
  const newMessage = propNewMessage ?? storeComposerText;
  const sending = propSending ?? storeComposerSending;
  const isRecording = propIsRecording ?? storeComposerIsRecording;
  const recordingTime = propRecordingTime ?? storeComposerRecordingTime;
  const chatAttachment = propChatAttachment ?? storeComposerAttachment;
  const attachmentCaption = propAttachmentCaption ?? storeComposerCaption;
  const uploadProgress = propUploadProgress ?? storeComposerUploadProgress;
  const replyingTo = propReplyingTo ?? storeComposerReplyingTo;
  const editingMessage = propEditingMessage ?? storeComposerEditing;
  const showAttachMenu = propShowAttachMenu ?? storeComposerShowAttachMenu;

  const onNewMessageChange = propOnNewMessageChange ?? storeSetComposerText;
  const onSetComposerFocused = propOnSetComposerFocused ?? storeSetComposerFocused;
  const onSetShowAttachMenu = propOnSetShowAttachMenu ?? storeSetComposerShowAttachMenu;
  const onSetChatAttachment = propOnSetChatAttachment ?? storeSetComposerAttachment;
  const onSetAttachmentCaption = propOnSetAttachmentCaption ?? storeSetComposerCaption;
  const onClearReply = propOnClearReply ?? (() => { storeSetComposerReplyingTo(null); storeSetComposerText(''); });
  const onClearEdit = propOnClearEdit ?? (() => { storeSetComposerEditing(null); storeSetComposerText(''); });

  return (
    <div className="px-4 pb-4 pt-2 bg-transparent">
      {canPost ? (
        <div className="flex flex-col gap-2">

          {/* Attachment preview */}
          {chatAttachment && (
            <>
              {(chatAttachment as any).type === 'voice' ? (
                /* ── Voice message preview ── */
                <div className="relative rounded-2xl border border-purple-200/70 bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-3">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">Voice message ready</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Listen before sending — tap Send when ready
                      </p>
                    </div>
                  </div>
                  <audio
                    src={chatAttachment.previewUrl}
                    controls
                    className="w-full"
                    style={{ height: '36px', accentColor: '#7c3aed' }}
                  />
                  <button
                    onClick={() => { onSetChatAttachment(null); onSetAttachmentCaption(''); }}
                    className="absolute right-2 top-2 rounded-full bg-black/40 p-1 text-white transition-colors hover:bg-black/70"
                    title="Discard recording"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* ── Image / video / PDF preview ── */
                <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
                  {chatAttachment.type === 'image' && (
                    <img src={chatAttachment.previewUrl} alt="" loading="lazy" decoding="async" className="max-h-40 w-full object-cover" />
                  )}
                  {chatAttachment.type === 'video' && (
                    <video src={chatAttachment.previewUrl} controls className="max-h-40 w-full bg-black" />
                  )}
                  {(chatAttachment.type === 'pdf' || chatAttachment.type === 'document') && (
                    <div className="flex items-center gap-2.5 px-3 py-3">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-navy truncate">{chatAttachment.file.name}</span>
                    </div>
                  )}
                  {chatAttachment.type === 'document' && (
                    <div className="flex items-center gap-2.5 px-3 py-3">
                      <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-navy truncate">{chatAttachment.file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => { onSetChatAttachment(null); onSetAttachmentCaption(''); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {(chatAttachment.type === 'image' || chatAttachment.type === 'video') && (
                <input
                  value={attachmentCaption}
                  onChange={e => onSetAttachmentCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-400/20"
                />
              )}
            </>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[var(--color-text-muted)]">Uploading…</span>
                <span className="text-[10px] font-semibold text-[var(--color-amber)]">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%`, background: 'var(--color-amber)' }}
                />
              </div>
            </div>
          )}

          {/* Reply / Edit Banner */}
          {(replyingTo || editingMessage) && (
            <motion.div
              className="flex items-center justify-between bg-[var(--color-parchment)] px-3 py-2 rounded-2xl mb-2 hover:bg-[#F2F2F2] transition-colors border border-[var(--color-amber)]/20 shadow-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={springs.composer}
            >
              <div className="flex items-center gap-3 overflow-hidden border-l-2 border-[var(--color-amber)] pl-2.5 py-0.5 w-full">
                {replyingTo ? <Reply className="w-4 h-4 text-[var(--color-amber)] flex-shrink-0" /> : <Edit2 className="w-4 h-4 text-[var(--color-amber)] flex-shrink-0" />}
                <div className="flex flex-col truncate flex-1 pr-2">
                  <span className="text-[11px] font-bold text-[var(--color-amber)] leading-tight">
                    {replyingTo ? `Replying to ${replyingTo.sender?.first_name || 'Member'}` : 'Editing Message'}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)] truncate">
                    {replyingTo?.content || editingMessage?.content || 'Attachment'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { onClearReply(); onClearEdit(); }}
                className="p-1.5 rounded-full hover:bg-white text-[var(--color-text-muted)] hover:text-navy transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {isRecording ? (
            <motion.div
              className="flex items-center gap-2 w-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={springs.composer}
            >
              <button onClick={onCancelRecording} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors shrink-0" title="Delete recording">
                <Trash2 className="w-6 h-6" />
              </button>
              
              <div className="flex-1 flex items-center gap-3 bg-[#419FD9] text-white rounded-full px-4 py-2.5 shadow-md h-[44px]">
                <button className="shrink-0 text-white hover:opacity-80 transition-opacity flex items-center justify-center">
                  <Pause className="w-5 h-5 fill-current" />
                </button>
                
                <span className="font-mono text-sm font-semibold shrink-0">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
                
                <div className="flex-1 flex items-center justify-between gap-[2px] h-5 overflow-hidden">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-white/80 rounded-full animate-pulse" 
                      style={{ 
                        height: `${Math.max(20, Math.random() * 100)}%`,
                        animationDelay: `${i * 50}ms`,
                        animationDuration: '600ms'
                      }} 
                    />
                  ))}
                </div>
              </div>

              {/* Send Button and floating View Once bubble */}
              <div className="relative shrink-0 flex items-center justify-center h-11 w-11">
                <motion.button
                  className="absolute bottom-[56px] w-[34px] h-[34px] rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
                  title="Send to be seen only one time"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.composer}
                >
                  <div className="absolute inset-0 m-[4px] rounded-full border-[1.5px] border-white/70 border-dashed" />
                  <span className="text-[11px] font-bold mt-[1px]">1</span>
                </motion.button>

                <button 
                  onClick={onStopRecordingAndSend}
                  className="w-11 h-11 rounded-full bg-[#419FD9] text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-md"
                >
                  <Send className="w-5 h-5 ml-[2px]" />
                </button>
              </div>
            </motion.div>
          ) : (
          <div className="flex items-end gap-2 rounded-3xl focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 p-1.5 pl-2 relative">

            {/* Attachment Button & Menu */}
            <div className="relative mb-0.5">
              <button
                onClick={() => onSetShowAttachMenu(!showAttachMenu)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-navy hover:bg-black/5 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,application/rtf"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  onSetChatAttachment({ file, type: pendingAttachTypeRef.current as any, previewUrl: URL.createObjectURL(file) });
                  e.target.value = '';
                }}
              />

              {/* Attachment Popup Menu */}
              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => onSetShowAttachMenu(false)} />
                  <motion.div
                    className="absolute bottom-12 left-0 w-48 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={springs.menu}
                  >
                    <button
                      onClick={() => { pendingAttachTypeRef.current = 'image'; onSetShowAttachMenu(false); fileInputRef.current!.accept = 'image/*'; fileInputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-[var(--color-amber)]" /> Photo / Image
                    </button>
                    {onOpenVideoWizard && (
                      <button
                        onClick={() => { onSetShowAttachMenu(false); onOpenVideoWizard(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                      >
                        <PlayCircle className="w-4 h-4 text-purple-500" /> Video → Playlist
                      </button>
                    )}
                    <button
                      onClick={() => {
                        pendingAttachTypeRef.current = 'document';
                        onSetShowAttachMenu(false);
                        fileInputRef.current!.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,application/rtf';
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-red-400" /> Docs / Files
                    </button>
                    <button
                      onClick={() => { 
                        pendingAttachTypeRef.current = 'document'; 
                        onSetShowAttachMenu(false); 
                        fileInputRef.current!.accept = '.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; 
                        fileInputRef.current?.click(); 
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <File className="w-4 h-4 text-blue-400" /> Document
                    </button>
                    <div className="h-px bg-[var(--color-border)] my-1" />
                    {onOpenProjectWizard && (
                      <button
                        onClick={() => { onSetShowAttachMenu(false); onOpenProjectWizard(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                      >
                        <Code2 className="w-4 h-4 text-blue-500" /> Share Project
                      </button>
                    )}
                    {onOpenEventWizard && (
                      <button
                        onClick={() => { onSetShowAttachMenu(false); onOpenEventWizard(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                      >
                        <Calendar className="w-4 h-4 text-green-500" /> Create Event
                      </button>
                    )}
                    {onOpenStartRoomModal && (
                      <button
                        onClick={() => { onSetShowAttachMenu(false); onOpenStartRoomModal(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                      >
                        <Mic2 className="w-4 h-4 text-emerald-500" /> Start Voice Room
                      </button>
                    )}
                    <button
                      onClick={() => { onSetShowAttachMenu(false); onShareLocation(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-cyan-500" /> Share Location
                    </button>
                    {onOpenPollWizard && (
                      <button
                        onClick={() => { onSetShowAttachMenu(false); onOpenPollWizard(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                      >
                        <BarChart2 className="w-4 h-4 text-orange-500" /> Create Poll
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </div>

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={e => { onNewMessageChange(e.target.value); onTypingStart(); }}
                onFocus={() => onSetComposerFocused(true)}
                onBlur={() => onSetComposerFocused(false)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder={`Message #${activeChannelName}`}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none py-2.5 px-2 text-sm leading-relaxed text-navy placeholder-[var(--color-text-muted)]"
                style={{ minHeight: '40px', height: '40px', overflowY: 'hidden' }}
              />

            <button
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                longPressTimerRef.current = setTimeout(() => {
                  longPressFiredRef.current = true;
                  if (!isRecording && (newMessage.trim() || chatAttachment || editingMessage) && onShowScheduleModal) {
                    onShowScheduleModal();
                  }
                }, 500);
              }}
              onPointerUp={() => {
                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
              }}
              onPointerLeave={() => {
                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
              }}
              onClick={() => {
                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                if (longPressFiredRef.current) {
                  longPressFiredRef.current = false;
                  return;
                }

                if (isRecording) onStopRecordingAndSend();
                else if (!newMessage.trim() && !chatAttachment && !editingMessage) onStartRecording();
                else onSend();
              }}
              disabled={sending}
              className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40
                ${isRecording ? 'bg-red-500 shadow-md scale-110' : 'bg-[var(--color-amber)]'}`}
            >
              <AnimatePresence mode="wait">
                {sending ? (
                  <motion.div key="sending" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={springs.fade}>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </motion.div>
                ) : isRecording ? (
                  <motion.div key="stop" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={springs.fade}>
                    <StopCircle className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (newMessage.trim() || chatAttachment || editingMessage) ? (
                  <motion.div key="send" initial={{ opacity: 0, scale: 0.8, rotate: -12 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={springs.fade}>
                    <Send className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <motion.div key="mic" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={springs.fade}>
                    <Mic className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--color-parchment)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
          <AlertCircle className="w-4 h-4" />
          Only Admins and Moderators can post in announcements.
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.canPost === next.canPost &&
    prev.activeChannelName === next.activeChannelName &&
    prev.textareaRef === next.textareaRef &&
    prev.fileInputRef === next.fileInputRef &&
    prev.pendingAttachTypeRef === next.pendingAttachTypeRef &&
    prev.longPressTimerRef === next.longPressTimerRef &&
    prev.longPressFiredRef === next.longPressFiredRef &&
    prev.onTypingStart === next.onTypingStart &&
    prev.onShareLocation === next.onShareLocation &&
    prev.onShowScheduleModal === next.onShowScheduleModal &&
    prev.onOpenVideoWizard === next.onOpenVideoWizard &&
    prev.onOpenProjectWizard === next.onOpenProjectWizard &&
    prev.onOpenEventWizard === next.onOpenEventWizard &&
    prev.onOpenPollWizard === next.onOpenPollWizard &&
    prev.onOpenStartRoomModal === next.onOpenStartRoomModal
  );
});

export default MessageInput;
