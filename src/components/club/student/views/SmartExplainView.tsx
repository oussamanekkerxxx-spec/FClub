
import { SectionLabel } from './StudentViewShared';


export function SmartExplainView() {
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
