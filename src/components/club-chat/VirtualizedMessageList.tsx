import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import MessageItem from './MessageItem';

interface VirtualizedMessageListProps {
  messages: any[];
  user: any;
  adaptToChatMessage: (msg: any) => any;
  
  // Handlers
  onReply: (msg: any) => void;
  onEdit: (msg: any) => void;
  onDelete: (msgId: string) => void;
  onPin: (msg: any) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onForward: (msg: any) => void;
  onViewImage: (msg: any) => void;
  onApplyToProject: (project: any) => void;
  onViewApplicants: (project: any) => void;
  
  // Extracted from context
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export default function VirtualizedMessageList({
  messages,
  user,
  adaptToChatMessage,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onToggleReaction,
  onForward,
  onViewImage,
  onApplyToProject,
  onViewApplicants,
  scrollContainerRef
}: VirtualizedMessageListProps) {
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 65, // Base estimate height
    overscan: 10,
    // Provide a key extractor so item measurements are stable if list updates
    getItemKey: (index) => messages[index].id,
  });

  // Auto-scroll to bottom on first load and when we receive new messages
  // In a production app, we would only scroll if already at bottom, but for this prototype:
  const prevCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCount.current && scrollContainerRef.current) {
      // Small delay to let React commit DOM nodes and Virtualizer measure them
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      });
    }
    prevCount.current = messages.length;
  }, [messages.length, virtualizer]);

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const i = virtualItem.index;
        const msg = messages[i];
        
        // --- View logic extracted from DmChatMainPane ---
        const adapted = adaptToChatMessage(msg);
        const isOwn = msg.sender_id === user?.id;
        const prevMsg = i > 0 ? messages[i - 1] : null;
        const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

        const msgDate = new Date(msg.created_at);
        const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
        const nextDate = nextMsg ? new Date(nextMsg.created_at) : null;

        const showDateDivider = !prevDate || !isSameDay(msgDate, prevDate);
        let dateDividerText = '';
        if (showDateDivider) {
          if (isToday(msgDate)) dateDividerText = 'Today';
          else if (isYesterday(msgDate)) dateDividerText = 'Yesterday';
          else dateDividerText = format(msgDate, 'MMMM d, yyyy');
        }

        const gapMs = 5 * 60 * 1000;
        const isGroupFirst =
          showDateDivider ||
          !prevMsg ||
          prevMsg.sender_id !== msg.sender_id ||
          msgDate.getTime() - prevDate!.getTime() > gapMs;

        const isGroupLast =
          !nextMsg ||
          nextMsg.sender_id !== msg.sender_id ||
          !isSameDay(msgDate, nextDate!) ||
          nextDate!.getTime() - msgDate.getTime() > gapMs;

        let bubbleRadius: string;
        if (isOwn) {
          if (isGroupFirst && isGroupLast) bubbleRadius = 'rounded-[20px] rounded-br-[5px]';
          else if (isGroupFirst) bubbleRadius = 'rounded-[20px] rounded-br-[8px]';
          else if (isGroupLast) bubbleRadius = 'rounded-[20px] rounded-tr-[8px] rounded-br-[5px]';
          else bubbleRadius = 'rounded-[20px] rounded-r-[8px]';
        } else {
          if (isGroupFirst && isGroupLast) bubbleRadius = 'rounded-[20px] rounded-bl-[5px]';
          else if (isGroupFirst) bubbleRadius = 'rounded-[20px] rounded-bl-[8px]';
          else if (isGroupLast) bubbleRadius = 'rounded-[20px] rounded-tl-[8px] rounded-bl-[5px]';
          else bubbleRadius = 'rounded-[20px] rounded-l-[8px]';
        }

        const marginTopClass = isGroupFirst && i !== 0 ? 'mt-4' : 'mt-[3px]';

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              // Use translate3d for GPU acceleration (ComponentFlow style)
              transform: `translate3d(0, ${virtualItem.start}px, 0)`,
              willChange: 'transform',
            }}
          >
            <MessageItem
              msg={adapted}
              isOwn={isOwn}
              isGroupFirst={isGroupFirst}
              isGroupLast={isGroupLast}
              bubbleRadius={bubbleRadius}
              marginTopClass={marginTopClass}
              showDateDivider={showDateDivider}
              dateDividerText={dateDividerText}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onToggleReaction={onToggleReaction}
              onForward={onForward}
              onViewImage={onViewImage}
              onApplyToProject={onApplyToProject}
              onViewApplicants={onViewApplicants}
            />
          </div>
        );
      })}
    </div>
  );
}
