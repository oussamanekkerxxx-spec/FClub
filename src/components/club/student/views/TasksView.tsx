import { useState } from 'react';



export function TasksView() {
  const [filter, setFilter] = useState<'all' | 'mine' | 'done'>('all');
  const TASKS = [
    { id: 1, title: 'Implement trust tier UI components', assignee: 'Oussama', img: 68, due: 'Apr 12', priority: 'High',   done: false },
    { id: 2, title: 'Design avatar upload flow',          assignee: 'Layla',   img: 15, due: 'Apr 15', priority: 'Medium', done: false },
    { id: 3, title: 'Fix RLS policy for bookings',        assignee: 'Youssef', img: 11, due: 'Apr 8',  priority: 'Low',    done: true  },
    { id: 4, title: 'Create onboarding walkthrough',      assignee: 'Amina',   img: 5,  due: 'Apr 20', priority: 'Medium', done: false },
  ];
  const priorityStyle = (p: string) => {
    if (p === 'High')   return 'text-red-500  bg-red-50   border-red-200';
    if (p === 'Medium') return 'text-blue-500 bg-blue-50  border-blue-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };
  const visible = TASKS.filter(t =>
    filter === 'mine' ? t.assignee === 'Oussama' :
    filter === 'done' ? t.done : true
  );
  return (
    <div className="p-6">
      <div className="flex items-center flex-wrap gap-2 mb-5">
        {(['all', 'mine', 'done'] as const).map(f => (
          <span key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              filter === f ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-200'
            }`}>
            {f === 'mine' ? 'My Tasks' : f === 'done' ? 'Completed' : 'All'}
          </span>
        ))}
        <button className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[11px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">+ Add Task</button>
      </div>
      <div className="space-y-2.5">
        {visible.map(t => (
          <div key={t.id} className={`flex items-center gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 transition-all ${t.done ? 'opacity-60' : ''}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              t.done ? 'border-green-400 bg-green-400' : 'border-gray-300 hover:border-orange-400 cursor-pointer'
            }`}>
              {t.done && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] font-semibold text-navy ${t.done ? 'line-through opacity-60' : ''}`}>{t.title}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <img src={`https://i.pravatar.cc/40?img=${t.img}`} className="w-4 h-4 rounded-full object-cover" alt="" />
                <span className="text-[11px] text-[var(--color-text-muted)]">{t.assignee} · Due {t.due}</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex-shrink-0 ${priorityStyle(t.priority)}`}>{t.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
