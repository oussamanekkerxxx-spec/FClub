import { useState } from 'react';
import { X, Copy, Check, Link, Share2, Layers, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PLATFORMS } from './sharePlatforms';

interface ShareClubModalProps {
  club: any;
  onClose: () => void;
}

type Tab = 'post' | 'stories';

export default function ShareClubModal({ club, onClose }: ShareClubModalProps) {
  const [tab, setTab] = useState<Tab>('post');
  const [copied, setCopied] = useState(false);

  const clubUrl = window.location.href;
  const shareText = `Check out "${club?.name || 'this club'}" on Lumina — ${club?.description ? club.description.slice(0, 80) + '…' : 'join us to learn and grow!'}`;
  const subject = `${club?.name || 'Club'} on Lumina`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(clubUrl);
    setCopied(true);
    toast.success('Club link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Story platforms = only those with getStoryUrl
  const storyPlatforms = PLATFORMS.filter((p) => !!p.getStoryUrl);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-6 pt-6 pb-8 flex-shrink-0">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            {club?.cover_url ? (
              <img src={club.cover_url} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20 flex-shrink-0" alt={club.name} />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
                {club?.emoji || '🎓'}
              </div>
            )}
            <div>
              <p className="text-white/60 text-[11px] uppercase tracking-widest font-bold mb-0.5">Share Club</p>
              <h2 className="text-white font-bold text-[18px] leading-tight">{club?.name || 'Club'}</h2>
              {club?.description && (
                <p className="text-white/50 text-[12px] mt-0.5 line-clamp-1">{club.description}</p>
              )}
            </div>
          </div>

          {/* Copy link row */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
            <Link className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="flex-1 text-white/60 text-[12px] font-mono truncate">{clubUrl}</span>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex-shrink-0 ${
                copied ? 'bg-green-500 text-white' : 'bg-white text-[#1a1a2e] hover:bg-violet-50'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[var(--color-border)] flex-shrink-0 bg-white">
          {([['post', Share2, 'Share as Post'], ['stories', Layers, 'Share to Stories']] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors ${
                tab === id
                  ? 'border-b-2 border-violet-600 text-violet-700'
                  : 'text-[var(--color-text-muted)] hover:text-navy'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {tab === 'post' && (
            <div className="space-y-5">
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Share on platforms
              </p>
              <div className="grid grid-cols-5 gap-3">
                {PLATFORMS.map((p) => (
                  <a
                    key={p.id}
                    href={p.getPostUrl(shareText, subject, clubUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-md"
                      style={{ backgroundColor: p.bg, color: p.color }}
                    >
                      {p.icon}
                    </div>
                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)] text-center leading-tight">
                      {p.label}
                    </span>
                  </a>
                ))}
              </div>

              {/* Preview */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[var(--color-border)]">
                <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Preview</p>
                <div className="bg-white rounded-xl p-3 border border-[var(--color-border)] shadow-sm">
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">{shareText}</p>
                  <p className="text-[12px] text-blue-500 mt-1 truncate">{clubUrl}</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'stories' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-[12px] text-[var(--color-text-muted)] bg-violet-50 border border-violet-100 rounded-xl p-3">
                <Info className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <p>
                  Story sharing opens the app directly on mobile. On desktop, copy the link and paste it into your story manually.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {storyPlatforms.map((p) => (
                  <a
                    key={p.id}
                    href={p.getStoryUrl!(clubUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[#F8F9FA] transition-colors group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: p.bg, color: p.color }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy">{p.label} Story</p>
                      {p.storyNote && (
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-snug mt-0.5">{p.storyNote}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                      Open →
                    </div>
                  </a>
                ))}
              </div>

              {/* Copy reminder for stories */}
              <div className="mt-2">
                <button
                  onClick={copyLink}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    copied
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-[#F8F9FA] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link Copied!' : 'Copy club link to paste in your story'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex-shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] bg-gray-100 hover:bg-gray-200 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
