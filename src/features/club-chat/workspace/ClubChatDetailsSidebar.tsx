import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCheck, Users, Image as ImageIcon, PlayCircle, FileText } from 'lucide-react';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';

interface ClubChatDetailsSidebarProps {
  c: any;
}

export default function ClubChatDetailsSidebar({ c }: ClubChatDetailsSidebarProps) {
  if (!c.showDetailsPanel) return null;

  return (
    <div className="w-[320px] flex-shrink-0 bg-[#FAFAFA] border-l border-[var(--color-border)] flex flex-col hidden lg:flex overflow-hidden animate-in slide-in-from-right-2 duration-300 relative z-20">
      <div className="p-6 flex flex-col items-center bg-white border-b border-[var(--color-border)] shrink-0">
        <Avatar className="w-20 h-20 mb-3 shadow-md border-4 border-white">
          <AvatarFallback className="text-3xl bg-[var(--color-parchment)] text-[var(--color-navy)] font-heading font-bold">{c.clubName[0]}</AvatarFallback>
        </Avatar>
        <h3 className="font-heading font-bold text-lg text-navy text-center flex items-center gap-1.5">{c.clubName} <CheckCheck className="w-4 h-4 text-blue-500" /></h3>
        <div className="flex items-center gap-4 mt-3 text-[13px] text-[var(--color-text-secondary)] font-medium">
          <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Members</div>
          <div className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full"></div>
          <div className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> {c.messages.filter((m: any) => m.image_url || m.video_url).length} Media</div>
        </div>
      </div>

      <div className="flex bg-white border-b border-[var(--color-border)] shrink-0">
        {(['images', 'videos', 'files'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => c.setSharedMediaTab(tab)}
            className={`flex-1 py-3 text-[12px] font-bold tracking-wide uppercase transition-colors relative
              ${c.sharedMediaTab === tab ? 'text-[var(--color-navy)]' : 'text-[var(--color-text-muted)] hover:text-navy hover:bg-[#F0F2F5]'}`}
          >
            {tab}
            {c.sharedMediaTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-amber)]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {c.sharedMediaTab === 'images' && (
          <div className="grid grid-cols-3 gap-1.5">
            {c.messages.filter((m: any) => m.image_url).length === 0
              ? <p className="col-span-3 text-center text-[13px] text-[var(--color-text-muted)] py-8">No images shared.</p>
              : c.messages.filter((m: any) => m.image_url).map((m: any) => (
                <div
                  key={m.id}
                  className="aspect-square bg-black/5 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => c.setViewingImageMsg(m)}
                >
                  <img src={m.image_url!} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
          </div>
        )}

        {c.sharedMediaTab === 'videos' && (
          <div className="space-y-2">
            {c.messages.filter((m: any) => m.video_url).length === 0
              ? <p className="text-center text-[13px] text-[var(--color-text-muted)] py-8">No videos shared.</p>
              : c.messages.filter((m: any) => m.video_url).map((m: any) => (
                <div key={m.id} className="flex gap-3 items-center p-2 rounded-xl hover:bg-[#F0F2F5] transition-colors border border-transparent hover:border-[var(--color-border)] cursor-pointer">
                  <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden relative">
                    <video src={m.video_url!} className="w-full h-full object-cover" />
                    <PlayCircle className="w-6 h-6 text-white absolute inset-0 m-auto opacity-80 pointer-events-none" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-navy truncate">{m.content || 'Video File'}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {c.sharedMediaTab === 'files' && (
          <div className="space-y-2">
            {c.messages.map((m: any) => ({ message: m, safePdfUrl: normalizeHttpUrl(m.pdf_url) })).filter((item: any) => item.safePdfUrl).length === 0
              ? <p className="text-center text-[13px] text-[var(--color-text-muted)] py-8">No files shared.</p>
              : c.messages
                .map((m: any) => ({ message: m, safePdfUrl: normalizeHttpUrl(m.pdf_url) }))
                .filter((item: any): item is { message: any; safePdfUrl: string } => !!item.safePdfUrl)
                .map(({ message, safePdfUrl }: { message: any; safePdfUrl: string }) => (
                  <a
                    key={message.id}
                    href={safePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F0F2F5] transition-colors border border-transparent hover:border-[var(--color-border)]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-navy truncate">{extractFileNameFromUrl(safePdfUrl, 'document.pdf')}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(message.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </a>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
