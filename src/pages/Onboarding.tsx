import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MOROCCO_REGIONS } from '@/lib/morocco';

const LANGUAGES = [
  { id: 'Arabic', label: 'Arabic', emoji: '🇲🇦' },
  { id: 'French', label: 'French', emoji: '🇫🇷' },
  { id: 'English', label: 'English', emoji: '🇬🇧' },
  { id: 'Spanish', label: 'Spanish', emoji: '🇪🇸' },
  { id: 'Tamasheq', label: 'Tamasheq', emoji: '🏔️' },
];

const SKILL_TAGS = [
  'Music', 'Languages', 'Technology', 'Cooking', 'Art & Craft',
  'Fitness', 'Photography', 'Writing', 'Business', 'Crafts',
  'Yoga', 'Drawing', 'Chess', 'Gardening', 'Calligraphy',
];

const STEPS = [
  { id: 'identity', question: 'Tell us who you are', subtext: 'This is how the community will know you.' },
  { id: 'location', question: 'Where in Morocco are you?', subtext: 'We use this to show you nearby skills and people.' },
  { id: 'skills', question: 'What do you teach and learn?', subtext: 'You can add more any time from your profile.' },
  { id: 'photo', question: 'Add a profile photo', subtext: 'Members with photos get 3× more connections. You can skip for now.' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: '',
    city: user?.city || '',
    region: user?.region || '',
    languages: [] as string[],
    teachText: '',
    learnText: '',
    teachTags: [] as string[],
    learnTags: [] as string[],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

  const update = (key: keyof typeof fields, value: unknown) =>
    setFields(prev => ({ ...prev, [key]: value }));

  const toggleTag = (list: 'teachTags' | 'learnTags', tag: string) => {
    setFields(prev => ({
      ...prev,
      [list]: prev[list].includes(tag)
        ? prev[list].filter(t => t !== tag)
        : [...prev[list], tag],
    }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const canContinue = () => {
    if (step === 0) return fields.firstName.trim().length > 0 && fields.lastName.trim().length > 0;
    if (step === 1) return fields.city.trim().length > 0 && fields.region !== '';
    if (step === 2) return true; // optional
    return true; // photo is optional
  };

  const saveStep = async () => {
    if (!user || user.isDemo) return true;

    if (step === 0) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: fields.firstName.trim(),
        last_name: fields.lastName.trim(),
        bio: fields.bio.trim() || null,
      }, { onConflict: 'id' });
      if (error) { console.error('Onboarding step 0 error:', error); toast.error(error.message || 'Could not save. Please try again.'); return false; }
      updateUser({ firstName: fields.firstName.trim(), lastName: fields.lastName.trim(), bio: fields.bio.trim() || undefined });
    }

    if (step === 1) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        city: fields.city.trim(),
        region: fields.region,
        languages: fields.languages,
      }, { onConflict: 'id' });
      if (error) { console.error('Onboarding step 1 error:', error); toast.error(error.message || 'Could not save. Please try again.'); return false; }
      updateUser({ city: fields.city.trim(), region: fields.region, location: fields.city.trim(), languages: fields.languages });
    }

    if (step === 2) {
      const what_i_teach = [
        ...fields.teachTags,
        ...fields.teachText.split(',').map(s => s.trim()).filter(Boolean),
      ];
      const what_i_learn = [
        ...fields.learnTags,
        ...fields.learnText.split(',').map(s => s.trim()).filter(Boolean),
      ];
      const { error } = await supabase.from('profiles').upsert({ id: user.id, what_i_teach, what_i_learn }, { onConflict: 'id' });
      if (error) { console.error('Onboarding step 2 error:', error); toast.error(error.message || 'Could not save. Please try again.'); return false; }
      updateUser({ what_i_teach, what_i_learn });
    }

    return true;
  };

  const finishOnboarding = async () => {
    if (!user || user.isDemo) { navigate('/app/welcome'); return; }
    setSaving(true);

    // Upload avatar if selected
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${user.id}/profile.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        updateUser({ avatar: publicUrl });
      }
    }

    // Set onboarding complete
    const { error } = await supabase.from('profiles')
      .upsert({ id: user.id, onboarding_completed: true }, { onConflict: 'id' });

    if (error) {
      console.error('Onboarding finish error:', error);
      toast.error(error.message || 'Could not complete setup. Please try again.');
      setSaving(false);
      return;
    }

    updateUser({ onboarding_completed: true });
    toast.success('Welcome to FightClub!');
    navigate('/app/welcome');
  };

  const goNext = async () => {
    if (step < STEPS.length - 1) {
      setSaving(true);
      const ok = await saveStep();
      setSaving(false);
      if (!ok) return;
      setTransitioning(true);
      setTimeout(() => { setStep(s => s + 1); setTransitioning(false); }, 200);
    } else {
      await finishOnboarding();
    }
  };

  const skipPhoto = () => finishOnboarding();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--color-amber)' }}>
            FC
          </div>
          <span className="font-heading font-semibold text-navy text-lg">FightClub</span>
        </div>
        <button
          onClick={() => navigate('/app/feed')}
          className="text-xs font-body text-[var(--color-text-muted)] hover:text-navy transition-colors"
        >
          Skip for now →
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-1 max-w-lg mx-auto">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i <= step ? 'var(--color-amber)' : 'var(--color-parchment-dark)' }}
            />
          ))}
        </div>
        <p className="text-center text-xs font-body mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col items-center px-6 pt-8 pb-12 transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="w-full max-w-lg text-center mb-8">
          <h1 className="font-heading text-navy mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            {STEPS[step].question}
          </h1>
          <p className="font-body text-[var(--color-text-secondary)] text-sm">
            {STEPS[step].subtext}
          </p>
        </div>

        {/* Step 0: Name + Bio */}
        {step === 0 && (
          <div className="w-full max-w-lg space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold font-body uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>First name *</label>
                <input
                  value={fields.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  placeholder="Youssef"
                  className="input-sc"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Last name *</label>
                <input
                  value={fields.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  placeholder="Benali"
                  className="input-sc"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Bio <span className="normal-case font-normal">(optional)</span></label>
              <textarea
                value={fields.bio}
                onChange={e => update('bio', e.target.value)}
                placeholder="A sentence or two about who you are. What drives you?"
                className="input-sc resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 1: City + Region + Languages */}
        {step === 1 && (
          <div className="w-full max-w-lg space-y-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold font-body uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>City *</label>
                <input
                  value={fields.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="e.g. Casablanca, Rabat, Fès…"
                  className="input-sc"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Region *</label>
                <select
                  value={fields.region}
                  onChange={e => update('region', e.target.value)}
                  className="input-sc"
                >
                  <option value="">Select your region…</option>
                  {MOROCCO_REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Languages you speak
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {LANGUAGES.map(lang => {
                  const selected = fields.languages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      onClick={() => update('languages', fields.languages.includes(lang.id)
                        ? fields.languages.filter(l => l !== lang.id)
                        : [...fields.languages, lang.id])}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold font-body transition-all border"
                      style={selected
                        ? { background: '#FFF3E0', color: 'var(--color-navy)', borderColor: 'var(--color-amber)' }
                        : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                    >
                      {lang.emoji} {lang.label}
                      {selected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-amber)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: What I teach / learn */}
        {step === 2 && (
          <div className="w-full max-w-lg space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-amber)' }}>
                What I can teach
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {SKILL_TAGS.map(tag => {
                  const selected = fields.teachTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag('teachTags', tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border"
                      style={selected
                        ? { background: 'var(--color-amber)', color: 'white', borderColor: 'var(--color-amber)' }
                        : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <input
                value={fields.teachText}
                onChange={e => update('teachText', e.target.value)}
                placeholder="Or type your own: Arabic calligraphy, bread making…"
                className="input-sc"
              />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-plum)' }}>
                What I want to learn
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {SKILL_TAGS.map(tag => {
                  const selected = fields.learnTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag('learnTags', tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border"
                      style={selected
                        ? { background: 'var(--color-plum)', color: 'white', borderColor: 'var(--color-plum)' }
                        : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <input
                value={fields.learnText}
                onChange={e => update('learnText', e.target.value)}
                placeholder="Or type your own: Darija, chess, yoga…"
                className="input-sc"
              />
            </div>
          </div>
        )}

        {/* Step 3: Photo */}
        {step === 3 && (
          <div className="w-full max-w-sm space-y-4">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />

            {avatarPreview ? (
              <div className="relative mx-auto w-36 h-36">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-36 h-36 rounded-full object-cover ring-4 ring-white shadow-card"
                />
                <button
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white shadow-card flex items-center justify-center hover:bg-red-50 transition-colors border border-[var(--color-border)]"
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="mx-auto flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-dashed hover:bg-parchment transition-colors"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Upload className="w-7 h-7 mb-2" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>Upload photo</span>
              </button>
            )}

            {avatarPreview && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="w-full text-center text-xs font-semibold font-body py-2 rounded-lg border border-[var(--color-border)] hover:bg-parchment transition-colors text-navy"
              >
                Change photo
              </button>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={goNext}
            disabled={!canContinue() || saving}
            className="flex items-center gap-2 btn-amber disabled:opacity-40 transition-all"
            style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step === STEPS.length - 1 ? (
              <>{avatarFile ? 'Upload & Enter the Ring' : 'Enter the Ring'} <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {step === STEPS.length - 1 && (
            <button
              onClick={skipPhoto}
              disabled={saving}
              className="text-xs font-body hover:underline disabled:opacity-40"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Skip for now, I'll add a photo later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
