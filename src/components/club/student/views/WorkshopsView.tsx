


export function WorkshopsView() {
  const WORKSHOPS = [
    {
      emoji: '🔧',
      title: 'GSAP ScrollTrigger — Advanced Animations',
      host: 'Youssef M.',
      hostImg: 11,
      date: 'Sat, Apr 19 · 4:00 PM',
      duration: '2h',
      seats: 3,
      maxSeats: 15,
      level: 'Intermediate',
      levelStyle: 'bg-blue-50 text-blue-600 border-blue-200',
      registered: false,
    },
    {
      emoji: '📦',
      title: 'Docker & GitHub Actions for Frontend Devs',
      host: 'Karim A.',
      hostImg: 44,
      date: 'Sun, Apr 27 · 3:00 PM',
      duration: '3h',
      seats: 8,
      maxSeats: 20,
      level: 'Beginner',
      levelStyle: 'bg-green-50 text-green-600 border-green-200',
      registered: true,
    },
    {
      emoji: '⚡',
      title: 'Performance Optimization with Vite & Bundle Analysis',
      host: 'Amina K.',
      hostImg: 5,
      date: 'Tue, May 6 · 6:30 PM',
      duration: '1.5h',
      seats: 11,
      maxSeats: 25,
      level: 'Advanced',
      levelStyle: 'bg-red-50 text-red-500 border-red-200',
      registered: false,
    },
  ];
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {WORKSHOPS.map((w, i) => (
        <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 flex flex-col hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all">
          <div className="text-[36px] mb-3">{w.emoji}</div>
          <div className="text-[13px] font-bold text-navy mb-1 leading-snug">{w.title}</div>

          <div className="flex items-center gap-1.5 mb-3">
            <img src={`https://i.pravatar.cc/40?img=${w.hostImg}`} className="w-5 h-5 rounded-full object-cover" alt="" />
            <span className="text-[11px] text-[var(--color-text-muted)]">{w.host} · {w.duration}</span>
          </div>

          <div className="text-[11px] text-[var(--color-text-muted)] mb-3">{w.date}</div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" style={{ width: `${((w.maxSeats - w.seats) / w.maxSeats) * 100}%` }} />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{w.seats} seats left</span>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${w.levelStyle}`}>{w.level}</span>
            <button className={`ml-auto px-4 py-2 rounded-xl text-[12px] font-bold border transition-all ${
              w.registered
                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                : 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm hover:shadow-md'
            }`}>{w.registered ? '✓ Registered' : 'Register'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
