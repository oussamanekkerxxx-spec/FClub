import { useState } from 'react';



export function FlashcardsView() {
  const [flipped, setFlipped] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [activeDeck, setActiveDeck] = useState(0);

  const DECKS = ['React Hooks', 'TypeScript', 'CSS Grid'];
  const CARDS = [
    { front: 'What is the difference between useMemo and useCallback?', back: 'useMemo memoizes a computed value, useCallback memoizes a function reference. Both take a dependency array.' },
    { front: 'What does useState return?', back: 'An array with two elements: the current state value and a setter function that triggers a re-render.' },
    { front: 'When does useEffect run?', back: 'After every render by default. Pass [] to run once on mount. Pass dependencies to run when they change.' },
    { front: 'What is the purpose of useRef?', back: 'To persist a mutable value across renders without causing a re-render. Also used to reference DOM elements.' },
  ];
  const card = CARDS[cardIdx % CARDS.length];

  const advance = () => {
    setFlipped(false);
    setTimeout(() => setCardIdx(i => i + 1), 180);
  };

  return (
    <div className="p-6">
      {/* Deck Pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DECKS.map((d, i) => (
          <span
            key={d}
            onClick={() => { setActiveDeck(i); setCardIdx(0); setFlipped(false); }}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
              i === activeDeck
                ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm'
                : 'bg-white border-[var(--color-border)] text-navy hover:border-orange-300'
            }`}
          >{d}</span>
        ))}
        <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold border bg-white border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] cursor-pointer hover:border-orange-300 hover:text-navy transition-all">+ New Deck</span>
      </div>

      {/* Card */}
      <div className="max-w-[440px]">
        <div
          onClick={() => setFlipped(f => !f)}
          className="cursor-pointer mb-4"
          style={{ height: '220px', perspective: '800px' }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm flex flex-col items-center justify-center p-7 text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-[15px] font-bold text-navy leading-relaxed">{card.front}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-5 flex items-center gap-1.5">
                <span>🃏</span> Click to reveal answer
              </p>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 bg-parchment border-2 border-orange-200 rounded-2xl shadow-sm flex items-center justify-center p-7 text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-[14px] text-navy leading-relaxed font-medium">{card.back}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2.5">
          <button onClick={advance} className="flex-1 py-2.5 bg-white border-2 border-red-200 text-red-500 text-[12px] font-bold rounded-xl hover:bg-red-50 transition-colors">❌ Again</button>
          <button onClick={advance} className="flex-1 py-2.5 bg-white border-2 border-yellow-200 text-yellow-600 text-[12px] font-bold rounded-xl hover:bg-yellow-50 transition-colors">🤔 Hard</button>
          <button onClick={advance} className="flex-1 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">✓ Got it</button>
        </div>

        {/* Counter */}
        <div className="text-center mt-3.5">
          <span className="text-[11px] text-[var(--color-text-muted)]">Card {(cardIdx % CARDS.length) + 1} of {CARDS.length}</span>
          <div className="flex justify-center gap-1.5 mt-2">
            {CARDS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${
                i === cardIdx % CARDS.length ? 'w-4 bg-[var(--color-amber)]' : 'w-1.5 bg-gray-200'
              }`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
