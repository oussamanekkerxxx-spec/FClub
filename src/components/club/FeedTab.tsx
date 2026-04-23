import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  FileText,
  MessageSquare,
  Rocket,
  Video,
} from 'lucide-react';

type JoinResult<T> = T | T[] | null;

type Sender = {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

type PollPreview = {
  id: string;
  question: string;
  options?: { id: string; votes?: { id: string }[] }[];
};

type ProjectPreview = {
  id: string;
  title: string;
  pitch: string;
  visibility: string;
  status: string;
};

type MessageRow = {
  id: string;
  channel_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  created_at: string;
  sender: JoinResult<Sender>;
  poll: JoinResult<PollPreview>;
  project: JoinResult<ProjectPreview>;
};

type ActivityType = 'project' | 'poll' | 'event' | 'resource' | 'video' | 'message';

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  body: string;
  createdAt: string;
  channelName: string;
  sender?: Sender;
  projectId?: string;
  href?: string;
};

interface Props {
  clubId: string;
  isMember: boolean;
  isPrivate: boolean;
}

const TYPE_META: Record<
  ActivityType,
  {
    label: string;
    icon: React.FC<{ className?: string }>;
    chip: string;
    line: string;
  }
> = {
  project: {
    label: 'Project',
    icon: Rocket,
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    line: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
  },
  poll: {
    label: 'Poll',
    icon: BarChart2,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    line: 'linear-gradient(90deg, #d97706, #f59e0b)',
  },
  event: {
    label: 'Event',
    icon: CalendarDays,
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
    line: 'linear-gradient(90deg, #6d28d9, #8b5cf6)',
  },
  resource: {
    label: 'Resource',
    icon: FileText,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    line: 'linear-gradient(90deg, #047857, #10b981)',
  },
  video: {
    label: 'Video',
    icon: Video,
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    line: 'linear-gradient(90deg, #be123c, #f43f5e)',
  },
  message: {
    label: 'Message',
    icon: MessageSquare,
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    line: 'linear-gradient(90deg, #334155, #64748b)',
  },
};

function one<T>(value: JoinResult<T>): T | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function memberInitials(sender?: Sender): string {
  if (!sender) return '?';
  return `${sender.first_name?.[0] ?? ''}${sender.last_name?.[0] ?? ''}`.toUpperCase();
}

function toActivityItem(row: MessageRow, channelName: string): ActivityItem | null {
  const sender = one(row.sender);
  const poll = one(row.poll);
  const project = one(row.project);
  const content = row.content?.trim() ?? '';
  const lowerContent = content.toLowerCase();

  if (project) {
    return {
      id: row.id,
      type: 'project',
      title: project.title,
      body: project.pitch?.trim() || 'A new project was shared in chat.',
      createdAt: row.created_at,
      channelName,
      sender,
      projectId: project.id,
    };
  }

  if (poll) {
    const optionsCount = poll.options?.length ?? 0;
    return {
      id: row.id,
      type: 'poll',
      title: poll.question,
      body: optionsCount > 0 ? `${optionsCount} options ready for voting.` : 'A poll was shared in chat.',
      createdAt: row.created_at,
      channelName,
      sender,
    };
  }

  if (lowerContent.includes('created an event')) {
    return {
      id: row.id,
      type: 'event',
      title: 'New event announced',
      body: content,
      createdAt: row.created_at,
      channelName,
      sender,
    };
  }

  if (row.video_url) {
    const safeVideoUrl = normalizeHttpUrl(row.video_url);
    if (!safeVideoUrl) return null;
    return {
      id: row.id,
      type: 'video',
      title: content || 'Video shared in chat',
      body: extractFileNameFromUrl(safeVideoUrl, 'video'),
      createdAt: row.created_at,
      channelName,
      sender,
      href: safeVideoUrl,
    };
  }

  if (row.pdf_url) {
    const safePdfUrl = normalizeHttpUrl(row.pdf_url);
    if (!safePdfUrl) return null;
    return {
      id: row.id,
      type: 'resource',
      title: content || 'Document shared in chat',
      body: extractFileNameFromUrl(safePdfUrl, 'document'),
      createdAt: row.created_at,
      channelName,
      sender,
      href: safePdfUrl,
    };
  }

  if (row.image_url) {
    const safeImageUrl = normalizeHttpUrl(row.image_url);
    if (!safeImageUrl) return null;
    return {
      id: row.id,
      type: 'message',
      title: content || 'Image shared in chat',
      body: 'Media update from the club chat.',
      createdAt: row.created_at,
      channelName,
      sender,
      href: safeImageUrl,
    };
  }

  return null;
}

