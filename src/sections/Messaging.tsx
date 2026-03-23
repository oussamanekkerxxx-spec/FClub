import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ChevronRight, Send, Paperclip, MoreVertical } from 'lucide-react';

interface MessagingProps {
  className?: string;
}

export default function Messaging({ className = '' }: MessagingProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const chat = chatRef.current;
    const typing = typingRef.current;

    if (!section || !headline || !chat || !typing) return;

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
        chat,
        { x: '60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        typing,
        { y: '-16vh', opacity: 0, scale: 0.9 },
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
        chat,
        { x: 0, opacity: 1 },
        { x: '30vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        typing,
        { y: 0, opacity: 1 },
        { y: '-12vh', opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const messages = [
    {
      id: 1,
      sender: 'Dr. Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      content: 'Hi Alex! I saw your question about the assignment. The deadline has been extended to Friday.',
      time: '2:30 PM',
      isMe: false,
    },
    {
      id: 2,
      sender: 'Me',
      content: "That's great news, thank you! Will there be office hours tomorrow?",
      time: '2:32 PM',
      isMe: true,
    },
    {
      id: 3,
      sender: 'Dr. Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      content: 'Yes, I\'ll be in my office from 2-4 PM. Feel free to stop by!',
      time: '2:35 PM',
      isMe: false,
    },
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
                Talk to your people.
              </h2>
              <p className="mt-5 text-lg text-brand-text-secondary leading-relaxed">
                Instructors, TAs, and classmates—threaded, searchable, and in one
                place.
              </p>
              <Link
                to="/app/messages"
                className="inline-flex items-center gap-2 mt-6 text-brand-accent font-medium hover:underline"
              >
                See messaging
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Content - Chat Card */}
            <div className="relative">
              <div
                ref={chatRef}
                className="bg-white rounded-2xl shadow-floating border border-gray-100 overflow-hidden"
                style={{ minHeight: '520px' }}
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                      alt="Dr. Sarah Chen"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-brand-text-primary">
                        Dr. Sarah Chen
                      </div>
                      <div className="text-xs text-green-600">Online</div>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <MoreVertical className="w-5 h-5 text-brand-text-secondary" />
                  </button>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-4" style={{ minHeight: '320px' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.isMe ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {!message.isMe && (
                        <img
                          src={message.avatar}
                          alt={message.sender}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div
                        className={`max-w-[70%] ${
                          message.isMe ? 'text-right' : ''
                        }`}
                      >
                        <div
                          className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                            message.isMe
                              ? 'bg-brand-accent text-white rounded-br-md'
                              : 'bg-gray-100 text-brand-text-primary rounded-bl-md'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-brand-text-secondary mt-1">
                          {message.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <Paperclip className="w-5 h-5 text-brand-text-secondary" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      readOnly
                    />
                    <button className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center hover:bg-brand-accent/90 transition-colors">
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Typing Indicator */}
              <div
                ref={typingRef}
                className="absolute -top-3 -left-3 bg-white rounded-xl px-4 py-2 shadow-floating border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-brand-text-secondary">
                    Dr. Chen is typing...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
