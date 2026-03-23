import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

interface PricingProps {
  className?: string;
}

const plans = [
  {
    id: 'seeker',
    name: 'Seeker',
    price: 'Free',
    period: 'forever',
    description: 'Browse skills, book sessions, learn from your peers.',
    features: [
      'Unlimited browsing & discovery',
      'Book sessions with teachers',
      'Chat with teachers before booking',
      'Rate and review sessions',
      'Join the community feed',
      'Mobile-friendly PWA',
    ],
    cta: 'Start Learning',
    highlighted: false,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    price: 'Free to list',
    period: '12% per paid session',
    description: 'Teach your skills, set your price, grow your reputation.',
    features: [
      'Everything in Seeker',
      'Create unlimited skill listings',
      'Set your own hourly rate',
      'Manage bookings & calendar',
      'Teacher profile & trust badge',
      'Earn money doing what you love',
      'Priority in search results',
    ],
    cta: 'Start Teaching',
    highlighted: true,
  },
];

export default function Pricing({ className = '' }: PricingProps) {
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

      // Cards animation
      const cardElements = cards.querySelectorAll('.pricing-card');
      gsap.fromTo(
        cardElements,
        { y: 60, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
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
      id="pricing"
      className={`section-flowing bg-brand-bg py-20 lg:py-28 ${className}`}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text-primary">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg text-brand-text-secondary">
            Seekers learn free. Teachers earn. We take 12% on paid sessions to keep the lights on.
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card rounded-2xl p-6 lg:p-8 ${
                plan.highlighted
                  ? 'bg-brand-text-primary text-white shadow-floating'
                  : 'bg-white shadow-card border border-gray-100'
              }`}
            >
              {plan.highlighted && (
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <h3
                className={`font-heading font-bold text-xl ${
                  plan.highlighted ? 'text-white' : 'text-brand-text-primary'
                }`}
              >
                {plan.name}
              </h3>

              <div className="mt-4 mb-2">
                <span
                  className={`text-4xl font-bold ${
                    plan.highlighted ? 'text-white' : 'text-brand-text-primary'
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.highlighted
                      ? 'text-white/70'
                      : 'text-brand-text-secondary'
                  }`}
                >
                  {' '}
                  / {plan.period}
                </span>
              </div>

              <p
                className={`text-sm mb-6 ${
                  plan.highlighted
                    ? 'text-white/80'
                    : 'text-brand-text-secondary'
                }`}
              >
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlighted
                          ? 'bg-white/20'
                          : 'bg-green-100'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          plan.highlighted ? 'text-white' : 'text-green-600'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm ${
                        plan.highlighted
                          ? 'text-white/90'
                          : 'text-brand-text-primary'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={plan.id === 'seeker' ? '/onboarding' : '#'}>
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-white text-brand-text-primary hover:bg-white/90'
                      : 'btn-primary border-0'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
