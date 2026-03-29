import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';

interface Props {
  className?: string;
}

export default function JoinCTA({ className }: Props) {
  const [counts, setCounts] = useState({ skills: 0, members: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('skills').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([skillsRes, profilesRes]) => {
      setCounts({
        skills: skillsRes.count || 0,
        members: profilesRes.count || 0,
      });
    });
  }, []);

  return (
    <section className={`py-20 px-6 ${className || ''}`} style={{ background: 'var(--color-navy)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-heading text-3xl text-white mb-4">
          Your next skill is one conversation away.
        </h2>
        <p className="font-body text-white/60 text-lg mb-6">
          Join {counts.members > 0 ? `${counts.members}+` : 'a growing'} members sharing{' '}
          {counts.skills > 0 ? `${counts.skills}+` : ''} skills across Morocco.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-heading font-semibold text-navy transition-all hover:scale-105"
          style={{ background: 'var(--color-amber)', color: 'white' }}
        >
          Enter the Ring
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-4 text-white/40 text-sm font-body">
          Free to join. No credit card needed.
        </p>
      </div>
    </section>
  );
}
