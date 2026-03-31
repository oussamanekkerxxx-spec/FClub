import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Flame, Mic2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroProps {
  className?: string;
}

export default function Hero({ className = '' }: HeroProps) {
  const sectionRef   = useRef<HTMLElement>(null);
  const headlineRef  = useRef<HTMLDivElement>(null);
  const subheadRef   = useRef<HTMLParagraphElement>(null);
  const ctaRef       = useRef<HTMLDivElement>(null);
  const imageCardRef = useRef<HTMLDivElement>(null);
  const statsRef     = useRef<HTMLDivElement>(null);

  const [vitals, setVitals] = useState({ members: 0, clubs: 0, rooms: 0 });

  // Live vitality stats
  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('clubs').select('id', { count: 'exact', head: true }),
      supabase.from('voice_rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]).then(([profiles, clubs, rooms]) => {
      setVitals({
        members: profiles.count ?? 0,
        clubs:   clubs.count   ?? 0,
        rooms:   rooms.count   ?? 0,
      });
    });
  }, []);

  useLayoutEffect(() => {
    const section   = sectionRef.current;
    const headline  = headlineRef.current;
    const subhead   = subheadRef.current;
    const cta       = ctaRef.current;
    const imageCard = imageCardRef.current;
    const statsEl   = statsRef.current;

    if (!section || !headline || !subhead || !cta || !imageCard || !statsEl) return;

    const ctx = gsap.context(() => {
      // Entrance
      const loadTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      loadTl.fromTo(
        headline.querySelectorAll('.word'),
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 }
      );
      loadTl.fromTo(subhead,   { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.4');
      loadTl.fromTo(cta.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.3');
      loadTl.fromTo(imageCard, { x: 60, opacity: 0, scale: 0.98 }, { x: 0, opacity: 1, scale: 1, duration: 0.9 }, '-=0.7');
      loadTl.fromTo(statsEl,   { y: 20, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7 }, '-=0.5');

      // Scroll exit
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set([headline, subhead, cta, imageCard, statsEl], {
              opacity: 1, x: 0, y: 0, scale: 1,
            });
          },
        },
      });

      scrollTl.fromTo(headline,  { x: 0, opacity: 1 }, { x: '-40vw', opacity: 0, ease: 'power2.in' }, 0.7);
      scrollTl.fromTo(subhead,   { x: 0, opacity: 1 }, { x: '-35vw', opacity: 0, ease: 'power2.in' }, 0.72);
      scrollTl.fromTo(cta,       { x: 0, opacity: 1 }, { x: '-30vw', opacity: 0, ease: 'power2.in' }, 0.74);
      scrollTl.fromTo(imageCard, { x: 0, opacity: 1 }, { x:  '40vw', opacity: 0, ease: 'power2.in' }, 0.7);
      scrollTl.fromTo(statsEl,   { y: 0, opacity: 1 }, { y:  '18vh', opacity: 0, ease: 'power2.in' }, 0.75);
    }, section);

    return () => ctx.revert();
  }, []);

  const VITALS = [
    { icon: Users,  label: 'Members',      value: vitals.members > 0 ? `${vitals.members.toLocaleString()}+` : '—' },
    { icon: Flame,  label: 'Active clubs',  value: vitals.clubs   > 0 ? `${vitals.clubs}+`                   : '—' },
    { icon: Mic2,   label: 'Live rooms',    value: vitals.rooms   > 0 ? String(vitals.rooms)                 : '0' },
  ];

  return (
    <section
      ref={sectionRef}
      className={`section-pinned bg-brand-bg ${className}`}
      style={{ paddingTop: '72px' }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full h-full flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw] py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* ── Left ── */}
            <div className="max-w-xl">
              <div ref={headlineRef}>
                <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[52px] text-brand-text-primary leading-[1.1] tracking-tight">
                  <span className="word inline-block">Find</span>{' '}
                  <span className="word inline-block">your</span>{' '}
                  <span className="word inline-block">people.</span>{' '}
                  <br />
                  <span className="word inline-block" style={{ color: 'var(--color-amber)' }}>Build</span>{' '}
                  <span className="word inline-block">together.</span>
                </h1>
              </div>

              <p ref={subheadRef} className="mt-6 text-lg text-brand-text-secondary leading-relaxed">
                Lumina is a community platform where people with shared passions find each other,
                run quests, host live rooms, and grow — right in your city.
              </p>

              {/* Live vitality stats */}
              <div className="mt-6 flex items-center gap-5">
                {VITALS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFF3E0' }}>
                      <Icon className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-brand-text-primary leading-none">{value}</div>
                      <div className="text-[11px] text-brand-text-secondary">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/signup">
                  <Button className="btn-amber text-base px-6 py-3 h-auto border-0 shadow-warm">
                    Find Your People
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a
                  href="#how-it-works"
                  className="text-brand-accent font-medium hover:underline inline-flex items-center gap-1.5 text-sm"
                >
                  Watch How It Works
                </a>
              </div>
            </div>

            {/* ── Right ── */}
            <div className="relative hidden lg:block">
              <div
                ref={imageCardRef}
                className="relative rounded-2xl overflow-hidden shadow-floating"
                style={{ height: '64vh', maxHeight: '600px' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1000&fit=crop"
                  alt="Community members collaborating"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Floating club cards */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end gap-3">
                  {[
                    { name: 'Guitar Circle',   city: 'Marrakesh', members: 34, gradient: 'from-purple-600 to-pink-500' },
                    { name: 'Code Builders',   city: 'Casablanca', members: 61, gradient: 'from-blue-600 to-cyan-500' },
                  ].map(club => (
                    <div key={club.name} className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                      <div className={`h-6 w-full rounded-lg bg-gradient-to-r ${club.gradient} mb-2`} />
                      <div className="font-semibold text-navy text-xs truncate">{club.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        <Users className="w-2.5 h-2.5" /> {club.members} members · {club.city}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating stat card */}
              <div
                ref={statsRef}
                className="absolute -left-14 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-4 shadow-floating border border-gray-100"
                style={{ width: '180px' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FFF3E0' }}>
                    <Mic2 className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
                  </div>
                  <div className="text-xs font-semibold text-navy">Live Room</div>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mb-2">Arabic Calligraphy Q&A</div>
                <div className="flex -space-x-2">
                  {[
                    'photo-1535713875002-d1d0cf377fde',
                    'photo-1494790108377-be9c29b29330',
                    'photo-1507003211169-0a1dd7228f2d',
                  ].map((id) => (
                    <img
                      key={id}
                      src={`https://images.unsplash.com/${id}?w=40&h=40&fit=crop&crop=face`}
                      className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      alt=""
                    />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'var(--color-amber)' }}>
                    +4
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
