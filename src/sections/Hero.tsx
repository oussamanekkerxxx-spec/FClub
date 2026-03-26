import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface HeroProps {
  className?: string;
}

export default function Hero({ className = '' }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageCardRef = useRef<HTMLDivElement>(null);
  const statCardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const subheadline = subheadlineRef.current;
    const cta = ctaRef.current;
    const imageCard = imageCardRef.current;
    const statCard = statCardRef.current;

    if (!section || !headline || !subheadline || !cta || !imageCard || !statCard) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation on page load
      const loadTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Headline words animation
      const words = headline.querySelectorAll('.word');
      loadTl.fromTo(
        words,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 }
      );

      // Subheadline
      loadTl.fromTo(
        subheadline,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.4'
      );

      // CTA buttons
      loadTl.fromTo(
        cta.children,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        '-=0.3'
      );

      // Hero image card
      loadTl.fromTo(
        imageCard,
        { x: 60, opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, duration: 0.9 },
        '-=0.7'
      );

      // Stat card
      loadTl.fromTo(
        statCard,
        { y: 20, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7 },
        '-=0.5'
      );

      // Scroll-driven exit animation (pinned)
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back to top
            gsap.set([headline, subheadline, cta, imageCard, statCard], {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            });
          },
        },
      });

      // Phase 1 (0-30%): Hold - elements already visible from load animation
      // Phase 2 (30-70%): Settle - static
      // Phase 3 (70-100%): Exit
      scrollTl.fromTo(
        headline,
        { x: 0, opacity: 1 },
        { x: '-40vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        subheadline,
        { x: 0, opacity: 1 },
        { x: '-35vw', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        cta,
        { x: 0, opacity: 1 },
        { x: '-30vw', opacity: 0, ease: 'power2.in' },
        0.74
      );

      scrollTl.fromTo(
        imageCard,
        { x: 0, opacity: 1 },
        { x: '40vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        statCard,
        { y: 0, opacity: 1 },
        { y: '18vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`section-pinned bg-brand-bg ${className}`}
      style={{ paddingTop: '72px' }}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full h-full flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw] py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              <div ref={headlineRef}>
                <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[48px] text-brand-text-primary leading-[1.15] tracking-tight">
                  <span className="word inline-block">From</span>{' '}
                  <span className="word inline-block">students.</span>{' '}
                  <span className="word inline-block">To</span>{' '}
                  <span className="word inline-block">students.</span>{' '}
                  <span className="word inline-block">No</span>{' '}
                  <span className="word inline-block">middleman.</span>
                </h1>
              </div>

              <p
                ref={subheadlineRef}
                className="mt-6 text-lg text-brand-text-secondary leading-relaxed"
              >
                A peer-to-peer skill ring where you teach what you know and learn what you need. Real people. Real skills. Your city.
              </p>

              <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/signup">
                  <Button className="btn-amber text-base px-6 py-3 h-auto border-0 shadow-warm">
                    Enter the Ring
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a
                  href="#dashboard"
                  className="text-brand-accent font-medium hover:underline inline-flex items-center gap-1"
                >
                  How it works
                </a>
              </div>
            </div>

            {/* Right Content - Hero Image Card */}
            <div className="relative hidden lg:block">
              <div
                ref={imageCardRef}
                className="relative rounded-2xl overflow-hidden shadow-floating"
                style={{ height: '64vh', maxHeight: '600px' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=1000&fit=crop"
                  alt="People learning from each other"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating Stat Card */}
              <div
                ref={statCardRef}
                className="absolute -left-16 bottom-12 bg-white rounded-2xl p-5 shadow-floating border border-gray-100"
                style={{ width: '220px' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <div className="text-3xl font-heading font-bold text-brand-text-primary">
                      100+
                    </div>
                    <div className="text-sm text-brand-text-secondary">
                      Skills shared between real people this month
                    </div>
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
