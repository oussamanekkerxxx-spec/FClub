import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { Compass, Users, Sparkles } from 'lucide-react';

interface Props {
  className?: string;
}

const STEPS = [
  {
    step: '01',
    icon: Compass,
    title: 'Find a club that fits your vibe',
    description:
      'Browse clubs by category, city, or tag. Music circles, code sprints, calligraphy ateliers — if it matters to people in Morocco, there\'s a club for it.',
    color: 'var(--color-amber)',
    bg: '#FFF3E0',
    accent: 'from-amber-400 to-orange-400',
  },
  {
    step: '02',
    icon: Users,
    title: 'Join, introduce yourself, jump in',
    description:
      'Post in the feed, pick up an open quest, or join a live voice room. Every club has members at all levels — you\'ll find your spot immediately.',
    color: 'var(--color-plum)',
    bg: '#F3E8FF',
    accent: 'from-violet-500 to-purple-500',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Grow together — lead, host, create',
    description:
      'Earn trust by contributing. Host your own voice room, launch a quest, organise a local event. The community is shaped by the people in it.',
    color: 'var(--color-forest)',
    bg: '#E8F5EE',
    accent: 'from-green-500 to-teal-400',
  },
];

export default function HowItWorks({ className }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);
  const stepsRef   = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header  = headerRef.current;
    const steps   = stepsRef.current;
    if (!section || !header || !steps) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 82%', end: 'top 60%', scrub: 0.5 },
        }
      );
      gsap.fromTo(
        steps.querySelectorAll('.step-card'),
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: steps, start: 'top 78%', end: 'top 40%', scrub: 0.5 },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className={`section-flowing py-20 lg:py-28 ${className ?? ''}`}
      style={{ background: 'white' }}
    >
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">

        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-amber)' }}>
            How it works
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text-primary mb-4">
            Three steps to your community
          </h2>
          <p className="text-brand-text-secondary leading-relaxed">
            No algorithms deciding who you meet. No endless scrolling. Just real people, shared interests, and momentum.
          </p>
        </div>

        <div ref={stepsRef} className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* connector line — desktop only */}
          <div
            className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
            style={{ background: 'linear-gradient(90deg, var(--color-amber), var(--color-plum), var(--color-forest))' }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="step-card relative">
                <div className="flex flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div className="relative mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: step.bg }}
                    >
                      <Icon className="w-7 h-7" style={{ color: step.color }} />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                      style={{ background: step.color }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  <div className="font-heading font-semibold text-lg text-navy mb-3">
                    {step.title}
                  </div>
                  <p className="font-body text-brand-text-secondary text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
