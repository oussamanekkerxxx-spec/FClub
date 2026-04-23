import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const WA = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const IG = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const FB = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const RD = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
  </svg>
);
const TG = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);
const XX = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const SC = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12.166.006C9.835-.026 5.04.75 2.889 5.66c-.693 1.58-.57 3.442-.507 4.282l-.012.01s-.698.08-1.313.499c-.643.44-.949 1.176-.78 1.91.3 1.286 1.55 1.645 2.322 1.705.04.006.077.014.116.018 1.104 2.09 3.074 3.662 5.476 4.08-.083.129-.178.237-.304.31-.379.222-.904.276-1.589.162-.44-.074-.809-.261-1.127-.426a3.78 3.78 0 0 0-1.705-.474c-.773 0-1.553.421-1.618 1.003-.05.456.279.872.978 1.234 1.023.528 2.162.815 3.164.963.044.025.09.046.146.046.024 0 .054-.006.079-.01A9.76 9.76 0 0 0 12 21.21a9.76 9.76 0 0 0 5.785-1.868c.025.004.055.01.08.01.055 0 .101-.021.145-.046 1.003-.148 2.141-.435 3.164-.963.7-.362 1.027-.778.978-1.234-.065-.582-.845-1.003-1.618-1.003a3.78 3.78 0 0 0-1.705.474c-.318.165-.687.352-1.127.426-.685.114-1.21.06-1.59-.163-.125-.073-.22-.18-.303-.309 2.402-.418 4.372-1.99 5.476-4.08.039-.004.076-.012.116-.018.772-.06 2.022-.419 2.322-1.705.168-.734-.138-1.47-.781-1.91-.614-.42-1.312-.499-1.312-.499l-.012-.01c.063-.84.186-2.702-.507-4.282C18.96.75 14.165-.026 12.166.006z" />
  </svg>
);
const TK = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
  </svg>
);

export interface SharePlatform {
  id: string;
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  getPostUrl: (text: string, subject: string, url: string) => string;
  getStoryUrl?: (url: string) => string;
  storyNote?: string;
}

export const PLATFORMS: SharePlatform[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#E7FBF0',
    icon: <WA />,
    getPostUrl: (t, _s, u) => `https://api.whatsapp.com/send?text=${encodeURIComponent(t + ' ' + u)}`,
    getStoryUrl: (_u) => `whatsapp://`, // WhatsApp Status is manual; open app
    storyNote: 'Open WhatsApp → Status to paste your link.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E4405F',
    bg: '#FEE7EC',
    icon: <IG />,
    getPostUrl: (_t, _s, _u) => `https://www.instagram.com/`,
    getStoryUrl: (_u) => `instagram://story-camera`,
    storyNote: 'Open Instagram → Stories camera, paste your link in a sticker.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    bg: '#E7F0FD',
    icon: <FB />,
    getPostUrl: (t, _s, u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}&quote=${encodeURIComponent(t)}`,
    getStoryUrl: (u) => `https://www.facebook.com/stories/create?link=${encodeURIComponent(u)}`,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    color: '#FF4500',
    bg: '#FFF0EB',
    icon: <RD />,
    getPostUrl: (t, _s, u) => `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#26A5E4',
    bg: '#E5F5FD',
    icon: <TG />,
    getPostUrl: (t, _s, u) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    getStoryUrl: (_u) => `https://t.me/`,
    storyNote: 'Share as a Telegram Story from your profile.',
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    bg: '#F0F0F0',
    icon: <XX />,
    getPostUrl: (t, _s, u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    color: '#FFFC00',
    bg: '#FFFDE7',
    icon: <SC />,
    getPostUrl: (_, _s, u) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(u)}`,
    getStoryUrl: (u) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(u)}`,
    storyNote: 'Opens Snapchat to share as a Snap Story.',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#010101',
    bg: '#F5F5F5',
    icon: <TK />,
    getPostUrl: (_t, _s, _u) => `https://www.tiktok.com/`,
    getStoryUrl: (_u) => `https://www.tiktok.com/`,
    storyNote: 'Open TikTok → Add video → insert the link in your bio or caption.',
  },
  {
    id: 'email',
    label: 'Email',
    color: '#EA4335',
    bg: '#FEE9E8',
    icon: <Mail className="w-6 h-6" />,
    getPostUrl: (t, s, u) => `mailto:?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(t + '\n\n' + u)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    color: '#34A853',
    bg: '#E6F4EA',
    icon: <MessageCircle className="w-6 h-6" />,
    getPostUrl: (t, _s, u) => `sms:?body=${encodeURIComponent(t + ' ' + u)}`,
  },
];
