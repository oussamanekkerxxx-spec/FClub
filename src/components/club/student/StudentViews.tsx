import { useState, useEffect } from 'react';
import { type StudentTabId } from './StudentClubConstants';
import ClubChatWorkspace from '@/features/club-chat/ClubChatWorkspace';

export default function StudentViews({ activeTab, clubId }: { activeTab: StudentTabId; clubId: string }) {
  // Render the view matching activeTab
  switch (activeTab) {
    case 'chat': return <ChatView clubId={clubId} />;
    case 'voice': return <VoiceRoomsView />;
    case 'notifs': return <NotifsView />;
    case 'courses': return <CoursesView />;
    case 'smart-explain': return <SmartExplainView />;
    case 'quizzes': return <QuizzesView />;
    case 'flashcards': return <FlashcardsView />;
    case 'notes': return <NotesView />;
    case 'docs': return <DocsView />;
    case 'tasks': return <TasksView />;
    case 'files': return <FilesView />;
    case 'studyrooms': return <StudyRoomsView />;
    case 'pomodoro': return <PomodoroView />;
    case 'library': return <LibraryView />;
    case 'exams': return <ExamsView />;
    case 'career': return <CareerView />;
    case 'events': return <EventsView />;
    case 'workshops': return <WorkshopsView />;
    case 'liveclasses': return <LiveClassesView />;
    case 'xp': return <XpView />;
    case 'leaderboard': return <LeaderboardView />;
    case 'badges': return <BadgesView />;
    case 'challenges': return <ChallengesView />;
    case 'feed': return <FeedView />;
    case 'matching': return <MatchingView />;
    case 'mentors': return <MentorsView />;
    case 'qa': return <QaView />;
    case 'roles': return <RolesView />;
    default: return <div className="p-6 text-center text-gray-500">View not implemented yet</div>;
  }
}

// ── Shared UI Patterns ────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
    <div className="w-3.5 h-[2px] bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" />
    {children}
  </div>
);

