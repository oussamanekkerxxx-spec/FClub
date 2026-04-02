import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, Flame, Zap, Info } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PointRow {
  user_id: string;
  points: number;
  streak_days: number;
  last_active: string | null;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    city: string | null;
  };
}

// ─── Rank badge ──────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#7C4D0A' }}>
        1
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', color: '#3A3A3A' }}>
        2
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #CD7F32, #A0522D)', color: '#FFF5E6' }}>
        3
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0
      bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
      {rank}
    </div>
  );
}

function initials(p?: { first_name: string; last_name: string } | null) {
  if (!p) return '?';
  return `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase();
}

// ─── LeaderboardTab (main export) ───────────────────────────────────────────

interface LeaderboardTabProps {
  clubId: string;
  currentUserId: string | undefined;
}

export default function LeaderboardTab({ clubId, currentUserId }: LeaderboardTabProps) {
  const [rows, setRows] = useState<PointRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    supabase
      .from('club_member_points')
      .select(`
        user_id, points, streak_days, last_active,
        profile:profiles!club_member_points_user_id_fkey(first_name, last_name, avatar_url, city)
      `)
      .eq('club_id', clubId)
      .order('points', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setRows(data as any);
        setLoading(false);
      });
  }, [clubId]);

  const myRow = rows.find(r => r.user_id === currentUserId);
  const myRank = myRow ? rows.indexOf(myRow) + 1 : null;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--color-amber)]" />
            Club Leaderboard
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">Points earned through club activity</p>
        </div>
        <button onClick={() => setShowInfo(v => !v)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors p-1">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Points legend */}
      {showInfo && (
        <div className="sc-card p-4 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--color-amber)]" />
            <span><strong className="text-[var(--color-text)]">+5 pts</strong> — Post in feed</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--color-amber)]" />
            <span><strong className="text-[var(--color-text)]">+1 pt</strong> — React to a post</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--color-amber)]" />
            <span><strong className="text-[var(--color-text)]">+20 pts</strong> — Complete a quest</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--color-amber)]" />
            <span><strong className="text-[var(--color-text)]">+10 pts</strong> — RSVP to an event</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>🔥 Streak = consecutive days active in this club</span>
          </div>
        </div>
      )}

      {/* My rank (if not in top 10) */}
      {myRank && myRank > 10 && myRow && (
        <div className="sc-card p-4 border-l-4 border-l-[var(--color-amber)]">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Your rank</p>
          <div className="flex items-center gap-3">
            <RankBadge rank={myRank} />
            <Avatar className="w-8 h-8">
              <AvatarImage src={myRow.profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials(myRow.profile as any)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm flex-1">You</span>
            {myRow.streak_days >= 3 && (
              <span className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5" /> {myRow.streak_days}d
              </span>
            )}
            <span className="font-bold text-sm text-[var(--color-amber)]">{myRow.points} pts</span>
          </div>
        </div>
      )}

      {/* Top 10 */}
      {rows.length === 0 ? (
        <div className="sc-card p-10 text-center text-[var(--color-text-secondary)]">
          <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-sm">No points yet</p>
          <p className="text-xs mt-1">Post in the feed, react to posts, or RSVP to an event to earn points!</p>
        </div>
      ) : (
        <div className="sc-card divide-y divide-[var(--color-border)] overflow-hidden">
          {rows.slice(0, 10).map((row, i) => {
            const isMe = row.user_id === currentUserId;
            return (
              <div key={row.user_id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isMe ? 'bg-[var(--color-amber)]/[0.06]' : 'hover:bg-[var(--color-bg-secondary)]'
                }`}>
                <RankBadge rank={i + 1} />
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={row.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(row.profile as any)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? 'text-[var(--color-amber)]' : ''}`}>
                    {row.profile
                      ? `${row.profile.first_name} ${row.profile.last_name}${isMe ? ' (you)' : ''}`
                      : 'Unknown'}
                  </p>
                  {row.profile?.city && (
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">{row.profile.city}</p>
                  )}
                </div>
                {/* Streak */}
                {row.streak_days >= 3 && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold flex-shrink-0">
                    <Flame className="w-3.5 h-3.5" />
                    {row.streak_days}d
                  </div>
                )}
                {/* Points bar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden hidden sm:block">
                    <div className="h-full rounded-full bg-[var(--color-amber)]"
                      style={{ width: `${Math.min(100, (row.points / (rows[0]?.points || 1)) * 100)}%` }} />
                  </div>
                  <span className="font-bold text-sm text-[var(--color-amber)] w-14 text-right">
                    {row.points.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
