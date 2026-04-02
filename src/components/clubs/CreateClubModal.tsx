import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowLeft, ArrowRight, Image as ImageIcon, 
  MapPin, Globe, Lock, Info, Sparkles, X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'art', label: 'Art & Craft', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'business', label: 'Business', emoji: '📊' },
  { id: 'events', label: 'Events', emoji: '📅' },
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'club_lounge', label: 'Club Lounge', emoji: '🛋️' },
  { id: 'deve_sandbox', label: 'Deve Sandbox', emoji: '🛠️' },
  { id: 'wellness_support', label: 'Wellness & Support Room', emoji: '🧘' },
  { id: 'connection_lounge', label: 'Connection Lounge', emoji: '🤝' },
];

const MOROCCO_REGIONS = [
  'Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakesh-Safi', 
  'Fès-Meknès', 'Tangier-Tetouan-Al Hoceima', 'Souss-Massa'
];

interface CreateClubModalProps {
  onClose: () => void;
}

export default function CreateClubModal({ onClose }: CreateClubModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [region, setRegion] = useState('');
  const [rules] = useState(['Be respectful', 'No spam']);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name || !category || !description) {
        toast.error('Please fill out all required fields.');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    const slug = generateSlug(name) + '-' + Math.floor(Math.random() * 1000);
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    // Default gradient based on category (mock logic)
    const gradients: Record<string, string> = {
      music: 'from-purple-600 to-pink-500',
      technology: 'from-indigo-600 to-blue-500',
      art: 'from-amber-500 to-orange-600',
      events: 'from-orange-500 to-red-600',
      student: 'from-blue-400 to-indigo-600',
      club_lounge: 'from-rose-400 to-orange-300',
      deve_sandbox: 'from-gray-700 to-gray-900',
      wellness_support: 'from-teal-400 to-emerald-500',
      connection_lounge: 'from-violet-400 to-fuchsia-500'
    };

    const { data: club, error } = await supabase.from('clubs').insert({
      name,
      slug,
      description,
      category,
      tags: tagArray,
      is_private: isPrivate,
      region,
      city: region,
      rules,
      created_by: user.id,
      cover_gradient: gradients[category] || 'from-blue-500 to-purple-600',
      member_count: 1
    }).select().single();

    if (error) {
      toast.error('Failed to create club.');
      setLoading(false);
      return;
    }

    // Auto-join
    await supabase.from('club_memberships').insert({
      club_id: club.id,
      user_id: user.id,
      role: 'admin',
      status: 'active'
    });

    toast.success('Your club is live!');
    onClose();
    navigate(`/club/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ background: 'var(--color-navy)' }}>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-heading font-semibold text-white">Create Club</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-1 flex w-full">
          <div className="bg-[var(--color-amber)] transition-all h-full" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-6">
                <h1 className="font-heading text-2xl text-navy mb-2">What's your club about?</h1>
                <p className="font-body text-sm text-[var(--color-text-secondary)]">Let's start with the basics. You can always change these later.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold font-body text-navy mb-2">Club Name <span className="text-red-500">*</span></label>
                  <input 
                    autoFocus
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="input-sc text-lg font-heading w-full" 
                    placeholder="e.g. Casa Jazz Enthusiasts" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold font-body text-navy mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          category === c.id 
                            ? 'bg-[var(--color-amber)] text-white border-[var(--color-amber)] shadow-md' 
                            : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-amber)]'
                        }`}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold font-body text-navy mb-2">Short Description <span className="text-red-500">*</span></label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="input-sc resize-none w-full" 
                    rows={3} 
                    maxLength={280} 
                    placeholder="What is the mission of this club? Who should join?" 
                  />
                  <div className="text-right text-xs text-[var(--color-text-muted)] mt-1">{description.length}/280</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Vibe & Rules */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-6">
                <h1 className="font-heading text-2xl text-navy mb-2">Set the tone</h1>
                <p className="font-body text-sm text-[var(--color-text-secondary)]">Create a safe and structured environment for your community.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold font-body text-navy mb-3">Privacy</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsPrivate(false)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${!isPrivate ? 'border-[var(--color-amber)] bg-[#FFF3E0]/30' : 'border-[var(--color-border)] bg-gray-50 hover:border-gray-300'}`}
                    >
                      <Globe className={`w-5 h-5 mb-1.5 ${!isPrivate ? 'text-[var(--color-amber)]' : 'text-gray-400'}`} />
                      <strong className="block text-navy font-body text-sm mb-0.5">Public Space</strong>
                      <span className="text-xs text-[var(--color-text-secondary)] font-body leading-tight hidden sm:block">Anyone can find and join the club immediately.</span>
                    </button>
                    <button 
                      onClick={() => setIsPrivate(true)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${isPrivate ? 'border-[var(--color-amber)] bg-[#FFF3E0]/30' : 'border-[var(--color-border)] bg-gray-50 hover:border-gray-300'}`}
                    >
                      <Lock className={`w-5 h-5 mb-1.5 ${isPrivate ? 'text-[var(--color-amber)]' : 'text-gray-400'}`} />
                      <strong className="block text-navy font-body text-sm mb-0.5">Private Sanctum</strong>
                      <span className="text-xs text-[var(--color-text-secondary)] font-body leading-tight hidden sm:block">Users must request an invite to join.</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold font-body text-navy mb-2">Location (Optional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                    <select 
                      value={region} 
                      onChange={e => setRegion(e.target.value)} 
                      className="input-sc pl-10 w-full"
                    >
                      <option value="">Global / Virtual</option>
                      {MOROCCO_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold font-body text-navy mb-2">Tags (Optional)</label>
                  <input 
                    value={tags} 
                    onChange={e => setTags(e.target.value)} 
                    className="input-sc w-full" 
                    placeholder="e.g. beginners, jazz, weekend-jams" 
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Comma separated tags help people find your club.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Visuals */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-6">
                <h1 className="font-heading text-2xl text-navy mb-2">Make it yours</h1>
                <p className="font-body text-sm text-[var(--color-text-secondary)]">Give your club a unique visual identity.</p>
              </div>

              <div className="space-y-5">
                <div className="p-6 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-gray-50 text-center hover:bg-parchment transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5 text-[var(--color-amber)]" />
                  </div>
                  <strong className="block text-navy font-body text-sm mb-1">Upload Cover Image</strong>
                  <span className="text-xs text-[var(--color-text-secondary)] font-body">1200 x 400px recommended</span>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-3">For the mockup, we will automatically generate a beautiful gradient based on your category.</p>
                </div>

                <div className="flex bg-[var(--color-plum)]/10 text-[var(--color-plum)] p-4 rounded-xl items-start gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-body font-medium leading-relaxed">
                    You are ready! Once you hit launch, you will instantly become the Admin of the club. You can then invite members, set up voice rooms, and create quests.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex-shrink-0 border-t border-[var(--color-border)] flex justify-between items-center bg-gray-50/50">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] font-body uppercase tracking-wider">
            Step {step} of 3
          </div>
          {step < 3 ? (
            <button onClick={handleNext} className="btn-amber px-6 py-2.5 bg-[var(--color-navy)] hover:bg-[#243660] text-white text-sm">
              Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-amber px-6 py-2.5 shadow-md hover:-translate-y-0.5 transition-transform text-sm">
              {loading ? 'Launching...' : 'Launch Club 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
