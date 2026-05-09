import { useState } from 'react';



export function LeaderboardView() {
  const MEMBERS = [
    { rank: 1, name: 'Oussama H.',    contributions: 47, xp: '1,280', img: 68 },
    { rank: 2, name: 'Amina Khaldi',  contributions: 38, xp: '1,045', img: 5 },
    { rank: 3, name: 'Youssef Maachi',contributions: 31, xp: '890',   img: 11 },
    { rank: 4, name: 'Layla Bennani', contributions: 24, xp: '720',   img: 15 },
    { rank: 5, name: 'Reda Tazi',     contributions: 18, xp: '540',   img: 22 },
  ];
  const [filter, setFilter] = useState(0);
  const rankStyle = (r: number) => {
    if (r === 1) return 'bg-gradient-to-br from-yellow-300 to-amber-400 text-amber-900 shadow-sm shadow-yellow-400/30';
    if (r === 2) return 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700';
    if (r === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
    return 'bg-gray-100 text-gray-500';
  };
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-5">
        {['This Month', 'All Time', 'This Week'].map((f, i) => (
          <span
            key={f}
            onClick={() => setFilter(i)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              i === filter
                ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-200'
            }`}
          >{f}</span>
        ))}
      </div>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-3 mb-6 px-4">
        {[MEMBERS[1], MEMBERS[0], MEMBERS[2]].map((m, i) => {
          const heights = ['h-16', 'h-24', 'h-12'];
          const crowns = ['🥈', '🥇', '🥉'];
          return (
            <div key={m.rank} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-lg">{crowns[i]}</span>
              <img src={`https://i.pravatar.cc/60?img=${m.img}`} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" alt={m.name} />
              <div className="text-[10px] font-bold text-navy text-center truncate w-full">{m.name.split(' ')[0]}</div>
              <div className={`w-full ${heights[i]} rounded-t-xl flex items-end justify-center pb-1.5 ${
                i === 1 ? 'bg-gradient-to-t from-amber-400/30 to-amber-400/10 border-t-2 border-amber-400/30' :
                i === 0 ? 'bg-gradient-to-t from-gray-300/30 to-gray-300/10 border-t-2 border-gray-300/30' :
                'bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-t-2 border-amber-600/20'
              }`}>
                <span className="text-[10px] font-black text-[var(--color-amber)]">{m.xp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {MEMBERS.map((m, i) => (
          <div key={m.rank} className={`flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-gray-50/50 ${
            i < MEMBERS.length - 1 ? 'border-b border-[var(--color-border)]' : ''
          } ${m.rank === 1 ? 'bg-amber-50/30' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0 ${rankStyle(m.rank)}`}>
              {m.rank}
            </div>
            <img src={`https://i.pravatar.cc/60?img=${m.img}`} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" alt={m.name} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy truncate">{m.name}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{m.contributions} contributions</div>
            </div>
            <div className="text-[17px] font-black bg-gradient-to-r from-[var(--color-amber)] to-orange-500 bg-clip-text text-transparent tabular-nums">{m.xp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
