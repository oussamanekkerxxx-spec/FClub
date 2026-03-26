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
    name: 'Maria Garcia',
    role: 'Learner',
    department: 'Found her web design teacher',
    quote: 'I learned React from someone who actually understood what it was like to be a beginner. She broke it down better than any course I\'ve seen.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 't2',
    name: 'Dr. James Wilson',
    role: 'Teacher',
    department: 'Teaching Guitar',
    quote: 'I make money on my own terms. No corporate middleman telling me what to do. It\'s just me and the students.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 't3',
    name: 'Tyler Brown',
    role: 'Learner & Teacher',
    department: 'Photography & Coding',
    quote: 'I\'ve learned 3 skills and started teaching photography. The community is so real and supportive—it\'s not like other platforms.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
];

export default function Testimonials({ className = '' }: TestimonialsProps) {
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
      const cardElements = cards.querySelectorAll('.testimonial-card');
      gsap.fromTo(
        cardElements,
        { y: 80, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
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
      className={`section-flowing bg-brand-bg py-20 lg:py-28 ${className}`}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text-primary">
            From the FightClub community
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="testimonial-card bg-white rounded-2xl p-6 lg:p-8 shadow-card border border-gray-100"
            >
              <Quote className="w-8 h-8 text-brand-accent/30 mb-4" />
              <p className="text-brand-text-primary leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-brand-text-primary">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    {testimonial.role}, {testimonial.department}
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
