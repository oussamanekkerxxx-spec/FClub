import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Shield, Users, BookOpen, Clock, Check, X, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  trust_tier: number;
  trust_score: number;
  what_i_teach: string[];
  created_at: string;
}

interface PendingVerification {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pending, setPending] = useState<PendingVerification[]>([]);
  const [skillCount, setSkillCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (user?.role !== 'admin') {
    return <Navigate to="/app/feed" replace />;
  }

  useEffect(() => {
    async function fetchAdminData() {
      const [membersRes, skillsRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, avatar_url, trust_tier, trust_score, what_i_teach, created_at').order('created_at', { ascending: false }),
        supabase.from('skills').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('id, first_name, last_name, avatar_url, created_at').eq('id_verified', false).eq('trust_tier', 0),
      ]);

      if (membersRes.data) setMembers(membersRes.data as MemberRow[]);
      if (skillsRes.count !== null) setSkillCount(skillsRes.count);
      if (pendingRes.data) setPending(pendingRes.data as PendingVerification[]);
      setIsLoading(false);
    }
    fetchAdminData();
  }, []);

  const verifiedCount = members.filter((m) => m.trust_tier >= 2).length;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-parchment-dark rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-navy">Admin Dashboard</h1>
        <p className="font-body text-[var(--color-text-secondary)] mt-1 text-sm">
          Marrakesh · Live data
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: '#5C3D8F', bg: '#EDE8F7' },
          { label: 'Verified Members', value: verifiedCount, icon: Shield, color: '#2D7A4F', bg: '#E8F5EE' },
          { label: 'Active Skills', value: skillCount, icon: BookOpen, color: '#C4873A', bg: '#FFF3E0' },
          { label: 'Pending Verifications', value: pending.length, icon: Clock, color: '#1B2A4A', bg: '#EAF0FF' },
        ].map((stat) => (
          <div key={stat.label} className="sc-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="font-bold font-heading text-xl text-navy">{stat.value}</div>
                <div className="text-[11px] font-body text-[var(--color-text-muted)]">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending ID Verifications */}
      <div className="sc-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
          <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>Pending Verifications</h3>
        </div>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((pv) => (
              <div key={pv.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={pv.avatar_url ?? undefined} />
                  <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                    {pv.first_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-body text-sm text-navy">
                    {pv.first_name} {pv.last_name}
                  </div>
                  <div className="text-[11px] font-body text-[var(--color-text-muted)]">
                    ID Document · Submitted {new Date(pv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-body text-white" style={{ background: 'var(--color-forest)' }}>
                    <Check className="w-3 h-3" /> Approve
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-body" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Check className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-forest)' }} />
            <p className="font-body text-sm text-[var(--color-text-secondary)]">All caught up! No pending verifications.</p>
          </div>
        )}
      </div>

      {/* All Members */}
      <div className="sc-card p-5">
        <h3 className="font-heading text-navy mb-4" style={{ fontSize: '1.05rem' }}>All Members</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-parchment transition-colors">
              <Avatar className="w-9 h-9">
                <AvatarImage src={member.avatar_url ?? undefined} />
                <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}>
                  {member.first_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold font-body text-navy text-sm">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-[11px] font-body text-[var(--color-text-muted)]">
                  {(member.what_i_teach ?? []).slice(0, 2).join(', ')} · Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.trust_score > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                    <span className="text-xs font-bold font-body text-navy">{member.trust_score}</span>
                  </div>
                )}
                <span
                  className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full"
                  style={
                    member.trust_tier >= 2
                      ? { background: '#E8F5EE', color: '#2D7A4F' }
                      : { background: '#EDF2FF', color: '#4C6EF5' }
                  }
                >
                  Tier {member.trust_tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
