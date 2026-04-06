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
import type { Club, ClubMembership } from '@/types/fightclub';

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
  /** Whether the current user can start a live room */
  canStartRoom: boolean;
  /** Whether the current user should see "Request a Room" (member, no active rooms) */
  canRequestRoom: boolean;
  /** Whether the current user can complete quest steps */
  canCompleteSteps: boolean;

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
}

interface UseClubActionsOptions {
  club: Club | null;
  membership: ClubMembership | null;
  userId: string | undefined;
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
  const canStartRoom     = canModerate;
  const canRequestRoom   = isActiveMember && !canStartRoom && !hasActiveRoom;
  const canCompleteSteps = isActiveMember;

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
  }, [userId, club, busy, navigate, onMembershipChange, onClubCountChange]);

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

  return {
    joinState,
    canPost,
    canModerate,
    canStartRoom,
    canRequestRoom,
    canCompleteSteps,
    handleJoin,
    handleLeave,
    handleCancelRequest,
    handleRequestRoom,
  };
}
