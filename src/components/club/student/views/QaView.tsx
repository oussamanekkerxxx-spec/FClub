import { useState } from 'react';



export function QaView() {
  const [showForm, setShowForm] = useState(false);
  const QUESTIONS = [
    {
      votes: 14,
      title: 'What is the best way to handle global state in a large React app?',
      tags: ['React', 'State Management'],
      author: 'Ahmed B.',
      authorImg: 33,
      answers: 3,
      answered: true,
      timeSince: '2h ago',
    },
    {
      votes: 7,
      title: 'How do you configure Supabase RLS for multi-tenant apps?',
      tags: ['Supabase', 'Security'],
      author: 'Nora F.',
      authorImg: 26,
      answers: 1,
      answered: false,
      timeSince: '5h ago',
    },
    {
      votes: 22,
      title: 'Is it better to use CSS Grid or Flexbox for a dashboard layout?',
      tags: ['CSS', 'Layout'],
      author: 'Layla B.',
      authorImg: 15,
      answers: 5,
      answered: true,
      timeSince: '1d ago',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          {['All Questions', 'Unanswered', 'My Questions'].map((f, i) => (
            <span key={f} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              i === 0 ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                      : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-200'
            }`}>{f}</span>
          ))}
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
        >+ Ask Question</button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm space-y-3">
          <input
            type="text"
            placeholder="Your question…"
            className="w-full h-10 px-4 bg-gray-50 border border-[var(--color-border)] rounded-xl text-[13px] text-navy focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[12px] font-semibold text-[var(--color-text-muted)] bg-gray-50 border border-[var(--color-border)] rounded-xl hover:bg-gray-100">Cancel</button>
            <button className="px-5 py-2 text-[12px] font-bold bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white rounded-xl shadow-sm">Post</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {QUESTIONS.map((q, i) => (
          <div key={i} className="flex gap-4 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group">
            {/* Vote block */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
              <button className="text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors text-[16px]">▲</button>
              <span className="text-[14px] font-black text-navy">{q.votes}</span>
              <button className="text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors text-[16px]">▼</button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors mb-2 leading-snug">{q.title}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {q.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-gray-50 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px] font-semibold rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <img src={`https://i.pravatar.cc/40?img=${q.authorImg}`} className="w-4 h-4 rounded-full object-cover" alt="" />
                <span className="text-[10px] text-[var(--color-text-muted)]">{q.author} · {q.timeSince}</span>
              </div>
            </div>

            {/* Answer badge */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border text-center ${
                q.answered
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-50 text-[var(--color-text-muted)] border-[var(--color-border)]'
              }`}>{q.answers}<br />{q.answers === 1 ? 'answer' : 'answers'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
