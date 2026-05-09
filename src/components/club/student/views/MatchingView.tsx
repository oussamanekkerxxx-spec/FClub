


export function MatchingView() {
  const MATCHES = [
    {
      name: 'Nora Fassi',
      img: 26,
      online: true,
      city: 'Casablanca',
      teaches: ['Figma', 'UI/UX'],
      wants: ['React', 'TypeScript'],
      compat: 92,
      sessions: 0,
    },
    {
      name: 'Ahmed Berrada',
      img: 33,
      online: false,
      city: 'Rabat',
      teaches: ['Python', 'Data Analysis'],
      wants: ['React', 'Supabase'],
      compat: 78,
      sessions: 2,
    },
    {
      name: 'Salma Ziati',
      img: 47,
      online: true,
      city: 'Marrakech',
      teaches: ['Tailwind', 'Motion Design'],
      wants: ['Node.js', 'APIs'],
      compat: 85,
      sessions: 1,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-3.5">
        <span className="text-[20px]">🔗</span>
        <div>
          <div className="text-[12px] font-bold text-navy">AI Student Matching</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">3 new skill-compatible matches found for you</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MATCHES.map((m, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <img src={`https://i.pravatar.cc/60?img=${m.img}`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" alt={m.name} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${m.online ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-navy">{m.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">📍 {m.city}</div>
              </div>
              <div className="ml-auto text-center">
                <div className="text-[18px] font-black bg-gradient-to-r from-[var(--color-amber)] to-orange-500 bg-clip-text text-transparent">{m.compat}%</div>
                <div className="text-[9px] text-[var(--color-text-muted)]">match</div>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Can teach you</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.teaches.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 text-[10px] font-semibold rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Wants to learn</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.wants.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-semibold rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {m.sessions > 0 && (
              <div className="text-[10px] text-[var(--color-text-muted)] mt-3">{m.sessions} session{m.sessions > 1 ? 's' : ''} together</div>
            )}

            <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
              Connect →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
