import type { CSSProperties, ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, Camera, Edit3, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeroStat {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'warm' | 'forest' | 'plum';
}

interface ProfileHeroCardProps {
  name: string;
  subtitle: string;
  location?: string;
  bio?: string;
  avatar?: string;
  cover?: string;
  badgeLabel?: string;
  verified?: boolean;
  stats: ProfileHeroStat[];
  onEditAvatar?: () => void;
  onChangeCover?: () => void;
  onEditProfile?: () => void;
  avatarUploading?: boolean;
  coverUploading?: boolean;
  sideAction?: ReactNode;
}

const DEFAULT_COVER = 'linear-gradient(135deg, #1B2A4A 0%, #35507B 48%, #5C3D8F 100%)';

const STAT_TONE_CLASSES: Record<NonNullable<ProfileHeroStat['tone']>, string> = {
  default: 'border-slate-200/80 bg-slate-50/85 text-[var(--color-navy)]',
  warm: 'border-amber-200/70 bg-amber-50 text-amber-700',
  forest: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
  plum: 'border-violet-200/70 bg-violet-50 text-violet-700',
};

function getCoverStyle(cover?: string): CSSProperties {
  if (cover?.startsWith('linear-gradient')) {
    return { background: cover };
  }

  if (!cover) {
    return { background: DEFAULT_COVER };
  }

  return {
    backgroundImage: `url('${cover}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#1B2A4A',
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileHeroCard({
  name,
  subtitle,
  location,
  bio,
  avatar,
  cover,
  badgeLabel,
  verified = false,
  stats,
  onEditAvatar,
  onChangeCover,
  onEditProfile,
  avatarUploading = false,
  coverUploading = false,
  sideAction,
}: ProfileHeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[var(--shadow-floating)]">
      <div className="relative h-32 sm:h-56" style={getCoverStyle(cover)}>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,15,35,0.2)_0%,rgba(27,42,74,0.5)_55%,rgba(92,61,143,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(196,135,58,0.28),transparent_28%)]" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {badgeLabel ? (
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
                {badgeLabel}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {onChangeCover ? (
              <button
                onClick={onChangeCover}
                disabled={coverUploading}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-slate-950/50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {coverUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                Change cover
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-16 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative w-fit">
              <Avatar className="h-28 w-28 border-4 border-white shadow-[0_16px_40px_rgba(15,23,42,0.25)] sm:h-32 sm:w-32">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-[var(--color-amber)] text-xl font-bold text-white">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              {onEditAvatar ? (
                <button
                  onClick={onEditAvatar}
                  disabled={avatarUploading}
                  className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--color-navy)] shadow-lg transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  title="Change avatar"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit3 className="h-4 w-4" />
                  )}
                </button>
              ) : null}
            </div>

            <div className="space-y-2 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-[var(--color-navy)] sm:text-4xl">
                  {name}
                </h1>
                {verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
                <span>{subtitle}</span>
                {location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[var(--color-amber)]" />
                    {location}
                  </span>
                ) : null}
              </div>

              {bio ? (
                <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-[15px]">
                  {bio}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {sideAction}
            {onEditProfile ? (
              <button
                onClick={onEditProfile}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-navy)] shadow-sm transition hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]"
              >
                <Edit3 className="h-4 w-4" />
                Edit profile
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 sm:mt-6 grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-xl sm:rounded-2xl border px-1.5 py-2 sm:px-4 sm:py-3 flex flex-col items-center justify-center text-center sm:items-start sm:text-left backdrop-blur-sm',
                STAT_TONE_CLASSES[stat.tone ?? 'default']
              )}
            >
              <div className="text-lg sm:text-2xl font-semibold leading-none">{stat.value}</div>
              <div className="mt-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.22em] text-current/70 w-full truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
