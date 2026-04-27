import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useClubActivity } from '@/hooks/useClubActivity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeHttpUrl } from '@/lib/safeUrl';
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  FileText,
  MessageSquare,
  Rocket,
  Video,
} from 'lucide-react';
import MemberGate from './MemberGate';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';

type ActivityType = 'project' | 'poll' | 'event' | 'resource' | 'video' | 'message';

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

function memberInitials(sender?: { first_name: string; last_name: string; avatar_url: string | null }): string {
  if (!sender) return '?';
  return `${sender.first_name?.[0] ?? ''}${sender.last_name?.[0] ?? ''}`.toUpperCase();
}

export default function FeedTab({ clubId, isMember, isPrivate }: Props) {
  const navigate = useNavigate();
  const { items, loading } = useClubActivity({ clubId, enabled: isMember });
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
        <SkeletonCard count={4} />
      ) : !hasActivity ? (
        <EmptyState icon={<MessageSquare className="w-6 h-6 text-[var(--color-text-muted)]" />} title="No chat activity yet" subtitle="Start with a poll or a project pitch in chat and it will appear here." />
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