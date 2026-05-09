import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  X,
  Share2,
  Download,
  Settings,
  Clock,
  Calendar,
  BellOff,
  Loader2,
  PlayCircle,
  Film,
  Layers,
  FileText,
  ExternalLink,
} from 'lucide-react';
import PollWizard from '@/components/club-chat/PollWizard';
import { ProjectWizard } from '@/components/chat/ProjectWizard';
import { ProjectApplicationForm } from '@/components/chat/ProjectApplicationForm';
import { ProjectApplicantsDashboard } from '@/components/chat/ProjectApplicantsDashboard';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import { supabase } from '@/lib/supabase';
import { springs } from '@/lib/animation';
import ForwardMessageModal from '@/features/club-chat/workspace/ForwardMessageModal';

interface ClubChatModalStackProps {
  c: any;
}

export default function ClubChatModalStack({ c }: ClubChatModalStackProps) {
  return (
    <>
      {/* ── Image Viewer ── */}
      <AnimatePresence>
        {c.viewingImageMsg && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          >
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
                <button onClick={() => toast.info('Share image coming soon')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors" title="Share">
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = c.viewingImageMsg.image_url;
                    link.download = `fightclub_image_${c.viewingImageMsg.id}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Downloading...');
                  }}
                  className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => c.setViewingImageMsg(null)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ml-2" title="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-hidden flex items-center justify-center p-4 cursor-zoom-out"
              onClick={() => c.setViewingImageMsg(null)}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <motion.img
                src={c.viewingImageMsg.image_url}
                alt="Fullscreen view"
                draggable={false}
                className="max-w-full max-h-full object-contain drop-shadow-2xl select-none outline-none"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springs.image}
              />
            </div>

            {c.viewingImageMsg.content && (
              <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                <div className="max-w-3xl text-white text-[15px] font-body leading-relaxed text-center">
                  {c.viewingImageMsg.content}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Settings ── */}
      <AnimatePresence>
        {c.showChatSettings && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          >
            <motion.div
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={springs.modal}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-navy text-[17px] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-navy" /> Chat Settings
                </h3>
                <button onClick={() => c.setShowChatSettings(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-navy mb-3">Wallpaper</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['wall-default', 'wall-1', 'wall-2', 'wall-3'].map((w) => (
                      <button
                        title={w}
                        key={w}
                        onClick={() => c.updatePreference('wallpaper_class', w)}
                        className={`w-[72px] h-[96px] rounded-xl flex-shrink-0 border-2 transition-all shadow-sm ${w} ${c.preferences?.wallpaper_class === w ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:-translate-y-1'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-navy">Dark Mode Bubbles</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">Toggle chat interface themes</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={c.preferences?.is_dark_mode || false} onChange={(e) => c.updatePreference('is_dark_mode', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {c.isAdminOrMod && (
                  <div className="pt-5 border-t border-[var(--color-border)]">
                    <label className="block text-sm font-bold text-navy mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" /> Slow Mode Delay
                    </label>
                    <p className="text-[11px] text-[var(--color-text-muted)] mb-3">Members will be restricted from sending consecutive messages within this interval.</p>
                    <select
                      value={c.activeChannel?.slow_mode_delay || 0}
                      onChange={async (e) => {
                        if (!c.activeChannelId) return;
                        const val = parseInt(e.target.value, 10);
                        await supabase.from('club_channels').update({ slow_mode_delay: val }).eq('id', c.activeChannelId);
                        c.setChannels(c.channels.map((chan: any) => chan.id === c.activeChannelId ? { ...chan, slow_mode_delay: val } : chan));
                        toast.success(`Slow mode set to ${e.target.options[e.target.selectedIndex].text}`);
                      }}
                      className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium"
                    >
                      <option value={0}>Off</option>
                      <option value={10}>10s</option>
                      <option value={30}>30s</option>
                      <option value={60}>1m</option>
                      <option value={300}>5m</option>
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Schedule Message ── */}
      <AnimatePresence>
        {c.showScheduleModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          >
            <motion.div
              className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={springs.modal}
            >
              <h3 className="font-heading font-bold text-navy text-[17px] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" /> Schedule Message
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 ml-1">Date</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={c.scheduledDate} onChange={(e) => c.setScheduledDate(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 ml-1">Time</label>
                  <input type="time" value={c.scheduledTime} onChange={(e) => c.setScheduledTime(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium" />
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-2 rounded-xl transition-colors bg-slate-50 border border-[var(--color-border)]">
                    <input type="checkbox" checked={c.isSilentSend} onChange={(e) => c.setIsSilentSend(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
                    <span className="text-sm text-navy font-medium"><BellOff className="w-4 h-4 inline-block text-[var(--color-text-muted)] mr-1 mb-0.5" /> Send silently (no notification)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => c.setShowScheduleModal(false)} className="flex-1 py-3 rounded-xl text-[var(--color-text-secondary)] bg-gray-100 hover:bg-gray-200 transition-colors font-semibold text-sm">Cancel</button>
                <button onClick={c.submitScheduledMessage} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md text-sm hover:opacity-90 transition-opacity">Schedule Send</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Poll Wizard ── */}
      {c.showPollWizard && (
        <PollWizard
          pollQuestion={c.pollQuestion}
          pollOptions={c.pollOptions}
          pollIsAnonymous={c.pollIsAnonymous}
          pollMultipleAnswers={c.pollMultipleAnswers}
          savingPoll={c.savingPoll}
          onClose={() => c.setShowPollWizard(false)}
          onQuestionChange={c.setPollQuestion}
          onOptionsChange={c.setPollOptions}
          onIsAnonymousChange={c.setPollIsAnonymous}
          onMultipleAnswersChange={c.setPollMultipleAnswers}
          onSubmit={c.submitPollWizard}
        />
      )}

      {/* ── Video Wizard ── */}
      <AnimatePresence>
        {c.showVideoWizard && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          >
            <motion.div
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={springs.modal}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-purple-500" />
                  <h3 className="font-heading font-bold text-navy text-[17px]">Share Video to Playlist</h3>
                </div>
                <button onClick={() => c.setShowVideoWizard(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              {!c.videoWizardFile ? (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors mb-4">
                  <Film className="w-8 h-8 text-purple-400" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Click to select a video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { c.setVideoWizardFile(f); c.setVideoWizardPreview(URL.createObjectURL(f)); }
                  }} />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden mb-4 bg-black">
                  <video src={c.videoWizardPreview} controls className="w-full max-h-48 object-contain" />
                  <button onClick={() => { c.setVideoWizardFile(null); c.setVideoWizardPreview(''); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="space-y-3">
                <input value={c.videoTitle} onChange={(e) => c.setVideoTitle(e.target.value)} placeholder="Video title *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30" />
                <input value={c.videoDuration} onChange={(e) => c.setVideoDuration(e.target.value)} placeholder="Duration label (e.g. 12:30 — optional)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30" />
                <select value={c.videoPlaylistId} onChange={(e) => c.setVideoPlaylistId(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30 bg-white">
                  <option value="">— Select existing playlist —</option>
                  {c.playlists.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  <option value="__new__">+ Create new playlist</option>
                </select>
                {(c.videoPlaylistId === '__new__' || (!c.videoPlaylistId && c.playlists.length === 0)) && (
                  <input value={c.videoNewPlaylistName} onChange={(e) => c.setVideoNewPlaylistName(e.target.value)} placeholder="New playlist name *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30" />
                )}
              </div>
              <button disabled={c.savingVideo || !c.videoWizardFile || !c.videoTitle.trim()} onClick={c.submitVideoWizard} className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
                {c.savingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                {c.savingVideo ? 'Uploading…' : 'Save to Playlist & Share'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Project Wizard / Application / Applicants ── */}
      {c.showProjectWizard && (
        <ProjectWizard onClose={() => c.setShowProjectWizard(false)} onSubmit={c.submitProjectWizard} isSaving={c.savingProject} />
      )}

      {c.applyingToProject && (
        <ProjectApplicationForm
          project={c.applyingToProject}
          onClose={() => c.setApplyingToProject(null)}
          onSubmit={(payload) => c.handleSubmitApplication(c.applyingToProject, payload)}
          isSubmitting={c.submittingApplication}
        />
      )}

      {c.viewingApplicants && (
        <ProjectApplicantsDashboard project={c.viewingApplicants} onClose={() => c.setViewingApplicants(null)} onUpdateStatus={c.handleUpdateApplicationStatus} />
      )}

      {/* ── Event Wizard ── */}
      <AnimatePresence>
        {c.showEventWizard && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          >
            <motion.div
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={springs.modal}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <h3 className="font-heading font-bold text-navy text-[17px]">Create an Event</h3>
                </div>
                <button onClick={() => c.setShowEventWizard(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input value={c.evtTitle} onChange={(e) => c.setEvtTitle(e.target.value)} placeholder="Event title *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30" />
                <textarea value={c.evtDesc} onChange={(e) => c.setEvtDesc(e.target.value)} rows={2} placeholder="Description (optional)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30 resize-none" />
                <div className="grid grid-cols-3 gap-2">
                  {(['workshop', 'sprint', 'showcase'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => c.setEvtStyle(style)}
                      className={`px-2 py-2 rounded-xl border text-xs font-semibold capitalize transition-colors ${
                        c.evtStyle === style
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-parchment'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <input type="datetime-local" value={c.evtDate} onChange={(e) => c.setEvtDate(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30 bg-white" />
                <input value={c.evtDuration} onChange={(e) => c.setEvtDuration(e.target.value)} placeholder="Duration in minutes (optional)" type="number" min="1" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30" />
                <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--color-border)] cursor-pointer hover:bg-parchment transition-colors">
                  <input type="checkbox" checked={c.evtOnline} onChange={(e) => c.setEvtOnline(e.target.checked)} className="w-4 h-4 rounded accent-green-500" />
                  <span className="text-sm text-navy">Online Event</span>
                </label>
                {c.evtOnline && (
                  <input value={c.evtLink} onChange={(e) => c.setEvtLink(e.target.value)} placeholder="Meeting link (Zoom, Teams…)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30" />
                )}
              </div>
              <button disabled={c.savingEvent || !c.evtTitle.trim() || !c.evtDate} onClick={c.submitEventWizard} className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
                {c.savingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {c.savingEvent ? 'Creating…' : 'Create Event & Share'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shared Media ── */}
      <AnimatePresence>
        {c.showSharedMedia && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.backdrop}
          >
            <motion.div
              className="bg-white w-full sm:max-w-lg h-[85vh] sm:h-[75vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={springs.modal}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[var(--color-navy)]" />
                  <h3 className="font-heading font-bold text-navy text-[17px]">Shared Media</h3>
                </div>
                <button onClick={() => c.setShowSharedMedia(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex border-b border-[var(--color-border)] shrink-0">
                {(['images', 'videos', 'files'] as const).map((tab) => (
                  <button key={tab} onClick={() => c.setSharedMediaTab(tab)} className={`flex-1 py-2.5 text-[13px] font-medium capitalize transition-colors ${c.sharedMediaTab === tab ? 'border-b-2 border-[var(--color-navy)] text-navy' : 'text-[var(--color-text-muted)] hover:text-navy'}`}>
                    {tab === 'images' ? '🖼️ Images' : tab === 'videos' ? '🎥 Videos' : '📄 Files'}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {c.sharedMediaTab === 'images' && (
                  <div className="grid grid-cols-3 gap-2">
                    {c.messages.filter((m: any) => m.image_url).length === 0
                      ? <p className="col-span-3 text-center text-sm text-[var(--color-text-muted)] py-8">No images shared yet.</p>
                      : c.messages.filter((m: any) => m.image_url).map((m: any) => (
                        <div key={m.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { c.setShowSharedMedia(false); c.setViewingImageMsg(m); }}>
                          <img src={m.image_url!} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                      ))}
                  </div>
                )}
                {c.sharedMediaTab === 'videos' && (
                  <div className="space-y-3">
                    {c.messages.filter((m: any) => m.video_url).length === 0
                      ? <p className="text-center text-sm text-[var(--color-text-muted)] py-8">No videos shared yet.</p>
                      : c.messages.filter((m: any) => m.video_url).map((m: any) => (
                        <div key={m.id} className="flex gap-3 items-center p-3 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors">
                          <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden">
                            <video src={m.video_url!} preload="none" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{m.content || 'Video'}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {c.sharedMediaTab === 'files' && (
                  <div className="space-y-2">
                    {c.messages.map((m: any) => ({ message: m, safePdfUrl: normalizeHttpUrl(m.pdf_url) })).filter((item: any) => item.safePdfUrl).length === 0
                      ? <p className="text-center text-sm text-[var(--color-text-muted)] py-8">No files shared yet.</p>
                      : c.messages
                        .map((m: any) => ({ message: m, safePdfUrl: normalizeHttpUrl(m.pdf_url) }))
                        .filter((item: any): item is { message: any; safePdfUrl: string } => !!item.safePdfUrl)
                        .map(({ message, safePdfUrl }: { message: any; safePdfUrl: string }) => (
                          <a key={message.id} href={safePdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors">
                            <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy truncate">{extractFileNameFromUrl(safePdfUrl, 'document.pdf')}</p>
                              <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(message.created_at), 'MMM d, yyyy')}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                          </a>
                        ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ForwardMessageModal c={c} />
    </>
  );
}
