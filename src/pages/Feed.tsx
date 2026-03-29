import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Star,
  Clock,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Feed() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<any[]>([]);
  const [feedEvents, setFeedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillCount, setSkillCount] = useState(0);
  const [, setDismissedIds] = useState<Set<string>>(new Set());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleDismiss = async (skillId: string) => {
    if (user?.isDemo) return;
    setSkills(prev => prev.filter(s => s.id !== skillId));
    setDismissedIds(prev => new Set(prev).add(skillId));
    await supabase.from('dismissed_skills').insert({ user_id: user!.id, skill_id: skillId });
    toast('Skill hidden from your feed');
  };

  useEffect(() => {
    const dismissedPromise = user && !user.isDemo
      ? supabase.from('dismissed_skills').select('skill_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] });

    Promise.all([
      supabase
        .from('skills')
        .select('*, profiles!skills_teacher_id_fkey(id, first_name, last_name, avatar_url, trust_tier, trust_score, city)')
        .eq('is_active', true),
      supabase
        .from('feed_events')
        .select('*, profiles!feed_events_member_id_fkey(id, first_name, last_name, avatar_url), skills!feed_events_skill_id_fkey(id, slug)')
        .order('created_at', { ascending: false })
        .limit(5),
      dismissedPromise,
    ]).then(([skillsRes, eventsRes, dismissedRes]) => {
      const dismissed = new Set((dismissedRes.data || []).map((d: any) => d.skill_id));
      setDismissedIds(dismissed);

      if (skillsRes.data) {
        const userInterests = (user?.what_i_learn || []).map(s => s.toLowerCase());
        const userNeighborhood = (user?.location || '').toLowerCase();
        const userLanguages = (user?.languages || []).map(s => s.toLowerCase());

        const mapped = skillsRes.data.filter((s: any) => !dismissed.has(s.id)).map((s: any) => {
          let relevance = 0;
          const category = (s.category || '').toLowerCase();
          const tags = ((s.tags as string[]) || []).map(t => t.toLowerCase());
          const neighborhood = (s.neighborhood || s.location || '').toLowerCase();
          const skillLangs = ((s.languages as string[]) || []).map(l => l.toLowerCase());

          // +2 for category or tag matching user interests
          if (userInterests.some(i => category.includes(i) || i.includes(category) || tags.some(t => t.includes(i) || i.includes(t)))) {
            relevance += 2;
          }
          // +1 for same neighborhood
          if (userNeighborhood && neighborhood && neighborhood === userNeighborhood) {
            relevance += 1;
          }
          // +1 for language overlap
          if (userLanguages.some(l => skillLangs.includes(l))) {
            relevance += 1;
          }

          return {
            ...s,
            relevance,
            teacher: {
              id: s.profiles?.id,
              firstName: s.profiles?.first_name || '',
              lastName: s.profiles?.last_name || '',
              avatar: s.profiles?.avatar_url || '',
              trust_tier: s.profiles?.trust_tier || 0,
              trust_score: s.profiles?.trust_score || 0,
              city: s.profiles?.city || '',
            },
            slug: s.slug || s.id,
            tags: s.tags || [],
            cover_gradient: s.cover_gradient || 'from-blue-500 to-purple-600',
          };
        });

        // Sort by relevance first, then recency
        mapped.sort((a: any, b: any) => {
          if (b.relevance !== a.relevance) return b.relevance - a.relevance;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setSkills(mapped);
        setSkillCount(skillsRes.data.length);
      }
      if (eventsRes.data) {
        setFeedEvents(eventsRes.data);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.what_i_learn, user?.location, user?.languages]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-navy">
          {greeting}, {user?.firstName}. ✦
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 font-body">
          Here's what's alive across Morocco today.
        </p>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Skills available', value: String(skillCount || '—'), color: 'var(--color-amber)' },
          { label: 'Free this week', value: String(skills.filter(s => s.is_free).length || '—'), color: 'var(--color-forest)' },
          { label: 'Your sessions', value: String(user?.sessions_completed || 0), color: 'var(--color-plum)' },
        ].map((stat) => (
          <div key={stat.label} className="sc-card p-4 text-center">
            <div
              className="text-2xl font-bold font-heading"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Browse CTA */}
      <Link
        to="/app/browse"
        className="flex items-center gap-3 sc-card p-4 hover:shadow-floating transition-shadow group"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFF3E0' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--color-amber)' }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold font-body text-navy text-sm group-hover:text-amber-sc transition-colors">
            Find a skill or a teacher
          </div>
          <div className="text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
            Browse all skills available in your city
          </div>
        </div>
        <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
      </Link>

      {/* Activity Feed */}
      {feedEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-navy" style={{ fontSize: '1.1rem' }}>
            Latest Activity
          </h2>
          <div className="space-y-3">
            {feedEvents.map((event) => (
              <div key={event.id} className="sc-card p-4 flex gap-3 items-start">
                <Avatar className="w-10 h-10 ring-2 ring-white flex-shrink-0">
                  <AvatarImage src={event.profiles?.avatar_url} />
                  <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white' }}>
                    {event.profiles?.first_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold font-body text-navy text-sm">
                    {event.title}
                  </div>
                  {event.subtitle && (
                    <div className="text-xs font-body text-[var(--color-text-secondary)] mt-0.5">
                      {event.subtitle}
                    </div>
                  )}
                  {event.skills?.slug && (
                    <Link to={`/app/skill/${event.skills.slug}`} className="text-xs font-semibold font-body mt-2 inline-block" style={{ color: 'var(--color-amber)' }}>
                      View skill →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-navy" style={{ fontSize: '1.1rem' }}>
            {skills.some(s => s.relevance > 0) ? 'Picked for you' : 'Skills worth discovering'}
          </h2>
          <Link
            to="/app/browse"
            className="text-xs font-semibold font-body flex items-center gap-1"
            style={{ color: 'var(--color-amber)' }}
          >
            Browse all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skill-card animate-pulse">
                <div className="h-24 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : skills.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {skills.slice(0, 4).map((skill) => (
              <div key={skill.id} className="skill-card group relative">
                <button
                  onClick={(e) => { e.preventDefault(); handleDismiss(skill.id); }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Not interested"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <Link to={`/app/skill/${skill.slug}`}>
                <div
                  className={`h-24 relative flex items-end p-4 overflow-hidden ${!skill.cover_image_url ? `bg-gradient-to-br ${skill.cover_gradient}` : 'bg-gray-900'}`}
                >
                  {skill.cover_image_url && (
                    <img src={skill.cover_image_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-90" />
                  )}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-9 h-9 ring-2 ring-white">
                      <AvatarImage src={skill.teacher.avatar} />
                      <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '12px' }}>
                        {skill.teacher.firstName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-[11px] font-semibold font-body text-white drop-shadow">
                        {skill.teacher.firstName} {skill.teacher.lastName}
                      </div>
                      <div className="text-[10px] font-body text-white/80 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {skill.teacher.city}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="font-semibold font-body text-navy text-sm mb-1 group-hover:text-amber-sc transition-colors">
                    {skill.title}
                  </div>
                  <p className="text-[12px] font-body leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {(skill.description || '').substring(0, 90)}…
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-sc text-amber-sc" />
                      <span className="text-xs font-semibold text-navy">{skill.avg_rating}</span>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        ({skill.reviews_count})
                      </span>
                    </div>
                    <div className="text-xs font-semibold font-body" style={{ color: 'var(--color-amber)' }}>
                      {skill.is_free ? 'Free' : `${skill.price_per_hour} ${skill.currency}/hr`}
                    </div>
                  </div>
                </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="sc-card p-8 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-amber)' }} />
            <div className="font-heading text-navy text-lg mb-2">The ring is quiet… for now</div>
            <p className="text-sm font-body" style={{ color: 'var(--color-text-secondary)' }}>
              No skills posted yet. Be the first to teach something!
            </p>
            <Link to="/app/teach" className="inline-flex items-center gap-2 btn-amber text-sm mt-4" style={{ padding: '0.625rem 1.25rem' }}>
              Start Teaching <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Inspiration footer */}
      <div
        className="p-6 rounded-2xl text-center"
        style={{ background: 'var(--color-navy)' }}
      >
        <div className="font-heading text-white text-lg mb-2">
          "Your next skill is one conversation away."
        </div>
        <p className="text-white/50 text-sm font-body mb-4">
          Real people teaching real skills in your city.
        </p>
        <Link
          to="/app/browse"
          className="inline-flex items-center gap-2 btn-amber text-sm"
          style={{ padding: '0.625rem 1.25rem' }}
        >
          <Clock className="w-4 h-4" />
          Find your next session
        </Link>
      </div>
    </div>
  );
}
