import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, FileText, CheckCircle, Lock } from 'lucide-react';

interface CoursePageProps {
  className?: string;
}

export default function CoursePage({ className = '' }: CoursePageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const courseCardRef = useRef<HTMLDivElement>(null);
  const moduleCardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const courseCard = courseCardRef.current;
    const moduleCard = moduleCardRef.current;

    if (!section || !headline || !courseCard || !moduleCard) return;

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
        courseCard,
        { x: '-60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        moduleCard,
        { y: '-20vh', opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(
        headline,
        { x: '50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.08
      );

      // Phase 3: EXIT (70-100%)
      scrollTl.fromTo(
        courseCard,
        { x: 0, opacity: 1 },
        { x: '-35vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        headline,
        { x: 0, opacity: 1 },
        { x: '35vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        moduleCard,
        { y: 0, opacity: 1 },
        { y: '-16vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const modules = [
    { title: 'Introduction to Programming', duration: '2h', completed: true },
    { title: 'Variables and Data Types', duration: '3h', completed: true },
    { title: 'Control Structures', duration: '4h', completed: true },
    { title: 'Functions and Modules', duration: '3h', completed: false, current: true },
    { title: 'Object-Oriented Programming', duration: '5h', completed: false, locked: true },
  ];

  return (
    <section
      ref={sectionRef}
      className={`section-pinned bg-brand-bg ${className}`}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative w-full h-full flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-[8vw]">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content - Course Card */}
            <div className="relative order-2 lg:order-1">
              <div
                ref={courseCardRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden"
                style={{ minHeight: '520px' }}
              >
                {/* Course Header */}
                <div className="relative h-40 bg-gradient-to-br from-blue-500 to-blue-600">
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-white/80 text-sm font-medium mb-1">
                      CS 101
                    </div>
                    <h3 className="text-white font-heading font-bold text-xl">
                      Introduction to Computer Science
                    </h3>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5">
                  {/* Progress */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-brand-text-secondary">
                        Course Progress
                      </span>
                      <span className="font-medium text-brand-text-primary">
                        65%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-accent rounded-full"
                        style={{ width: '65%' }}
                      />
                    </div>
                  </div>

                  {/* Modules */}
                  <div className="space-y-2">
                    {modules.map((module, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          module.current
                            ? 'bg-brand-bg-secondary border border-brand-accent/20'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            module.completed
                              ? 'bg-green-100'
                              : module.locked
                              ? 'bg-gray-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          {module.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : module.locked ? (
                            <Lock className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Play className="w-4 h-4 text-brand-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium truncate ${
                              module.locked
                                ? 'text-brand-text-secondary'
                                : 'text-brand-text-primary'
                            }`}
                          >
                            {module.title}
                          </div>
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {module.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Module Card */}
              <div
                ref={moduleCardRef}
                className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-floating border border-gray-100"
                style={{ width: '200px' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-brand-text-primary">
                      4 Modules
                    </div>
                    <div className="text-xs text-brand-text-secondary">
                      Completed this week
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div ref={headlineRef} className="max-w-lg order-1 lg:order-2">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-[40px] text-brand-text-primary leading-tight">
                A clear path through every course.
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Modules, readings, and videos—organized so you always know what's
                next.
              </p>
              <Link
                to="/app/courses"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                See how courses work
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
