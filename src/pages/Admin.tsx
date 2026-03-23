import { members, skills } from '@/data/mockData';
import { Shield, Users, BookOpen, Clock, Check, X, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PENDING_VERIFICATIONS = [
  { id: 'pv-1', member: members[7], submitted: '2026-03-10T10:00:00Z', type: 'ID Document' },
];

export default function Admin() {
  const totalMembers = members.length;
  const verifiedMembers = members.filter((m) => m.trust_tier >= 2).length;
  const activeSkills = skills.filter((s) => s.status === 'active').length;
  const pendingVerifications = PENDING_VERIFICATIONS.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-navy">Admin Dashboard</h1>
        <p className="font-body text-[var(--color-text-secondary)] mt-1 text-sm">
          Marrakesh · Phase 1 Seed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers, icon: Users, color: '#5C3D8F', bg: '#EDE8F7' },
          { label: 'Verified Members', value: verifiedMembers, icon: Shield, color: '#2D7A4F', bg: '#E8F5EE' },
          { label: 'Active Skills', value: activeSkills, icon: BookOpen, color: '#C4873A', bg: '#FFF3E0' },
          { label: 'Pending Verifications', value: pendingVerifications, icon: Clock, color: '#1B2A4A', bg: '#EAF0FF' },
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
        {PENDING_VERIFICATIONS.length > 0 ? (
          <div className="space-y-3">
            {PENDING_VERIFICATIONS.map((pv) => (
              <div key={pv.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={pv.member.avatar} />
                  <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                    {pv.member.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-body text-sm text-navy">
                    {pv.member.firstName} {pv.member.lastName}
                  </div>
                  <div className="text-[11px] font-body text-[var(--color-text-muted)]">
                    {pv.type} · Submitted {new Date(pv.submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                <AvatarImage src={member.avatar} />
                <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}>
                  {member.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold font-body text-navy text-sm">
                  {member.firstName} {member.lastName}
                </div>
                <div className="text-[11px] font-body text-[var(--color-text-muted)]">
                  {member.what_i_teach.slice(0, 2).join(', ')} · Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
