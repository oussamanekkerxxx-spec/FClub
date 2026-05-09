import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth, TRUST_TIER_LABELS } from '@/contexts/AuthContext';
import { MOROCCO_REGIONS } from '@/lib/morocco';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { useProfileData } from '@/hooks/useProfileData';
import BookingsDashboard from '@/components/bookings/BookingsDashboard';
import GovernmentIDModal from '@/components/profile/GovernmentIDModal';
import ProfileCoverPicker from '@/components/profile/ProfileCoverPicker';
import ProfileEditModal, { type ProfileEditValues } from '@/components/profile/ProfileEditModal';
import ProfileHeroCard from '@/components/profile/ProfileHeroCard';
import ProfileTagGroup from '@/components/profile/ProfileTagGroup';
import TrustProgress from '@/components/profile/TrustProgress';
import TrustTimeline from '@/components/profile/TrustTimeline';
import { useT } from '@/lib/t';
import { BookOpen, Check, Globe, MapPin, Phone, Shield, Sparkles, Users } from 'lucide-react';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

const COVER_GRADIENTS = [
  { label: 'Navy Glow', value: 'linear-gradient(135deg,#1B2A4A 0%,#35507B 50%,#5C3D8F 100%)' },
  { label: 'Amber Warmth', value: 'linear-gradient(135deg,#C4873A 0%,#E3A450 100%)' },
  { label: 'Forest Depths', value: 'linear-gradient(135deg,#24523C 0%,#2D7A4F 100%)' },
  { label: 'Sunrise', value: 'linear-gradient(135deg,#D97706 0%,#EA580C 55%,#DC2626 100%)' },
  { label: 'Ocean', value: 'linear-gradient(135deg,#2563EB 0%,#0891B2 100%)' },
  { label: 'Rose Gold', value: 'linear-gradient(135deg,#FB7185 0%,#F59E0B 100%)' },
];

