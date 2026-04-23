import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { mapSkillRow, type SkillRow } from '@/mappers/skills';
import type { Skill } from '@/types/skills';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Star, Sparkles } from 'lucide-react';

export default function Welcome() {
  const { user } = useAuth();
  const [matchedSkills, setMatchedSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.what_i_learn || user.what_i_learn.length === 0) {
      setLoading(false);
      return;
    }

    // New onboarding stores real tag names (e.g. "Guitar", "Photography").
    // Match skills that share any of those tags; fall back to category matching for legacy values.
    const legacyCategoryMap: Record<string, string> = {
      cook: 'cooking', language: 'languages', move: 'fitness',
      create: 'art', tech: 'technology', photo: 'photography', write: 'writing',
    };
    const tags = user.what_i_learn;
    const cats = tags.map((t: string) => legacyCategoryMap[t]).filter(Boolean);

    const query = supabase
      .from('skills')
      .select('*, profiles!skills_teacher_id_fkey(id, first_name, last_name, avatar_url)')
      .eq('is_active', true)
      .limit(3);

    // Use overlaps on tags (new onboarding) OR category fallback (legacy)
    if (cats.length > 0) {
      query.or(`tags.ov.{${tags.join(',')}},category.in.(${cats.join(',')})`);
    } else {
      query.overlaps('tags', tags);
    }

    query
      .then(({ data }) => {
        if (data) setMatchedSkills((data as SkillRow[]).map(mapSkillRow));
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
          Welcome to FightClub, {user?.firstName}. ✦
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
              <div className={`w-24 flex-shrink-0 relative overflow-hidden ${!skill.cover_image_url ? `bg-gradient-to-br ${skill.cover_gradient}` : 'bg-gray-900'} flex items-center justify-center`}>
                {skill.cover_image_url && (
                  <img src={skill.cover_image_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-80" />
                )}
                <Avatar className="w-12 h-12 ring-2 ring-white/50 relative z-10">
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
          to="/app/board"
          className="btn-amber text-sm flex items-center gap-2"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          Explore all skills
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/app/discover"
          className="text-sm font-semibold font-body px-5 py-3 rounded-xl border border-[var(--color-border)] text-navy hover:bg-parchment transition-colors"
        >
          Go to Discover
        </Link>
      </div>
    </div>
  );
}
