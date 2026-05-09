import { useState } from 'react';



export function QuizzesView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [questionIdx] = useState(0);

  const QUESTIONS = [
    {
      q: 'What does the useEffect cleanup function do in React?',
      options: [
        { id: 'A', text: 'It initializes state variables' },
        { id: 'B', text: 'It runs before the component unmounts or before the next effect' },
        { id: 'C', text: 'It replaces componentDidMount' },
        { id: 'D', text: 'It fetches data from an API' },
      ],
      correct: 'B',
    },
  ];
  const q = QUESTIONS[questionIdx];

  return (
    <div className="p-6">
      <div className="max-w-[580px]">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[11px] font-bold text-[var(--color-amber)] uppercase tracking-wider">Question 3 of 10</span>
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] font-medium">
              <span className="text-yellow-500">⭐</span> +15 XP each
            </span>
          </div>

          <h2 className="text-[15px] font-bold text-navy mb-5 leading-relaxed">{q.q}</h2>

          <div className="space-y-2.5">
            {q.options.map(opt => {
              const isCorrect = opt.id === q.correct;
              const isWrong = selected === opt.id && !isCorrect;
              let borderCls = 'border-[var(--color-border)] bg-gray-50/80';
              let textCls = 'text-navy';
              let circleCls = 'border-gray-300 text-[var(--color-text-muted)]';
              if (selected) {
                if (isCorrect) { borderCls = 'border-green-400 bg-green-50'; textCls = 'text-green-700'; circleCls = 'border-green-500 bg-green-500 text-white'; }
                else if (isWrong) { borderCls = 'border-red-400 bg-red-50'; textCls = 'text-red-600'; circleCls = 'border-red-400 bg-red-400 text-white'; }
                else { borderCls = 'border-gray-100 bg-gray-50/40 opacity-50'; textCls = 'text-gray-400'; }
              }
              return (
                <div
                  key={opt.id}
                  onClick={() => !selected && setSelected(opt.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-[13px] transition-all ${borderCls} ${!selected ? 'cursor-pointer hover:border-[var(--color-amber)]/40 hover:bg-parchment' : 'cursor-default'}`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all ${circleCls}`}>
                    {selected && isCorrect ? '✓' : selected && isWrong ? '✗' : opt.id}
                  </span>
                  <span className={`font-medium ${textCls}`}>{opt.text}</span>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-[12px] font-semibold ${
              selected === q.correct
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {selected === q.correct ? '🎉 Correct! +15 XP earned' : `❌ The correct answer was: ${q.options.find(o => o.id === q.correct)?.text}`}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button className="px-5 py-2.5 bg-gray-50 border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl hover:bg-gray-100 transition-colors">← Previous</button>
            <button
              onClick={() => setSelected(null)}
              className="px-5 py-2.5 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
            >Next →</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[11px] text-[var(--color-text-muted)] font-medium flex-shrink-0">Progress</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full transition-all" style={{ width: '30%' }} />
          </div>
          <span className="text-[11px] font-bold text-[var(--color-amber)]" >3/10</span>
        </div>
      </div>
    </div>
  );
}
