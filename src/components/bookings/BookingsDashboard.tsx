import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Check, X, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  status: 'pending' | 'agreed' | 'completed' | 'cancelled';
  proposed_time: string | null;
  neighborhood: string | null;
  student_note: string | null;
  created_at: string;
  skill: { id: string; slug: string; title: string } | null;
  other: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
  isTeacher: boolean;
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pending',   bg: '#FFF3E0', color: '#C4873A' },
  agreed:    { label: 'Agreed',    bg: '#E8F5EE', color: '#2D7A4F' },
  completed: { label: 'Completed', bg: '#EDF2FF', color: '#4C6EF5' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#DC2626' },
};

export default function BookingsDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select('id, status, proposed_time, neighborhood, student_note, created_at, skill_id, student_id, teacher_id, skills(id, slug, title), student:profiles!bookings_student_id_fkey(id, first_name, last_name, avatar_url), teacher:profiles!bookings_teacher_id_fkey(id, first_name, last_name, avatar_url)')
      .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) { setLoading(false); return; }

    const mapped: Booking[] = (data || []).map((b: any) => {
      const isTeacher = b.teacher_id === user.id;
      return {
        id: b.id,
        status: b.status,
        proposed_time: b.proposed_time,
        neighborhood: b.neighborhood,
        student_note: b.student_note,
        created_at: b.created_at,
        skill: b.skills ? { id: b.skills.id, slug: b.skills.slug, title: b.skills.title } : null,
        other: isTeacher ? b.student : b.teacher,
        isTeacher,
      };
    });

    setBookings(mapped);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'agreed' | 'cancelled') => {
    setUpdating(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    setUpdating(null);
    if (error) { toast.error('Could not update booking'); return; }
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    toast.success(status === 'agreed' ? 'Booking confirmed!' : 'Booking declined');
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="sc-card p-5 flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-amber)' }} />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="sc-card p-5 text-center py-10">
        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-amber)' }} />
        <p className="font-body text-sm" style={{ color: 'var(--color-text-secondary)' }}>No session requests yet.</p>
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === 'pending' && b.isTeacher);
  const others = bookings.filter((b) => !(b.status === 'pending' && b.isTeacher));

  return (
    <div className="sc-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
        <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>Sessions</h3>
      </div>

      {/* Teacher inbox — pending requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold font-body uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Incoming Requests
          </div>
          {pending.map((b) => (
            <div key={b.id} className="p-4 rounded-xl space-y-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={b.other?.avatar_url ?? undefined} />
                  <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                    {b.other?.first_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-body text-sm text-navy">
                    {b.other?.first_name} {b.other?.last_name}
                  </div>
                  {b.skill && (
                    <Link to={`/app/skill/${b.skill.slug}`} className="text-xs font-body" style={{ color: 'var(--color-amber)' }}>
                      {b.skill.title}
                    </Link>
                  )}
                </div>
              </div>
              {b.proposed_time && (
                <div className="text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Proposed: {new Date(b.proposed_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {b.neighborhood ? ` · ${b.neighborhood}` : ''}
                </div>
              )}
              {b.student_note && (
                <p className="text-xs font-body italic" style={{ color: 'var(--color-text-secondary)' }}>"{b.student_note}"</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(b.id, 'agreed')}
                  disabled={updating === b.id}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold font-body text-white disabled:opacity-50"
                  style={{ background: 'var(--color-forest)' }}
                >
                  {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Confirm
                </button>
                <button
                  onClick={() => updateStatus(b.id, 'cancelled')}
                  disabled={updating === b.id}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold font-body disabled:opacity-50"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  <X className="w-3 h-3" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All other bookings (student view + non-pending teacher) */}
      {others.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && (
            <div className="text-xs font-semibold font-body uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              History
            </div>
          )}
          {others.map((b) => {
            const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
            return (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={b.other?.avatar_url ?? undefined} />
                  <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '10px' }}>
                    {b.other?.first_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-body text-xs text-navy truncate">
                    {b.other?.first_name} {b.other?.last_name}
                    {b.skill && <span className="font-normal text-[var(--color-text-muted)]"> · {b.skill.title}</span>}
                  </div>
                  {b.proposed_time && (
                    <div className="text-[10px] font-body mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(b.proposed_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
