import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Clock, MapPin } from 'lucide-react';

interface CalendarPlannerProps {
  className?: string;
}

export default function CalendarPlanner({ className = '' }: CalendarPlannerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const eventCardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const calendar = calendarRef.current;
    const eventCard = eventCardRef.current;

    if (!section || !headline || !calendar || !eventCard) return;

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
        calendar,
        { x: '-60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        eventCard,
        { y: '20vh', opacity: 0, scale: 0.9 },
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
        calendar,
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
        eventCard,
        { y: 0, opacity: 1 },
        { y: '16vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const events = [
    { day: 11, hasEvent: false },
    { day: 12, hasEvent: true, type: 'class' },
    { day: 13, hasEvent: true, type: 'study' },
    { day: 14, hasEvent: false },
    { day: 15, hasEvent: true, type: 'assignment' },
    { day: 16, hasEvent: false },
    { day: 17, hasEvent: false },
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
            {/* Left Content - Calendar Card */}
            <div className="relative order-2 lg:order-1">
              <div
                ref={calendarRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden p-5"
                style={{ minHeight: '480px' }}
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-lg text-brand-text-primary">
                    March 2024
                  </h3>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-brand-text-secondary py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative ${
                        event.day === 13
                          ? 'bg-brand-accent text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          event.day === 13
                            ? 'text-white'
                            : 'text-brand-text-primary'
                        }`}
                      >
                        {event.day}
                      </span>
                      {event.hasEvent && (
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1 ${
                            event.day === 13
                              ? 'bg-white'
                              : event.type === 'assignment'
                              ? 'bg-amber-500'
                              : event.type === 'class'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Upcoming Events List */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h4 className="font-medium text-sm text-brand-text-primary mb-3">
                    Today's Events
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-brand-text-primary">
                          CS 202 Lecture
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-brand-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            10:00 AM
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Tech 101
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-brand-text-primary">
                          Study Group Meeting
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-brand-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            4:00 PM
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Library 205
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Event Detail Card */}
              <div
                ref={eventCardRef}
                className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white rounded-xl p-4 shadow-floating border border-gray-100"
                style={{ width: '200px' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-brand-accent" />
                  <span className="text-xs text-brand-text-secondary">
                    March 15
                  </span>
                </div>
                <div className="text-sm font-medium text-brand-text-primary mb-1">
                  Assignment Due
                </div>
                <div className="text-xs text-brand-text-secondary">
                  Python Functions - CS 101
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div ref={headlineRef} className="max-w-lg order-1 lg:order-2">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-[40px] text-brand-text-primary leading-tight">
                Plan your week in seconds.
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Sync with Google Calendar, filter by course, and protect time to
                study.
              </p>
              <Link
                to="/app/calendar"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                Explore the planner
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
