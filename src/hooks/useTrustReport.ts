import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TrustBreakdownItem {
  key: string;
  label: string;
  current: number;
  max: number;
  points: number;
  maxPoints: number;
  unit?: string;
  action?: { label: string; path: string };
}

export interface TrustTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  points?: number;
  icon: 'join' | 'verify' | 'session' | 'vouch' | 'skill' | 'tier';
}

export interface TrustReport {
  score: number;
  tier: number;
  breakdown: TrustBreakdownItem[];
  nextTier: number | null;
  nextThreshold: number | null;
  pointsToNext: number;
  fastestPath: { label: string; points: number; action: string }[];
  timeline: TrustTimelineEvent[];
}

function computeBreakdown(
  avatarUrl: string | null,
  bio: string | null,
  phoneVerified: boolean,
  idVerified: boolean,
  sessionHours: number,
  vouchCount: number,
  streakDays: number
): TrustBreakdownItem[] {
  const photoPoints = avatarUrl ? 5 : 0;
  const bioPoints = bio && bio.length > 20 ? 5 : 0;
  const phonePoints = phoneVerified ? 10 : 0;
  const idPoints = idVerified ? 10 : 0;
  const sessionPoints = Math.min(Math.floor(sessionHours * 10), 40);
  const vouchPoints = Math.min(vouchCount * 5, 20);
  const streakPoints = Math.min(streakDays, 10);

  return [
    {
      key: 'photo',
      label: 'Profile Photo',
      current: photoPoints > 0 ? 1 : 0,
      max: 1,
      points: photoPoints,
      maxPoints: 5,
      action: photoPoints === 0 ? { label: 'Add photo', path: '/app/settings' } : undefined,
    },
    {
      key: 'bio',
      label: 'Bio',
      current: bioPoints > 0 ? (bio?.length ?? 0) : 0,
      max: 20,
      points: bioPoints,
      maxPoints: 5,
      unit: 'chars',
      action: bioPoints === 0 ? { label: 'Write bio', path: '/app/settings' } : undefined,
    },
    {
      key: 'phone',
      label: 'Phone Verified',
      current: phonePoints > 0 ? 1 : 0,
      max: 1,
      points: phonePoints,
      maxPoints: 10,
      action: phonePoints === 0 ? { label: 'Verify phone', path: '/app/settings' } : undefined,
    },
    {
      key: 'id',
      label: 'Government ID',
      current: idPoints > 0 ? 1 : 0,
      max: 1,
      points: idPoints,
      maxPoints: 10,
      action: idPoints === 0 ? { label: 'Verify ID', path: '/app/settings' } : undefined,
    },
    {
      key: 'sessions',
      label: 'Teaching Hours',
      current: Math.round(sessionHours * 10) / 10,
      max: 4,
      points: sessionPoints,
      maxPoints: 40,
      unit: 'hrs',
      action: sessionPoints < 40 ? { label: 'Teach more', path: '/app/board' } : undefined,
    },
    {
      key: 'vouches',
      label: 'Peer Vouches',
      current: vouchCount,
      max: 4,
      points: vouchPoints,
      maxPoints: 20,
      unit: 'vouches',
      action: vouchPoints < 20 ? { label: 'Share profile', path: '/app/profile' } : undefined,
    },
    {
      key: 'streak',
      label: 'Engagement Streak',
      current: streakDays,
      max: 10,
      points: streakPoints,
      maxPoints: 10,
      unit: 'days',
      action: streakPoints < 10 ? { label: 'Join a club', path: '/app/clubs' } : undefined,
    },
  ];
}

function computeFastestPath(
  breakdown: TrustBreakdownItem[],
  pointsNeeded: number
): { label: string; points: number; action: string }[] {
  const missing = breakdown
    .filter((b) => b.points < b.maxPoints)
    .map((b) => ({
      label: b.label,
      available: b.maxPoints - b.points,
      action: b.action?.label ?? 'Complete',
    }))
    .sort((a, b) => b.available - a.available);

  const path: { label: string; points: number; action: string }[] = [];
  let remaining = pointsNeeded;

  for (const item of missing) {
    if (remaining <= 0) break;
    const take = Math.min(item.available, remaining);
    path.push({ label: item.label, points: take, action: item.action });
    remaining -= take;
  }

  return path;
}

