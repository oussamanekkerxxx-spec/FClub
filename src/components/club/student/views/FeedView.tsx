


export function FeedView() {
  const ITEMS = [
    {
      type: 'Course',
      typeStyle: 'bg-blue-50 text-blue-600',
      icon: '📚',
      iconBg: 'bg-blue-100/60',
      title: 'Recommended: Advanced TypeScript Patterns',
      reason: 'Because you completed React Hooks Masterclass and have been studying TypeScript flashcards.',
      cta: 'Start Course',
      ctaStyle: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
    },
    {
      type: 'Student',
      typeStyle: 'bg-green-50 text-green-600',
      icon: '👤',
      iconBg: 'bg-green-100/60',
      title: 'Study partner match: Nora Fassi — 85% compatible',
      reason: 'You both want to learn Figma and have similar XP levels and schedule availability.',
      cta: 'Connect',
      ctaStyle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
    },
    {
      type: 'Resource',
      typeStyle: 'bg-purple-50 text-purple-600',
      icon: '📜',
      iconBg: 'bg-purple-100/60',
      title: 'Trending: CSS Container Queries Cheat Sheet',
      reason: '18 members viewed this resource in the last 48h. Your notes on CSS are unfinished.',
      cta: 'View',
      ctaStyle: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
    },
    {
      type: 'Event',
      typeStyle: 'bg-amber-50 text-amber-600',
      icon: '🎉',
      iconBg: 'bg-amber-100/60',
      title: 'Happening soon: Monthly Guild Meetup — Apr 18',
      reason: "3 of your connections are attending. You haven't RSVP'd yet.",
      cta: 'RSVP',
      ctaStyle: 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white border-transparent shadow-sm hover:shadow-md',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-3.5">
        <span className="text-[20px]">🤖</span>
        <div>
          <div className="text-[12px] font-bold text-navy">AI Smart Feed</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">Personalised to your activity, XP, and interests</div>
        </div>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-start gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${item.iconBg}`}>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.typeStyle}`}>{item.type}</span>
              </div>
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors">{item.title}</div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">{item.reason}</div>
            </div>
            <button className={`flex-shrink-0 self-center px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap ${item.ctaStyle}`}>{item.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