function MemberGate({ isPrivate }: { isPrivate: boolean }) {
  return (
    <div className="sc-card p-10 text-center">
      <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <MessageSquare className="w-6 h-6 text-[var(--color-text-muted)]" />
      </div>
      <p className="font-semibold text-navy text-sm mb-1">Members only</p>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {isPrivate ? 'Request to join this club to view activity.' : 'Join this club to unlock activity.'}
      </p>
    </div>
  );
}

export default function FeedTab({ clubId, isMember, isPrivate }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadActivity() {
      if (!isMember || !clubId) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      const { data: channels, error: channelsError } = await supabase
        .from('club_channels')
        .select('id, name')
        .eq('club_id', clubId);

      if (channelsError) {
        toast.error('Could not load club activity');
        if (mounted) setLoading(false);
        return;
      }

      const channelMap = new Map((channels ?? []).map((channel) => [channel.id, channel.name]));
      const channelIds = Array.from(channelMap.keys());

      if (channelIds.length === 0) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const { data: rows, error: messagesError } = await supabase
        .from('club_messages')
        .select(`
          id,
          channel_id,
          content,
          image_url,
          video_url,
          pdf_url,
          created_at,
          sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url),
          poll:polls(id, question, options:poll_options(id, votes:poll_votes(id))),
          project:club_projects(id, title, pitch, visibility, status)
        `)
        .in('channel_id', channelIds)
        .order('created_at', { ascending: false })
        .limit(120);

      if (messagesError) {
        toast.error('Could not load club activity');
        if (mounted) setLoading(false);
        return;
      }

      const normalized = ((rows ?? []) as MessageRow[])
        .map((row) => toActivityItem(row, channelMap.get(row.channel_id) ?? 'general'))
        .filter((item): item is ActivityItem => item !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 24);

      if (mounted) {
        setItems(normalized);
        setLoading(false);
      }
    }

    loadActivity();

    return () => {
      mounted = false;
    };
  }, [clubId, isMember]);

  const hasActivity = useMemo(() => items.length > 0, [items.length]);

  if (!isMember) return <MemberGate isPrivate={isPrivate} />;

  return (
    <div className="space-y-4">
      <div className="sc-card p-4 sm:p-5 overflow-hidden relative">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: 'linear-gradient(90deg, #C4873A, #E16B3B, #C05A81)' }}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-navy">Activity is now powered by chat</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Polls, project launches, events, files, and videos shared in messages appear here automatically.
            </p>
          </div>
          <button
            onClick={() => navigate(`/app/club/${clubId}/chat`)}
            className="btn-amber text-xs px-3 py-1.5 whitespace-nowrap"
            style={{ padding: '6px 12px' }}
          >
            Open Chat
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="sc-card p-5 animate-pulse">
              <div className="h-4 w-1/3 rounded bg-gray-200 mb-3" />
              <div className="h-3 w-full rounded bg-gray-100 mb-2" />
              <div className="h-3 w-2/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : !hasActivity ? (
        <div className="sc-card p-10 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-sm font-semibold text-navy">No chat activity yet</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Start with a poll or a project pitch in chat and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            const safeItemHref = normalizeHttpUrl(item.href);
            return (
              <article key={item.id} className="sc-card p-4 sm:p-5 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: meta.line }} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={item.sender?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[11px] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                        {memberInitials(item.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-navy truncate">
                        {item.sender ? `${item.sender.first_name} ${item.sender.last_name}` : 'Club member'}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        #{item.channelName} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${meta.chip}`}>
                    <span className="inline-flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-navy mt-3">{item.title}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{item.body}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                  {safeItemHref ? (
                    <a
                      href={safeItemHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-amber)] transition-colors"
                    >
                      Open shared file
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">Auto-synced from chat</span>
                  )}
                  <button
                    onClick={() => {
                      if (item.projectId) {
                        navigate(`/app/club/${clubId}/projects/${item.projectId}`);
                        return;
                      }
                      navigate(`/app/club/${clubId}/chat`);
                    }}
                    className="text-xs font-semibold text-[var(--color-amber)] hover:underline inline-flex items-center gap-1"
                  >
                    {item.projectId ? 'See details' : 'Open chat'}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
