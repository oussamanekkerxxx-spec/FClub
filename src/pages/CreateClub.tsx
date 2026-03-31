import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowLeft, ArrowRight, Image as ImageIcon, 
  MapPin, Globe, Lock, Info, Sparkles 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'art', label: 'Art & Craft', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'business', label: 'Business', emoji: '📊' },
];

const MOROCCO_REGIONS = [
  'Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakesh-Safi', 
  'Fès-Meknès', 'Tangier-Tetouan-Al Hoceima', 'Souss-Massa'
];

export default function CreateClub() {
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
      art: 'from-amber-500 to-orange-600'
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
      status: 'active' // For testing purposes, auto-active
    });

    toast.success('Your club is live!');
    navigate(`/club/${slug}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button 
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} 
          className="p-2 rounded-full hover:bg-parchment text-navy transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-2.5 rounded-full transition-all ${step >= i ? 'bg-amber-sc w-8' : 'bg-gray-200 w-4'}`}
            />
          ))}
        </div>
      </div>

      <div className="sc-card p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl text-navy mb-3">What's your club about?</h1>
              <p className="font-body text-[var(--color-text-secondary)]">Let's start with the basics. You can always change these later.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold font-body text-navy mb-2">Club Name <span className="text-red-500">*</span></label>
                <input 
                  autoFocus
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="input-sc text-lg font-heading" 
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
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
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
                  className="input-sc resize-none" 
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl text-navy mb-3">Set the tone</h1>
              <p className="font-body text-[var(--color-text-secondary)]">Create a safe and structured environment for your community.</p>
            </div>

            <div className="space-y-6">
              {/* Privacy Toggle */}
              <div>
                <label className="block text-sm font-semibold font-body text-navy mb-3">Privacy</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsPrivate(false)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${!isPrivate ? 'border-[var(--color-amber)] bg-[#FFF3E0]/30' : 'border-[var(--color-border)] bg-gray-50'}`}
                  >
                    <Globe className={`w-6 h-6 mb-2 ${!isPrivate ? 'text-[var(--color-amber)]' : 'text-gray-400'}`} />
                    <strong className="block text-navy font-body text-sm mb-1">Public Space</strong>
                    <span className="text-xs text-[var(--color-text-secondary)] font-body">Anyone can find and join the club immediately.</span>
                  </button>
                  <button 
                    onClick={() => setIsPrivate(true)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isPrivate ? 'border-[var(--color-amber)] bg-[#FFF3E0]/30' : 'border-[var(--color-border)] bg-gray-50'}`}
                  >
                    <Lock className={`w-6 h-6 mb-2 ${isPrivate ? 'text-[var(--color-amber)]' : 'text-gray-400'}`} />
                    <strong className="block text-navy font-body text-sm mb-1">Private Sanctum</strong>
                    <span className="text-xs text-[var(--color-text-secondary)] font-body">Users must request an invite to join and see content.</span>
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
                    className="input-sc pl-10"
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
                  className="input-sc" 
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl text-navy mb-3">Make it yours</h1>
              <p className="font-body text-[var(--color-text-secondary)]">Give your club a unique visual identity.</p>
            </div>

            <div className="space-y-6">
              <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-gray-50 text-center hover:bg-parchment transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6 text-[var(--color-amber)]" />
                </div>
                <strong className="block text-navy font-body text-sm mb-1">Upload Cover Image</strong>
                <span className="text-xs text-[var(--color-text-secondary)] font-body">1200 x 400px recommended</span>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-4">For the mockup, we will automatically generate a beautiful gradient based on your category.</p>
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

        {/* Footer Actions */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] font-body uppercase tracking-wider">
            Step {step} of 3
          </div>
          {step < 3 ? (
            <button onClick={handleNext} className="btn-amber px-8 py-3 bg-[var(--color-navy)] hover:bg-[#243660] text-white">
              Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-amber px-8 py-3 shadow-lg hover:-translate-y-1">
              {loading ? 'Launching...' : 'Launch Club 🚀'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
