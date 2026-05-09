


export function CareerView() {
  const GUIDES = [
    {
      icon: '🖥',
      title: 'Frontend Developer Roadmap',
      subtitle: 'Morocco Tech Market 2025',
      desc: 'A full learning path from HTML/CSS basics to landing your first frontend role at a Moroccan startup or remote company. Covers tools, frameworks, salary ranges, and portfolio tips.',
      tags: ['React', 'TypeScript', 'Tailwind', 'Supabase'],
      color: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      btnStyle: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
    },
    {
      icon: '💼',
      title: 'Freelancing in Morocco',
      subtitle: 'Upwork · Fiverr · Local Clients',
      desc: 'Practical guide to getting your first freelance client as a Moroccan developer. Covers proposal writing, pricing in MAD vs USD, payment gateways (PayoneerSa), and client communication.',
      tags: ['Freelance', 'Upwork', 'Pricing', 'Contracts'],
      color: 'from-orange-50 to-amber-50',
      border: 'border-orange-100',
      btnStyle: 'bg-orange-50 text-[var(--color-amber)] border-orange-200 hover:bg-orange-100',
    },
    {
      icon: '🎓',
      title: 'Getting into Big Tech',
      subtitle: 'Interview Prep & Networking',
      desc: 'Step-by-step preparation for landing roles at international tech companies from Morocco. Covers algorithm practice, system design, behavioral interviews, and remote work visa options.',
      tags: ['LeetCode', 'System Design', 'DSA', 'Remote'],
      color: 'from-green-50 to-emerald-50',
      border: 'border-green-100',
      btnStyle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
    },
  ];
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {GUIDES.map((g, i) => (
          <div key={i} className={`bg-gradient-to-br ${g.color} border ${g.border} rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer group flex flex-col`}>
            <div className="text-[40px] mb-3 group-hover:scale-105 transition-transform">{g.icon}</div>
            <div className="text-[14px] font-bold text-navy mb-0.5">{g.title}</div>
            <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{g.subtitle}</div>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed flex-1 mb-4">{g.desc}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {g.tags.map(t => (
                <span key={t} className="text-[9px] font-bold px-2 py-0.5 bg-white/70 border border-white/80 text-[var(--color-text-secondary)] rounded-full">{t}</span>
              ))}
            </div>
            <button className={`w-full py-2.5 rounded-xl text-[12px] font-bold border transition-colors ${g.btnStyle}`}>Read Guide →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
