import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Star, Sparkles } from 'lucide-react';

export default function Welcome() {
  const { user } = useAuth();
  const [matchedSkills, setMatchedSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.what_i_learn || user.what_i_learn.length === 0) {
      setLoading(false);
      return;
    }

    // Map aspiration IDs to skill categories
    const categoryMap: Record<string, string> = {
      music: 'music',
      cook: 'cooking',
      language: 'languages',
      move: 'fitness',
      create: 'art',
      tech: 'technology',
      photo: 'photography',
      write: 'writing',
    };
    const cats = user.what_i_learn
      .map((id: string) => categoryMap[id] || id)
      .filter(Boolean);

    supabase
      .from('skills')
      .select('*, profiles!skills_teacher_id_fkey(id, first_name, last_name, avatar_url)')
      .eq('is_active', true)
      .in('category', cats)
      .limit(3)
      .then(({ data }) => {
        if (data) {
          setMatchedSkills(data.map((s: any) => ({
            ...s,
            teacher: {
              firstName: s.profiles?.first_name || '',
              lastName: s.profiles?.last_name || '',
              avatar: s.profiles?.avatar_url || '',
            },
            slug: s.slug || s.id,
            cover_gradient: s.cover_gradient || 'from-blue-500 to-purple-600',
          })));
        }
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="max-w-xl mx-auto text-center py-12 px-6 space-y-8">
      <div>
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ background: '#FFF3E0' }}>
          <Sparkles className="w-8 h-8" style={{ color: 'var(--color-amber)' }} />
        </div>
        <h1 className="font-heading text-2xl text-navy mb-2">
          Welcome to SKILLCLUB, {user?.firstName}. ✦
        </h1>
        <p className="font-body text-[var(--color-text-secondary)]">
          {matchedSkills.length > 0
            ? "Based on what you want to learn, here are some skills we think you'll love."
            : "Your journey starts here. Let's find your first skill."
          }
        </p>
      </div>

      {/* Matched Skills */}
      {!loading && matchedSkills.length > 0 && (
        <div className="space-y-3 text-left">
          {matchedSkills.map((skill) => (
            <Link
              key={skill.id}
              to={`/app/skill/${skill.slug}`}
              className="skill-card group flex overflow-hidden"
            >
              <div className={`w-24 flex-shrink-0 bg-gradient-to-br ${skill.cover_gradient} flex items-center justify-center`}>
                <Avatar className="w-12 h-12 ring-2 ring-white/50">
                  <AvatarImage src={skill.teacher.avatar} />
                  <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white' }}>
                    {skill.teacher.firstName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="p-4 flex-1">
                <div className="font-semibold font-body text-navy text-sm group-hover:text-amber-sc transition-colors">
                  {skill.title}
                </div>
                <div className="text-xs font-body text-[var(--color-text-secondary)] mt-0.5">
                  with {skill.teacher.firstName} {skill.teacher.lastName}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                    <span className="text-xs font-bold text-navy">{skill.avg_rating}</span>
                  </div>
                  <span className="text-xs font-body" style={{ color: 'var(--color-amber)' }}>
                    {skill.price_per_hour === 0 ? 'Free' : `${skill.price_per_hour} MAD/hr`}
                  </span>
                </div>
              </div>
              <div className="flex items-center pr-4">
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/app/browse"
          className="btn-amber text-sm flex items-center gap-2"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          Explore all skills
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/app/feed"
          className="text-sm font-semibold font-body px-5 py-3 rounded-xl border border-[var(--color-border)] text-navy hover:bg-parchment transition-colors"
        >
          Go to Feed
        </Link>
      </div>
    </div>
  );
}
