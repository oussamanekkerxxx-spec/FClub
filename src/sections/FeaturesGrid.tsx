import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import {
  Users,
  BookOpen,
  MessageCircle,
  Shield,
  MapPin,
  Zap,
} from 'lucide-react';

interface FeaturesGridProps {
  className?: string;
}

const features = [
  {
    icon: Users,
    title: 'Peer-to-Peer Sessions',
    description: 'Learn directly from someone who\'s been there. No corporate trainers — real people sharing real skills.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: BookOpen,
    title: 'Teach What You Know',
    description: 'Got a skill? List it, set your price, and start teaching. Everyone has something to share.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: MessageCircle,
    title: 'Talk Before You Book',
    description: 'No cold bookings. Chat with your teacher first, agree on a plan, then meet up.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Shield,
    title: 'Trust Built In',
    description: 'Verified profiles, honest reviews, and a trust tier system that rewards great members.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal',
    description: 'Find skills in your neighborhood. Start in Marrakesh — meet people around the corner.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Zap,
    title: 'Zero Friction',
    description: 'No complicated sign-ups or payment walls. Request a session in 30 seconds flat.',
    color: 'bg-cyan-50 text-cyan-600',
  },
];

export default function FeaturesGrid({ className = '' }: FeaturesGridProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        header,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 55%',
            scrub: 0.5,
          },
        }
      );

      // Cards animation with stagger
      const cardElements = cards.querySelectorAll('.feature-card');
      gsap.fromTo(
        cardElements,
        { y: 80, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cards,
            start: 'top 75%',
            end: 'top 40%',
            scrub: 0.5,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className={`section-flowing bg-brand-bg py-20 lg:py-28 ${className}`}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text-primary">
            What makes FightClub different
          </h2>
          <p className="mt-4 text-lg text-brand-text-secondary">
            We stripped out everything that makes learning platforms feel corporate. What's left is raw, human, and effective.
          </p>
        </div>

        {/* Features Grid */}
        <div
          ref={cardsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card bg-white rounded-2xl p-6 lg:p-8 shadow-card border border-gray-100 hover:shadow-floating transition-shadow duration-300 group"
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-brand-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-brand-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
