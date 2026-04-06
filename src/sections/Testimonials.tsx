import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { Quote } from 'lucide-react';

interface TestimonialsProps {
  className?: string;
}

const testimonials = [
  {
    id: 't1',
    name: 'Yasmine Idrissi',
    role: 'Member',
    department: 'Guitar Circle Marrakesh',
    quote: 'I joined thinking I\'d just learn a few chords. Three months later I\'m hosting Saturday sessions and I\'ve met my closest friends here. This community is the real deal.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 't2',
    name: 'Karim Bensouda',
    role: 'Quest Lead',
    department: 'Code Builders Casablanca',
    quote: 'We shipped a real open-source project through a FightClub quest. Four strangers from different cities, all connected through the club. That wouldn\'t have happened anywhere else.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 't3',
    name: 'Amina Berrada',
    role: 'Founding Member',
    department: 'Arabic Calligraphy — Fès',
    quote: 'I came to learn calligraphy. I stayed because I found my people. Now I teach here every Saturday. The trust tier system made it easy — everyone knew I was serious before I even said a word.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  },
];

export default function Testimonials({ className = '' }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);
  const cardsRef   = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header  = headerRef.current;
    const cards   = cardsRef.current;
    if (!section || !header || !cards) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 55%', scrub: 0.5 },
        }
      );
      gsap.fromTo(
        cards.querySelectorAll('.testimonial-card'),
        { y: 80, opacity: 0, scale: 0.98 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: cards, start: 'top 75%', end: 'top 40%', scrub: 0.5 },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className={`section-flowing bg-brand-bg py-20 lg:py-28 ${className}`}
    >
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">

        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-amber)' }}>
            Stories
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text-primary">
            From the FightClub community
          </h2>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="testimonial-card bg-white rounded-2xl p-6 lg:p-8 shadow-card border border-gray-100 flex flex-col"
            >
              <Quote className="w-7 h-7 mb-4" style={{ color: 'var(--color-amber)', opacity: 0.4 }} />
              <p className="text-brand-text-primary leading-relaxed mb-6 flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <div className="font-semibold text-sm text-brand-text-primary">{t.name}</div>
                  <div className="text-xs text-brand-text-secondary mt-0.5">
                    {t.role} · {t.department}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
