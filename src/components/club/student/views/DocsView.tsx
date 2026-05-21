import { useRef, useState } from 'react';
import { useStudentSharedFiles } from '@/hooks/useStudentSharedFiles';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary, detectFileKind } from '@/lib/cloudinary';
import { toast } from 'sonner';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';

import { SectionLabel, groupFilesByMathField } from './StudentViewShared';

export function DocsView({ clubId }: { clubId: string }) {
  const { data: files, isLoading, error, refetch } = useStudentSharedFiles({
    clubId,
    kinds: ['pdf', 'document', 'slides', 'spreadsheet'],
    enabled: !!clubId,
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docTypeStyle = (kind: string) => {
    if (kind === 'pdf') return { icon: '📄', bg: 'bg-red-100/60', text: 'text-red-600' };
    if (kind === 'slides') return { icon: '📊', bg: 'bg-purple-100/60', text: 'text-purple-600' };
    if (kind === 'spreadsheet') return { icon: '📈', bg: 'bg-green-100/60', text: 'text-green-600' };
    return { icon: '📝', bg: 'bg-blue-100/60', text: 'text-blue-600' };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clubId) return;

    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      const kind = detectFileKind(file);

      const { error: insertError } = await supabase.from('club_shared_files').insert({
        club_id: clubId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        file_name: file.name,
        file_url: result.url,
        mime_type: file.type || 'application/octet-stream',
        file_kind: kind,
        storage_provider: 'cloudinary',
        storage_public_id: result.publicId,
        source: 'chat' as const,
        file_size: file.size,
      });

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        <input
          type="text"
          placeholder="Search documents…"
          className="flex-1 max-w-[280px] h-10 px-4 bg-white border border-[var(--color-border)] rounded-xl text-[13px] text-navy focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60 flex items-center gap-2"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading…' : '+ Upload'}
        </button>
      </div>
      <div className="space-y-5">
        {fileGroups.map((group) => (
          <div key={group.key}>
            <SectionLabel>{group.label}</SectionLabel>
            <div className="space-y-2.5">
              {group.items.map((f) => {
                const style = docTypeStyle(f.file_kind);
                return (
                  <div key={f.id} className="flex items-center gap-3.5 p-4 bg-white border border-[var(--color-border)] rounded-2xl hover:border-orange-200 transition-all group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-navy truncate">{f.title}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {f.file_size ? `${(f.file_size / 1024 / 1024).toFixed(1)} MB` : ''} · {f.file_name}
                      </div>
                    </div>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[var(--color-amber)] px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex-shrink-0"
                    >
                      Open
                    </a>
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
