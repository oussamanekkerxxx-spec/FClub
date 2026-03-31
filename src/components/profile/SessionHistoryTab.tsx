import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SessionLedger } from '@/types/fightclub';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Star, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SessionHistoryTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === 'demo-user-bypass') {
      setLoading(false);
      return;
    }

    supabase
      .from('session_ledger')
      .select(`
        id, teacher_id, learner_id, completed_at, duration_hours, price_paid, currency, review_given,
        teacher:profiles!session_ledger_teacher_id_fkey(first_name, last_name, avatar_url),
        learner:profiles!session_ledger_learner_id_fkey(first_name, last_name, avatar_url),
        skill:skills!session_ledger_skill_id_fkey(title)
      `)
      .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
      .order('completed_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setSessions(data as unknown as SessionLedger[]);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)] text-sm font-body">
        Loading ledger...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-dashed rounded-xl">
        <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="font-body text-sm text-[var(--color-text-secondary)]">No completed sessions yet.</p>
        <p className="font-body text-xs text-[var(--color-text-muted)] mt-1">
          When you teach or learn, your immutable record will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isTeacher = session.teacher_id === user?.id;
        const otherPerson = isTeacher ? session.learner : session.teacher;
        const roleText = isTeacher ? 'Taught' : 'Learned';
        
        return (
          <div key={session.id} className="p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-amber)] transition-colors flex items-center gap-4">
            <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-white shadow-sm">
              <AvatarImage src={otherPerson?.avatar_url || ''} />
              <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white' }}>
                {otherPerson?.first_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-navy font-body truncate">
                {roleText} <span className="text-[var(--color-amber)]">{session.skill?.title || 'a skill'}</span> {isTeacher ? 'to' : 'from'} {otherPerson?.first_name}
              </div>
              <div className="flex items-center gap-3 text-xs mt-1 text-[var(--color-text-muted)] font-body">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {session.duration_hours}h
                </span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-bold text-navy">
                {session.price_paid === 0 ? 'Free' : `${session.price_paid} ${session.currency}`}
              </div>
              {session.review_given && (
                <div className="text-[10px] font-semibold text-[var(--color-forest)] flex items-center gap-1 justify-end mt-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" /> Reviewed
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
