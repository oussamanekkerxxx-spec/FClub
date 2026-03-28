import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, ArrowRight, MapPin } from 'lucide-react';

interface Props {
  className?: string;
}

export default function LiveSkillsPreview({ className }: Props) {
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('skills')
      .select('*, profiles!skills_teacher_id_fkey(id, first_name, last_name, avatar_url, neighborhood, city)')
      .eq('is_active', true)
      .order('avg_rating', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          setSkills(data.map((s: any) => ({
            ...s,
            teacher: {
              firstName: s.profiles?.first_name || '',
              lastName: s.profiles?.last_name || '',
              avatar: s.profiles?.avatar_url || '',
              neighborhood: s.profiles?.neighborhood || '',
              city: s.profiles?.city || 'Marrakesh',
            },
            slug: s.slug || s.id,
            cover_gradient: s.cover_gradient || 'from-blue-500 to-purple-600',
            tags: s.tags || [],
          })));
        }
      });
  }, []);

  if (skills.length === 0) return null;

  return (
    <section id="skills" className={`py-20 px-6 ${className || ''}`} style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-2" style={{ color: 'var(--color-amber)' }}>
            Live right now
          </div>
          <h2 className="font-heading text-3xl text-navy mb-3">
            Skills being shared in Marrakesh
          </h2>
          <p className="font-body text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Real people teaching real skills. Browse without signing up — join when you find something you love.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to="/signup"
              className="group block bg-white rounded-xl overflow-hidden border border-[var(--color-border)] hover:shadow-lg transition-all"
            >
              <div className={`h-24 bg-gradient-to-br ${skill.cover_gradient} flex items-end p-3`}>
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7 ring-2 ring-white/50">
                    <AvatarImage src={skill.teacher.avatar} />
                    <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '10px' }}>
                      {skill.teacher.firstName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-semibold font-body text-white drop-shadow">
                    {skill.teacher.firstName}
                  </span>
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-semibold font-body text-navy text-sm mb-1 group-hover:text-amber-sc transition-colors">
                  {skill.title}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-body text-[var(--color-text-muted)] mb-2">
                  <MapPin className="w-3 h-3" />
                  {skill.teacher.neighborhood || skill.teacher.city}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                    <span className="text-[11px] font-bold text-navy">{skill.avg_rating}</span>
                  </div>
                  <span className="text-[11px] font-bold font-body" style={{ color: 'var(--color-amber)' }}>
                    {skill.price_per_hour === 0 ? 'Free' : `${skill.price_per_hour} MAD`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 btn-amber text-sm"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Browse all skills
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
