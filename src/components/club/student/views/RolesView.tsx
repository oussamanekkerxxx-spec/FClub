import { useEffect, useState } from 'react';
import { Shield, Crown, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';

interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
}

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; border: string; dot: string; perms: string[] }> = {
  admin: {
    icon: <Crown className="w-4 h-4" />,
    label: 'Admin',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    perms: ['Manage Members', 'Edit Club', 'Delete Posts', 'Assign Roles'],
  },
  moderator: {
    icon: <Shield className="w-4 h-4" />,
    label: 'Moderator',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    perms: ['Pin Messages', 'Remove Members', 'Review Join Requests'],
  },
  member: {
    icon: <GraduationCap className="w-4 h-4" />,
    label: 'Student',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
    perms: ['View All Content', 'Post in Chat', 'Attend Events', 'Earn XP'],
  },
};

export function RolesView({ clubId }: { clubId: string }) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('club_memberships')
        .select('role, profile:profiles!club_memberships_user_id_fkey(id, first_name, last_name, avatar_url)')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('role');
      if (!cancelled) {
        const mapped = (data ?? []).map((row: any) => {
          const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
          return {
            id: profile?.id ?? row.user_id ?? '',
            first_name: profile?.first_name ?? 'User',
            last_name: profile?.last_name ?? '',
            avatar_url: profile?.avatar_url ?? null,
            role: row.role ?? 'member',
          };
        });
        setMembers(mapped);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clubId]);

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (!members.length) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Shield className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No members yet"
          subtitle="Member roles will appear here once people join the club."
        />
      </div>
    );
  }

  const byRole: Record<string, MemberProfile[]> = {};
  for (const m of members) {
    byRole[m.role] = byRole[m.role] ?? [];
    byRole[m.role].push(m);
  }

  const roles = ['admin', 'moderator', 'member'];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((roleKey) => {
          const list = byRole[roleKey] ?? [];
          if (!list.length) return null;
          const meta = ROLE_META[roleKey] ?? ROLE_META.member;
          return (
            <div key={roleKey} className={`bg-white border ${meta.border} rounded-2xl p-5 hover:shadow-sm transition-all`}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center text-[18px] ${meta.color}`}>{meta.icon}</span>
                <div>
                  <div className={`text-[14px] font-black ${meta.color}`}>{meta.label}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{list.length} member{list.length !== 1 ? 's' : ''}</div>
                </div>
                <span className={`ml-auto w-2 h-2 rounded-full ${meta.dot}`} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {meta.perms.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-parchment rounded-md text-[9px] font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)]">{p}</span>
                ))}
              </div>
              <div className="flex -space-x-2 overflow-hidden">
                {list.slice(0, 8).map((m) => (
                  <div key={m.id} className="inline-block w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 overflow-hidden" title={`${m.first_name} ${m.last_name}`}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      `${m.first_name[0] ?? ''}${m.last_name[0] ?? ''}`
                    )}
                  </div>
                ))}
                {list.length > 8 && (
                  <div className="inline-block w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">+{list.length - 8}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
