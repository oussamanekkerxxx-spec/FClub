import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Wifi,
  Users,
  X,
} from 'lucide-react';

type Category = 'music' | 'languages' | 'technology' | 'cooking' | 'art' | 'fitness' | 'photography' | 'business' | 'writing';
type Format = 'online' | 'in-person' | 'both';

const categories = [
  { id: 'music', label: 'Music', emoji: '🎵', count: 0 },
  { id: 'languages', label: 'Languages', emoji: '🌍', count: 0 },
  { id: 'technology', label: 'Technology', emoji: '💻', count: 0 },
  { id: 'cooking', label: 'Cooking', emoji: '🍳', count: 0 },
  { id: 'art', label: 'Art & Craft', emoji: '🎨', count: 0 },
  { id: 'fitness', label: 'Fitness', emoji: '💪', count: 0 },
  { id: 'photography', label: 'Photography', emoji: '📷', count: 0 },
  { id: 'business', label: 'Business', emoji: '📊', count: 0 },
  { id: 'writing', label: 'Writing', emoji: '✍️', count: 0 },
];

const FORMAT_LABELS: Record<Format, string> = {
  online: 'Online',
  'in-person': 'In-person',
  both: 'Online & In-person',
};

const LoadingSkeleton = () => (
  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="skill-card bg-white rounded-xl overflow-hidden animate-pulse">
        <div className="h-28 bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="flex justify-between pt-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function Browse() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<Format | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState(500);
  const [showFilters, setShowFilters] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('skills')
      .select('*, profiles!skills_teacher_id_fkey(id, first_name, last_name, avatar_url, trust_tier, trust_score)')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((s: any) => ({
            ...s,
            teacher: {
              id: s.profiles?.id,
              firstName: s.profiles?.first_name || '',
              lastName: s.profiles?.last_name || '',
              avatar: s.profiles?.avatar_url || '',
              trust_tier: s.profiles?.trust_tier || 0,
              trust_score: s.profiles?.trust_score || 0,
            },
            slug: s.slug || s.id,
            tags: s.tags || [],
            cover_gradient: s.cover_gradient || 'from-blue-500 to-purple-600',
            format: s.format || 'in-person',
          }));
          setSkills(mapped);
        }
        setLoading(false);
      });
  }, []);

  const filtered = skills.filter((skill) => {
    const matchSearch =
      !search ||
      skill.title.toLowerCase().includes(search.toLowerCase()) ||
      skill.teacher.firstName.toLowerCase().includes(search.toLowerCase()) ||
      skill.teacher.lastName.toLowerCase().includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchFormat = selectedFormat === 'all' || skill.format === selectedFormat || skill.format === 'both';
    const matchPrice = skill.price_per_hour <= maxPrice;
    return matchSearch && matchCat && matchFormat && matchPrice;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-navy">Browse Skills</h1>
        <p className="mt-1 font-body text-[var(--color-text-secondary)]">
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''} available in Marrakesh
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="What do you want to learn? Try 'piano', 'Python', 'cooking'…"
          className="input-sc pl-12 py-3.5 text-base"
          style={{ background: 'white', fontSize: '15px' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>

      {/* Categories Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold font-body transition-all ${
            selectedCategory === 'all'
              ? 'text-white'
              : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-amber-sc'
          }`}
          style={selectedCategory === 'all' ? { background: 'var(--color-navy)' } : {}}
        >
          All Skills
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as Category)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold font-body transition-all ${
              selectedCategory === cat.id
                ? 'text-white'
                : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-amber-sc'
            }`}
            style={selectedCategory === cat.id ? { background: 'var(--color-amber)' } : {}}
          >
            <span>{cat.emoji}</span>
            {cat.label}
            <span className="text-[10px] opacity-60">{cat.count}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Filter Sidebar (desktop) */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-5">
          <div className="sc-card p-4 space-y-5">
            {/* Format */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] mb-2.5">
                Format
              </div>
              <div className="space-y-2">
                {(['all', 'online', 'in-person', 'both'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFormat(f)}
                    className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-sm font-body transition-all ${
                      selectedFormat === f
                        ? 'font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:bg-parchment'
                    }`}
                    style={selectedFormat === f ? { color: 'var(--color-amber)', background: '#FFF3E0' } : {}}
                  >
                    {f === 'online' && <Wifi className="w-3.5 h-3.5" />}
                    {f === 'in-person' && <MapPin className="w-3.5 h-3.5" />}
                    {f === 'both' && <Users className="w-3.5 h-3.5" />}
                    {f === 'all' ? 'All formats' : FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider-warm" />

            {/* Price */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] mb-2.5">
                Max price
              </div>
              <div
                className="text-2xl font-bold font-heading mb-2"
                style={{ color: 'var(--color-amber)' }}
              >
                {maxPrice} MAD
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={25}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-sc"
              />
              <div className="flex justify-between text-[10px] font-body text-[var(--color-text-muted)] mt-1">
                <span>50 MAD</span>
                <span>500 MAD</span>
              </div>
            </div>

            {/* Reset */}
            {(selectedCategory !== 'all' || selectedFormat !== 'all' || maxPrice < 500) && (
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedFormat('all'); setMaxPrice(500); }}
                className="w-full text-sm font-semibold font-body py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-parchment transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        </aside>

        {/* Skill Grid */}
        <div className="flex-1">
          {/* Mobile filter toggle */}
          <button
            className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[var(--color-border)] text-sm font-semibold font-body text-navy"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {loading ? (
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <div className="sc-card p-12 text-center">
              <div className="font-heading text-xl text-navy mb-2">
                {skills.length === 0 ? 'No skills found yet' : 'No skills found'}
              </div>
              <p className="font-body text-[var(--color-text-secondary)] text-sm">
                {skills.length === 0
                  ? 'Be the first to teach something!'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((skill) => (
                <Link
                  key={skill.id}
                  to={`/app/skill/${skill.slug}`}
                  className="skill-card group block"
                >
                  {/* Cover */}
                  <div
                    className={`h-28 bg-gradient-to-br ${skill.cover_gradient} relative flex items-end p-3`}
                  >
                    {/* Format badge */}
                    <span
                      className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 font-body"
                      style={{ color: 'var(--color-navy)' }}
                    >
                      {skill.format === 'both' ? '🌐 Both' : skill.format === 'online' ? '💻 Online' : '📍 In-person'}
                    </span>
                    {/* Teacher avatar row */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 ring-2 ring-white/60">
                        <AvatarImage src={skill.teacher.avatar} />
                        <AvatarFallback
                          style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}
                        >
                          {skill.teacher.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-semibold font-body text-white drop-shadow">
                        {skill.teacher.firstName} {skill.teacher.lastName}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div
                      className="font-semibold font-body text-sm text-navy mb-1 group-hover:text-amber-sc transition-colors"
                    >
                      {skill.title}
                    </div>
                    <p
                      className="text-[11px] font-body leading-relaxed line-clamp-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {skill.description.substring(0, 80)}…
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {skill.tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[10px] font-body px-2 py-0.5 rounded-full"
                          style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Price + Rating */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-sc text-amber-sc" />
                        <span className="text-xs font-bold text-navy">{skill.avg_rating}</span>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          ({skill.reviews_count})
                        </span>
                      </div>
                      <div
                        className="font-bold font-body text-sm"
                        style={{ color: 'var(--color-amber)' }}
                      >
                        {skill.price_per_hour} {skill.currency}
                        <span className="text-[10px] font-normal">/hr</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
