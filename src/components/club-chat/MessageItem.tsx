import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trash2, Reply, Edit2, CornerUpLeft, Pin, Smile, Check, CheckCheck,
  FileText, ExternalLink, MapPin, BarChart2, CornerDownRight,
} from 'lucide-react';
import AudioPlayerBubble from '@/components/AudioPlayerBubble';
import { ProjectBubble, type ClubProject } from '@/components/chat/ProjectBubble';
import { supabase } from '@/lib/supabase';
import type { Poll } from '@/types/messaging';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface ChannelRead {
  channel_id: string;
  user_id: string;
  last_read_at: string;
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  voice_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  created_at: string;
  reply_to_id?: string | null;
  is_edited?: boolean;
  deleted_at?: string | null;
  caption?: string | null;
  sender?: { first_name: string; last_name: string; avatar_url: string };
  reply_to_message?: Message | null;
  reactions?: Reaction[];
  poll?: Poll | null;
  project?: ClubProject | null;
  forwarded_from_id?: string | null;
  forwarded_from_name?: string | null;
}

interface MessageItemProps {
  msg: Message;
  isOwn: boolean;
  isGroupFirst: boolean;
  isGroupLast: boolean;
  bubbleRadius: string;
  marginTopClass: string;
  showDateDivider: boolean;
  dateDividerText: string;
  currentUserId: string | undefined;
  isAdminOrMod: boolean;
  channelReads: ChannelRead[];
  allMessages: Message[];
  searchQuery: string;
  parseMessageContent: (text: string, query: string) => React.ReactNode;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  onPin: (msg: Message) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onForward: (msg: Message) => void;
  onViewImage: (msg: Message) => void;
  onApplyToProject: (project: ClubProject) => void;
  onViewApplicants: (project: ClubProject) => void;
}

