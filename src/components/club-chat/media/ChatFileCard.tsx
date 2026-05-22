import React from 'react';
import { format } from 'date-fns';
import { FileText, FileSpreadsheet, FileIcon, Presentation, ExternalLink, Check, CheckCheck } from 'lucide-react';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import type { ChannelRead } from '@/types/clubs';
import type { Message } from '@/features/club-chat/workspace/types';
import type { ClubSharedFile, ClubCourse } from '@/types/clubs';

interface ChatFileCardProps {
  msg: Message;
  isOwn: boolean;
  bubbleRadius: string;
  channelReads: ChannelRead[];
  linkedSharedFile?: ClubSharedFile;
  linkedCourse?: ClubCourse;
}

function getFileMeta(msg: Message) {
  const url = normalizeHttpUrl(msg.pdf_url);
  if (!url) return null;

  const filename = extractFileNameFromUrl(url, 'document.pdf');
  const lower = filename.toLowerCase();

  if (lower.endsWith('.pdf')) {
    return { icon: FileText, label: 'PDF', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
  }
  if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.odt')) {
    return { icon: FileIcon, label: 'DOC', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
  }
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx') || lower.endsWith('.odp')) {
    return { icon: Presentation, label: 'PPT', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
  }
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv') || lower.endsWith('.ods')) {
    return { icon: FileSpreadsheet, label: 'XLS', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
  }
  return { icon: FileIcon, label: 'FILE', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
}

const ChatFileCard = React.memo(function ChatFileCardInternal({
  msg,
  isOwn,
  bubbleRadius,
  channelReads,
  linkedSharedFile,
  linkedCourse,
}: ChatFileCardProps) {
  const meta = getFileMeta(msg);
  if (!meta) return null;

  const url = normalizeHttpUrl(msg.pdf_url)!;
  const filename = extractFileNameFromUrl(url, 'document.pdf');
  const msgDate = new Date(msg.created_at);
  const isRead = isOwn && channelReads.some(
    (r) => new Date(r.last_read_at) >= msgDate
  );

  const Icon = meta.icon;

  return (
    <div
      className={`flex max-w-[82vw] flex-col overflow-hidden shadow-sm sm:max-w-xs ${bubbleRadius}
        ${isOwn ? 'bg-[var(--color-navy)] text-white' : 'bg-white text-navy border border-gray-200'}
      `}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} border ${meta.border}`}>
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{filename}</div>
          <div className={`text-[10px] flex items-center gap-1 ${isOwn ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>
            <span className="font-bold uppercase">{meta.label}</span>
            {linkedSharedFile?.file_size ? (
              <span>- {(linkedSharedFile.file_size / 1024 / 1024).toFixed(1)} MB</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-1.5 rounded-lg transition-colors ${isOwn ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-[var(--color-text-muted)]'}`}
            title="Open"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className={`flex items-center gap-0.5 text-[9px] ${isOwn ? 'text-white/50' : 'text-gray-400'}`}>
            {format(msgDate, 'h:mm a')}
            {isOwn && (
              isRead
                ? <CheckCheck className="w-2.5 h-2.5 text-blue-300" />
                : <Check className="w-2.5 h-2.5 opacity-60" />
            )}
          </div>
        </div>
      </div>

      {/* Learning badge */}
      {linkedSharedFile && (
        <div className={`px-3 pb-2 pt-0 ${isOwn ? 'bg-[var(--color-navy)]' : 'bg-white'}`}>
          <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[9px] font-bold ${isOwn ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
            {linkedCourse ? `Course: ${linkedCourse.title}` : 'Course resource'}
          </span>
        </div>
      )}
    </div>
  );
});

export default ChatFileCard;
