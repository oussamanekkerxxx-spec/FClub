import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Link, Navigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Star,
  Edit3,
  BookOpen,
  Users,
  Upload,
  X,
} from 'lucide-react';

const CATEGORY_GRADIENTS: Record<string, string> = {
  music: 'from-purple-500 to-pink-500',
  languages: 'from-blue-500 to-cyan-400',
  technology: 'from-indigo-500 to-blue-600',
  cooking: 'from-orange-400 to-red-500',
  art: 'from-pink-400 to-rose-500',
  fitness: 'from-green-500 to-teal-400',
  photography: 'from-slate-600 to-gray-800',
  business: 'from-amber-500 to-yellow-400',
  writing: 'from-violet-500 to-purple-600',
};

const CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'art', label: 'Art & Craft', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'business', label: 'Business', emoji: '📊' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
];

const STEPS = ['Basics', 'Description', 'Pricing', 'Media', 'Publish'];

const FORMAT_OPTIONS = [
  { value: 'online', label: '💻 Online', desc: 'Video call sessions' },
  { value: 'in-person', label: '📍 In-person', desc: 'Meet in person' },
  { value: 'both', label: '🌐 Both', desc: 'Student chooses' },
];

const LEVEL_OPTIONS = [
  { value: 'all levels', label: '✦ All levels' },
  { value: 'beginner', label: '🌱 Beginner' },
  { value: 'intermediate', label: '📈 Intermediate' },
  { value: 'advanced', label: '🚀 Advanced' },
];

