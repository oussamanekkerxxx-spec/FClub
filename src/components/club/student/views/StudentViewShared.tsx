import type { ClubSharedFile, MathField } from '@/types/clubs';


// ── Shared UI Patterns ────────────────────────────────────────────────────────

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
    <div className="w-3.5 h-[2px] bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full" />
    {children}
  </div>
);

export const PillNav = ({ items, activeIdx }: { items: string[], activeIdx?: number }) => (
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

export const MATH_FIELD_LABELS: Record<string, string> = {
  math: 'Math',
  physics: 'Physics',
  biology: 'Biology',
  chemistry: 'Chemistry',
  algebra: 'Algebra',
  analysis: 'Analyses',
};

export function groupFilesByMathField(files: ClubSharedFile[]) {
  const knownFields = Object.keys(MATH_FIELD_LABELS) as MathField[];
  const groups: Array<{ key: string; label: string; items: ClubSharedFile[] }> = [];

  knownFields.forEach((field) => {
    const items = files.filter((file) => file.math_field === field);
    if (items.length > 0) {
      groups.push({ key: field, label: MATH_FIELD_LABELS[field], items });
    }
  });

  const general = files.filter((file) => !file.math_field);
  if (general.length > 0) {
    groups.push({ key: 'general', label: 'General', items: general });
  }

  return groups;
}

export const FeedItem = ({ icon, iconBg, title, desc, tag, tagColor, btnText }: any) => (
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

