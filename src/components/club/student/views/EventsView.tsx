import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';
import type { ClubEvent } from '@/types/clubs';

export function EventsView({ clubId }: { clubId: string }) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'online' | 'in-person'>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('club_events')
        .select('*')
        .eq('club_id', clubId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at');
      if (!cancelled) {
        setEvents(data ?? []);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clubId]);

  const filtered = events.filter((e) => {
    if (filter === 'online') return e.format === 'online';
    if (filter === 'in-person') return e.format === 'in-person';
    return true;
  });

  const formatStyle = (fmt: string) => {
    if (fmt === 'online') return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'Online' };
    if (fmt === 'in-person') return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'In-Person' };
    return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', label: 'Hybrid' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<CalendarDays className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No upcoming events"
          subtitle="Events will appear here once scheduled by club moderators."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'online', 'in-person'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-200'
            }`}
          >
            {f === 'all' ? 'Upcoming' : f === 'online' ? 'Online' : 'In-Person'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((e) => {
          const style = formatStyle(e.format);
          const date = new Date(e.starts_at);
          return (
            <div
              key={e.id}
              className="flex items-center gap-4 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-parchment flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">{format(date, 'MMM')}</span>
                <span className="text-[16px] font-black text-navy leading-none">{format(date, 'd')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors truncate">
                  {e.title}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                    {style.label}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {format(date, 'EEEE · h:mm a')}
                  </span>
                </div>
                {e.location ? (
                  <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {e.location}
                  </div>
                ) : null}
              </div>
              <div className="text-[11px] font-semibold text-navy text-right">
                {e.attendee_count ?? 0}/{e.max_attendees ?? '∞'}
                <div className="text-[10px] text-[var(--color-text-muted)] font-normal">attending</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
