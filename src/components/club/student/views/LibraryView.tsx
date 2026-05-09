import { useState } from 'react';



export function LibraryView() {
  const [cat, setCat] = useState(0);
  const CATS = ['All', 'Cheat Sheets', 'Past Exams', 'Career', 'Recordings'];
  const RESOURCES = [
    { icon: '📜', iconBg: 'bg-orange-100/70', title: 'CSS Grid & Flexbox Cheat Sheet', desc: 'Quick visual reference for all grid and flex properties.', type: 'Cheat Sheet', btnText: 'View', btnStyle: 'bg-blue-50 text-blue-600 border-blue-200' },
    { icon: '📊', iconBg: 'bg-purple-100/70', title: 'Data Structures & Algorithms Overview', desc: 'Big-O cheatsheet + patterns: sliding window, two-pointer, BFS/DFS...', type: 'Cheat Sheet', btnText: 'View', btnStyle: 'bg-blue-50 text-blue-600 border-blue-200' },
    { icon: '🧠', iconBg: 'bg-green-100/70', title: 'React Interview Questions 2025', desc: '50 common React interview questions with answers and code examples.', type: 'Guide', btnText: 'Practice', btnStyle: 'bg-green-50 text-green-600 border-green-200' },
    { icon: '🌍', iconBg: 'bg-amber-100/70', title: 'Frontend Roadmap — Morocco Tech Jobs', desc: 'Skills required for mid-level frontend roles at top Moroccan companies.', type: 'Career', btnText: 'Read', btnStyle: 'bg-orange-50 text-[var(--color-amber)] border-orange-200' },
  ];
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-2 mb-5">
        {CATS.map((c, i) => (
          <span key={c} onClick={() => setCat(i)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              cat === i ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                       : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-200'
            }`}>{c}</span>
        ))}
      </div>
      <div className="space-y-2.5">
        {RESOURCES.map((r, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0 ${r.iconBg}`}>{r.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors truncate">{r.title}</div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed line-clamp-1">{r.desc}</div>
            </div>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] bg-gray-50 border border-[var(--color-border)] px-2 py-0.5 rounded-full flex-shrink-0">{r.type}</span>
            <button className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border flex-shrink-0 transition-colors ${r.btnStyle}`}>{r.btnText}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
