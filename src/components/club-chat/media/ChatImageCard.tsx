import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import type { ChannelRead } from '@/types/clubs';
import type { Message } from '@/features/club-chat/workspace/types';
import type { ClubSharedFile, ClubCourse } from '@/types/clubs';

interface ChatImageCardProps {
  msg: Message;
  isOwn: boolean;
  bubbleRadius: string;
  channelReads: ChannelRead[];
  onViewImage: (msg: Message) => void;
  linkedSharedFile?: ClubSharedFile;
  linkedCourse?: ClubCourse;
}

const ChatImageCard = React.memo(function ChatImageCardInternal({
  msg,
  isOwn,
  bubbleRadius,
  channelReads,
  onViewImage,
  linkedSharedFile,
  linkedCourse,
}: ChatImageCardProps) {
  if (!msg.image_url) return null;

  const msgDate = new Date(msg.created_at);
  const isRead = isOwn && channelReads.some(
    (r) => new Date(r.last_read_at) >= msgDate
  );

  return (
    <div
      className={`relative max-w-[82vw] shrink-0 overflow-hidden border border-black/5 bg-white shadow-sm sm:max-w-xs ${bubbleRadius}`}
      style={{ WebkitTapHighlightColor: 'transparent', transform: 'translateZ(0)' }}
    >
      {/* Image area */}
      <div
        className="relative cursor-pointer"
        onClick={(e) => { e.preventDefault(); onViewImage(msg); }}
        style={{
          ...(msg.image_width && msg.image_height
            ? { aspectRatio: `${msg.image_width} / ${msg.image_height}` }
            : {}),
        }}
      >
        <img
          src={msg.image_url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-full max-h-[46dvh] w-full object-cover sm:max-h-60"
        />

        {/* Timestamp pill */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm select-none">
          {msg.is_edited && <span className="opacity-80 italic">edited</span>}
          {format(msgDate, 'h:mm a')}
          {isOwn && (
            isRead
              ? <CheckCheck className="w-3 h-3 text-blue-300" />
              : <Check className="w-3 h-3 opacity-70" />
          )}
        </div>
      </div>

      {/* Caption */}
      {msg.caption && (
        <div className={`px-3 py-2 text-[13px] leading-relaxed break-words ${isOwn ? 'text-navy' : 'text-[#1E293B]'}`}>
          {msg.caption}
        </div>
      )}

      {/* Learning badge */}
      {linkedSharedFile && (
        <div className="px-3 pb-2 pt-0.5">
          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600">
            {linkedCourse ? `Course: ${linkedCourse.title}` : 'Course resource'}
          </span>
        </div>
      )}
    </div>
  );
});

export default ChatImageCard;
