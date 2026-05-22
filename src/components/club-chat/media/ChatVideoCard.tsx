import React from 'react';
import { format } from 'date-fns';
import { Play, Check, CheckCheck } from 'lucide-react';
import type { ChannelRead } from '@/types/clubs';
import type { Message } from '@/features/club-chat/workspace/types';
import type { ClubSharedFile, ClubCourse } from '@/types/clubs';

interface ChatVideoCardProps {
  msg: Message;
  isOwn: boolean;
  bubbleRadius: string;
  channelReads: ChannelRead[];
  onViewVideo?: (msg: Message) => void;
  linkedSharedFile?: ClubSharedFile;
  linkedCourse?: ClubCourse;
}

const ChatVideoCard = React.memo(function ChatVideoCardInternal({
  msg,
  isOwn,
  bubbleRadius,
  channelReads,
  onViewVideo,
  linkedSharedFile,
  linkedCourse,
}: ChatVideoCardProps) {
  if (!msg.video_url) return null;

  const msgDate = new Date(msg.created_at);
  const isRead = isOwn && channelReads.some(
    (r) => new Date(r.last_read_at) >= msgDate
  );

  return (
    <div
      className={`relative overflow-hidden shadow-sm bg-black border border-black/5 ${bubbleRadius} shrink-0 max-w-[280px] sm:max-w-xs`}
      style={{ WebkitTapHighlightColor: 'transparent', transform: 'translateZ(0)' }}
    >
      {/* Thumbnail area */}
      <div
        className="relative cursor-pointer"
        onClick={() => onViewVideo?.(msg)}
        style={{
          ...(msg.video_width && msg.video_height
            ? { aspectRatio: `${msg.video_width} / ${msg.video_height}` }
            : {}),
        }}
      >
        <video
          src={msg.video_url}
          preload="metadata"
          className="w-full h-full max-h-52 object-cover block opacity-80"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

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
        <div className="px-3 py-2 text-[13px] leading-relaxed break-words text-white/90 bg-black">
          {msg.caption}
        </div>
      )}

      {/* Learning badge */}
      {linkedSharedFile && (
        <div className="px-3 pb-2 pt-0.5 bg-black">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
            🎓 {linkedCourse ? `Added to ${linkedCourse.title}` : 'Course resource'}
          </span>
        </div>
      )}
    </div>
  );
});

export default ChatVideoCard;
