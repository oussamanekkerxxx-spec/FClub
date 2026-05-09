import { useStudentSharedFiles } from '@/hooks/useStudentSharedFiles';
import { FileText } from 'lucide-react';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';

import { SectionLabel, groupFilesByMathField } from './StudentViewShared';


export function DocsView({ clubId }: { clubId: string }) {
  const { data: files, isLoading, error } = useStudentSharedFiles({
    clubId,
    kinds: ['pdf', 'document', 'slides', 'spreadsheet'],
    enabled: !!clubId,
  });

  const docTypeStyle = (kind: string) => {
    if (kind === 'pdf') return { icon: '📄', bg: 'bg-red-100/60', text: 'text-red-600' };
    if (kind === 'slides') return { icon: '📊', bg: 'bg-purple-100/60', text: 'text-purple-600' };
    if (kind === 'spreadsheet') return { icon: '📈', bg: 'bg-green-100/60', text: 'text-green-600' };
    return { icon: '📝', bg: 'bg-blue-100/60', text: 'text-blue-600' };
  };

  if (!clubId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FileText className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="Select a club"
          subtitle="Join a student club to view documents."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FileText className="w-6 h-6 text-red-400" />}
          title="Failed to load documents"
          subtitle="Please try again later."
        />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FileText className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No documents yet"
          subtitle="Share PDFs, documents, or slides in chat to see them here."
        />
      </div>
    );
  }

  const fileGroups = groupFilesByMathField(files);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <input type="text" placeholder="Search documents…"
          className="flex-1 max-w-[280px] h-10 px-4 bg-white border border-[var(--color-border)] rounded-xl text-[13px] text-navy focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        />
        <button className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all">+ Upload</button>
      </div>
      <div className="space-y-5">
        {fileGroups.map((group) => (
          <div key={group.key}>
            <SectionLabel>{group.label}</SectionLabel>
            <div className="space-y-2.5">
              {group.items.map((d) => {
                const style = docTypeStyle(d.file_kind);
          return (
            <div key={d.id} className="flex items-center gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${style.bg} ${style.text}`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-navy group-hover:text-[var(--color-amber)] transition-colors truncate">{d.title}</div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  {d.category || 'Uncategorized'} · {new Date(d.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[11px] font-semibold text-navy bg-gray-50 border border-[var(--color-border)] rounded-lg hover:bg-gray-100"
                >
                  View
                </a>
              </div>
            </div>
          );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
