/**
 * useClubActions
 *
 * Central evaluation matrix for all club-related button logic.
 *
 * Evaluation: [Auth State] + [Context Role] + [Entity Status] -> Action & UI Result
 *
 * joinState values:
 *   'visitor'    – not logged in
 *   'not-member' – logged in, no membership or request
 *   'pending'    – join request submitted, awaiting mod approval
 *   'active'     – confirmed member (role: 'member')
 *   'moderator'  – confirmed member with elevated role
 *   'admin'      – confirmed member with full control
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Club, ClubMembership, ClubBan, ClubMute } from '@/types/clubs';

export type JoinState =
  | 'visitor'
  | 'not-member'
  | 'pending'
  | 'active'
  | 'moderator'
  | 'admin';

export interface ClubActionsResult {
  /** Resolved join state based on the evaluation matrix */
  joinState: JoinState;
  /** Whether the current user can post in the club feed */
  canPost: boolean;
  /** Whether the current user can moderate (pin, delete, mute) */
  canModerate: boolean;
  /** Whether the current user can start a live room (mod+admin + trust tier >= 2) */
  canStartRoom: boolean;
  /** Whether the current user should see "Request a Room" (member, no active rooms) */
  canRequestRoom: boolean;
  /** Whether the current user can complete quest steps */
  canCompleteSteps: boolean;
  /** Whether the current user can create quests/events (mod+admin + trust tier >= 2) */
  canCreateQuestsEvents: boolean;
  /** Whether the current user can promote to moderator (admin + trust tier >= 3) */
  canPromoteModerator: boolean;
  /** Whether the current user can promote to admin (admin + trust tier >= 4) */
  canPromoteAdmin: boolean;
  /** Whether the current user can mute members (mod + trust tier >= 2) */
  canMute: boolean;
  /** Whether the current user can ban members (admin + trust tier >= 3) */
  canBan: boolean;
  /** Whether the current user is banned from this club */
  isBanned: boolean;
  /** Whether the current user is muted in this club */
  isMuted: boolean;

  // ── Actions ──
  handleJoin: () => Promise<void>;
  handleLeave: () => Promise<void>;
  /**
   * Request a live room — notifies all club moderators/admins.
   * Used by normal members who cannot start rooms themselves.
   */
  handleRequestRoom: (clubId: string, roomHint?: string) => Promise<void>;
  /**
   * Cancel a pending join request.
   */
  handleCancelRequest: (clubId: string) => Promise<void>;
  /**
   * Ban a member from the club. Sets membership to 'banned', creates ban record.
   */
  handleBan: (targetUserId: string, reason?: string, expiresInDays?: number) => Promise<void>;
  /**
   * Mute a member in the club. Prevents posting while muted.
   */
  handleMute: (targetUserId: string, reason?: string, expiresInDays?: number) => Promise<void>;
  /**
   * Unmute a member. Removes the mute record; does not restore posting ability.
   */
  handleUnmute: (targetUserId: string) => Promise<void>;
}

interface UseClubActionsOptions {
  club: Club | null;
  membership: ClubMembership | null;
  userId: string | undefined;
  trustTier: number | undefined;
  /** Optional active bans for the current club — pass to hydrate isBanned without extra query */
  activeBans?: ClubBan[];
  /** Optional active mutes for the current club — pass to hydrate isMuted without extra query */
  activeMutes?: ClubMute[];
  joinRequestPending: boolean;
  hasActiveRoom: boolean;
  onMembershipChange?: (m: ClubMembership | null) => void;
  onClubCountChange?: (delta: number) => void;
  onJoinRequestChange?: (pending: boolean) => void;
}