const PillNav = ({ items, activeIdx }: { items: string[], activeIdx?: number }) => (
  <div className="flex flex-wrap gap-2 mb-4">
    {items.map((item, i) => (
      <span key={item} className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all
        ${i === (activeIdx || 0) 
          ? 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm' 
          : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-orange-200 hover:text-navy'}
      `}>
        {item}
      </span>
    ))}
  </div>
);

const FeedItem = ({ icon, iconBg, title, desc, tag, tagColor, btnText }: any) => (
  <div className="flex gap-3 p-4 bg-white border border-[var(--color-border)] rounded-2xl mb-2.5 cursor-pointer hover:border-orange-200 hover:shadow-sm transition-all group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${iconBg}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-semibold text-navy mb-0.5 truncate">{title}</div>
      <div className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{desc}</div>
      {tag && <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block ${tagColor}`}>{tag}</div>}
    </div>
    {btnText && (
      <button className="self-center px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white rounded-xl text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {btnText}
      </button>
    )}
  </div>
);

// ── Views ─────────────────────────────────────────────────────────────────────

function ChatView({ clubId }: { clubId: string }) {
  return (
    <div className="h-[calc(100vh-140px)] w-full bg-white rounded-tl-xl overflow-hidden shadow-sm">
      <ClubChatWorkspace isEmbedded clubId={clubId} />
    </div>
  );
}

function VoiceRoomsView() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { name: 'General Lounge', count: 3, live: true, users: [5,11,44] },
          { name: 'Code Pairing', count: 2, live: true, users: [15,33] },
          { name: 'Design Critique', count: 0, live: false, users: [] },
          { name: 'Study Hall', count: 0, live: false, users: [] }
        ].map((v, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-4.5 hover:border-orange-200 transition-colors">
            <div className="flex items-center gap-2 mb-3.5">
              <span className={`w-2 h-2 rounded-full ${v.live ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-[14px] font-bold text-navy flex-1">{v.name}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{v.count > 0 ? `${v.count} in room` : 'Empty'}</span>
            </div>
            
            <div className="flex gap-2 flex-wrap mb-4 h-[60px]">
              {v.users.map((u, j) => (
                <div key={j} className="flex flex-col items-center gap-1 w-12">
                  <img src={`https://i.pravatar.cc/80?img=${u}`} className={`w-10 h-10 rounded-full object-cover border-2 border-white ${j === 0 ? 'ring-2 ring-green-500 ring-offset-1' : ''}`} alt="" />
                  <span className="text-[9px] text-[var(--color-text-muted)] truncate w-full text-center">User</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-2.5 rounded-xl text-[12px] font-bold transition-all ${v.live ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100' : 'bg-gray-50 text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-gray-100'}`}>
              {v.live ? 'Join Voice' : 'Start Room'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotifsView() {
  return (
    <div className="p-6">
      <SectionLabel>Today</SectionLabel>
      <FeedItem icon="🔔" iconBg="bg-orange-100/50" title="Amina mentioned you in Group Chat" desc='"@Oussama can you check the RLS migration?"' tag="Chat" tagColor="bg-orange-100 text-[var(--color-amber)]" />
      <FeedItem icon="✅" iconBg="bg-green-100/50" title="Quiz completed: React Hooks Basics" desc="You scored 9/10 — earned +45 XP" tag="Learning" tagColor="bg-green-100 text-green-600" />
      <FeedItem icon="🎖" iconBg="bg-purple-100/50" title="New badge unlocked: Code Reviewer" desc="Complete 10 code reviews in the guild" tag="Badge" tagColor="bg-purple-100 text-purple-600" />
      
      <div className="mt-8"><SectionLabel>Yesterday</SectionLabel></div>
      <FeedItem icon="📅" iconBg="bg-red-100/50" title="Event reminder: Monthly Meetup" desc="Friday, Apr 11 · 7:00 PM · Café L'Horloge" tag="Event" tagColor="bg-red-100 text-red-600" />
      <FeedItem icon="👤" iconBg="bg-blue-100/50" title="Nora Fassi requested to join the club" desc='"UI designer looking to learn React"' tag="Request" tagColor="bg-blue-100 text-blue-600" />
    </div>
  );
}

function CoursesView() {
  return (
    <div className="p-6">
      <PillNav items={['All', 'In Progress', 'Completed', 'New']} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=60', title: 'React Hooks Masterclass', meta: 'By Amina K. · 4.9★ · 2h 30m', prog: 72, badge: '12 lessons' },
          { img: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=60', title: 'Figma Design Tokens', meta: 'By Layla B. · 4.8★ · 1h 45m', prog: 35, badge: '8 lessons' },
          { img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=60', title: 'Supabase RLS Deep Dive', meta: 'By Oussama H. · 5.0★ · 3h 10m', prog: 100, badge: '15 lessons' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-orange-200 transition-all cursor-pointer group shadow-sm">
            <div className="h-28 relative">
              <img src={c.img} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase tracking-wider border border-white/20">{c.badge}</div>
            </div>
            <div className="p-4">
              <h3 className="text-[14px] font-bold text-navy mb-1 group-hover:text-[var(--color-amber)] transition-colors">{c.title}</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mb-3">{c.meta}</p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" style={{ width: `${c.prog}%` }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)]">{c.prog === 100 ? 'Completed ✓' : `${c.prog}% complete`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimal wrappers for other views to complete the implementation. 
// They follow the exact same visual schema translated to Tailwind.

function SmartExplainView() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-br from-orange-50 to-purple-50 border border-orange-100 p-5 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🧠</span>
          <div>
            <h3 className="text-[15px] font-bold text-navy">AI Visual Explainer</h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">Type any concept and get a visual breakdown</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="e.g. How does React's virtual DOM work?" className="flex-1 px-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-[13px]" />
          <button className="px-5 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white font-bold rounded-xl text-[12px] whitespace-nowrap">Explain →</button>
        </div>
      </div>
      
      <SectionLabel>Recent Explanations</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: '🔄 Event Loop in JavaScript', desc: 'Visual diagram showing call stack, web APIs, callback queue.' },
          { title: '🛡 Supabase Row Level Security', desc: 'Step-by-step policy builder with before/after queries.' }
        ].map((x, i) => (
          <div key={i} className="p-4 bg-white border border-[var(--color-border)] rounded-2xl">
            <h4 className="text-[13px] font-bold text-navy mb-2">{x.title}</h4>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{x.desc}</p>
            <div className="flex gap-2 mt-3">
               <span className="px-2 py-1 bg-gray-50 border border-[var(--color-border)] rounded-md text-[10px] font-semibold text-navy">Diagram</span>
               <span className="px-2 py-1 bg-gray-50 border border-[var(--color-border)] rounded-md text-[10px] font-semibold text-navy">Interactive</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ... All other views follow similarly. For brevity in this PR, I am rendering functional placeholders 
// with the Lumina styling for the remaining sub-views that weren't fully expanded to keep file size manageable.

function QuizzesView() {
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
function FlashcardsView() {
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
function NotesView() {
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
function DocsView() {
  const DOCS = [
    { icon: '📄', iconBg: 'bg-blue-100/60 text-blue-600',   title: 'Sprint #3 Architecture Report', author: 'Oussama', updated: '2h ago',   contributors: 3 },
    { icon: '🎨', iconBg: 'bg-purple-100/60 text-purple-600', title: 'Design System v2 Spec',         author: 'Layla',   updated: 'Yesterday', contributors: 2 },
    { icon: '💻', iconBg: 'bg-green-100/60 text-green-600',  title: 'RLS Policy Templates',          author: 'Youssef', updated: '3d ago',     contributors: 4 },
  ];
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <input type="text" placeholder="Search documents…"
          className="flex-1 max-w-[280px] h-10 px-4 bg-white border border-[var(--color-border)] rounded-xl text-[13px] text-navy focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        />
        <button className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">+ Upload</button>
      </div>
      <div className="space-y-2.5">
        {DOCS.map((d, i) => (
          <div key={i} className="flex items-center gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${d.iconBg}`}>{d.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors truncate">{d.title}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{d.author} · Updated {d.updated} · {d.contributors} contributors</div>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="px-3 py-1.5 text-[11px] font-semibold text-navy bg-gray-50 border border-[var(--color-border)] rounded-lg hover:bg-gray-100">View</button>
              <button className="px-3 py-1.5 text-[11px] font-semibold text-[var(--color-amber)] bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function TasksView() {
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
function FilesView() {
  const FILES = [
    { icon: '📄', iconBg: 'bg-blue-50',   ext: 'PDF', title: 'react-patterns-cheatsheet.pdf',  size: '2.4 MB',  by: 'Youssef', date: 'Apr 3' },
    { icon: '📹', iconBg: 'bg-yellow-50', ext: 'MP4', title: 'gsap-workshop-recording.mp4',    size: '128 MB', by: 'Amina',   date: 'Mar 28' },
    { icon: '💻', iconBg: 'bg-green-50',  ext: 'SQL', title: 'supabase-rls-templates.sql',    size: '18 KB',  by: 'Oussama', date: 'Mar 22' },
  ];
  const extStyle = (e: string) => {
    if (e === 'PDF') return 'bg-red-50    text-red-500   border-red-200';
    if (e === 'MP4') return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    return 'bg-green-50 text-green-600 border-green-200';
  };
  return (
    <div className="p-6">
      <div className="flex justify-end mb-5">
        <button className="px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">+ Share File</button>
      </div>
      <div className="space-y-2.5">
        {FILES.map((f, i) => (
          <div key={i} className="flex items-center gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${f.iconBg}`}>{f.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-navy truncate">{f.title}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{f.size} · Shared by {f.by} · {f.date}</div>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${extStyle(f.ext)}`}>{f.ext}</span>
            <button className="text-[11px] font-bold text-[var(--color-amber)] px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex-shrink-0">Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function StudyRoomsView() {
  const ROOMS = [
    { name: 'Silent Focus Room', live: true, count: 4, users: [5, 22, 33, 44], mode: '🔇 Mics off · Cameras optional · Pomodoro synced' },
    { name: 'Group Study Room',  live: true, count: 6, users: [11, 15, 36, 55], mode: '🎙 Open mics · Video on · Discussion mode' },
  ];
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {ROOMS.map((r, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.live ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-[14px] font-bold text-navy flex-1">{r.name}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{r.count} studying</span>
            </div>
            <div className="flex mb-3">
              {r.users.map((u, j) => (
                <img key={j} src={`https://i.pravatar.cc/40?img=${u}`} alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                  style={{ marginLeft: j === 0 ? 0 : '-8px' }}
                />
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mb-4 leading-relaxed">{r.mode}</p>
            <button className="w-full py-2.5 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              Join Room
            </button>
          </div>
        ))}
      </div>
      <div className="p-5 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-center cursor-pointer hover:border-orange-300 hover:bg-parchment transition-all group">
        <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">➕</span>
        <div className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Create a new study room</div>
        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Set your focus mode and invite study buddies</div>
      </div>
    </div>
  );
}
function PomodoroView() {
  const FOCUS_SECS = 25 * 60;
  const BREAK_SECS =  5 * 60;
  const [secs,       setSecs]      = useState(FOCUS_SECS);
  const [running,    setRunning]   = useState(false);
  const [mode,       setMode]      = useState<'focus' | 'break'>('focus');
  const [sessionNum, setSessionNum]= useState(1);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          if (mode === 'focus') { setMode('break'); setSecs(BREAK_SECS); setSessionNum(n => n + 1); }
          else                  { setMode('focus'); setSecs(FOCUS_SECS); }
          return s;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  const total  = mode === 'focus' ? FOCUS_SECS : BREAK_SECS;
  const pct    = ((total - secs) / total) * 100;
  const radius = 80;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const mm     = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss     = String(secs % 60).padStart(2, '0');

  const reset = () => { setRunning(false); setSecs(total); };
  const skip  = () => {
    setRunning(false);
    if (mode === 'focus') { setMode('break'); setSecs(BREAK_SECS); }
    else                  { setMode('focus'); setSecs(FOCUS_SECS); }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Ring */}
      <div className="relative flex items-center justify-center mb-8">
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={mode === 'focus' ? 'url(#pomoGrad)' : '#22c55e'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[48px] font-black text-navy leading-none tabular-nums">{mm}:{ss}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${
            mode === 'focus' ? 'text-[var(--color-amber)]' : 'text-green-500'
          }`}>
            {mode === 'focus' ? 'Focus Session' : '☕ Break Time'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-5">
        <button onClick={reset} className="px-5 py-2.5 bg-white border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl hover:bg-gray-50 transition-colors">Reset</button>
        <button
          onClick={() => setRunning(r => !r)}
          className={`px-8 py-2.5 text-white text-[12px] font-bold rounded-xl shadow-md hover:shadow-lg transition-all ${
            running
              ? 'bg-gray-700 hover:bg-gray-800'
              : 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500'
          }`}
        >{running ? '⏸ Pause' : '▶ Start'}</button>
        <button onClick={skip} className="px-5 py-2.5 bg-white border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl hover:bg-gray-50 transition-colors">Skip</button>
      </div>

      <div className="text-[12px] text-[var(--color-text-muted)] mb-6 text-center">
        Session {sessionNum} of 4 · 25 min focus / 5 min break
      </div>

      {/* Session dots */}
      <div className="flex gap-2 mb-6">
        {[1,2,3,4].map(n => (
          <div key={n} className={`w-2.5 h-2.5 rounded-full transition-colors ${
            n < sessionNum ? 'bg-[var(--color-amber)]' : n === sessionNum ? 'bg-orange-300 ring-2 ring-orange-300/40' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Co-study buddies */}
      <div className="flex items-center gap-3 p-4 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm w-full max-w-xs">
        <div className="flex">
          {[5, 22].map((u, i) => (
            <img key={i} src={`https://i.pravatar.cc/40?img=${u}`}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
              style={{ marginLeft: i === 0 ? 0 : '-6px' }} alt="" />
          ))}
        </div>
        <span className="text-[12px] text-[var(--color-text-muted)] flex-1">2 studying with you</span>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full">In Sync</span>
      </div>
    </div>
  );
}
function LibraryView() {
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
function ExamsView() {
  const EXAMS = [
    {
      subject: 'Algorithms & Data Structures',
      school: 'ENSIAS',
      year: '2024',
      professor: 'Pr. M. Alaoui',
      pages: 8,
      hasSolutions: true,
    },
    {
      subject: 'Web Technologies & Architecture',
      school: 'ENSA Rabat',
      year: '2023',
      professor: 'Pr. S. Chafik',
      pages: 6,
      hasSolutions: false,
    },
    {
      subject: 'Database Systems — Final',
      school: 'FSR',
      year: '2024',
      professor: 'Pr. K. Benbrahim',
      pages: 10,
      hasSolutions: true,
    },
  ];
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXAMS.map((e, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-[22px] flex-shrink-0">📝</div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors leading-snug">{e.subject}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{e.school} · {e.year} · {e.professor}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-50 border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-full">{e.pages} pages</span>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 border border-red-200 text-red-500 rounded-full">PDF</span>
              {e.hasSolutions && (
                <span className="text-[9px] font-bold px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 rounded-full">✓ Solutions</span>
              )}
            </div>
            <button className="mt-4 w-full py-2 bg-gray-50 border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl group-hover:bg-parchment group-hover:border-orange-200 transition-colors">Download Exam</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function CareerView() {
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
function EventsView() {
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
function WorkshopsView() {
  const WORKSHOPS = [
    {
      emoji: '🔧',
      title: 'GSAP ScrollTrigger — Advanced Animations',
      host: 'Youssef M.',
      hostImg: 11,
      date: 'Sat, Apr 19 · 4:00 PM',
      duration: '2h',
      seats: 3,
      maxSeats: 15,
      level: 'Intermediate',
      levelStyle: 'bg-blue-50 text-blue-600 border-blue-200',
      registered: false,
    },
    {
      emoji: '📦',
      title: 'Docker & GitHub Actions for Frontend Devs',
      host: 'Karim A.',
      hostImg: 44,
      date: 'Sun, Apr 27 · 3:00 PM',
      duration: '3h',
      seats: 8,
      maxSeats: 20,
      level: 'Beginner',
      levelStyle: 'bg-green-50 text-green-600 border-green-200',
      registered: true,
    },
    {
      emoji: '⚡',
      title: 'Performance Optimization with Vite & Bundle Analysis',
      host: 'Amina K.',
      hostImg: 5,
      date: 'Tue, May 6 · 6:30 PM',
      duration: '1.5h',
      seats: 11,
      maxSeats: 25,
      level: 'Advanced',
      levelStyle: 'bg-red-50 text-red-500 border-red-200',
      registered: false,
    },
  ];
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {WORKSHOPS.map((w, i) => (
        <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 flex flex-col hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all">
          <div className="text-[36px] mb-3">{w.emoji}</div>
          <div className="text-[13px] font-bold text-navy mb-1 leading-snug">{w.title}</div>

          <div className="flex items-center gap-1.5 mb-3">
            <img src={`https://i.pravatar.cc/40?img=${w.hostImg}`} className="w-5 h-5 rounded-full object-cover" alt="" />
            <span className="text-[11px] text-[var(--color-text-muted)]">{w.host} · {w.duration}</span>
          </div>

          <div className="text-[11px] text-[var(--color-text-muted)] mb-3">{w.date}</div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" style={{ width: `${((w.maxSeats - w.seats) / w.maxSeats) * 100}%` }} />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{w.seats} seats left</span>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${w.levelStyle}`}>{w.level}</span>
            <button className={`ml-auto px-4 py-2 rounded-xl text-[12px] font-bold border transition-all ${
              w.registered
                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                : 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 border-transparent text-white shadow-sm hover:shadow-md'
            }`}>{w.registered ? '✓ Registered' : 'Register'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
function LiveClassesView() {
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
function XpView() {
  const STATS = [
    { label: 'Sessions', value: '47', color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Reviews',  value: '12', color: 'text-blue-500',  bg: 'bg-blue-50' },
    { label: 'Badges',  value: '8',  color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Streaks', value: '5',  color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];
  return (
    <div className="p-6">
      <div className="max-w-md space-y-4">
        {/* Main XP card */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[2px] mb-3">Your XP</div>
          <div className="text-[64px] font-black leading-none bg-gradient-to-r from-[var(--color-amber)] to-orange-500 bg-clip-text text-transparent mb-2">1,280</div>
          <div className="text-[13px] text-[var(--color-text-muted)]">Rank #1 in Frontend Guild</div>

          <div className="h-px bg-gray-100 my-6" />

          <div className="grid grid-cols-4 gap-3">
            {STATS.map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                <div className={`text-[22px] font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Level progress */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Progress to Level 4</div>
            <div className="text-[11px] font-bold text-[var(--color-amber)]">64%</div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[12px] font-bold text-navy whitespace-nowrap">Level 3</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full transition-all" style={{ width: '64%' }} />
            </div>
            <span className="text-[12px] font-bold text-[var(--color-text-muted)] whitespace-nowrap">Level 4</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] text-center">1,280 / 2,000 XP · 720 XP remaining</div>
        </div>

        {/* Recent XP log */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <div className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Recent Activity</div>
          </div>
          {[
            { label: 'Quiz completed: React Hooks', xp: '+45', color: 'text-green-500', when: '2h ago' },
            { label: 'Attended Workshop: GSAP', xp: '+30', color: 'text-blue-500', when: 'Yesterday' },
            { label: 'Badge unlocked: Code Reviewer', xp: '+20', color: 'text-purple-500', when: '2d ago' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--color-border)] last:border-b-0">
              <div className="flex-1 text-[12px] text-navy font-medium">{r.label}</div>
              <div className={`text-[13px] font-black ${r.color}`}>{r.xp}</div>
              <div className="text-[10px] text-[var(--color-text-muted)] w-16 text-right">{r.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function LeaderboardView() {
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
function BadgesView() {
  const EARNED = [
    { icon: '🔥', name: 'First Session',  desc: 'Complete your first skill session', newly: true },
    { icon: '⭐', name: '5-Star Teacher', desc: 'Get a 5-star review' },
    { icon: '💬', name: 'Active Voice',   desc: 'Join 10 voice rooms' },
    { icon: '🛡', name: 'Code Reviewer',  desc: 'Review 10 PRs', newly: true },
  ];
  const LOCKED = [
    { icon: '🏆', name: 'Top 3 Monthly',  desc: 'Reach top 3 on leaderboard', progress: 68 },
    { icon: '📚', name: 'Course Creator', desc: 'Publish your first course', progress: 0 },
    { icon: '🎯', name: '100 Sessions',   desc: 'Complete 100 skill sessions', progress: 47 },
    { icon: '👑', name: 'Guild Master',   desc: 'Become a club admin', progress: 0 },
  ];

  return (
    <div className="p-6">
      {/* Earned */}
      <SectionLabel>Earned · {EARNED.length} badges</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {EARNED.map(b => (
          <div key={b.name} className="relative text-center p-5 bg-white border border-[var(--color-border)] rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-md group">
            {b.newly && (
              <span className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
            )}
            <div className="text-4xl mb-2.5 group-hover:scale-110 transition-transform">{b.icon}</div>
            <div className="text-[12px] font-bold text-navy mb-1">{b.name}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Locked */}
      <SectionLabel>Locked · {LOCKED.length} remaining</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LOCKED.map(b => (
          <div key={b.name} className="relative text-center p-5 bg-white border border-[var(--color-border)] rounded-2xl cursor-pointer transition-all hover:border-orange-100 group">
            <div className="text-4xl mb-2.5 grayscale opacity-40 group-hover:opacity-50 transition-opacity">{b.icon}</div>
            <div className="text-[12px] font-bold text-[var(--color-text-muted)] mb-1">{b.name}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] leading-relaxed opacity-70">{b.desc}</div>
            {b.progress > 0 && (
              <div className="mt-3">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full" style={{ width: `${b.progress}%` }} />
                </div>
                <div className="text-[9px] text-[var(--color-text-muted)] mt-1">{b.progress}%</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function ChallengesView() {
  const CHALLENGES = [
    {
      icon: '🔥',
      title: '7-Day Coding Streak',
      desc: 'Write code every day for 7 consecutive days.',
      xpReward: 150,
      progress: 5,
      total: 7,
      daysLeft: 2,
      color: 'from-orange-400 to-red-500',
      bgLight: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      icon: '💬',
      title: 'Club Contributor',
      desc: 'Post 10 messages in Group Chat this week.',
      xpReward: 80,
      progress: 7,
      total: 10,
      daysLeft: 4,
      color: 'from-blue-400 to-indigo-500',
      bgLight: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      icon: '📚',
      title: 'Knowledge Sharer',
      desc: 'Complete 3 courses before end of month.',
      xpReward: 200,
      progress: 1,
      total: 3,
      daysLeft: 14,
      color: 'from-purple-400 to-violet-500',
      bgLight: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      icon: '🤝',
      title: 'Mentor a Member',
      desc: 'Answer 5 questions on the Q&A board.',
      xpReward: 120,
      progress: 2,
      total: 5,
      daysLeft: 7,
      color: 'from-green-400 to-emerald-500',
      bgLight: 'bg-green-50',
      border: 'border-green-100',
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHALLENGES.map((c, i) => {
          const pct = Math.round((c.progress / c.total) * 100);
          return (
            <div key={i} className={`bg-white border ${c.border} rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bgLight} flex items-center justify-center text-[22px] flex-shrink-0`}>{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-navy">{c.title}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{c.desc}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[13px] font-black text-[var(--color-amber)]">⧆ +{c.xpReward} XP</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{c.daysLeft}d left</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${c.color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-navy whitespace-nowrap">{c.progress}/{c.total}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">{pct}% complete</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function FeedView() {
  const ITEMS = [
    {
      type: 'Course',
      typeStyle: 'bg-blue-50 text-blue-600',
      icon: '📚',
      iconBg: 'bg-blue-100/60',
      title: 'Recommended: Advanced TypeScript Patterns',
      reason: 'Because you completed React Hooks Masterclass and have been studying TypeScript flashcards.',
      cta: 'Start Course',
      ctaStyle: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
    },
    {
      type: 'Student',
      typeStyle: 'bg-green-50 text-green-600',
      icon: '👤',
      iconBg: 'bg-green-100/60',
      title: 'Study partner match: Nora Fassi — 85% compatible',
      reason: 'You both want to learn Figma and have similar XP levels and schedule availability.',
      cta: 'Connect',
      ctaStyle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
    },
    {
      type: 'Resource',
      typeStyle: 'bg-purple-50 text-purple-600',
      icon: '📜',
      iconBg: 'bg-purple-100/60',
      title: 'Trending: CSS Container Queries Cheat Sheet',
      reason: '18 members viewed this resource in the last 48h. Your notes on CSS are unfinished.',
      cta: 'View',
      ctaStyle: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
    },
    {
      type: 'Event',
      typeStyle: 'bg-amber-50 text-amber-600',
      icon: '🎉',
      iconBg: 'bg-amber-100/60',
      title: 'Happening soon: Monthly Guild Meetup — Apr 18',
      reason: "3 of your connections are attending. You haven't RSVP'd yet.",
      cta: 'RSVP',
      ctaStyle: 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white border-transparent shadow-sm hover:shadow-md',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-3.5">
        <span className="text-[20px]">🤖</span>
        <div>
          <div className="text-[12px] font-bold text-navy">AI Smart Feed</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">Personalised to your activity, XP, and interests</div>
        </div>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-start gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${item.iconBg}`}>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.typeStyle}`}>{item.type}</span>
              </div>
              <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors">{item.title}</div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">{item.reason}</div>
            </div>
            <button className={`flex-shrink-0 self-center px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap ${item.ctaStyle}`}>{item.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function MatchingView() {
  const MATCHES = [
    {
      name: 'Nora Fassi',
      img: 26,
      online: true,
      city: 'Casablanca',
      teaches: ['Figma', 'UI/UX'],
      wants: ['React', 'TypeScript'],
      compat: 92,
      sessions: 0,
    },
    {
      name: 'Ahmed Berrada',
      img: 33,
      online: false,
      city: 'Rabat',
      teaches: ['Python', 'Data Analysis'],
      wants: ['React', 'Supabase'],
      compat: 78,
      sessions: 2,
    },
    {
      name: 'Salma Ziati',
      img: 47,
      online: true,
      city: 'Marrakech',
      teaches: ['Tailwind', 'Motion Design'],
      wants: ['Node.js', 'APIs'],
      compat: 85,
      sessions: 1,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-3.5">
        <span className="text-[20px]">🔗</span>
        <div>
          <div className="text-[12px] font-bold text-navy">AI Student Matching</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">3 new skill-compatible matches found for you</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MATCHES.map((m, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <img src={`https://i.pravatar.cc/60?img=${m.img}`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" alt={m.name} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${m.online ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-navy">{m.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">📍 {m.city}</div>
              </div>
              <div className="ml-auto text-center">
                <div className="text-[18px] font-black bg-gradient-to-r from-[var(--color-amber)] to-orange-500 bg-clip-text text-transparent">{m.compat}%</div>
                <div className="text-[9px] text-[var(--color-text-muted)]">match</div>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Can teach you</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.teaches.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 text-[10px] font-semibold rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Wants to learn</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.wants.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-semibold rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {m.sessions > 0 && (
              <div className="text-[10px] text-[var(--color-text-muted)] mt-3">{m.sessions} session{m.sessions > 1 ? 's' : ''} together</div>
            )}

            <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
              Connect →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function MentorsView() {
  const MENTORS = [
    {
      name: 'Amina Khaldi',
      img: 5,
      title: 'Senior Frontend Engineer',
      company: 'OCP Digital',
      online: true,
      rating: 4.9,
      sessions: 38,
      skills: ['React', 'TypeScript', 'System Design'],
      price: 'Free',
      priceStyle: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      name: 'Oussama H.',
      img: 68,
      title: 'Fullstack Developer',
      company: 'Freelance',
      online: true,
      rating: 5.0,
      sessions: 47,
      skills: ['Supabase', 'Node.js', 'RLS'],
      price: 'Free',
      priceStyle: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      name: 'Layla Bennani',
      img: 15,
      title: 'UX/UI Designer',
      company: 'Wafatech',
      online: false,
      rating: 4.7,
      sessions: 21,
      skills: ['Figma', 'Design Systems', 'Prototyping'],
      price: 'Free',
      priceStyle: 'bg-green-50 text-green-600 border-green-200',
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MENTORS.map((m, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <img src={`https://i.pravatar.cc/80?img=${m.img}`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" alt={m.name} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${m.online ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-navy">{m.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">{m.title} · {m.company}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {'★★★★★'.split('').slice(0, Math.round(m.rating)).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-[13px]">★</span>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-navy">{m.rating}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">· {m.sessions} sessions</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
              {m.skills.map(s => (
                <span key={s} className="px-2 py-0.5 bg-gray-50 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px] font-semibold rounded-full">{s}</span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[var(--color-border)]">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.priceStyle}`}>{m.price}</span>
              <button className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                Ask a Question
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function QaView() {
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
function RolesView() {
  const ROLES = [
    {
      emoji: '👑',
      name: 'Admin',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      permissions: ['Manage Members', 'Edit Club', 'Delete Posts', 'Assign Roles'],
      members: [{ img: 68, name: 'Oussama' }],
    },
    {
      emoji: '📚',
      name: 'Teacher',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      permissions: ['Post Courses', 'Create Quizzes', 'Host Live Classes', 'Manage Resources'],
      members: [{ img: 5, name: 'Amina' }, { img: 15, name: 'Layla' }],
    },
    {
      emoji: '🛡',
      name: 'Moderator',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      permissions: ['Pin Messages', 'Remove Members', 'Review Join Requests'],
      members: [{ img: 11, name: 'Youssef' }],
    },
    {
      emoji: '🎓',
      name: 'Student',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      dot: 'bg-green-500',
      permissions: ['View All Content', 'Post in Chat', 'Attend Events', 'Earn XP'],
      members: [{ img: 22, name: 'Reda' }, { img: 26, name: 'Nora' }, { img: 33, name: 'Ahmed' }, { img: 44, name: 'Karim' }],
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((role, i) => (
          <div key={i} className={`bg-white border ${role.border} rounded-2xl p-5 hover:shadow-sm transition-all`}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className={`w-9 h-9 ${role.bg} rounded-xl flex items-center justify-center text-[18px]`}>{role.emoji}</span>
              <div>
                <div className={`text-[14px] font-black ${role.color}`}>{role.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{role.members.length} member{role.members.length !== 1 ? 's' : ''}</div>
              </div>
              <span className={`ml-auto w-2 h-2 rounded-full ${role.dot}`} />
            </div>

            {/* Permissions */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {role.permissions.map(p => (
                <span key={p} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${role.bg} ${role.color} border ${role.border}`}>{p}</span>
              ))}
            </div>

            {/* Members */}
            <div className="flex items-center gap-1.5">
              {role.members.map((m, j) => (
                <div key={j} className="flex items-center gap-1.5 bg-gray-50 border border-[var(--color-border)] rounded-full pl-0.5 pr-2.5 py-0.5">
                  <img src={`https://i.pravatar.cc/30?img=${m.img}`} className="w-5 h-5 rounded-full object-cover" alt={m.name} />
                  <span className="text-[10px] font-semibold text-navy">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
