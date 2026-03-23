import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Award, Target } from 'lucide-react';

interface ProgressAnalyticsProps {
  className?: string;
}

export default function ProgressAnalytics({ className = '' }: ProgressAnalyticsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const insightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const analytics = analyticsRef.current;
    const insight = insightRef.current;

    if (!section || !headline || !analytics || !insight) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Phase 1: ENTRANCE (0-30%)
      scrollTl.fromTo(
        headline,
        { x: '-50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        analytics,
        { x: '60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        insight,
        { y: '18vh', opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0.12
      );

      // Phase 3: EXIT (70-100%)
      scrollTl.fromTo(
        headline,
        { x: 0, opacity: 1 },
        { x: '-30vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        analytics,
        { x: 0, opacity: 1 },
        { x: '30vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        insight,
        { y: 0, opacity: 1 },
        { y: '14vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const stats = [
    { label: 'Average Grade', value: '87%', icon: Award, color: 'bg-amber-100 text-amber-600' },
    { label: 'Completion Rate', value: '78%', icon: Target, color: 'bg-blue-100 text-blue-600' },
    { label: 'Study Streak', value: '7 days', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  ];

  return (
    <section
      ref={sectionRef}
      className={`section-pinned bg-brand-bg-secondary ${className}`}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full h-full flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div ref={headlineRef} className="max-w-lg">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-[40px] text-brand-text-primary leading-tight">
                Know where you stand.
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Track completion, see feedback trends, and focus on what matters
                most.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                View insights
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Content - Analytics Card */}
            <div className="relative">
              <div
                ref={analyticsRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden p-5"
                style={{ minHeight: '480px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-bold text-lg text-brand-text-primary">
                    Your Progress
                  </h3>
                  <select className="text-sm text-brand-text-secondary bg-gray-50 rounded-lg px-3 py-1.5 border-0">
                    <option>This Semester</option>
                    <option>Last Semester</option>
                  </select>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="text-xl font-bold text-brand-text-primary">
                        {stat.value}
                      </div>
                      <div className="text-xs text-brand-text-secondary mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Chart */}
                <div className="mb-6">
                  <h4 className="font-medium text-brand-text-primary mb-4">
                    Course Progress
                  </h4>
                  <div className="space-y-4">
                    {[
                      { name: 'CS 101', progress: 65, color: 'bg-blue-500' },
                      { name: 'CS 202', progress: 42, color: 'bg-green-500' },
                      { name: 'MATH 301', progress: 78, color: 'bg-purple-500' },
                      { name: 'ENG 205', progress: 30, color: 'bg-amber-500' },
                    ].map((course) => (
                      <div key={course.name}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-brand-text-primary">{course.name}</span>
                          <span className="text-brand-text-secondary">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${course.color} rounded-full transition-all duration-500`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-medium text-brand-text-primary mb-3">
                    Recent Activity
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-brand-text-primary flex-1">
                        Completed Module 4 in CS 101
                      </span>
                      <span className="text-xs text-brand-text-secondary">2h ago</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-brand-text-primary flex-1">
                        Submitted Assignment 3
                      </span>
                      <span className="text-xs text-brand-text-secondary">Yesterday</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Insight Pill */}
              <div
                ref={insightRef}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-floating border border-gray-100"
                style={{ width: '220px' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600">
                    Insight
                  </span>
                </div>
                <div className="text-sm text-brand-text-primary">
                  You're on track to improve your average by 5% this month!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
