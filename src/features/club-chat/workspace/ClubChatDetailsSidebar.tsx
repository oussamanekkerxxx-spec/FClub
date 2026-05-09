import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCheck, Users, Image as ImageIcon, PlayCircle, FileText, X } from 'lucide-react';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import { springs } from '@/lib/animation';

interface ClubChatDetailsSidebarProps {
  c: any;
}

const ClubChatDetailsSidebar = React.memo(function ClubChatDetailsSidebar({ c }: ClubChatDetailsSidebarProps) {
  const mediaStats = useMemo(() => ({
    mediaCount: c.messages.filter((m: any) => m.image_url || m.video_url).length,
    imageMessages: c.messages.filter((m: any) => m.image_url),
    videoMessages: c.messages.filter((m: any) => m.video_url),
    fileMessages: c.messages.map((m: any) => ({ message: m, safePdfUrl: normalizeHttpUrl(m.pdf_url) })).filter((item: any) => item.safePdfUrl),
  }), [c.messages]);

  return (
    <AnimatePresence>
      {c.showDetailsPanel && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 hidden lg:block"
            onClick={() => c.setShowDetailsPanel(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          />
          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-[320px] flex flex-col bg-[#FAFAFA] border-l border-[var(--color-border)] overflow-hidden shadow-2xl hidden lg:flex"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springs.sidebar}
          >
        {/* Close button (visible on smaller desktop where rail is still shown) */}
        <button
          onClick={() => c.setShowDetailsPanel(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 text-[var(--color-text-muted)] hover:text-navy transition-colors z-10"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 flex flex-col items-center bg-white border-b border-[var(--color-border)] shrink-0">
          <Avatar className="w-20 h-20 mb-3 shadow-md border-4 border-white">
            <AvatarFallback className="text-3xl bg-[var(--color-parchment)] text-[var(--color-navy)] font-heading font-bold">{c.clubName[0]}</AvatarFallback>
          </Avatar>
          <h3 className="font-heading font-bold text-lg text-navy text-center flex items-center gap-1.5">{c.clubName} <CheckCheck className="w-4 h-4 text-blue-500" /></h3>
          <div className="flex items-center gap-4 mt-3 text-[13px] text-[var(--color-text-secondary)] font-medium">
            <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Members</div>
            <div className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full"></div>
            <div className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> {mediaStats.mediaCount} Media</div>
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
              {mediaStats.imageMessages.length === 0
                ? <p className="col-span-3 text-center text-[13px] text-[var(--color-text-muted)] py-8">No images shared.</p>
                : mediaStats.imageMessages.map((m: any) => (
                  <div
                    key={m.id}
                    className="aspect-square bg-black/5 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => c.setViewingImageMsg(m)}
                  >
                    <img src={m.image_url!} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                ))}
            </div>
          )}

          {c.sharedMediaTab === 'videos' && (
            <div className="space-y-2">
              {mediaStats.videoMessages.length === 0
                ? <p className="text-center text-[13px] text-[var(--color-text-muted)] py-8">No videos shared.</p>
                : mediaStats.videoMessages.map((m: any) => (
                  <div key={m.id} className="flex gap-3 items-center p-2 rounded-xl hover:bg-[#F0F2F5] transition-colors border border-transparent hover:border-[var(--color-border)] cursor-pointer">
                    <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden relative">
                      <video src={m.video_url!} preload="none" className="w-full h-full object-cover" />
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
              {mediaStats.fileMessages.length === 0
                ? <p className="text-center text-[13px] text-[var(--color-text-muted)] py-8">No files shared.</p>
                : mediaStats.fileMessages.map(({ message, safePdfUrl }: { message: any; safePdfUrl: string }) => (
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
        </motion.div>
      </>
      )}
    </AnimatePresence>
  );
});

export default ClubChatDetailsSidebar;
