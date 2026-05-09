


export function MentorsView() {
  const MENTORS = [
    {
      name: 'Amina Khaldi',
      img: 5,
      title: 'Senior Frontend Engineer',
      company: 'OCP Digital',
      online: true,
      rating: 4.9,
      sessions: 38,
      skills: ['React', 'TypeScript', 'System Design'],
      price: 'Free',
      priceStyle: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      name: 'Oussama H.',
      img: 68,
      title: 'Fullstack Developer',
      company: 'Freelance',
      online: true,
      rating: 5.0,
      sessions: 47,
      skills: ['Supabase', 'Node.js', 'RLS'],
      price: 'Free',
      priceStyle: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      name: 'Layla Bennani',
      img: 15,
      title: 'UX/UI Designer',
      company: 'Wafatech',
      online: false,
      rating: 4.7,
      sessions: 21,
      skills: ['Figma', 'Design Systems', 'Prototyping'],
      price: 'Free',
      priceStyle: 'bg-green-50 text-green-600 border-green-200',
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MENTORS.map((m, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <img src={`https://i.pravatar.cc/80?img=${m.img}`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" alt={m.name} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${m.online ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-navy">{m.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">{m.title} · {m.company}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {'★★★★★'.split('').slice(0, Math.round(m.rating)).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-[13px]">★</span>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-navy">{m.rating}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">· {m.sessions} sessions</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
              {m.skills.map(s => (
                <span key={s} className="px-2 py-0.5 bg-gray-50 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px] font-semibold rounded-full">{s}</span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[var(--color-border)]">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.priceStyle}`}>{m.price}</span>
              <button className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                Ask a Question
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
