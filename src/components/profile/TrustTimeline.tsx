import { useTrustReport } from '@/hooks/useTrustReport';
import { UserCheck, BookOpen, Calendar, Shield, Star, Flag, Award } from 'lucide-react';

interface Props {
  userId: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  join: <Flag className="w-4 h-4" />,
  skill: <BookOpen className="w-4 h-4" />,
  verify: <Shield className="w-4 h-4" />,
  session: <Calendar className="w-4 h-4" />,
  vouch: <UserCheck className="w-4 h-4" />,
  tier: <Award className="w-4 h-4" />,
};

const EVENT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  join: { bg: '#EDF2FF', border: '#4C6EF5', icon: '#4C6EF5' },
  skill: { bg: '#FFF3E0', border: '#C4873A', icon: '#C4873A' },
  verify: { bg: '#E8F5EE', border: '#2D7A4F', icon: '#2D7A4F' },
  session: { bg: '#E3F2FD', border: '#1976D2', icon: '#1976D2' },
  vouch: { bg: '#EDE8F7', border: '#5C3D8F', icon: '#5C3D8F' },
  tier: { bg: '#FFF3E0', border: '#C4873A', icon: '#C4873A' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function TrustTimeline({ userId }: Props) {
  const { data: report, isLoading } = useTrustReport(userId);
  const events = report?.timeline ?? [];

  if (isLoading) {
    return (
      <div className="sc-card p-5">
        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="sc-card p-5 text-center">
        <div className="text-2xl mb-2">🌱</div>
        <div className="font-body text-sm font-semibold text-[var(--color-navy)]">
          Trust journey just beginning
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Complete your profile and start teaching to build your trust score.
        </p>
      </div>
    );
  }

  return (
    <div className="sc-card p-5">
      <h3 className="font-heading text-navy mb-4" style={{ fontSize: '1.05rem' }}>
        Trust Journey
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-4 top-2 bottom-2 w-0.5"
          style={{ background: 'var(--color-parchment-dark)' }}
        />

        <div className="space-y-4">
          {events.map((event, index) => {
            const colors = EVENT_COLORS[event.icon] ?? EVENT_COLORS.join;
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="flex gap-3 relative z-10">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white"
                  style={{ background: colors.bg, color: colors.icon }}
                >
                  {EVENT_ICONS[event.icon] ?? <Star className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-4 ${!isLast ? '' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body font-semibold text-[var(--color-navy)]">
                      {event.title}
                    </span>
                    <span className="text-[10px] font-body text-[var(--color-text-muted)]">
                      {timeAgo(event.date)}
                    </span>
                  </div>
                  <p className="text-xs font-body text-[var(--color-text-secondary)] mt-0.5">
                    {event.description}
                  </p>
                  {event.points && event.points > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-body font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
                      +{event.points} pts
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
