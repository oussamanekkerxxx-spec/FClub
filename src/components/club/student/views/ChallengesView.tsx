


export function ChallengesView() {
  const CHALLENGES = [
    {
      icon: '🔥',
      title: '7-Day Coding Streak',
      desc: 'Write code every day for 7 consecutive days.',
      xpReward: 150,
      progress: 5,
      total: 7,
      daysLeft: 2,
      color: 'from-orange-400 to-red-500',
      bgLight: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      icon: '💬',
      title: 'Club Contributor',
      desc: 'Post 10 messages in Group Chat this week.',
      xpReward: 80,
      progress: 7,
      total: 10,
      daysLeft: 4,
      color: 'from-blue-400 to-indigo-500',
      bgLight: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      icon: '📚',
      title: 'Knowledge Sharer',
      desc: 'Complete 3 courses before end of month.',
      xpReward: 200,
      progress: 1,
      total: 3,
      daysLeft: 14,
      color: 'from-purple-400 to-violet-500',
      bgLight: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      icon: '🤝',
      title: 'Mentor a Member',
      desc: 'Answer 5 questions on the Q&A board.',
      xpReward: 120,
      progress: 2,
      total: 5,
      daysLeft: 7,
      color: 'from-green-400 to-emerald-500',
      bgLight: 'bg-green-50',
      border: 'border-green-100',
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHALLENGES.map((c, i) => {
          const pct = Math.round((c.progress / c.total) * 100);
          return (
            <div key={i} className={`bg-white border ${c.border} rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bgLight} flex items-center justify-center text-[22px] flex-shrink-0`}>{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-navy">{c.title}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{c.desc}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[13px] font-black text-[var(--color-amber)]">⧆ +{c.xpReward} XP</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{c.daysLeft}d left</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${c.color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-navy whitespace-nowrap">{c.progress}/{c.total}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">{pct}% complete</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
