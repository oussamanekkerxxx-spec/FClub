import { useState } from 'react';



export function EventsView() {
  const [filter, setFilter] = useState(0);
  const EVENTS = [
    {
      emoji: '🎉',
      title: 'Monthly Guild Meetup — April',
      date: 'Fri, Apr 18 · 7:00 PM',
      location: 'Café L’Horloge, Rabat',
      attendees: 24,
      max: 40,
      format: 'In-Person',
      formatStyle: 'bg-amber-50 text-amber-600 border-amber-200',
      rsvp: true,
    },
    {
      emoji: '💻',
      title: 'Live Code Review Session',
      date: 'Sun, Apr 20 · 5:00 PM',
      location: 'Google Meet',
      attendees: 11,
      max: 20,
      format: 'Online',
      formatStyle: 'bg-blue-50 text-blue-600 border-blue-200',
      rsvp: false,
    },
    {
      emoji: '🎨',
      title: 'Figma Design System Workshop',
      date: 'Sat, Apr 26 · 3:00 PM',
      location: 'Rabat Technopark',
      attendees: 18,
      max: 30,
      format: 'Hybrid',
      formatStyle: 'bg-purple-50 text-purple-600 border-purple-200',
      rsvp: true,
    },
  ];
  const FILTERS = ['Upcoming', 'Online', 'In-Person', 'Past'];
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f, i) => (
          <span key={f} onClick={() => setFilter(i)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              filter === i ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                          : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-200'
            }`}>{f}</span>
        ))}
      </div>

      <div className="space-y-3">
        {EVENTS.map((e, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all group">
            <div className="w-12 h-12 rounded-xl bg-parchment flex items-center justify-center text-[24px] flex-shrink-0 group-hover:scale-105 transition-transform">{e.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors truncate">{e.title}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{e.date} · {e.location}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" style={{ width: `${(e.attendees / e.max) * 100}%` }} />
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{e.attendees}/{e.max} RSVP</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${e.formatStyle}`}>{e.format}</span>
              <button className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                e.rsvp
                  ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                  : 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm hover:shadow-md'
              }`}>{e.rsvp ? '✓ Going' : 'RSVP'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
