import { useState } from 'react';



export function NotesView() {
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine');
  const MY_NOTES = [
    { title: 'React Server Components — Deep Dive', preview: 'RSC allows components to run on the server at request time. They cannot use state or lifecycle...', updated: '2h ago', tag: 'React', tagColor: 'bg-blue-50 text-blue-600' },
    { title: 'CSS Container Queries Cheatsheet',    preview: '@container queries let you style elements based on their parent container size instead of viewport...', updated: 'Yesterday', tag: 'CSS', tagColor: 'bg-purple-50 text-purple-600' },
    { title: 'Supabase Auth — Edge Cases',           preview: 'When using magic links with custom domains, make sure to configure the site URL in the dashboard...', updated: '3d ago', tag: 'Backend', tagColor: 'bg-green-50 text-green-600' },
  ];
  const SHARED_NOTES = [
    { title: 'GSAP Scroll Workshop — Group Notes', preview: 'ScrollTrigger.create({ trigger: el, start: "top center", onEnter: () => ... }) is the primary API...', updated: '5d ago', tag: 'Animation', tagColor: 'bg-orange-50 text-orange-600' },
    { title: 'Figma Variables 2025 — Summary',     preview: 'Figma Variables now support modes. Each variable collection can have multiple value modes mapped to tokens...', updated: '1w ago', tag: 'Design', tagColor: 'bg-pink-50 text-pink-600' },
  ];
  const notes = activeTab === 'mine' ? MY_NOTES : SHARED_NOTES;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['mine', 'shared'] as const).map(t => (
            <span key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all capitalize ${
                activeTab === t ? 'bg-white text-navy shadow-sm' : 'text-[var(--color-text-muted)] hover:text-navy'
              }`}>
              {t === 'mine' ? 'My Notes' : 'Shared'}
            </span>
          ))}
        </div>
        <button className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[11px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">+ New Note</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.map((n, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-4 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors leading-snug">{n.title}</div>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0 ${n.tagColor}`}>{n.tag}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 mb-3">{n.preview}</p>
            <div className="text-[10px] text-[var(--color-text-muted)]">Updated {n.updated}</div>
          </div>
        ))}

        {/* New note placeholder */}
        <div className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange-300 hover:bg-parchment transition-all group min-h-[120px]">
          <span className="text-3xl group-hover:scale-110 transition-transform">📝</span>
          <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">New note</span>
        </div>
      </div>

    </div>
  );
}
