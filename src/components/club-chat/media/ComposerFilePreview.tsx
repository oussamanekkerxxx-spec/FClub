import React from 'react';
import { X, FileText, FileSpreadsheet, FileIcon, Presentation, BookOpen, Paperclip } from 'lucide-react';
import { useChatStore } from '@/features/club-chat/store/chatStore';
import { detectFileKind } from '@/lib/cloudinary';
import type { ChatAttachment } from '@/features/club-chat/workspace/types';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileMeta(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    return { icon: FileText, label: 'PDF', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
  }
  if (name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.odt')) {
    return { icon: FileIcon, label: 'DOCX', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.odp')) {
    return { icon: Presentation, label: 'PPT', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.ods')) {
    return { icon: FileSpreadsheet, label: 'XLS', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
  }
  if (name.endsWith('.txt') || name.endsWith('.rtf')) {
    return { icon: FileText, label: 'TXT', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
  }
  return { icon: FileIcon, label: 'FILE', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
}

interface ComposerFilePreviewProps {
  attachment: ChatAttachment;
  onRemove: () => void;
}

const ComposerFilePreview = React.memo(function ComposerFilePreviewInternal({
  attachment,
  onRemove,
}: ComposerFilePreviewProps) {
  const clubCategory = useChatStore((s) => s.clubCategory);
  const sendCasually = useChatStore((s) => s.sendAttachmentCasually);
  const setLearningFileModal = useChatStore((s) => s.setLearningFileModal);

  const meta = getFileMeta(attachment.file);
  const fileKind = detectFileKind(attachment.file);
  const isStudentClub = clubCategory === 'student';
  const validLearningKind = ['pdf', 'document', 'slides', 'spreadsheet', 'video', 'audio', 'image'].includes(fileKind);
  const showActions = isStudentClub && validLearningKind;

  const Icon = meta.icon;

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
    <div className="relative rounded-2xl bg-white border border-[var(--color-border)] shadow-sm max-w-md mx-auto w-full overflow-hidden">
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
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Ready to send</p>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
        title="Remove"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Student club action bar */}
      {showActions && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] flex gap-2">
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
  );
});

export default ComposerFilePreview;
