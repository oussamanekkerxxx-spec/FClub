import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare, Code2, BarChart2, Tag, ImageIcon, Film, Paperclip,
  FileText, X, Plus, Loader2,
} from 'lucide-react';

const POST_TOPIC_TAGS = [
  'AI', 'Web Dev', 'Cybersecurity', 'Mobile', 'DevOps',
  'Design', 'Data Science', 'Open Source', 'Career', 'Tutorial',
];

type PostType = 'text' | 'code' | 'poll';
type AttachmentType = 'image' | 'video' | 'pdf';

export interface PostAttachment {
  file: File;
  type: AttachmentType;
  previewUrl: string;
}

export interface PostComposerProps {
  userAvatar: string | undefined;
  userFirstName: string | undefined;
  newPostContent: string;
  setNewPostContent: (v: string) => void;
  postType: PostType;
  setPostType: (v: PostType) => void;
  postImageUrl: string;
  setPostImageUrl: (v: string) => void;
  postCodeLang: string;
  setPostCodeLang: (v: string) => void;
  postTopicTags: string[];
  setPostTopicTags: (fn: (prev: string[]) => string[]) => void;
  pollOptions: string[];
  setPollOptions: (fn: (prev: string[]) => string[]) => void;
  postingPost: boolean;
  uploadProgress: number;
  postAttachment: PostAttachment | null;
  setPostAttachment: (v: PostAttachment | null) => void;
  onPost: () => void;
}

export default function PostComposer({
  userAvatar,
  userFirstName,
  newPostContent,
  setNewPostContent,
  postType,
  setPostType,
  postImageUrl,
  setPostImageUrl,
  postCodeLang,
  setPostCodeLang,
  postTopicTags,
  setPostTopicTags,
  pollOptions,
  setPollOptions,
  postingPost,
  uploadProgress,
  postAttachment,
  setPostAttachment,
  onPost,
}: PostComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAttachTypeRef = useRef<AttachmentType>('image');
  const hasExternalImage = postImageUrl.trim().length > 0;

  return (
    <div className="sc-card p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={userAvatar} />
          <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}>
            {userFirstName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Type switcher */}
          <div className="flex items-center gap-1 mb-2">
            {([['text', 'Text', MessageSquare], ['code', 'Code', Code2], ['poll', 'Poll', BarChart2]] as const).map(([t, label, Icon]) => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  postType === t ? 'text-white' : 'text-[var(--color-text-muted)] hover:bg-parchment'
                }`}
                style={postType === t ? { background: 'var(--color-navy)' } : {}}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          {/* Main textarea */}
          <textarea
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
            placeholder={postType === 'code' ? 'Paste your code here…' : postType === 'poll' ? 'Ask a question for your poll…' : 'Share something with the club…'}
            className={`w-full resize-none text-sm text-navy placeholder:text-[var(--color-text-muted)] bg-transparent outline-none ${
              postType === 'code' ? 'font-mono min-h-[100px] bg-gray-50 rounded-lg p-2 border border-[var(--color-border)]' : 'min-h-[60px]'
            }`}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onPost(); }}
          />

          {/* Code lang picker */}
          {postType === 'code' && (
            <select
              value={postCodeLang}
              onChange={e => setPostCodeLang(e.target.value)}
              className="input-sc text-xs mt-2 py-1"
            >
              {['typescript', 'javascript', 'python', 'rust', 'go', 'html', 'css', 'sql', 'bash'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}

          {/* Poll options */}
          {postType === 'poll' && (
            <div className="mt-2 space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    className="input-sc text-sm flex-1"
                  />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-[var(--color-text-muted)] hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions(prev => [...prev, ''])} className="text-xs text-[var(--color-amber)] font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> Add option
                </button>
              )}
            </div>
          )}

          {/* File attachment (text posts only) */}
          {postType === 'text' && (
            <div className="mt-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,application/pdf"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const type = pendingAttachTypeRef.current;
                  const previewUrl = URL.createObjectURL(file);
                  setPostAttachment({ file, type, previewUrl });
                  e.target.value = '';
                }}
              />

              {/* Attachment preview */}
              {postAttachment ? (
                <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
                  {postAttachment.type === 'image' && (
                    <img src={postAttachment.previewUrl} alt="" className="max-h-48 w-full object-cover" />
                  )}
                  {postAttachment.type === 'video' && (
                    <video src={postAttachment.previewUrl} controls className="max-h-48 w-full bg-black" />
                  )}
                  {postAttachment.type === 'pdf' && (
                    <div className="flex items-center gap-2.5 px-3 py-3 bg-parchment">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-navy truncate">{postAttachment.file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setPostAttachment(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] mr-1">Attach:</span>
                  {([
                    { type: 'image' as AttachmentType, icon: ImageIcon, label: 'Image', accept: 'image/*' },
                    { type: 'video' as AttachmentType, icon: Film, label: 'Video', accept: 'video/*' },
                    { type: 'pdf' as AttachmentType, icon: Paperclip, label: 'PDF', accept: '.pdf,application/pdf' },
                  ]).map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        pendingAttachTypeRef.current = type;
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-[var(--color-text-muted)] hover:bg-parchment hover:text-navy transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Topic tags */}
          <div className="mt-2">
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="w-3 h-3 text-[var(--color-text-muted)]" />
              {POST_TOPIC_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setPostTopicTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${
                    postTopicTags.includes(tag)
                      ? 'text-white'
                      : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200'
                  }`}
                  style={postTopicTags.includes(tag) ? { background: 'var(--color-amber)' } : {}}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Upload progress bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
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

          {/* Actions row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)]">
            {newPostContent.trim() && (
              <span className="text-[10px] text-[var(--color-text-muted)]">Draft saved</span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {(newPostContent.trim() || postAttachment || hasExternalImage) && (
                <button
                  onClick={() => { setNewPostContent(''); setPostImageUrl(''); setPostTopicTags(() => []); setPostType('text'); setPollOptions(() => ['', '']); setPostAttachment(null); }}
                  className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                >
                  Discard
                </button>
              )}
              <button
                onClick={onPost}
                disabled={postingPost || (!newPostContent.trim() && !postAttachment)}
                className="btn-amber text-sm disabled:opacity-50"
                style={{ padding: '6px 16px' }}
              >
                {postingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
