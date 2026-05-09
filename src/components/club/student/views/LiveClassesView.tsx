
import { SectionLabel } from './StudentViewShared';


export function LiveClassesView() {
  const CLASSES = [
    {
      live: true,
      title: 'React Query v5 — Practical Patterns',
      host: 'Oussama H.',
      hostImg: 68,
      viewers: 32,
      startedAgo: '18 min ago',
      thumbnail: 'https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=400&q=60',
    },
    {
      live: false,
      title: 'Intro to TypeScript Generics',
      host: 'Layla B.',
      hostImg: 15,
      viewers: 0,
      scheduledAt: 'Tomorrow · 5:00 PM',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=60',
    },
    {
      live: false,
      title: 'Building a Design System from Scratch',
      host: 'Amina K.',
      hostImg: 5,
      viewers: 0,
      scheduledAt: 'Sat Apr 26 · 3:00 PM',
      thumbnail: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=60',
    },
  ];
  return (
    <div className="p-6">
      {/* LIVE NOW banner */}
      {CLASSES.filter(c => c.live).map((c, i) => (
        <div key={i} className="relative mb-6 rounded-2xl overflow-hidden border-2 border-red-400/30 shadow-lg shadow-red-500/10 group cursor-pointer">
          <img src={c.thumbnail} alt="" className="w-full h-[180px] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="text-[11px] text-white/80 font-medium">{c.startedAgo}</span>
            </div>
            <div>
              <div className="text-[16px] font-black text-white mb-2 leading-snug">{c.title}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={`https://i.pravatar.cc/40?img=${c.hostImg}`} className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="" />
                  <span className="text-[12px] text-white font-semibold">{c.host}</span>
                  <span className="text-[11px] text-white/60">· {c.viewers} watching</span>
                </div>
                <button className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[12px] font-black rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Join Live →
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Scheduled classes */}
      <SectionLabel>Scheduled</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CLASSES.filter(c => !c.live).map((c, i) => (
          <div key={i} className="flex items-center gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors truncate">{c.title}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <img src={`https://i.pravatar.cc/40?img=${c.hostImg}`} className="w-4 h-4 rounded-full object-cover" alt="" />
                <span className="text-[11px] text-[var(--color-text-muted)] truncate">{c.host} · {c.scheduledAt}</span>
              </div>
            </div>
            <button className="flex-shrink-0 px-3.5 py-1.5 bg-gray-50 border border-[var(--color-border)] text-navy text-[11px] font-semibold rounded-xl hover:bg-parchment hover:border-orange-200 transition-colors">
              Remind
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
