import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { Shield, UserCheck, Eye, Flag, Star, Lock } from 'lucide-react';

interface Props {
  className?: string;
}

const PILLARS = [
  {
    icon: UserCheck,
    title: 'Verified Members',
    description: 'Members earn trust tiers through activity, peer vouches, and optional ID verification. You always know who you\'re talking to.',
    color: 'var(--color-forest)',
    bg: '#E8F5EE',
  },
  {
    icon: Eye,
    title: 'Transparent Moderation',
    description: 'Every club has visible moderators. Content rules are posted in each club\'s sidebar — no hidden policies, no silent bans.',
    color: 'var(--color-plum)',
    bg: '#F3E8FF',
  },
  {
    icon: Flag,
    title: 'Community Reporting',
    description: 'One-tap flagging on any post, message, or profile. Reports are reviewed by moderators within 24 hours.',
    color: 'var(--color-amber)',
    bg: '#FFF3E0',
  },
  {
    icon: Lock,
    title: 'Private Clubs',
    description: 'Sensitive or invite-only communities stay private. Moderators approve each join request manually.',
    color: '#4338CA',
    bg: '#EEF2FF',
  },
  {
    icon: Star,
    title: 'Reputation System',
    description: 'Trust scores are earned, not bought. Contributing to quests, hosting rooms, and receiving peer vouches all build your standing.',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  {
    icon: Shield,
    title: 'Zero Tolerance',
    description: 'Harassment, hate speech, and spam result in immediate removal. Platform-wide bans are permanent and publicly logged.',
    color: '#0369A1',
    bg: '#E0F2FE',
  },
];

const TIERS = [
  { name: 'Explorer',   desc: 'New to the platform',     color: '#4C6EF5', bg: '#EDF2FF' },
  { name: 'Member',     desc: 'Active for 30+ days',      color: '#1976D2', bg: '#E3F2FD' },
  { name: 'Verified',   desc: 'ID or phone confirmed',    color: '#2D7A4F', bg: '#E8F5EE' },
  { name: 'Teacher',    desc: 'Completed 5+ sessions',    color: '#C4873A', bg: '#FFF3E0' },
  { name: 'Connector',  desc: 'Community pillar',         color: '#5C3D8F', bg: '#EDE8F7' },
];

export default function TrustSafety({ className }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const tiersRef   = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section  = sectionRef.current;
    const header   = headerRef.current;
    const pillars  = pillarsRef.current;
    const tiersEl  = tiersRef.current;
    if (!section || !header || !pillars || !tiersEl) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 82%', end: 'top 58%', scrub: 0.5 },
        }
      );
      gsap.fromTo(
        pillars.querySelectorAll('.pillar-card'),
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: pillars, start: 'top 80%', end: 'top 40%', scrub: 0.5 },
        }
      );
      gsap.fromTo(
        tiersEl.querySelectorAll('.tier-chip'),
        { x: -20, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out',
          scrollTrigger: { trigger: tiersEl, start: 'top 82%', end: 'top 55%', scrub: 0.5 },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="trust-safety"
      className={`section-flowing py-20 lg:py-28 ${className ?? ''}`}
      style={{ background: 'var(--color-navy)' }}
    >
      <div className="absolute inset-0 dot-pattern pointer-events-none opacity-[0.04]" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">

        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-amber)' }}>
            Trust & Safety
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">
            A community you can actually trust
          </h2>
          <p className="text-white/60 leading-relaxed">
            Lumina is built around accountability. Every member has a visible reputation, every club has clear rules,
            and every moderation decision is transparent.
          </p>
        </div>

        {/* Pillars grid */}
        <div ref={pillarsRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="pillar-card rounded-2xl p-5 border border-white/8"
                style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: pillar.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: pillar.color }} />
                </div>
                <h3 className="font-heading font-semibold text-white mb-2">{pillar.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>

        {/* Trust tiers */}
        <div ref={tiersRef} className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Trust Tiers</p>
            <p className="text-white/60 text-sm">
              Every member's tier is publicly visible on their profile. You always know who you're engaging with.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TIERS.map((tier, i) => (
              <div
                key={i}
                className="tier-chip flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: tier.color }}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">{tier.name}</div>
                  <div className="text-[11px] text-white/50">{tier.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
