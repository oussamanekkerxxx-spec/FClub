import React, { useRef, useState, useEffect } from 'react';
import { X, Play, BookOpen, Paperclip } from 'lucide-react';
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

interface ComposerMediaPreviewProps {
  attachment: ChatAttachment;
  caption: string;
  onCaptionChange: (value: string) => void;
  onRemove: () => void;
}

const ComposerMediaPreview = React.memo(function ComposerMediaPreviewInternal({
  attachment,
  caption,
  onCaptionChange,
  onRemove,
}: ComposerMediaPreviewProps) {
  const clubCategory = useChatStore((s) => s.clubCategory);
  const sendCasually = useChatStore((s) => s.sendAttachmentCasually);
  const setLearningFileModal = useChatStore((s) => s.setLearningFileModal);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isImage = attachment.type === 'image';
  const isVideo = attachment.type === 'video';
  const fileKind = detectFileKind(attachment.file);
  const isStudentClub = clubCategory === 'student';
  const validLearningKind = ['pdf', 'document', 'slides', 'spreadsheet', 'video', 'audio', 'image'].includes(fileKind);
  const showActions = isStudentClub && validLearningKind;

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;
    const handleLoaded = () => {
      if (video.duration && isFinite(video.duration)) {
        setVideoDuration(video.duration);
      }
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    // If metadata is already loaded
    if (video.readyState >= 1) handleLoaded();
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, [isVideo, attachment.previewUrl]);

  const handleSendCasually = async () => {
    try {
      await sendCasually(attachment.file, fileKind);
    } catch {
      // error toast handled inside action
    }
    onRemove();
  };

  const handleAddToCourse = () => {
    setLearningFileModal({ open: true, data: { file: attachment.file, fileKind } });
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Media Card */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm bg-black max-w-md mx-auto w-full">
        {/* Media */}
        <div className="relative max-h-64">
          {isImage ? (
            <img
              src={attachment.previewUrl}
              alt=""
              className="w-full h-full object-cover max-h-64"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={attachment.previewUrl}
                preload="metadata"
                className="w-full h-full object-cover max-h-64 opacity-90"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
            </>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* Bottom-left file info */}
          <div className="absolute bottom-3 left-3 right-12 text-white">
            <p className="text-sm font-semibold truncate drop-shadow">{attachment.file.name}</p>
            <p className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
              <span className="uppercase font-bold text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{fileKind}</span>
              <span>{formatFileSize(attachment.file.size)}</span>
            </p>
          </div>

          {/* Duration badge (video only) */}
          {isVideo && videoDuration !== null && (
            <div className="absolute top-3 right-12 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {formatDuration(videoDuration)}
            </div>
          )}

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Caption strip */}
        <div className="bg-white/95 backdrop-blur px-3 py-2 border-t border-black/5">
          <input
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            className="w-full text-sm bg-transparent outline-none text-navy placeholder-[var(--color-text-muted)]"
          />
        </div>

        {/* Student club action bar */}
        {showActions && (
          <div className="bg-white px-3 py-2 border-t border-[var(--color-border)] flex gap-2">
            <button
              type="button"
              onClick={handleSendCasually}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Send in chat only
            </button>
            <button
              type="button"
              onClick={handleAddToCourse}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-amber)] to-orange-500 px-3 py-2 text-[12px] font-bold text-white hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Add to course
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ComposerMediaPreview;
