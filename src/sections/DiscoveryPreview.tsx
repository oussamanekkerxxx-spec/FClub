import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { Users, MapPin, Mic2, ArrowRight, Globe, Lock, Flame } from 'lucide-react';
import { CATEGORY_GRADIENTS } from '@/constants/categories';

interface Props {
  className?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  music: '🎵', languages: '🌍', technology: '💻', cooking: '🍳',
  art: '🎨', fitness: '💪', photography: '📷', business: '📊',
  writing: '✍️', crafts: '🧵',
};

export default function DiscoveryPreview({ className }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  const [clubs, setClubs]   = useState<any[]>([]);
  const [rooms, setRooms]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('clubs')
        .select('*')
        .eq('is_private', false)
        .order('member_count', { ascending: false })
        .limit(6),
      supabase
        .from('voice_rooms')
        .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name), club:clubs!voice_rooms_club_id_fkey(name, slug)')
        .in('status', ['active', 'waiting'])
        .limit(3),
    ]).then(([clubsRes, roomsRes]) => {
      if (clubsRes.data) setClubs(clubsRes.data);
      if (roomsRes.data) setRooms(roomsRes.data);
      setLoading(false);
    });
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header  = headerRef.current;
    const grid    = gridRef.current;
    if (!section || !header || !grid) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 55%', scrub: 0.5 },
        }
      );
      gsap.fromTo(
        grid.children,
        { y: 50, opacity: 0, scale: 0.98 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out',
          scrollTrigger: { trigger: grid, start: 'top 80%', end: 'top 45%', scrub: 0.5 },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [clubs]);

  // Show section even if no DB data yet — show skeleton placeholders
  const PLACEHOLDER_CLUBS = [
    { id: 'p1', slug: 'guitar-circle-marrakesh', name: 'Guitar Circle Marrakesh', category: 'music', cover_gradient: 'from-purple-600 to-pink-500', member_count: 34, city: 'Marrakesh', is_private: false, tags: ['guitar', 'beginner-friendly'] },
    { id: 'p2', slug: 'code-builders-casa', name: 'Code Builders Casablanca', category: 'technology', cover_gradient: 'from-indigo-600 to-blue-500', member_count: 61, city: 'Casablanca', is_private: false, tags: ['coding', 'react'] },
    { id: 'p3', slug: 'arabic-calligraphy-fes', name: 'Arabic Calligraphy — Fès', category: 'art', cover_gradient: 'from-amber-500 to-orange-600', member_count: 22, city: 'Fès', is_private: false, tags: ['art', 'heritage'] },
  ];

  const displayClubs = clubs.length > 0 ? clubs : (!loading ? PLACEHOLDER_CLUBS : []);

  return (
    <section
      ref={sectionRef}
      id="discovery"
      className={`section-flowing py-20 lg:py-28 ${className ?? ''}`}
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="absolute inset-0 dot-pattern pointer-events-none opacity-40" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">

        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-amber)' }}>
            Happening right now
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text-primary mb-4">
            Your community is already here
          </h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Trending clubs, live voice rooms, and collaborative quests — all across Morocco.
            Browse without signing up.
          </p>
        </div>

        {/* Active Voice Rooms strip */}
        {rooms.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-forest)' }}>
                Live rooms right now
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {rooms.map(room => (
                <Link
                  key={room.id}
                  to="/signup"
                  className="flex-shrink-0 flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[var(--color-border)] hover:shadow-md transition-all group"
                  style={{ minWidth: '240px' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
                    <Mic2 className="w-4 h-4" style={{ color: 'var(--color-forest)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-navy truncate group-hover:text-[var(--color-amber)] transition-colors">
                      {room.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      {room.club?.name ?? 'Open room'} ·{' '}
                      <span className="text-[var(--color-forest)] font-semibold">
                        {room.status === 'active' ? 'Live' : 'Starting soon'}
                      </span>
                    </div>
                  </div>
                  <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">{room.participant_count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Clubs grid */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
              <span className="font-heading font-semibold text-navy" style={{ fontSize: '1.1rem' }}>
                Trending clubs
              </span>
            </div>
            <Link to="/signup" className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--color-amber)' }}>
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] animate-pulse">
                  <div className="h-24 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayClubs.map(club => {
                const gradient = club.cover_gradient ?? CATEGORY_GRADIENTS[club.category] ?? 'from-blue-500 to-purple-600';
                return (
                  <Link
                    key={club.id}
                    to="/signup"
                    className="group block bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] hover:shadow-floating transition-all"
                  >
                    {/* Cover */}
                    <div className={`h-24 relative bg-gradient-to-br ${gradient}`}>
                      {club.cover_image_url && (
                        <img src={club.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      <div className="absolute top-2 right-2">
                        {club.is_private
                          ? <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-black/40 text-white flex items-center gap-0.5"><Lock className="w-2 h-2" /> Private</span>
                          : <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-black/30 text-white flex items-center gap-0.5"><Globe className="w-2 h-2" /> Public</span>
                        }
                      </div>
                      <div className="absolute bottom-2 left-3 text-lg">
                        {CATEGORY_EMOJIS[club.category] ?? '✨'}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <div className="font-semibold text-sm text-navy mb-1 group-hover:text-[var(--color-amber)] transition-colors line-clamp-1">
                        {club.name}
                      </div>
                      {club.description && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed mb-2">
                          {club.description}
                        </p>
                      )}
                      {Array.isArray(club.tags) && club.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(club.tags as string[]).slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                        <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                          <Users className="w-3 h-3" /> {club.member_count} members
                        </span>
                        {club.city && (
                          <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                            <MapPin className="w-3 h-3" /> {club.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 btn-amber text-sm"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Explore all clubs
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Free to join. No credit card.</p>
        </div>

      </div>
    </section>
  );
}