export default function Teach() {
  const { user } = useAuth();

  // Gate: only users who completed onboarding can access the Teach page
  if (user && !user.onboarding_completed && user.id !== 'demo-user-bypass') {
    toast.error('Complete your profile setup before teaching.');
    return <Navigate to="/app/profile" replace />;
  }

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    category: '',
    format: 'both',
    level: 'all levels',
    description: '',
    philosophy: '',
    who_for: '',
    what_session_looks_like: '',
    price: 200,
    currency: 'MAD',
    location: user?.location ?? '',
    languages: user?.languages ?? [],
    is_group: false,
    max_headcount: 8,
    availability_note: '',
  });
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mySkills, setMySkills] = useState<any[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  // Fetch user's active skills from Supabase
  useEffect(() => {
    if (!user || user.id === 'demo-user-bypass') return;
    supabase
      .from('skills')
      .select('id, title, slug, avg_rating, reviews_count, cover_gradient')
      .eq('teacher_id', user.id)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setMySkills(data);
      });
  }, [user, published]);

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const canProceed = () => {
    if (step === 0) return form.title.trim() && form.category;
    if (step === 1) return form.description.trim();
    if (step === 2) return form.price >= 0;
    return true;
  };

  const resetForm = () => {
    setPublished(false);
    setStep(0);
    setCoverFile(null);
    setCoverPreview(null);
    setForm({
      title: '', category: '', format: 'both', level: 'all levels',
      description: '', philosophy: '', who_for: '', what_session_looks_like: '',
      price: 200, currency: 'MAD', location: user?.location ?? '',
      languages: user?.languages ?? [], is_group: false, max_headcount: 8,
      availability_note: '',
    });
  };

  if (published) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: '#E8F5EE' }}>
          <Check className="w-10 h-10" style={{ color: 'var(--color-forest)' }} />
        </div>
        <h1 className="font-heading text-2xl text-navy">Your skill is live!</h1>
        <p className="font-body text-[var(--color-text-secondary)]">
          <strong>{form.title}</strong> is now visible to the FIGHTCLUB community across Morocco.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={resetForm} className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-navy hover:bg-parchment">
            Add another skill
          </button>
          <Link to="/app/browse" className="btn-amber text-sm" style={{ padding: '0.625rem 1.25rem' }}>
            View in Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-navy">Share a Skill</h1>
        <p className="font-body text-[var(--color-text-secondary)] mt-1 text-sm">
          Tell the community what you know. Givers are the heart of FIGHTCLUB.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-2 sc-card p-6">
          {/* Progress */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all"
                    style={
                      i < step
                        ? { background: 'var(--color-forest)', color: 'white' }
                        : i === step
                        ? { background: 'var(--color-amber)', color: 'white' }
                        : { background: '#E8E2D4', color: 'var(--color-text-muted)' }
                    }
                  >
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-body font-medium hidden sm:block"
                    style={{ color: i === step ? 'var(--color-amber)' : 'var(--color-text-muted)' }}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? 'var(--color-forest)' : '#E8E2D4' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Skill Title *</label>
                <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Classical Piano, Python for Beginners, Moroccan Tagine…" className="input-sc" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} onClick={() => update('category', cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium transition-all border"
                      style={form.category === cat.id ? { background: 'var(--color-amber)', color: 'white', border: '1px solid var(--color-amber)' } : { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => update('format', opt.value)}
                      className="p-3 rounded-xl text-left border transition-all"
                      style={form.format === opt.value ? { borderColor: 'var(--color-amber)', background: '#FFF3E0' } : { borderColor: 'var(--color-border)', background: 'white' }}
                    >
                      <div className="font-semibold font-body text-xs text-navy">{opt.label}</div>
                      <div className="font-body text-[10px] text-[var(--color-text-muted)] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Level</label>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => update('level', opt.value)}
                      className="px-3 py-1.5 rounded-full text-sm font-body font-medium transition-all border"
                      style={form.level === opt.value ? { background: 'var(--color-navy)', color: 'white', borderColor: 'var(--color-navy)' } : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group toggle */}
              <div className="p-4 rounded-2xl border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--color-plum)' }} />
                    <span className="font-semibold font-body text-sm text-navy">This is a group session</span>
                  </div>
                  <button
                    onClick={() => update('is_group', !form.is_group)}
                    className="w-11 h-6 rounded-full transition-all relative"
                    style={{ background: form.is_group ? 'var(--color-amber)' : '#E8E2D4' }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: form.is_group ? '22px' : '2px' }} />
                  </button>
                </div>
                {form.is_group && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <label className="text-xs font-body text-[var(--color-text-muted)] block mb-1.5">Max participants</label>
                    <input type="number" min={2} max={30} value={form.max_headcount} onChange={(e) => update('max_headcount', Number(e.target.value))} className="input-sc w-24" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Description */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-1.5">Describe your skill *</label>
                <p className="text-xs font-body text-[var(--color-text-muted)] mb-2">Write like you're talking to someone over coffee.</p>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Tell potential students what they'll experience…" className="input-sc resize-none" rows={5} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-1.5">Your teaching philosophy</label>
                <textarea value={form.philosophy} onChange={(e) => update('philosophy', e.target.value)} placeholder="In one or two sentences — what do you believe about teaching and learning?" className="input-sc resize-none" rows={2} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-1.5">Who is this for?</label>
                <textarea value={form.who_for} onChange={(e) => update('who_for', e.target.value)} placeholder="Describe the ideal student." className="input-sc resize-none" rows={3} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-1.5">What a session looks like</label>
                <textarea value={form.what_session_looks_like} onChange={(e) => update('what_session_looks_like', e.target.value)} placeholder="Walk a potential student through a typical session." className="input-sc resize-none" rows={3} />
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Your rate per hour</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold font-body" style={{ color: 'var(--color-amber)' }}>MAD</span>
                    <input type="number" min={0} max={1000} step={25} value={form.price} onChange={(e) => update('price', Number(e.target.value))} className="input-sc pl-16 text-2xl font-bold font-body" style={{ color: 'var(--color-navy)' }} />
                  </div>
                  <div className="text-sm font-body text-[var(--color-text-secondary)]">/ hour</div>
                </div>
                <input type="range" min={0} max={500} step={25} value={form.price} onChange={(e) => update('price', Number(e.target.value))} className="w-full mt-3 accent-amber-sc" />
                <p className="text-xs font-body text-[var(--color-text-muted)] mt-1">Set to 0 for a free session.</p>
              </div>

              {form.price > 0 && (
                <div className="p-4 rounded-2xl" style={{ background: '#FFF3E0' }}>
                  <div className="text-sm font-body font-semibold text-navy mb-2">Earnings breakdown</div>
                  <div className="space-y-1.5 font-body text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Student pays</span>
                      <span className="font-semibold text-navy">{form.price} MAD/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Platform fee (12%)</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>−{Math.round(form.price * 0.12)} MAD</span>
                    </div>
                    <hr className="divider-warm" />
                    <div className="flex justify-between">
                      <span className="font-bold text-navy">You receive</span>
                      <span className="font-bold text-2xl font-heading" style={{ color: 'var(--color-amber)' }}>{Math.round(form.price * 0.88)} MAD/hr</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Location (for in-person sessions)</label>
                <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Your city or neighbourhood in Morocco" className="input-sc" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body text-[var(--color-text-muted)] block mb-2">Availability note</label>
                <input value={form.availability_note} onChange={(e) => update('availability_note', e.target.value)} placeholder="e.g. Mornings only, Weekends preferred, On vacation until April 5" className="input-sc" />
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div className="space-y-4">
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
              <p className="font-body text-sm text-[var(--color-text-secondary)]">
                Add a cover photo for your skill. Real moments are better than perfect photos.
              </p>

              {coverPreview ? (
                <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[11px] font-body font-semibold text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    16:9 recommended
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-parchment transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Upload className="w-7 h-7" style={{ color: 'var(--color-text-muted)' }} />
                  <div className="font-body text-sm text-[var(--color-text-secondary)]">Click to upload cover photo</div>
                  <div className="text-[11px] font-body text-[var(--color-text-muted)]">JPG, PNG, WebP — up to 3 MB</div>
                </button>
              )}

              {/* Preview gradient fallback */}
              {!coverPreview && form.category && (
                <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'var(--color-bg)' }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_GRADIENTS[form.category] || 'from-blue-500 to-purple-600'} flex-shrink-0`} />
                  <div className="font-body text-xs text-[var(--color-text-secondary)]">
                    No photo? We'll use this gradient placeholder for your <strong>{form.category}</strong> skill.
                  </div>
                </div>
              )}

              <p className="text-[11px] font-body text-center" style={{ color: 'var(--color-text-muted)' }}>
                You can skip this and add a photo later.
              </p>
            </div>
          )}

          {/* Step 4: Publish */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl" style={{ background: 'var(--color-bg)' }}>
                <h3 className="font-heading text-navy text-lg mb-3">Review your listing</h3>
                <div className="space-y-2 font-body text-sm">
                  {[
                    ['Title', form.title],
                    ['Category', form.category],
                    ['Format', form.format],
                    ['Level', form.level],
                    ['Rate', form.price === 0 ? 'Free' : `${form.price} MAD / hr`],
                    ['Type', form.is_group ? `Group (max ${form.max_headcount})` : '1-on-1'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-[var(--color-text-muted)] w-24 flex-shrink-0">{label}</span>
                      <span className="font-medium text-navy">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs font-body text-[var(--color-text-secondary)] leading-relaxed">
                By publishing, you agree to FIGHTCLUB's community guidelines. Your listing will be visible to all verified members across Morocco immediately.
              </p>
              <button
                onClick={async () => {
                  if (!user || user.id === 'demo-user-bypass') { toast.error('Sign in to publish a skill'); return; }
                  if (!form.title.trim()) { toast.error('Please add a skill title'); return; }
                  if (!form.category) { toast.error('Please select a category'); return; }
                  if (!form.description.trim()) { toast.error('Please write a description'); return; }
                  setPublishing(true);
                  const slug = `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${user.firstName?.toLowerCase() || 'teacher'}`;
                  const coverGradient = CATEGORY_GRADIENTS[form.category] || 'from-blue-500 to-purple-600';
                  const { data: skillData, error } = await supabase.from('skills').insert({
                    teacher_id: user.id,
                    title: form.title,
                    slug,
                    description: form.description,
                    philosophy: form.philosophy || null,
                    who_for: form.who_for || null,
                    what_session_looks_like: form.what_session_looks_like || null,
                    category: form.category,
                    neighborhood: form.location,
                    location: form.location || null,
                    price_per_hour: form.price,
                    currency: form.currency,
                    is_free: form.price === 0,
                    format: form.format,
                    level: form.level,
                    languages: form.languages,
                    is_active: true,
                    is_group: form.is_group,
                    max_headcount: form.is_group ? form.max_headcount : null,
                    availability_note: form.availability_note || null,
                    cover_gradient: coverGradient,
                  }).select('id').single();

                  if (error) {
                    setPublishing(false);
                    toast.error('Could not publish skill. Please try again.');
                    return;
                  }

                  // Upload cover photo if selected
                  if (skillData?.id && coverFile) {
                    const ext = coverFile.name.split('.').pop();
                    const path = `${skillData.id}/cover.${ext}`;
                    const { error: uploadErr } = await supabase.storage
                      .from('skill-covers')
                      .upload(path, coverFile, { upsert: true });
                    if (!uploadErr) {
                      const { data: { publicUrl } } = supabase.storage.from('skill-covers').getPublicUrl(path);
                      await supabase.from('skills').update({ cover_image_url: publicUrl }).eq('id', skillData.id);
                    }
                  }

                  setPublishing(false);
                  setPublished(true);
                }}
                disabled={publishing}
                className="w-full btn-amber justify-center disabled:opacity-50"
                style={{ padding: '1rem' }}
              >
                <Check className="w-4 h-4" />
                {publishing ? 'Publishing…' : 'Publish My Skill'}
              </button>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-border)]">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold font-body border border-[var(--color-border)] text-navy disabled:opacity-40 hover:bg-parchment transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 && (
              <button
                onClick={() => canProceed() && setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold font-body text-white disabled:opacity-40 transition-all"
                style={{ background: 'var(--color-amber)' }}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar — My Active Skills */}
        <div className="space-y-4">
          <div className="sc-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
              <h3 className="font-heading text-navy" style={{ fontSize: '1rem' }}>Your active skills</h3>
            </div>
            {mySkills.length > 0 ? (
              <div className="space-y-3">
                {mySkills.map((skill) => (
                  <div key={skill.id} className="flex items-start gap-2.5 pb-3 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${skill.cover_gradient || 'from-blue-500 to-purple-600'} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold font-body text-navy text-xs truncate">{skill.title}</div>
                      <div className="flex items-center gap-1 text-[10px] font-body text-[var(--color-text-muted)] mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-sc text-amber-sc" />
                        {skill.avg_rating} · {skill.reviews_count} reviews
                      </div>
                    </div>
                    <button className="p-1 rounded-lg hover:bg-parchment">
                      <Edit3 className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-body text-[var(--color-text-secondary)]">
                No active skills yet. Create your first one!
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl" style={{ background: 'var(--color-navy)' }}>
            <div className="text-white/70 text-[10px] font-semibold uppercase tracking-wider font-body mb-2">Pro Tip</div>
            <p className="text-white/80 text-xs font-body leading-relaxed">
              Skills with a teaching philosophy get 3× more inquiries than those without. Be specific about what makes your approach different.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