const COVER_PHOTOS = [
  { label: 'Mountains', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=500&fit=crop' },
  { label: 'Forest', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=500&fit=crop' },
  { label: 'Ocean', value: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&h=500&fit=crop' },
  { label: 'Desert', value: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=500&fit=crop' },
  { label: 'City', value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=500&fit=crop' },
  { label: 'Morocco', value: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=1200&h=500&fit=crop' },
];

type ProfileTab = 'about' | 'relations' | 'trust';

function parseUniqueCsv(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(',')) {
    const cleaned = part.trim().replace(/\s+/g, ' ');
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

function TabButton({
  active,
  label,
  panelId,
  tabId,
  onClick,
}: {
  active: boolean;
  label: string;
  panelId: string;
  tabId: string;
  onClick: () => void;
}) {
  return (
    <button
      id={tabId}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition sm:px-5 ${
        active
          ? 'bg-[var(--color-navy)] text-white shadow-lg'
          : 'text-[var(--color-text-secondary)] hover:bg-slate-50 hover:text-[var(--color-navy)]'
      }`}
    >
      {label}
    </button>
  );
}

export default function Profile() {
  const { t } = useT();
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();
  const { user, setLocalUser, saveProfile, updateCover } = useProfileData({ authUser, updateUser });
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverPickerTab, setCoverPickerTab] = useState<'gradients' | 'photos'>('gradients');
  const [showIdModal, setShowIdModal] = useState(false);
  const [form, setForm] = useState<ProfileEditValues>({
    bio: '',
    city: '',
    region: '',
    phone: '',
    languages: '',
    teach: '',
    learn: '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const avatarUpload = useStorageUpload({
    bucket: 'avatars',
    maxBytes: 2 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    profileField: 'avatar_url',
    onSuccess: (url) => setLocalUser({ avatar: url }),
  });
  const coverUpload = useStorageUpload({
    bucket: 'avatars',
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    profileField: 'cover_url',
    onSuccess: (url) => {
      setLocalUser({ cover_url: url });
      setShowCoverPicker(false);
    },
  });
  const setFormField = <K extends keyof ProfileEditValues,>(field: K, value: ProfileEditValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openEditModal = () => {
    if (!user) return;
    setForm({
      bio: user.bio || '',
      city: user.city || '',
      region: user.region || '',
      phone: user.phone || '',
      languages: user.languages.join(', '),
      teach: user.what_i_teach.join(', '),
      learn: user.what_i_learn.join(', '),
    });
    setIsEditing(true);
  };

  const handleTrustAction = (key: string) => {
    switch (key) {
      case 'photo':   avatarInputRef.current?.click(); break;
      case 'bio':
      case 'phone':   openEditModal(); break;
      case 'id':      setShowIdModal(true); break;
      case 'skill':   navigate('/app/teach'); break;
      case 'session': navigate('/app/board'); break;
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveProfile({
        bio: form.bio,
        city: form.city,
        region: form.region,
        phone: form.phone,
        languages: parseUniqueCsv(form.languages),
        what_i_teach: parseUniqueCsv(form.teach),
        what_i_learn: parseUniqueCsv(form.learn),
      });
      toast.success(t('Profile updated.'));
      setIsEditing(false);
    } catch {
      toast.error(t('Failed to save profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    await avatarUpload.upload(file, user.id, `${user.id}/profile`, 'Profile photo updated.');
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    await coverUpload.upload(file, user.id, `${user.id}/cover`, 'Cover photo updated.');
    e.target.value = '';
  };

  const handleCoverPreset = async (coverUrl: string) => {
    if (!user) return;
    try {
      await updateCover(coverUrl);
      toast.success('Cover updated.');
      setShowCoverPicker(false);
    } catch {
      toast.error('Failed to update cover.');
    }
  };

  if (!user) return null;

  const locationSummary = [user.city, user.region].filter(Boolean).join(', ') || user.location;
  const verificationItems = [
    { label: 'Email on account', done: true, icon: Check },
    { label: user.phone ? 'Phone number added' : 'Add your phone number', done: !!user.phone, icon: Phone },
    { label: user.id_verified ? 'Government ID approved' : 'Government ID pending', done: user.id_verified, icon: Shield },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      <ProfileHeroCard
        name={`${user.firstName} ${user.lastName}`.trim()}
        subtitle={TRUST_TIER_LABELS[user.trust_tier]}
        location={locationSummary}
        bio={user.bio || t('Tell your community what you teach, what you are learning, and how you like to collaborate.')}
        avatar={user.avatar}
        cover={user.cover_url}
        badgeLabel={t('Member card')}
        verified={user.trust_tier >= 2 || user.id_verified}
        onEditAvatar={() => avatarInputRef.current?.click()}
        onChangeCover={() => setShowCoverPicker(true)}
        onEditProfile={openEditModal}
        avatarUploading={avatarUpload.uploading}
        coverUploading={coverUpload.uploading}
        stats={[
          { label: t('Sessions'), value: user.sessions_completed, tone: 'forest' },
          { label: t('Reviews'), value: user.reviews_count, tone: 'default' },
          { label: t('Trust'), value: user.trust_score, tone: 'warm' },
          { label: t('Learning'), value: user.what_i_learn.length, tone: 'plum' },
        ]}
      />

      <div className="sc-card p-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Profile sections">
          <TabButton active={activeTab === 'about'} label={t('About')} tabId="profile-tab-about" panelId="profile-panel-about" onClick={() => setActiveTab('about')} />
          <TabButton active={activeTab === 'relations'} label={t('Relations')} tabId="profile-tab-relations" panelId="profile-panel-relations" onClick={() => setActiveTab('relations')} />
          <TabButton active={activeTab === 'trust'} label={t('Trust')} tabId="profile-tab-trust" panelId="profile-panel-trust" onClick={() => setActiveTab('trust')} />
        </div>
      </div>

      {activeTab === 'about' ? (
        <div id="profile-panel-about" role="tabpanel" aria-labelledby="profile-tab-about" className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="sc-card p-6">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{t('About me')}</div>
              <p className="text-[15px] leading-7 text-[var(--color-text-secondary)]">
                {user.bio || t('Add a short bio so people understand your interests, context, and how they can work with you.')}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="sc-card p-6">
                <ProfileTagGroup label={t('What I teach')} icon={<BookOpen className="h-3.5 w-3.5" />} items={user.what_i_teach} emptyLabel={t('No skills listed yet')} tone="amber" />
              </div>
              <div className="sc-card p-6">
                <ProfileTagGroup label={t('What I learn')} icon={<Sparkles className="h-3.5 w-3.5" />} items={user.what_i_learn} emptyLabel={t('No learning goals listed yet')} tone="plum" />
              </div>
            </div>
            <div className="sc-card p-6">
              <ProfileTagGroup label="Languages" icon={<Globe className="h-3.5 w-3.5" />} items={user.languages} emptyLabel="No languages added yet" tone="slate" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="sc-card p-6">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{t('Profile details')}</div>
              <div className="space-y-3">
                {[
                  { label: t('City'), value: user.city || t('Add your city'), icon: MapPin },
                  { label: t('Region'), value: user.region || t('Add your region'), icon: Shield },
                  { label: t('Phone'), value: user.phone || t('Add your phone number'), icon: Phone },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <item.icon className="mt-0.5 h-4 w-4 text-[var(--color-amber)]" />
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-navy)]">{item.label}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sc-card p-6">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{t('Snapshot')}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-4"><div className="text-2xl font-semibold text-amber-700">{user.what_i_teach.length}</div><div className="mt-1 text-xs font-medium text-amber-700/80">{t('Teaching topics')}</div></div>
                <div className="rounded-2xl border border-violet-200/70 bg-violet-50 px-4 py-4"><div className="text-2xl font-semibold text-violet-700">{user.languages.length}</div><div className="mt-1 text-xs font-medium text-violet-700/80">{t('Languages')}</div></div>
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-4"><div className="text-2xl font-semibold text-emerald-700">{user.sessions_completed}</div><div className="mt-1 text-xs font-medium text-emerald-700/80">{t('Sessions done')}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"><div className="text-2xl font-semibold text-[var(--color-navy)]">{user.reviews_count}</div><div className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">{t('Reviews')}</div></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'relations' ? (
        <div id="profile-panel-relations" role="tabpanel" aria-labelledby="profile-tab-relations" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="sc-card p-6">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]"><Users className="h-3.5 w-3.5" />{t('Your network')}</div>
              <p className="text-[15px] leading-7 text-[var(--color-text-secondary)]">
                This section keeps the relationship layer grounded in real activity. Session requests, confirmations, and completed exchanges stay connected to the same booking flow the app already uses.
              </p>
            </div>
            <div className="sc-card p-6">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{t('Collaboration snapshot')}</div>
              <div className="space-y-3">
                {[
                  [t('Trust tier'), TRUST_TIER_LABELS[user.trust_tier]],
                  [t('Completed sessions'), String(user.sessions_completed)],
                  [t('Reviews received'), String(user.reviews_count)],
                  [t('Skills shared'), String(user.what_i_teach.length)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                    <span className="text-sm font-semibold text-[var(--color-navy)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-navy)]">{t('Session requests')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('Incoming requests, confirmations, and history are unchanged. This is a visual refresh only.')}</p>
            </div>
            <BookingsDashboard />
          </div>
        </div>
      ) : null}

      {activeTab === 'trust' ? (
        <div id="profile-panel-trust" role="tabpanel" aria-labelledby="profile-tab-trust" className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <TrustProgress user={user} onActionClick={handleTrustAction} />
            <TrustTimeline userId={user.id} />
          </div>
          <div className="sc-card p-6">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Verification status</div>
            <div className="space-y-3">
              {verificationItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}><item.icon className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--color-navy)]">{item.label}</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">{item.done ? t('Completed') : t('Still needed')}</div>
                  </div>
                </div>
              ))}
            </div>

            {!user.id_verified && (
              <button
                onClick={() => setShowIdModal(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-[var(--color-navy)] transition hover:border-[var(--color-amber)] hover:bg-amber-50"
              >
                {user.id_card_status === 'pending' ? t('View ID verification status') : user.id_card_status === 'rejected' ? t('Re-submit government ID') : t('Submit ID for verification')}
              </button>
            )}
          </div>
        </div>
      ) : null}

      <ProfileEditModal open={isEditing} values={form} regions={MOROCCO_REGIONS} isSaving={isSaving} onClose={() => setIsEditing(false)} onSave={handleSaveProfile} onChange={setFormField} />
      <ProfileCoverPicker open={showCoverPicker} currentCover={user.cover_url} currentTab={coverPickerTab} gradients={COVER_GRADIENTS} photos={COVER_PHOTOS} onClose={() => setShowCoverPicker(false)} onTabChange={setCoverPickerTab} onChoose={handleCoverPreset} onUpload={() => coverInputRef.current?.click()} />
      <GovernmentIDModal
        open={showIdModal}
        onClose={() => setShowIdModal(false)}
        userId={user.id}
        idCardStatus={user.id_card_status}
        idVerified={user.id_verified}
        onSubmitted={() => {
          setLocalUser({ id_card_status: 'pending' });
          setShowIdModal(false);
        }}
      />
    </div>
  );
}
