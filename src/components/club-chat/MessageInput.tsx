import {
  Paperclip, Send, Mic, StopCircle, Loader2, X, FileText, Reply, Edit2,
  ImageIcon, PlayCircle, Code2, Calendar, MapPin, BarChart2, AlertCircle,
} from 'lucide-react';

type ChatAttachType = 'image' | 'video' | 'pdf';
interface ChatAttachment { file: File; type: ChatAttachType; previewUrl: string; }

interface Message {
  id: string;
  sender_id: string;
  content: string;
  sender?: { first_name: string; last_name: string; avatar_url: string };
}

interface MessageInputProps {
  canPost: boolean;
  activeChannelName: string;
  newMessage: string;
  sending: boolean;
  isRecording: boolean;
  recordingTime: number;
  chatAttachment: ChatAttachment | null;
  attachmentCaption: string;
  uploadProgress: number;
  replyingTo: Message | null;
  editingMessage: Message | null;
  composerFocused: boolean;
  showAttachMenu: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  longPressTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  longPressFiredRef: React.RefObject<boolean>;
  onNewMessageChange: (value: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecordingAndSend: () => void;
  onCancelRecording: () => void;
  onTypingStart: () => void;
  onSetComposerFocused: (focused: boolean) => void;
  onSetShowAttachMenu: (show: boolean) => void;
  onSetChatAttachment: (attachment: ChatAttachment | null) => void;
  onSetAttachmentCaption: (caption: string) => void;
  onClearReply: () => void;
  onClearEdit: () => void;
  onShowScheduleModal: () => void;
  onOpenVideoWizard: () => void;
  onOpenProjectWizard: () => void;
  onOpenEventWizard: () => void;
  onOpenPollWizard: () => void;
  onShareLocation: () => void;
  onApplyFormat: (syntax: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  pendingAttachTypeRef: React.RefObject<ChatAttachType>;
}

export default function MessageInput({
  canPost,
  activeChannelName,
  newMessage,
  sending,
  isRecording,
  recordingTime,
  chatAttachment,
  attachmentCaption,
  uploadProgress,
  replyingTo,
  editingMessage,
  composerFocused,
  showAttachMenu,
  textareaRef,
  longPressTimerRef,
  longPressFiredRef,
  onNewMessageChange,
  onSend,
  onStartRecording,
  onStopRecordingAndSend,
  onCancelRecording,
  onTypingStart,
  onSetComposerFocused,
  onSetShowAttachMenu,
  onSetChatAttachment,
  onSetAttachmentCaption,
  onClearReply,
  onClearEdit,
  onShowScheduleModal,
  onOpenVideoWizard,
  onOpenProjectWizard,
  onOpenEventWizard,
  onOpenPollWizard,
  onShareLocation,
  onApplyFormat,
  fileInputRef,
  pendingAttachTypeRef,
}: MessageInputProps) {
  return (
    <div className="px-4 py-3 bg-white border-t border-[var(--color-border)]">
      {canPost ? (
        <div className="flex flex-col gap-2">

          {/* Attachment preview */}
          {chatAttachment && (
            <>
              <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
                {chatAttachment.type === 'image' && (
                  <img src={chatAttachment.previewUrl} alt="" className="max-h-40 w-full object-cover" />
                )}
                {chatAttachment.type === 'video' && (
                  <video src={chatAttachment.previewUrl} controls className="max-h-40 w-full bg-black" />
                )}
                {chatAttachment.type === 'pdf' && (
                  <div className="flex items-center gap-2.5 px-3 py-3">
                    <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
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
              {chatAttachment.type !== 'pdf' && (
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
            <div className="flex items-center justify-between bg-[var(--color-parchment)] px-3 py-2 rounded-2xl mb-2 hover:bg-[#F2F2F2] transition-colors border border-[var(--color-amber)]/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
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
            </div>
          )}

          {/* Formatting Toolbar — shown when composer is focused */}
          {(composerFocused || newMessage.length > 0) && !isRecording && (
            <div className="flex items-center gap-0.5 px-1 pb-1 animate-in fade-in duration-150">
              {([
                { label: 'B', title: 'Bold (wrap with **)', syntax: '**', cls: 'font-bold' },
                { label: 'I', title: 'Italic (wrap with *)', syntax: '*', cls: 'italic' },
                { label: 'U', title: 'Underline (wrap with __)', syntax: '__', cls: 'underline' },
                { label: 'S', title: 'Strikethrough (wrap with ~~)', syntax: '~~', cls: 'line-through' },
                { label: 'M', title: 'Monospace (wrap with `)', syntax: '`', cls: 'font-mono text-[11px]' },
                { label: '||', title: 'Spoiler (wrap with ||)', syntax: '||', cls: 'text-[10px]' },
              ] as const).map(({ label, title, syntax, cls }) => (
                <button
                  key={label}
                  type="button"
                  title={title}
                  onMouseDown={e => { e.preventDefault(); onApplyFormat(syntax); }}
                  className="w-7 h-7 rounded text-[var(--color-text-muted)] hover:bg-black/8 hover:text-navy transition-colors flex items-center justify-center"
                >
                  <span className={`text-[13px] ${cls}`}>{label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-3xl bg-[#F0F2F5] focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 p-1.5 pl-2 relative">

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
                accept="image/*,video/*,.pdf,application/pdf"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  onSetChatAttachment({ file, type: pendingAttachTypeRef.current!, previewUrl: URL.createObjectURL(file) });
                  e.target.value = '';
                }}
              />

              {/* Attachment Popup Menu */}
              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => onSetShowAttachMenu(false)} />
                  <div className="absolute bottom-12 left-0 w-48 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <button
                      onClick={() => { pendingAttachTypeRef.current = 'image'; onSetShowAttachMenu(false); fileInputRef.current!.accept = 'image/*'; fileInputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-[var(--color-amber)]" /> Photo / Image
                    </button>
                    <button
                      onClick={() => { onSetShowAttachMenu(false); onOpenVideoWizard(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <PlayCircle className="w-4 h-4 text-purple-500" /> Video → Playlist
                    </button>
                    <button
                      onClick={() => { pendingAttachTypeRef.current = 'pdf'; onSetShowAttachMenu(false); fileInputRef.current!.accept = '.pdf,application/pdf'; fileInputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-red-400" /> PDF / File
                    </button>
                    <div className="h-px bg-[var(--color-border)] my-1" />
                    <button
                      onClick={() => { onSetShowAttachMenu(false); onOpenProjectWizard(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <Code2 className="w-4 h-4 text-blue-500" /> Share Project
                    </button>
                    <button
                      onClick={() => { onSetShowAttachMenu(false); onOpenEventWizard(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <Calendar className="w-4 h-4 text-green-500" /> Create Event
                    </button>
                    <button
                      onClick={() => { onSetShowAttachMenu(false); onShareLocation(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-cyan-500" /> Share Location
                    </button>
                    <button
                      onClick={() => { onSetShowAttachMenu(false); onOpenPollWizard(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                    >
                      <BarChart2 className="w-4 h-4 text-orange-500" /> Create Poll
                    </button>
                  </div>
                </>
              )}
            </div>

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-2 text-sm text-navy animate-in slide-in-from-right-4 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono text-red-500 font-bold">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[var(--color-text-muted)] animate-pulse">Recording Voice...</span>
                </div>
                <button onClick={onCancelRecording} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors" title="Cancel">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
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
            )}

            <button
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                longPressTimerRef.current = setTimeout(() => {
                  longPressFiredRef.current = true;
                  if (!isRecording && (newMessage.trim() || chatAttachment || editingMessage)) {
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
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : isRecording ? (
                <StopCircle className="w-4 h-4 text-white animate-in zoom-in" />
              ) : (newMessage.trim() || chatAttachment || editingMessage) ? (
                <Send className="w-4 h-4 text-white animate-in zoom-in spin-in-12 duration-200" />
              ) : (
                <Mic className="w-4 h-4 text-white animate-in zoom-in" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--color-parchment)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
          <AlertCircle className="w-4 h-4" />
          Only Admins and Moderators can post in announcements.
        </div>
      )}
    </div>
  );
}