export function useClubActions({
  club,
  membership,
  userId,
  trustTier,
  activeBans,
  activeMutes,
  joinRequestPending,
  hasActiveRoom,
  onMembershipChange,
  onClubCountChange,
  onJoinRequestChange,
}: UseClubActionsOptions): ClubActionsResult {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // ── Derive join state ──────────────────────────────────────
  const joinState: JoinState = (() => {
    if (!userId) return 'visitor';
    if (!membership) return joinRequestPending ? 'pending' : 'not-member';
    if (membership.status === 'pending') return 'pending';
    if (membership.role === 'admin') return 'admin';
    if (membership.role === 'moderator') return 'moderator';
    return 'active';
  })();

  // ── Derived capabilities ──────────────────────────────────
  const isActiveMember  = joinState === 'active' || joinState === 'moderator' || joinState === 'admin';
  const canPost          = isActiveMember;
  const canModerate      = joinState === 'moderator' || joinState === 'admin';
  const canStartRoom     = canModerate && (trustTier ?? 0) >= 2;
  const canRequestRoom   = isActiveMember && !canStartRoom && !hasActiveRoom;
  const canCompleteSteps = isActiveMember;

  // ── Trust tier-gated capabilities ──────────────────────────────
  // Create quests/events: mod+admin + trust tier >= 2
  const canCreateQuestsEvents = canModerate && (trustTier ?? 0) >= 2;
  // Promote to moderator: admin + trust tier >= 3
  const canPromoteModerator = (joinState === 'admin') && (trustTier ?? 0) >= 3;
  // Promote to admin: admin + trust tier >= 4
  const canPromoteAdmin = (joinState === 'admin') && (trustTier ?? 0) >= 4;
  // Mute members: mod+admin + trust tier >= 2
  const canMute = canModerate && (trustTier ?? 0) >= 2;
  // Ban members: admin + trust tier >= 3
  const canBan = (joinState === 'admin') && (trustTier ?? 0) >= 3;

  // ── Ban/mute status ──────────────────────────────────────────────
  const isBanned = membership?.status === 'banned' || !!(activeBans?.some(b => b.user_id === userId));
  const isMuted  = !!(activeMutes?.some(m => m.user_id === userId));

  // ── handleJoin ────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    // Visitor → redirect to signup (auth wall)
    if (!userId || !club) {
      navigate('/signup');
      return;
    }
    if (busy) return;
    setBusy(true);

    if (club.is_private) {
      // Check for an existing request (any status) first
      const { data: existing } = await supabase
        .from('join_requests')
        .select('id, status')
        .eq('club_id', club.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing?.status === 'pending') {
        toast.info('You already have a pending request for this club.');
        onJoinRequestChange?.(true);
        setBusy(false);
        return;
      }

      // If a previous (denied/rejected) request exists → update it back to pending
      // Otherwise → fresh insert
      const { error } = existing
        ? await supabase
            .from('join_requests')
            .update({ status: 'pending' })
            .eq('id', existing.id)
        : await supabase
            .from('join_requests')
            .insert({ club_id: club.id, user_id: userId, status: 'pending' });

      if (error) {
        toast.error('Could not send request. Please try again.');
      } else {
        toast.success('Request sent! A moderator will review it soon.');
        onMembershipChange?.(null);
        onJoinRequestChange?.(true); // flip button to "Pending…"

        // Notify moderators — fire and forget, never block the join flow
        supabase
          .from('club_memberships')
          .select('user_id')
          .eq('club_id', club.id)
          .in('role', ['moderator', 'admin'])
          .eq('status', 'active')
          .then(({ data: mods }) => {
            if (mods && mods.length > 0) {
              supabase.from('notifications').insert(
                mods.map(m => ({
                  user_id: m.user_id,
                  type: 'join_request',
                  title: 'New join request',
                  body: `Someone wants to join ${club.name}`,
                  link: `/club/${club.slug ?? club.id}`,
                  actor_id: userId,
                }))
              );
            }
          });
      }
    } else {
      // Public club → immediate join
      const { data, error } = await supabase
        .from('club_memberships')
        .insert({ club_id: club.id, user_id: userId, role: 'member', status: 'active' })
        .select('*')
        .single();

      if (error) {
        toast.error('Could not join club. Please try again.');
      } else {
        toast.success(`You joined ${club.name}!`);
        onMembershipChange?.(data);
        onClubCountChange?.(1);
      }
    }

    setBusy(false);
  }, [userId, club, busy, navigate, onMembershipChange, onJoinRequestChange, onClubCountChange]);

  // ── handleLeave ───────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    if (!userId || !club || !membership) return;
    if (busy) return;
    setBusy(true);

    const { error } = await supabase
      .from('club_memberships')
      .delete()
      .eq('id', membership.id);

    if (error) {
      toast.error('Could not leave club.');
    } else {
      toast('You left the club.');
      onMembershipChange?.(null);
      onClubCountChange?.(-1);
    }
    setBusy(false);
  }, [userId, club, membership, busy, onMembershipChange, onClubCountChange]);

  // ── handleCancelRequest ───────────────────────────────────
  const handleCancelRequest = useCallback(async (clubId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('join_requests')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);
    if (error) {
      toast.error('Could not cancel request.');
      return;
    }
    toast('Request withdrawn.');
    onMembershipChange?.(null);
    onJoinRequestChange?.(false); // flip button back to "Request to Join"
  }, [userId, onMembershipChange, onJoinRequestChange]);

  // ── handleRequestRoom ─────────────────────────────────────
  const handleRequestRoom = useCallback(async (clubId: string, roomHint = '') => {
    if (!userId) return;

    const requestPayload = {
      club_id: clubId,
      request_type: 'room',
      requested_by: userId,
      title: roomHint.trim() ? `Room request: ${roomHint.trim()}` : 'Room request',
      details: roomHint.trim() || null,
      context: roomHint.trim() ? { topic_hint: roomHint.trim() } : {},
    };

    // Persist request in unified inbox (new migration). If the table is missing,
    // continue with legacy notifications so the action still works.
    const { error: requestError } = await supabase
      .from('club_requests')
      .insert(requestPayload);

    if (requestError && requestError.code !== '42P01') {
      toast.error('Could not submit room request.');
      return;
    }

    // Fetch mods/admins to notify
    const { data: mods } = await supabase
      .from('club_memberships')
      .select('user_id')
      .eq('club_id', clubId)
      .in('role', ['moderator', 'admin'])
      .eq('status', 'active');

    if (!mods || mods.length === 0) {
      toast.info('No moderators found to notify.');
      return;
    }

    await supabase.from('notifications').insert(
      mods.map(m => ({
        user_id: m.user_id,
        type: 'room_request',
        title: 'Room requested',
        body: roomHint
          ? `A member wants to start a room: "${roomHint}"`
          : 'A member is requesting a live voice room.',
        link: `/club/${club?.slug ?? clubId}`,
        actor_id: userId,
      }))
    );
    // Caller is responsible for showing the tooltip confirmation
  }, [userId, club]);

  // ── handleBan ────────────────────────────────────────────────
  const handleBan = useCallback(async (
    targetUserId: string,
    reason?: string,
    expiresInDays?: number,
  ) => {
    if (!userId || !club || !canBan) return;
    if (busy) return;
    setBusy(true);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString()
      : null;

    const [, banError] = await Promise.all([
      supabase
        .from('club_memberships')
        .update({ status: 'banned' })
        .eq('club_id', club.id)
        .eq('user_id', targetUserId)
        .eq('status', 'active'),
      supabase
        .from('club_bans')
        .upsert({
          club_id: club.id,
          user_id: targetUserId,
          reason: reason || null,
          banned_by: userId,
          expires_at: expiresAt,
        }),
    ]);

    if (banError) {
      toast.error('Could not ban member. Please try again.');
    } else {
      toast.success('Member has been banned from this club.');
      if (targetUserId === userId) {
        onMembershipChange?.(null);
        navigate('/');
      }
    }
    setBusy(false);
  }, [userId, club, canBan, busy, navigate, onMembershipChange]);

  // ── handleMute ────────────────────────────────────────────────
  const handleMute = useCallback(async (
    targetUserId: string,
    reason?: string,
    expiresInDays?: number,
  ) => {
    if (!userId || !club || !canMute) return;
    if (busy) return;
    setBusy(true);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString()
      : null;

    const { error } = await supabase
      .from('club_mutes')
      .upsert({
        club_id: club.id,
        user_id: targetUserId,
        reason: reason || null,
        muted_by: userId,
        expires_at: expiresAt,
      });

    if (error) {
      toast.error('Could not mute member.');
    } else {
      toast.success('Member has been muted.');
    }
    setBusy(false);
  }, [userId, club, canMute, busy]);

  // ── handleUnmute ─────────────────────────────────────────
  const handleUnmute = useCallback(async (targetUserId: string) => {
    if (!userId || !club || !canMute) return;

    const { error } = await supabase
      .from('club_mutes')
      .delete()
      .eq('club_id', club.id)
      .eq('user_id', targetUserId);

    if (error) {
      toast.error('Could not unmute member.');
    } else {
      toast.success('Member unmuted.');
    }
  }, [userId, club, canMute]);

  return {
    joinState,
    canPost,
    canModerate,
    canStartRoom,
    canRequestRoom,
    canCompleteSteps,
    canCreateQuestsEvents,
    canPromoteModerator,
    canPromoteAdmin,
    canMute,
    canBan,
    isBanned,
    isMuted,
    handleJoin,
    handleLeave,
    handleCancelRequest,
    handleRequestRoom,
    handleBan,
    handleMute,
    handleUnmute,
  };
}
