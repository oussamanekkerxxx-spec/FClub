import { format } from 'date-fns';
import { X, Download, Share2, Layers, FileText, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';

interface DmModalStackProps {
  c: any;
}

export default function DmModalStack({ c }: DmModalStackProps) {
  return (
    <>
      {/* ── Image Lightbox ──────────────────────────────────────────────────── */}
      {c.viewingImageMsg && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-white/10">
                <AvatarImage src={c.viewingImageMsg.sender?.avatar_url} />
                <AvatarFallback className="bg-white/10 text-white">
                  {c.viewingImageMsg.sender?.first_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white font-medium text-[15px]">
                  {c.viewingImageMsg.sender?.first_name} {c.viewingImageMsg.sender?.last_name}
                </span>
                <span className="text-white/60 text-xs">
                  {format(new Date(c.viewingImageMsg.created_at), 'MMMM d, yyyy • h:mm a')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info('Share image coming soon')}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = c.viewingImageMsg.image_url;
                  link.download = `fightclub_dm_${c.viewingImageMsg.id}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Downloading…');
                }}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => c.setViewingImageMsg(null)}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ml-2"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-hidden flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => c.setViewingImageMsg(null)}
          >
            <img
              src={c.viewingImageMsg.image_url}
              alt="Fullscreen view"
              draggable={false}
              className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-200 select-none outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {c.viewingImageMsg.caption && (
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
              <div className="max-w-3xl text-white text-[15px] leading-relaxed text-center">
                {c.viewingImageMsg.caption}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Shared Media panel ─────────────────────────────────────────────── */}
      {c.showSharedMedia && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg h-[85vh] sm:h-[72vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--color-navy)]" />
                <h3 className="font-heading font-bold text-navy text-[17px]">Shared Media</h3>
              </div>
              <button
                onClick={() => c.setShowSharedMedia(false)}
                className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-[var(--color-border)] shrink-0">
              {(['images', 'videos', 'files'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => c.setSharedMediaTab(tab)}
                  className={`flex-1 py-2.5 text-[13px] font-medium capitalize transition-colors ${
                    c.sharedMediaTab === tab
                      ? 'border-b-2 border-[var(--color-navy)] text-navy'
                      : 'text-[var(--color-text-muted)] hover:text-navy'
                  }`}
                >
                  {tab === 'images' ? '🖼️ Images' : tab === 'videos' ? '🎥 Videos' : '📄 Files'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {c.sharedMediaTab === 'images' && (
                <div className="grid grid-cols-3 gap-2">
                  {c.messages.filter((m: any) => m.image_url).length === 0 ? (
                    <p className="col-span-3 text-center text-sm text-[var(--color-text-muted)] py-8">No images shared yet.</p>
                  ) : (
                    c.messages
                      .filter((m: any) => m.image_url)
                      .map((m: any) => (
                        <div
                          key={m.id}
                          className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => { c.setShowSharedMedia(false); c.setViewingImageMsg(m); }}
                        >
                          <img src={m.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))
                  )}
                </div>
              )}

              {c.sharedMediaTab === 'videos' && (
                <div className="space-y-3">
                  {c.messages.filter((m: any) => m.video_url).length === 0 ? (
                    <p className="text-center text-sm text-[var(--color-text-muted)] py-8">No videos shared yet.</p>
                  ) : (
                    c.messages
                      .filter((m: any) => m.video_url)
                      .map((m: any) => (
                        <div key={m.id} className="flex gap-3 items-center p-3 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors">
                          <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden">
                            <video src={m.video_url} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{m.content || 'Video'}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {c.sharedMediaTab === 'files' && (
                <div className="space-y-2">
                  {c.messages.filter((m: any) => normalizeHttpUrl(m.pdf_url)).length === 0 ? (
                    <p className="text-center text-sm text-[var(--color-text-muted)] py-8">No files shared yet.</p>
                  ) : (
                    c.messages
                      .filter((m: any) => normalizeHttpUrl(m.pdf_url))
                      .map((m: any) => {
                        const safeUrl = normalizeHttpUrl(m.pdf_url)!;
                        return (
                          <a
                            key={m.id}
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors"
                          >
                            <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy truncate">{extractFileNameFromUrl(safeUrl, 'document.pdf')}</p>
                              <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                          </a>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
