
import { SectionLabel } from './StudentViewShared';


export function BadgesView() {
  const EARNED = [
    { icon: '🔥', name: 'First Session',  desc: 'Complete your first skill session', newly: true },
    { icon: '⭐', name: '5-Star Teacher', desc: 'Get a 5-star review' },
    { icon: '💬', name: 'Active Voice',   desc: 'Join 10 voice rooms' },
    { icon: '🛡', name: 'Code Reviewer',  desc: 'Review 10 PRs', newly: true },
  ];
  const LOCKED = [
    { icon: '🏆', name: 'Top 3 Monthly',  desc: 'Reach top 3 on leaderboard', progress: 68 },
    { icon: '📚', name: 'Course Creator', desc: 'Publish your first course', progress: 0 },
    { icon: '🎯', name: '100 Sessions',   desc: 'Complete 100 skill sessions', progress: 47 },
    { icon: '👑', name: 'Guild Master',   desc: 'Become a club admin', progress: 0 },
  ];

  return (
    <div className="p-6">
      {/* Earned */}
      <SectionLabel>Earned · {EARNED.length} badges</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {EARNED.map(b => (
          <div key={b.name} className="relative text-center p-5 bg-white border border-[var(--color-border)] rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-md group">
            {b.newly && (
              <span className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
            )}
            <div className="text-4xl mb-2.5 group-hover:scale-110 transition-transform">{b.icon}</div>
            <div className="text-[12px] font-bold text-navy mb-1">{b.name}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Locked */}
      <SectionLabel>Locked · {LOCKED.length} remaining</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LOCKED.map(b => (
          <div key={b.name} className="relative text-center p-5 bg-white border border-[var(--color-border)] rounded-2xl cursor-pointer transition-all hover:border-orange-100 group">
            <div className="text-4xl mb-2.5 grayscale opacity-40 group-hover:opacity-50 transition-opacity">{b.icon}</div>
            <div className="text-[12px] font-bold text-[var(--color-text-muted)] mb-1">{b.name}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] leading-relaxed opacity-70">{b.desc}</div>
            {b.progress > 0 && (
              <div className="mt-3">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full" style={{ width: `${b.progress}%` }} />
                </div>
                <div className="text-[9px] text-[var(--color-text-muted)] mt-1">{b.progress}%</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
