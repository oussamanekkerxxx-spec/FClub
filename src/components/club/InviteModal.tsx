import { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Users,
  Link,
} from 'lucide-react';
import { toast } from 'sonner';

interface InviteModalProps {
  club: any;
  onClose: () => void;
}

const SHARE_PLATFORMS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#E7FBF0',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (text: string) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E4405F',
    bg: '#FEE7EC',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    getUrl: (_text: string) => `https://www.instagram.com/`,
    note: 'Copy link to share via Instagram DM',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    bg: '#E7F0FD',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    color: '#FF4500',
    bg: '#FFF0EB',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    getUrl: (text: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#26A5E4',
    bg: '#E5F5FD',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (text: string) => `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    bg: '#F0F0F0',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`,
  },
  {
    id: 'email',
    label: 'Email',
    color: '#EA4335',
    bg: '#FEE9E8',
    icon: <Mail className="w-6 h-6" />,
    getUrl: (text: string, subject: string) =>
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + '\n\n' + window.location.href)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    color: '#34A853',
    bg: '#E6F4EA',
    icon: <MessageCircle className="w-6 h-6" />,
    getUrl: (text: string) => `sms:?body=${encodeURIComponent(text + ' ' + window.location.href)}`,
  },
];

export default function InviteModal({ club, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);

  const clubUrl = window.location.href;
  const inviteText = `Hey! Join "${club?.name || 'our club'}" on Lumina — ${club?.description ? club.description.slice(0, 80) + '…' : 'a great learning community!'}`;
  const subject = `Join ${club?.name || 'our club'} on Lumina`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(clubUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const sendViaSms = () => {
    if (!phoneNumber.trim()) return;
    const cleaned = phoneNumber.replace(/\s+/g, '');
    window.open(`sms:${cleaned}?body=${encodeURIComponent(inviteText + ' ' + clubUrl)}`);
    setPhoneSent(true);
    setTimeout(() => setPhoneSent(false), 3000);
  };

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
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--color-navy)] to-[#1a2a4a] px-6 pt-6 pb-8 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Club avatar */}
          <div className="flex items-center gap-4 mb-4">
            {club?.cover_url ? (
              <img
                src={club.cover_url}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20 flex-shrink-0"
                alt={club.name}
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">
                {club?.emoji || '🎓'}
              </div>
            )}
            <div>
              <h2 className="text-white font-bold text-[18px] leading-tight">{club?.name || 'Club'}</h2>
              {club?.description && (
                <p className="text-white/60 text-[13px] mt-0.5 line-clamp-2 leading-snug">
                  {club.description}
                </p>
              )}
            </div>
          </div>

          {/* Copy link box */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 mt-2 border border-white/10">
            <Link className="w-4 h-4 text-white/50 flex-shrink-0" />
            <span className="flex-1 text-white/70 text-[12px] font-mono truncate">{clubUrl}</span>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex-shrink-0 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-[var(--color-navy)] hover:bg-amber-50'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Share via platforms */}
          <div>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Share via
            </p>
            <div className="grid grid-cols-4 gap-3">
              {SHARE_PLATFORMS.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.getUrl(inviteText, subject)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={platform.note || platform.label}
                  className="flex flex-col items-center gap-1.5 group"
                  onClick={(e) => {
                    if (platform.id === 'sms') {
                      e.preventDefault();
                      window.open(platform.getUrl(inviteText, subject));
                    }
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md"
                    style={{ backgroundColor: platform.bg, color: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--color-text-secondary)] text-center leading-tight">
                    {platform.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Invite by phone number */}
          <div>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Invite by phone number
            </p>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1 bg-[#F8F9FA] border border-[var(--color-border)] rounded-xl px-3 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <Phone className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-navy placeholder-[var(--color-text-muted)]"
                  onKeyDown={(e) => e.key === 'Enter' && sendViaSms()}
                />
              </div>
              <button
                onClick={sendViaSms}
                disabled={!phoneNumber.trim()}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                  phoneSent
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--color-navy)] text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {phoneSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {phoneSent ? 'Sent!' : 'Send'}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 ml-1">
              Opens your SMS app with a pre-filled invite message.
            </p>
          </div>

          {/* Club info card */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[var(--color-border)]">
            <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              What your friends will see
            </p>
            <div className="bg-white rounded-xl p-3 border border-[var(--color-border)] shadow-sm">
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                {inviteText}
              </p>
              <p className="text-[12px] text-blue-500 mt-1 truncate">{clubUrl}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
