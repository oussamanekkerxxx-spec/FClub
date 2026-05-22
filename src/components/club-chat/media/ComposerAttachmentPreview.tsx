import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, BookOpen, Paperclip, FileText, FileSpreadsheet, FileIcon, Presentation } from 'lucide-react';
import { useChatStore } from '@/features/club-chat/store/chatStore';
import { detectFileKind } from '@/lib/cloudinary';
import type { ChatAttachment } from '@/features/club-chat/workspace/types';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getFileMeta(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    return { icon: FileText, label: 'PDF', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', status: 'Opens after sending' };
  }
  if (name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.odt')) {
    return { icon: FileIcon, label: 'DOCX', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', status: 'Ready to send' };
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.odp')) {
    return { icon: Presentation, label: 'PPT', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', status: 'Ready to send' };
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.ods')) {
    return { icon: FileSpreadsheet, label: 'XLS', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', status: 'Ready to send' };
  }
  if (name.endsWith('.txt') || name.endsWith('.rtf')) {
    return { icon: FileText, label: 'TXT', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', status: 'Ready to send' };
  }
  return { icon: FileIcon, label: 'FILE', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', status: 'Ready to send' };
}

interface ComposerAttachmentPreviewProps {
  attachment: ChatAttachment;
  caption?: string;
  onCaptionChange?: (value: string) => void;
  onRemove: () => void;
}

const ComposerAttachmentPreview = React.memo(function ComposerAttachmentPreviewInternal({
  attachment,
  caption,
  onCaptionChange,
  onRemove,
}: ComposerAttachmentPreviewProps) {
  const clubCategory = useChatStore((s) => s.clubCategory);
  const sendCasually = useChatStore((s) => s.sendAttachmentCasually);
  const setLearningFileModal = useChatStore((s) => s.setLearningFileModal);

  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveform = useRef(Array.from({ length: 28 }, () => Math.floor(Math.random() * 70) + 20)).current;

  const type = (attachment as any).type as string;
  const isImage = type === 'image';
  const isVideo = type === 'video';
  const isVoice = type === 'voice';
  const isFile = type === 'pdf' || type === 'document';
  const fileKind = detectFileKind(attachment.file);
  const isStudentClub = clubCategory === 'student';
  const validLearningKind = ['pdf', 'document', 'slides', 'spreadsheet', 'video', 'audio', 'image'].includes(fileKind);
  const showActions = isStudentClub && validLearningKind;

  // Video duration
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;
    const handleLoaded = () => {
      if (video.duration && isFinite(video.duration)) setVideoDuration(video.duration);
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    if (video.readyState >= 1) handleLoaded();
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, [isVideo, attachment.previewUrl]);

  // Audio player for voice
  useEffect(() => {
    if (!isVoice || !attachment.previewUrl) return;
    const audio = new Audio(attachment.previewUrl);
    audioRef.current = audio;
    audio.preload = 'metadata';

    const setData = () => setAudioDuration(audio.duration);
    const setTime = () => {
      setAudioCurrentTime(audio.currentTime);
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnd = () => { setIsPlaying(false); setAudioProgress(0); setAudioCurrentTime(0); };

    audio.addEventListener('loadedmetadata', setData);
    audio.addEventListener('timeupdate', setTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('loadedmetadata', setData);
      audio.removeEventListener('timeupdate', setTime);
      audio.removeEventListener('ended', onEnd);
      audio.pause();
    };
  }, [isVoice, attachment.previewUrl]);

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSendCasually = async () => {
    try { await sendCasually(attachment.file, fileKind, caption); } catch { /* handled inside action */ }
    onRemove();
  };

  const handleAddToCourse = () => {
    setLearningFileModal({ open: true, data: { file: attachment.file, fileKind, caption } });
  };

  const casualLabel = fileKind === 'image'
    ? 'Temporary chat photo'
    : fileKind === 'video'
    ? 'Temporary chat video'
    : 'Temporary chat file';

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="relative max-h-64">
          <img src={attachment.previewUrl} alt="" className="w-full h-full object-cover max-h-64" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-12 text-white">
            <p className="text-sm font-semibold truncate drop-shadow">{attachment.file.name}</p>
            <p className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
              <span className="uppercase font-bold text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{fileKind}</span>
              <span>{formatFileSize(attachment.file.size)}</span>
            </p>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="relative max-h-64">
          <video ref={videoRef} src={attachment.previewUrl} preload="metadata" className="w-full h-full object-cover max-h-64 opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-12 text-white">
            <p className="text-sm font-semibold truncate drop-shadow">{attachment.file.name}</p>
            <p className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
              <span className="uppercase font-bold text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{fileKind}</span>
              <span>{formatFileSize(attachment.file.size)}</span>
            </p>
          </div>
          {videoDuration !== null && (
            <div className="absolute top-3 right-12 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {formatDuration(videoDuration)}
            </div>
          )}
        </div>
      );
    }

    if (isVoice) {
      return (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-indigo-50">
          <button
            onClick={toggleAudio}
            className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm hover:bg-purple-200 transition-colors flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <div className="flex-1 flex items-end gap-[2px] h-8">
            {waveform.map((h, i) => (
              <div
                key={i}
                className="w-1 bg-purple-300 rounded-full transition-all"
                style={{
                  height: `${isPlaying ? Math.max(20, Math.random() * 100) : h}%`,
                  opacity: isPlaying ? 0.8 + Math.random() * 0.2 : 0.6,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)] font-mono w-10 text-right">
            {formatDuration(audioCurrentTime || audioDuration)}
          </span>
        </div>
      );
    }

    if (isFile) {
      const meta = getFileMeta(attachment.file);
      const Icon = meta.icon;
      return (
        <div className="flex items-center gap-3 p-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} border ${meta.border}`}>
            <Icon className={`w-6 h-6 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy truncate">{attachment.file.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{formatFileSize(attachment.file.size)}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{meta.status}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const showCaption = (isImage || isVideo) && onCaptionChange;

  return (
    <div className="relative rounded-2xl bg-white border border-[var(--color-border)] shadow-sm overflow-hidden max-w-md mx-auto w-full">
      {renderPreview()}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
        title="Remove"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Caption strip */}
      {showCaption && (
        <div className="bg-gray-50 px-3 py-2 border-t border-black/5">
          <input
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            className="w-full text-sm bg-transparent outline-none text-navy placeholder-[var(--color-text-muted)]"
          />
        </div>
      )}

      {/* Student club action bar */}
      {showActions && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] flex gap-2">
          <button
            type="button"
            onClick={handleSendCasually}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {casualLabel}
          </button>
          <button
            type="button"
            onClick={handleAddToCourse}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-amber)] to-orange-500 px-3 py-2 text-[12px] font-bold text-white hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Learning resource
          </button>
        </div>
      )}
    </div>
  );
});

export default ComposerAttachmentPreview;
