import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ClubMembership } from '@/types/fightclub';
import { useLazyQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { MapPin, Shield, UserMinus, Mail } from 'lucide-react';
import MemberGate from './MemberGate';

interface MembersTabProps {
  clubId: string;
  isMember: boolean;
  isPrivate: boolean;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onMemberRemoved: () => void;
}

export default function MembersTab({
  clubId, isMember, isPrivate, isAdmin, currentUserId, onMemberRemoved,
}: MembersTabProps) {
  const navigate = useNavigate();

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
    return <div className="sc-card p-10 text-center text-sm text-[var(--color-text-secondary)]">No members yet.</div>;
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
                  {m.profile?.city && (
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {m.profile.city}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            {isAdmin && m.user_id !== currentUserId && m.role !== 'admin' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {m.role === 'member' ? (
                  <button onClick={() => handleChangeMemberRole(m.id, 'moderator')} title="Promote to moderator"
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-[var(--color-text-muted)] hover:text-blue-600 transition-colors">
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => handleChangeMemberRole(m.id, 'member')} title="Remove moderator role"
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-[var(--color-amber)] hover:text-amber-700 transition-colors">
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => handleRemoveMember(m.id)} title="Remove from club"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
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
