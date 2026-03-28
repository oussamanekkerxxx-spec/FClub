import { Shield, GraduationCap, Sparkles, Check, MapPin, Edit3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TRUST_TIER_LABELS, type TrustTier, type User } from '@/contexts/AuthContext';

interface Props {
  user: User;
  onEditAvatar?: () => void;
  onEditProfile?: () => void;
}

const TIER_ACCENT: Record<number, { ring: string; badge: string; text: string }> = {
  2: { ring: '#2D7A4F', badge: 'rgba(45,122,79,0.2)', text: '#7DD4A8' },
  3: { ring: '#C4873A', badge: 'rgba(196,135,58,0.2)', text: '#F0C07A' },
  4: { ring: '#5C3D8F', badge: 'rgba(92,61,143,0.2)', text: '#B59EE0' },
};

const TIER_ICONS: Record<number, React.ReactNode> = {
  2: <Shield className="w-3 h-3" />,
  3: <GraduationCap className="w-3 h-3" />,
  4: <Sparkles className="w-3 h-3" />,
};

export default function VerifiedProfileCard({ user, onEditAvatar, onEditProfile }: Props) {
  const accent = TIER_ACCENT[user.trust_tier] ?? TIER_ACCENT[2];
  const tierIcon = TIER_ICONS[user.trust_tier] ?? TIER_ICONS[2];

  const verificationBadges = [
    { label: 'Photo', done: !!user.avatar },
    { label: 'Phone', done: user.phone_verified },
    { label: 'ID', done: user.id_verified },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, #2D1B4E 100%)' }}
    >
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none select-none">
        <span className="font-heading font-black text-white/[0.035] text-9xl tracking-widest">FC</span>
      </div>

      <div className="relative p-6">
        {/* Top row */}
        <div className="flex items-start justify-between mb-5">
          {/* Avatar */}
          <div className="relative">
            <div
              className="rounded-full p-0.5"
              style={{ background: `linear-gradient(135deg, ${accent.ring}, transparent)` }}
            >
              <Avatar className="w-20 h-20 ring-2 ring-white/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback
                  className="text-xl font-heading font-bold text-white"
                  style={{ background: 'var(--color-amber)' }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            {onEditAvatar && (
              <button
                onClick={onEditAvatar}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Edit3 className="w-3 h-3 text-white" />
              </button>
            )}
          </div>

          {/* Tier badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-body"
            style={{ background: accent.badge, color: accent.text }}
          >
            {tierIcon}
            {TRUST_TIER_LABELS[user.trust_tier as TrustTier]}
          </div>
        </div>

        {/* Name & location */}
        <h2 className="font-heading text-white text-2xl leading-tight mb-1">
          {user.firstName} {user.lastName}
        </h2>
        {user.location && (
          <div className="flex items-center gap-1.5 text-white/50 text-sm font-body mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {user.location}
          </div>
        )}

        {/* Bio */}
        {user.bio && (
          <p className="text-white/60 text-sm font-body leading-relaxed mb-4 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Verification badges */}
        <div className="flex gap-2 flex-wrap mb-5">
          {verificationBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-medium transition-colors"
              style={
                badge.done
                  ? { background: 'rgba(255,255,255,0.15)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }
              }
            >
              <Check className={`w-3 h-3 ${badge.done ? 'opacity-100' : 'opacity-20'}`} />
              {badge.label}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div
          className="flex gap-6 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-center">
            <div className="font-heading font-bold text-white text-lg leading-none">
              {user.sessions_completed}
            </div>
            <div className="text-white/35 text-[11px] font-body mt-0.5">Sessions</div>
          </div>
          <div className="text-center">
            <div className="font-heading font-bold text-white text-lg leading-none">
              {user.reviews_count}
            </div>
            <div className="text-white/35 text-[11px] font-body mt-0.5">Reviews</div>
          </div>
          <div className="text-center">
            <div
              className="font-heading font-bold text-lg leading-none"
              style={{ color: 'var(--color-amber)' }}
            >
              ★ {user.trust_score}
            </div>
            <div className="text-white/35 text-[11px] font-body mt-0.5">Trust</div>
          </div>
          {user.languages?.length > 0 && (
            <div className="text-center">
              <div className="font-heading font-bold text-white text-lg leading-none">
                {user.languages.length}
              </div>
              <div className="text-white/35 text-[11px] font-body mt-0.5">Languages</div>
            </div>
          )}
        </div>
      </div>

      {/* Edit button overlay (only for own profile) */}
      {onEditProfile && (
        <button
          onClick={onEditProfile}
          className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-body text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          <Edit3 className="w-3 h-3" />
          Edit
        </button>
      )}
    </div>
  );
}