export default function MessageItem({
  msg,
  isOwn,
  isGroupFirst,
  isGroupLast,
  bubbleRadius,
  marginTopClass,
  showDateDivider,
  dateDividerText,
  currentUserId,
  isAdminOrMod,
  channelReads,
  allMessages,
  searchQuery,
  parseMessageContent,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onToggleReaction,
  onForward,
  onViewImage,
  onApplyToProject,
  onViewApplicants,
}: MessageItemProps) {
  const msgDate = new Date(msg.created_at);

  return (
    <div key={msg.id} data-message-id={msg.id} className="flex flex-col">

      {/* Date Divider */}
      {showDateDivider && (
        <div className="flex justify-center my-5 mb-4">
          <span className="px-3 py-1 bg-black/5 text-[var(--color-text-secondary)] text-[11px] font-bold uppercase tracking-wider rounded-full">
            {dateDividerText}
          </span>
        </div>
      )}

      <div className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : ''} ${marginTopClass}`}>

        {/* Avatar — anchored to bottom, visible only on last bubble of group */}
        <div className="w-8 flex-shrink-0">
          {!isOwn && isGroupLast ? (
            <Avatar className="w-8 h-8">
              <AvatarImage src={msg.sender?.avatar_url} />
              <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white', fontSize: '12px' }}>
                {msg.sender?.first_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Bubble Container */}
        <div className={`max-w-[78%] sm:max-w-[70%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>

          {/* Name header — first bubble of group only, for other users */}
          {!isOwn && isGroupFirst && (
            <div className="mb-0.5 px-2">
              <span className="text-[13px] font-bold text-slate-700 tracking-tight">
                {msg.sender?.first_name || 'Member'}
              </span>
            </div>
          )}

          <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} relative group`}>

            {/* Actions Menu (Desktop hover) */}
            {!msg.deleted_at && (
              <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[var(--color-border)] rounded-full shadow-sm items-center p-0.5 z-10 hidden md:flex
                ${isOwn ? '-left-[150px]' : '-right-[150px]'}
              `}>
                <div className="relative group/react inline-block">
                  <button title="React" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-amber-500"><Smile className="w-4 h-4" /></button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/react:flex items-center gap-1 bg-white border border-[var(--color-border)] shadow-lg rounded-full p-1 opacity-0 group-hover/react:opacity-100 transition-opacity animate-in fade-in zoom-in-95">
                    {['👍', '❤️', '😂', '😮', '😢', '😡'].map(e => (
                      <button key={e} onClick={() => onToggleReaction(msg.id, e)} className="hover:bg-black/5 hover:scale-110 transition-transform rounded-full w-7 h-7 flex items-center justify-center text-sm">{e}</button>
                    ))}
                  </div>
                </div>

                <button onClick={() => onReply(msg)} title="Reply" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-navy"><Reply className="w-4 h-4" /></button>
                {isOwn && <button onClick={() => onEdit(msg)} title="Edit" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>}
                <button onClick={() => onForward(msg)} title="Forward" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-emerald-500"><CornerUpLeft className="w-4 h-4" style={{ transform: 'scaleX(-1)' }} /></button>
                {isAdminOrMod && <button onClick={() => onPin(msg)} title="Pin" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-amber-500"><Pin className="w-4 h-4" /></button>}
                {(isOwn || isAdminOrMod) && <button onClick={() => onDelete(msg.id)} title="Delete" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            )}

            {/* Deleted State Guard */}
            {msg.deleted_at ? (
              <div className={`px-3.5 py-2.5 text-[13px] font-body text-[var(--color-text-muted)] italic bg-white shadow-sm border border-[var(--color-border)] ${bubbleRadius} flex items-center gap-2`}>
                <Trash2 className="w-3.5 h-3.5 opacity-50" /> This message was deleted.
              </div>
            ) : (
              <>
                {/* Reactions List */}
                {msg.reactions && msg.reactions.length > 0 && (() => {
                  const counts = msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {} as Record<string, number>);
                  const userReacts = new Set(msg.reactions.filter(r => r.user_id === currentUserId).map(r => r.emoji));
                  return (
                    <div className={`flex flex-wrap gap-1 mb-1 relative z-0 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(counts).map(([emoji, count]) => {
                        const iReacted = userReacts.has(emoji);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] border transition-colors ${iReacted ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5'}`}
                          >
                            <span>{emoji}</span><span>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Forwarded label */}
                {msg.forwarded_from_name && (
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-0.5 ${isOwn ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                    <CornerDownRight className="w-3 h-3" />
                    Forwarded from {msg.forwarded_from_name}
                  </div>
                )}

                {/* Reply Quote Block */}
                {msg.reply_to_id && (() => {
                  const quoted = allMessages.find(m => m.id === msg.reply_to_id);
                  if (!quoted) return null;
                  return (
                    <div className={`text-[12px] pl-2.5 py-1 mb-0.5 border-l-2 cursor-pointer max-w-[200px] sm:max-w-[260px] text-left
                      ${isOwn ? 'border-white/50 text-white' : 'border-[var(--color-amber)] text-navy'}
                    `} onClick={() => {
                      const el = document.querySelector(`[data-message-id="${msg.reply_to_id}"]`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}>
                      <div className="font-bold truncate opacity-90">{quoted.sender?.first_name || 'Member'}</div>
                      <div className="truncate opacity-75">{quoted.content || 'Attachment'}</div>
                    </div>
                  );
                })()}

                {/* Image */}
                {msg.image_url && (
                  <div
                    className={`relative overflow-hidden shadow-sm cursor-pointer border border-black/5 outline-none select-none ${bubbleRadius} shrink-0`}
                    onClick={(e) => { e.preventDefault(); onViewImage(msg); }}
                    style={{ WebkitTapHighlightColor: 'transparent', transform: 'translateZ(0)' }}
                  >
                    <img
                      src={msg.image_url}
                      alt=""
                      draggable={false}
                      className="w-full h-auto max-h-60 max-w-[280px] sm:max-w-xs object-cover block"
                    />
                  </div>
                )}
                {msg.image_url && msg.caption && (
                  <div className={`px-3.5 py-2 text-[14px] font-body leading-relaxed shadow-sm break-words max-w-[280px] sm:max-w-xs ${bubbleRadius}
                    ${isOwn ? 'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white' : 'bg-white text-[#1E293B] border border-gray-100/50'}`}>
                    {msg.caption}
                  </div>
                )}

                {/* Video */}
                {msg.video_url && (
                  <div
                    className={`relative overflow-hidden shadow-sm bg-black border border-black/5 ${bubbleRadius} shrink-0`}
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <video
                      src={msg.video_url}
                      controls
                      className="w-full h-auto max-h-52 max-w-[280px] sm:max-w-xs object-cover block"
                    />
                  </div>
                )}
                {msg.video_url && msg.caption && (
                  <div className={`px-3.5 py-2 text-[14px] font-body leading-relaxed shadow-sm break-words max-w-[280px] sm:max-w-xs ${bubbleRadius}
                    ${isOwn ? 'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white' : 'bg-white text-[#1E293B] border border-gray-100/50'}`}>
                    {msg.caption}
                  </div>
                )}

                {/* PDF */}
                {(() => {
                  const safePdfUrl = normalizeHttpUrl(msg.pdf_url);
                  if (!safePdfUrl) return null;
                  return (
                    <a
                      href={safePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium shadow-sm max-w-xs ${bubbleRadius}
                        ${isOwn
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-indigo-500/10'
                          : 'bg-white text-navy border border-[var(--color-border)]'
                        }`}
                    >
                      <FileText className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-white/80' : 'text-red-400'}`} />
                      <span className="truncate">{extractFileNameFromUrl(safePdfUrl, 'document.pdf')}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                    </a>
                  );
                })()}

                {/* Voice */}
                {msg.voice_url && (
                  <AudioPlayerBubble url={msg.voice_url} isOwn={isOwn} bubbleRadius={bubbleRadius} />
                )}

                {/* Location */}
                {msg.location_lat && msg.location_lng && (
                  <div className={`flex flex-col overflow-hidden shadow-sm w-[240px] ${bubbleRadius} ${isOwn ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : 'bg-white text-navy border border-[var(--color-border)]'}`}>
                    <div className="h-28 w-full bg-slate-200 relative">
                      <img src={`https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${msg.location_lng},${msg.location_lat}&z=14&l=map&size=240,112&pt=${msg.location_lng},${msg.location_lat},pm2ntl`} alt="Map" className="w-full h-full object-cover" />
                    </div>
                    <div className="px-3 py-2.5 text-[13px] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2"><MapPin className={`w-4 h-4 ${isOwn ? 'text-white/80' : 'text-cyan-600'}`} /> Shared Location</span>
                      <ExternalLink className={`w-3.5 h-3.5 opacity-60`} />
                    </div>
                  </div>
                )}

                {/* Project Bubble */}
                {msg.project && (
                  <div className="mt-2 text-left clear-both max-w-full">
                    <ProjectBubble
                      project={msg.project}
                      currentUserId={currentUserId}
                      onApply={() => {
                        if (msg.project!.creator_id === currentUserId) {
                          return;
                        }
                        const already = msg.project!.applications?.some(a => a.user_id === currentUserId);
                        if (already) {
                          return;
                        }
                        onApplyToProject(msg.project!);
                      }}
                      onViewDetails={() => {
                        if (msg.project!.creator_id === currentUserId) {
                          onViewApplicants(msg.project!);
                        } else {
                          const already = msg.project!.applications?.some(a => a.user_id === currentUserId);
                          if (!already) {
                            onApplyToProject(msg.project!);
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {/* Poll */}
                {msg.poll && (
                  <div className={`flex flex-col shadow-sm w-[260px] p-3 ${bubbleRadius} ${isOwn ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white' : 'bg-white text-navy border border-[var(--color-border)]'}`}>
                    <div className="flex items-start gap-2.5 mb-3">
                      <BarChart2 className={`w-5 h-5 flex-shrink-0 ${isOwn ? 'text-white/80' : 'text-orange-500'}`} />
                      <div>
                        <div className="text-[14px] font-bold leading-tight relative">{msg.poll.question}</div>
                        <div className={`text-[10px] uppercase font-bold mt-1 ${isOwn ? 'text-white/70' : 'text-orange-500/80'}`}>
                          {msg.poll.is_anonymous ? 'Anonymous Poll' : 'Public Poll'} {msg.poll.multiple_answers ? '• Multiple' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {msg.poll.options?.map(opt => {
                        const totalVotes = msg.poll!.options!.reduce((acc, o) => acc + (o.votes?.length || 0), 0);
                        const optionVotes = opt.votes?.length || 0;
                        const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                        const voted = opt.votes?.some(v => v.user_id === currentUserId);
                        return (
                          <button key={opt.id} className={`w-full relative overflow-hidden rounded-lg border flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer group
                            ${isOwn
                              ? `border-white/20 hover:bg-white/10 ${voted ? 'bg-white/20' : ''}`
                              : `border-[var(--color-border)] hover:bg-[#F0F2F5] ${voted ? 'bg-orange-50 border-orange-200' : ''}`
                            }`}
                            onClick={async () => {
                              if (!currentUserId) return;
                              if (voted) {
                                const vote = opt.votes!.find(v => v.user_id === currentUserId);
                                if (vote) await supabase.from('poll_votes').delete().eq('id', vote.id);
                              } else {
                                await supabase.from('poll_votes').insert({ option_id: opt.id, user_id: currentUserId });
                              }
                            }}
                          >
                            <div className={`absolute top-0 left-0 h-full transition-all duration-500 z-0 ${isOwn ? 'bg-white/20' : 'bg-orange-100'}`} style={{ width: `${percent}%` }} />
                            <span className={`text-[13px] font-medium relative z-10 flex items-center gap-1.5 ${isOwn ? 'text-white' : 'text-navy'}`}>
                              {opt.text}
                              <div className={`w-1.5 h-1.5 rounded-full ${voted ? (isOwn ? 'bg-white' : 'bg-orange-500') : 'opacity-0'} shadow-sm`} />
                            </span>
                            <span className={`text-[11px] font-bold relative z-10 ${isOwn ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>{percent}%</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className={`text-[10px] mt-2 text-right ${isOwn ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>
                      {msg.poll.options?.reduce((acc, o) => acc + (o.votes?.length || 0), 0) || 0} votes
                    </div>
                  </div>
                )}

                {/* Text */}
                {msg.content && !msg.poll && !msg.project && msg.content !== 'Voice Message' && msg.content !== 'Shared Location' && (
                  <div
                    className={`px-3.5 py-2 text-[15px] font-body leading-[1.45] shadow-sm break-words ${bubbleRadius}
                      ${isOwn
                        ? 'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white shadow-slate-800/10'
                        : 'bg-white text-[#1E293B] border border-gray-100/50'
                      }
                    `}
                    style={{ minWidth: '80px' }}
                  >
                    <span className="whitespace-pre-wrap leading-relaxed">{parseMessageContent(msg.content, searchQuery)}</span>
                    <span className={`float-right flex items-center gap-1 text-[10px] select-none ml-3 mt-2 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                      {msg.is_edited && <span className="opacity-70 italic mr-0.5">edited</span>}
                      {format(msgDate, 'h:mm a')}
                      {isOwn && (
                        channelReads.some(r => new Date(r.last_read_at) >= new Date(msg.created_at))
                          ? <CheckCheck className="w-[14px] h-[14px] text-blue-300" />
                          : <Check className="w-[14px] h-[14px] opacity-60" />
                      )}
                    </span>
                    <div className="clear-both" />
                  </div>
                )}

                {/* Media-only / project timestamp */}
                {(!msg.content || msg.poll || msg.project || msg.content === 'Voice Message' || msg.content === 'Shared Location' || msg.image_url || msg.video_url || msg.pdf_url) && (!msg.content || msg.poll || msg.project || msg.content === 'Voice Message' || msg.content === 'Shared Location') && (
                  <div className={`flex items-center gap-1 text-[10px] select-none px-1 mt-0.5 justify-end w-full ${isOwn ? 'text-[var(--color-text-muted)]' : 'text-gray-400'}`}>
                    {msg.is_edited && <span className="opacity-70 italic mr-0.5">edited</span>}
                    {format(msgDate, 'h:mm a')}
                    {isOwn && (
                      channelReads.some(r => new Date(r.last_read_at) >= new Date(msg.created_at))
                        ? <CheckCheck className="w-[14px] h-[14px] text-blue-400" />
                        : <Check className="w-[14px] h-[14px] opacity-50" />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
