import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ChevronRight, Upload, CheckCircle, Clock } from 'lucide-react';

interface AssignmentFlowProps {
  className?: string;
}

export default function AssignmentFlow({ className = '' }: AssignmentFlowProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const assignmentRef = useRef<HTMLDivElement>(null);
  const uploadChipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const assignment = assignmentRef.current;
    const uploadChip = uploadChipRef.current;

    if (!section || !headline || !assignment || !uploadChip) return;

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
        assignment,
        { x: '60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        uploadChip,
        { y: '20vh', opacity: 0, scale: 0.9 },
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
        assignment,
        { x: 0, opacity: 1 },
        { x: '30vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        uploadChip,
        { y: 0, opacity: 1 },
        { y: '16vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

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
                Submit with confidence.
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Read the brief, attach your work, and confirm it's in. We'll keep a
                receipt.
              </p>
              <Link
                to="/app/assignments"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                View assignment features
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Content - Assignment Card */}
            <div className="relative">
              <div
                ref={assignmentRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden"
                style={{ minHeight: '520px' }}
              >
                {/* Assignment Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-brand-text-secondary mb-2">
                    <span>CS 101</span>
                    <span>•</span>
                    <span>Assignment 4</span>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-brand-text-primary">
                    Python Functions Assignment
                  </h3>
                </div>

                {/* Assignment Content */}
                <div className="p-5">
                  {/* Due Date */}
                  <div className="flex items-center gap-2 mb-5 p-3 bg-amber-50 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Due Friday, March 15 at 11:59 PM
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-5">
                    <h4 className="font-medium text-brand-text-primary mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-brand-text-secondary leading-relaxed">
                      Implement a set of utility functions including factorial,
                      fibonacci, and prime number checking. Submit your code as a
                      single .py file.
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="mb-5">
                    <h4 className="font-medium text-brand-text-primary mb-2">
                      Your Submission
                    </h4>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-accent/50 hover:bg-brand-bg-secondary/50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-brand-bg-secondary flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-brand-accent" />
                      </div>
                      <p className="text-sm text-brand-text-primary font-medium mb-1">
                        Drop files here or click to upload
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        Supports .py, .zip, .pdf up to 50MB
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button className="w-full btn-primary py-3 border-0">
                    Submit Assignment
                  </button>
                </div>
              </div>

              {/* Floating Upload Confirmation Chip */}
              <div
                ref={uploadChipRef}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-floating border border-gray-100"
                style={{ width: '200px' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-brand-text-primary">
                      Uploaded!
                    </div>
                    <div className="text-xs text-brand-text-secondary">
                      functions.py (2.4 KB)
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
