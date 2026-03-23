import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ChevronRight, Users, MapPin, Clock, Plus } from 'lucide-react';

interface StudyGroupsProps {
  className?: string;
}

export default function StudyGroups({ className = '' }: StudyGroupsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const groups = groupsRef.current;
    const members = membersRef.current;

    if (!section || !headline || !groups || !members) return;

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
        groups,
        { x: '-60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        members,
        { y: '18vh', opacity: 0, scale: 0.9 },
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
        groups,
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
        members,
        { y: 0, opacity: 1 },
        { y: '14vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const groups = [
    {
      name: 'Algorithms Study Circle',
      course: 'CS 202',
      members: 6,
      maxMembers: 8,
      meetingTime: 'Tuesdays 4-6 PM',
      location: 'Library Room 205',
      joined: true,
    },
    {
      name: 'Linear Algebra Problem Solvers',
      course: 'MATH 301',
      members: 4,
      maxMembers: 10,
      meetingTime: 'Thursdays 3-5 PM',
      location: 'Math Building Lounge',
      joined: false,
    },
  ];

  const memberAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
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
            {/* Left Content - Groups Card */}
            <div className="relative order-2 lg:order-1">
              <div
                ref={groupsRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden p-5"
                style={{ minHeight: '480px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-lg text-brand-text-primary">
                    Study Groups
                  </h3>
                  <button className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center hover:bg-brand-accent/90 transition-colors">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Groups List */}
                <div className="space-y-4">
                  {groups.map((group, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-gray-100 hover:border-brand-accent/30 hover:bg-brand-bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-brand-text-primary">
                            {group.name}
                          </h4>
                          <p className="text-sm text-brand-text-secondary">
                            {group.course}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            group.joined
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-brand-text-secondary'
                          }`}
                        >
                          {group.joined ? 'Joined' : 'Open'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-brand-text-secondary mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {group.members}/{group.maxMembers} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {group.meetingTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-brand-text-secondary">
                        <MapPin className="w-3.5 h-3.5" />
                        {group.location}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create Group CTA */}
                <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-brand-text-secondary hover:border-brand-accent/50 hover:text-brand-accent transition-colors">
                  + Create a new study group
                </button>
              </div>

              {/* Floating Members Card */}
              <div
                ref={membersRef}
                className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white rounded-xl p-4 shadow-floating border border-gray-100"
                style={{ width: '160px' }}
              >
                <div className="text-sm font-medium text-brand-text-primary mb-3">
                  Active Members
                </div>
                <div className="flex -space-x-2">
                  {memberAvatars.map((avatar, index) => (
                    <img
                      key={index}
                      src={avatar}
                      alt={`Member ${index + 1}`}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-brand-bg-secondary border-2 border-white flex items-center justify-center text-xs font-medium text-brand-accent">
                    +12
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div ref={headlineRef} className="max-w-lg order-1 lg:order-2">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-[40px] text-brand-text-primary leading-tight">
                Study better together.
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Join groups for your courses, share notes, and schedule sessions.
              </p>
              <Link
                to="/app/study-groups"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                Browse groups
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