function buildTimeline(
  profileCreatedAt: string,
  firstSkillAt: string | null,
  idApprovedAt: string | null,
  sessions: { created_at: string; duration_hours: number }[],
  vouches: { created_at: string; voucher_name?: string }[],
  currentTier: number,
  currentScore: number
): TrustTimelineEvent[] {
  const events: TrustTimelineEvent[] = [];

  // Joined
  events.push({
    id: 'joined',
    date: profileCreatedAt,
    title: 'Joined FightClub',
    description: 'Started the trust journey as an Explorer.',
    icon: 'join',
  });

  // First skill
  if (firstSkillAt) {
    events.push({
      id: 'first-skill',
      date: firstSkillAt,
      title: 'Listed first skill',
      description: 'Shared something they can teach the community.',
      icon: 'skill',
    });
  }

  // ID approved
  if (idApprovedAt) {
    events.push({
      id: 'id-approved',
      date: idApprovedAt,
      title: 'Government ID verified',
      description: 'Identity confirmed. +10 trust points.',
      points: 10,
      icon: 'verify',
    });
  }

  // First session
  const firstSession = sessions[0];
  if (firstSession) {
    events.push({
      id: 'first-session',
      date: firstSession.created_at,
      title: 'First teaching session',
      description: `Completed a ${firstSession.duration_hours}h session.`,
      points: Math.min(Math.floor(firstSession.duration_hours * 10), 40),
      icon: 'session',
    });
  }

  // First vouch
  const firstVouch = vouches[0];
  if (firstVouch) {
    events.push({
      id: 'first-vouch',
      date: firstVouch.created_at,
      title: 'Received first vouch',
      description: firstVouch.voucher_name
        ? `Endorsed by ${firstVouch.voucher_name}.`
        : 'Endorsed by a community member.',
      points: 5,
      icon: 'vouch',
    });
  }

  // Tier milestones
  const tierThresholds = [
    { tier: 1, score: 20, label: 'Member' },
    { tier: 2, score: 50, label: 'Verified' },
    { tier: 3, score: 75, label: 'Teacher' },
    { tier: 4, score: 100, label: 'Connector' },
  ];

  for (const t of tierThresholds) {
    if (currentTier >= t.tier && currentScore >= t.score) {
      // Approximate: use the most recent event before tier upgrade as the date
      // This is a simplification; ideally we'd store tier upgrade dates
      const approxDate = sessions.length > 0
        ? sessions[sessions.length - 1].created_at
        : firstSkillAt ?? idApprovedAt ?? profileCreatedAt;
      events.push({
        id: `tier-${t.tier}`,
        date: approxDate,
        title: `Reached ${t.label}`,
        description: `Trust score hit ${t.score} points.`,
        icon: 'tier',
      });
    }
  }

  // Sort by date ascending
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return events;
}

export function useTrustReport(userId: string | undefined) {
  return useQuery<TrustReport | null>({
    queryKey: userId ? ['trust-report', userId] : ['trust-report', '__disabled__'],
    queryFn: async () => {
      if (!userId) return null;

      const [
        profileRes,
        sessionsRes,
        vouchesRes,
        streakRes,
        skillsRes,
        idRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at, avatar_url, bio, phone_verified, id_verified, trust_score, trust_tier')
          .eq('id', userId)
          .single(),
        supabase
          .from('session_ledger')
          .select('created_at, duration_hours')
          .eq('teacher_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('vouches')
          .select('created_at, voucher:profiles!vouches_voucher_id_fkey(first_name, last_name)')
          .eq('recipient_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('club_member_points')
          .select('streak_days')
          .eq('user_id', userId)
          .order('streak_days', { ascending: false })
          .limit(1),
        supabase
          .from('skills')
          .select('created_at')
          .eq('teacher_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1),
        supabase
          .from('id_verification_requests')
          .select('created_at')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .order('created_at', { ascending: true })
          .limit(1),
      ]);

      if (profileRes.error || !profileRes.data) return null;

      const profile = profileRes.data;
      const sessions = (sessionsRes.data ?? []) as { created_at: string; duration_hours: number }[];
      const vouchesRaw = (vouchesRes.data ?? []) as { created_at: string; voucher: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null }[];
      const streak = streakRes.data?.[0]?.streak_days ?? 0;
      const firstSkill = skillsRes.data?.[0]?.created_at ?? null;
      const idApproved = idRes.data?.[0]?.created_at ?? null;

      const sessionHours = sessions.reduce(
        (sum, s) => sum + Math.min(s.duration_hours, 4),
        0
      );
      const vouchCount = vouchesRaw.length;

      const vouches = vouchesRaw.map((v) => {
        const voucher = Array.isArray(v.voucher) ? v.voucher[0] : v.voucher;
        return {
          created_at: v.created_at,
          voucher_name: voucher ? `${voucher.first_name} ${voucher.last_name}` : undefined,
        };
      });

      const breakdown = computeBreakdown(
        profile.avatar_url,
        profile.bio,
        profile.phone_verified ?? false,
        profile.id_verified ?? false,
        sessionHours,
        vouchCount,
        streak
      );

      const score = breakdown.reduce((sum, b) => sum + b.points, 0);
      const tier = profile.trust_tier ?? 0;

      const thresholds = [0, 20, 50, 75, 100];
      const nextTier = tier < 4 ? tier + 1 : null;
      const nextThreshold = nextTier !== null ? thresholds[nextTier] : null;
      const pointsToNext = nextThreshold !== null ? Math.max(nextThreshold - score, 0) : 0;

      const fastestPath = computeFastestPath(breakdown, pointsToNext);

      const timeline = buildTimeline(
        profile.created_at,
        firstSkill,
        idApproved,
        sessions,
        vouches,
        tier,
        score
      );

      return {
        score,
        tier,
        breakdown,
        nextTier,
        nextThreshold,
        pointsToNext,
        fastestPath,
        timeline,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
