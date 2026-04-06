import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Users, Flame, Mic2 } from 'lucide-react';

interface Props {
  className?: string;
}

export default function JoinCTA({ className }: Props) {
  const [counts, setCounts] = useState({ clubs: 0, members: 0, rooms: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('voice_rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]).then(([clubsRes, profilesRes, roomsRes]) => {
      setCounts({
        clubs:   clubsRes.count   ?? 0,
        members: profilesRes.count ?? 0,
        rooms:   roomsRes.count   ?? 0,
      });
    });
  }, []);

  const STATS = [
    { icon: Flame,  label: 'clubs',   value: counts.clubs   > 0 ? `${counts.clubs}+`   : '10+' },
    { icon: Users,  label: 'members', value: counts.members > 0 ? `${counts.members}+` : '100+' },
    { icon: Mic2,   label: 'live rooms today', value: counts.rooms > 0 ? String(counts.rooms) : '0' },
  ];

  return (
    <section
      className={`py-20 px-6 ${className ?? ''}`}
      style={{ background: 'var(--color-navy)' }}
    >
      <div className="max-w-2xl mx-auto text-center">

        <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-amber)' }}>
          Join FightClub
        </div>

        <h2 className="font-heading text-3xl sm:text-4xl text-white mb-4 leading-tight">
          Your people are already here.
          <br />
          <span style={{ color: 'var(--color-amber)' }}>Find them today.</span>
        </h2>

        <p className="font-body text-white/60 text-lg mb-8 max-w-lg mx-auto">
          Clubs for every interest, quests for every goal, and a community that grows with you.
        </p>

        {/* Live stats */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-amber)' }} />
                <span className="font-heading font-bold text-white text-lg">{value}</span>
              </div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
          ))}
        </div>

        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-heading font-semibold transition-all hover:scale-105"
          style={{ background: 'var(--color-amber)', color: 'white' }}
        >
          Find Your People
          <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="mt-4 text-white/30 text-sm font-body">
          Free to join. No credit card needed.
        </p>
      </div>
    </section>
  );
}
