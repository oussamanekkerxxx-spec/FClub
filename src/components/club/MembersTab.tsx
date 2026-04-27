import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EmptyState from './EmptyState';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ClubMembership } from '@/types/fightclub';
import { useLazyQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { MapPin, Shield, UserMinus, Mail, MoreHorizontal, Ban, BellOff, BellRing, Users } from 'lucide-react';
import MemberGate from './MemberGate';

interface MembersTabProps {
  clubId: string;
  isMember: boolean;
  isPrivate: boolean;
  isAdmin: boolean;
  currentUserId: string | undefined;
  canPromoteModerator?: boolean;
  canPromoteAdmin?: boolean;
  canMute?: boolean;
  canBan?: boolean;
  handleBan?: (targetUserId: string, reason?: string, days?: number) => Promise<void>;
  handleMute?: (targetUserId: string, reason?: string, days?: number) => Promise<void>;
  handleUnmute?: (targetUserId: string) => Promise<void>;
  onMemberRemoved: () => void;
}

export default function MembersTab({
  clubId, isMember, isPrivate, isAdmin, currentUserId,
  canPromoteModerator = false, canPromoteAdmin = false,
  canMute = false, canBan = false,
  handleBan, handleMute, handleUnmute,
  onMemberRemoved,
}: MembersTabProps) {
  const navigate = useNavigate();
  const [mutedUserIds, setMutedUserIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: members, loading, setData: setMembers } = useLazyQuery<ClubMembership>(
    queryKeys.clubs.members(clubId),
    () => supabase
      .from('club_memberships')
      .select('*, profile:profiles!club_memberships_user_id_fkey(id, first_name, last_name, avatar_url, trust_tier, city)')
      .eq('club_id', clubId).eq('status', 'active').order('role').limit(50),
    isMember && !!clubId,
    { errorMessage: 'Failed to load members' }
  );

  const handleChangeMemberRole = async (membershipId: string, newRole: 'member' | 'moderator') => {
    const { error } = await supabase
      .from('club_memberships').update({ role: newRole }).eq('id', membershipId);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === membershipId ? { ...m, role: newRole } : m));
      toast.success(`Role updated to ${newRole}.`);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    await supabase.from('club_memberships').delete().eq('id', membershipId);
    setMembers(prev => prev.filter(m => m.id !== membershipId));
    onMemberRemoved();
    toast('Member removed.');
  };

  const handleToggleMute = async (userId: string) => {
    if (!handleMute || !handleUnmute) return;
    setProcessingId(userId);
    try {
      if (mutedUserIds.has(userId)) {
        await handleUnmute(userId);
        setMutedUserIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
      } else {
        await handleMute(userId);
        setMutedUserIds(prev => new Set(prev).add(userId));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleBanMember = async (userId: string) => {
    if (!handleBan) return;
    setProcessingId(userId);
    try {
      await handleBan(userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      onMemberRemoved();
    } finally {
      setProcessingId(null);
    }
  };

  const showOverflow = isAdmin && (
    canPromoteModerator || canPromoteAdmin || canMute || canBan || currentUserId !== undefined
  );

  if (!isMember) return <MemberGate isPrivate={isPrivate} />;

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="sc-card p-4 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-2 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return <EmptyState icon={<Users className="w-6 h-6 text-[var(--color-text-muted)]" />} title="No members yet" />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {members.map(m => (
        <div key={m.id} className="sc-card p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Link to={`/app/member/${m.user_id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '13px' }}>
                  {m.profile?.first_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">
                  {m.profile?.first_name} {m.profile?.last_name}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {m.role !== 'member' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={m.role === 'admin' ? { background: '#FFF3E0', color: 'var(--color-amber)' } : { background: '#E8EFF5', color: 'var(--color-navy)' }}>
                      {m.role}
                    </span>
                  )}
                  {mutedUserIds.has(m.user_id) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      muted
                    </span>
                  )}
                  {m.profile?.city && (
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {m.profile.city}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            {showOverflow && m.user_id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)] transition-colors flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canPromoteModerator && m.role !== 'admin' && (
                    <DropdownMenuItem onClick={() => handleChangeMemberRole(m.id, 'moderator')}>
                      <Shield className="w-4 h-4" /> Promote to moderator
                    </DropdownMenuItem>
                  )}
                  {canPromoteAdmin && m.role === 'moderator' && (
                    <DropdownMenuItem onClick={() => handleChangeMemberRole(m.id, 'admin')}>
                      <Shield className="w-4 h-4 fill-current" /> Promote to admin
                    </DropdownMenuItem>
                  )}
                  {canMute && (
                    <DropdownMenuItem
                      onClick={() => handleToggleMute(m.user_id)}
                      disabled={processingId === m.user_id}>
                      {mutedUserIds.has(m.user_id) ? (
                        <><BellRing className="w-4 h-4" /> Unmute</>
                      ) : (
                        <><BellOff className="w-4 h-4" /> Mute member</>
                      )}
                    </DropdownMenuItem>
                  )}
                  {canBan && m.role !== 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleBanMember(m.user_id)}
                        disabled={processingId === m.user_id}
                        className="text-red-600">
                        <Ban className="w-4 h-4" /> Ban from club
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRemoveMember(m.id)} className="text-red-500">
                    <UserMinus className="w-4 h-4" /> Remove from club
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(m.profile as (typeof m.profile & { what_i_teach?: string[] }))?.what_i_teach?.slice(0, 3).map((skill: string) => (
              <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                {skill}
              </span>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              {m.user_id !== currentUserId && (
                <button onClick={() => navigate(`/app/messages?to=${m.user_id}`)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
                  title="Message this member">
                  <Mail className="w-3 h-3" /> Message
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}