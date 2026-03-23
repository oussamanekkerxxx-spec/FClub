import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  FileText,
  MessageCircle,
  Clock,
  ChevronRight,
  Bell,
} from 'lucide-react';

interface DashboardPreviewProps {
  className?: string;
}

export default function DashboardPreview({ className = '' }: DashboardPreviewProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const dashboard = dashboardRef.current;
    const notification = notificationRef.current;

    if (!section || !headline || !dashboard || !notification) return;

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
        dashboard,
        { x: '60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        notification,
        { y: '-20vh', opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0.12
      );

      // Phase 2: SETTLE (30-70%) - elements hold position

      // Phase 3: EXIT (70-100%)
      scrollTl.fromTo(
        headline,
        { x: 0, opacity: 1 },
        { x: '-30vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        dashboard,
        { x: 0, opacity: 1 },
        { x: '30vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        notification,
        { y: 0, opacity: 1 },
        { y: '-16vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const upcomingItems = [
    { icon: Calendar, title: 'Guitar Lesson with Maya', course: 'Music', time: 'Tomorrow 3PM' },
    { icon: MessageCircle, title: 'Message from Marcus', course: 'Photography', time: '2h ago' },
    { icon: FileText, title: 'Coding Bootcamp Session', course: 'Web Dev', time: 'Thu 6PM' },
  ];

  const stats = [
    { label: 'Skills Bookmarked', value: '8', color: 'bg-blue-500' },
    { label: 'Upcoming Sessions', value: '2', color: 'bg-amber-500' },
    { label: 'Teachers Followed', value: '5', color: 'bg-green-500' },
  ];

  return (
    <section
      ref={sectionRef}
      id="dashboard"
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
                Your learning command center
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Track your booked sessions, discover new skills, and message your teachers — all from one place.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                Explore the dashboard
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Content - Dashboard Card */}
            <div className="relative">
              <div
                ref={dashboardRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden"
                style={{ minHeight: '520px' }}
              >
                {/* Dashboard Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                      <input
                        type="text"
                        placeholder="Search skills, teachers..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                        readOnly
                      />
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Bell className="w-5 h-5 text-brand-text-secondary" />
                    </button>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-5">
                  {/* Stats */}
                  <div className="flex gap-3 mb-6">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex-1 bg-gray-50 rounded-xl p-3 text-center"
                      >
                        <div
                          className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                        >
                          <span className="text-white font-bold text-sm">
                            {stat.value}
                          </span>
                        </div>
                        <div className="text-xs text-brand-text-secondary">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upcoming Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-semibold text-brand-text-primary">
                        Upcoming
                      </h3>
                      <button className="text-sm text-brand-accent">View all</button>
                    </div>
                    <div className="space-y-3">
                      {upcomingItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-lg bg-brand-bg-secondary flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-brand-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-brand-text-primary truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-brand-text-secondary">
                              {item.course}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-brand-text-secondary">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini Calendar Strip */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div
                          key={i}
                          className={`flex flex-col items-center gap-1 ${
                            i === 2 ? 'text-brand-accent' : 'text-brand-text-secondary'
                          }`}
                        >
                          <span className="text-xs">{day}</span>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                              i === 2
                                ? 'bg-brand-accent text-white'
                                : 'bg-gray-50 text-brand-text-primary'
                            }`}
                          >
                            {11 + i}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Notification Card */}
              <div
                ref={notificationRef}
                className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-floating border border-gray-100"
                style={{ width: '180px' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-brand-text-primary">
                      Session confirmed
                    </div>
                    <div className="text-xs text-brand-text-secondary mt-1">
                      Web Design with Alex
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
