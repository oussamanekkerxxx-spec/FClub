import { useState, useEffect } from 'react';
import { useAuth, TRUST_TIER_LABELS, type TrustTier } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Star,
  MapPin,
  Shield,
  GraduationCap,
  Edit3,
  MessageCircle,
  Globe,
  BookOpen,
  Sparkles,
  Check,
  Upload,
  X,
} from 'lucide-react';

const TIER_COLORS: Record<TrustTier, { bg: string; text: string; label: string }> = {
  0: { bg: '#EDF2FF', text: '#4C6EF5', label: 'Explorer' },
  1: { bg: '#E3F2FD', text: '#1976D2', label: 'Member' },
  2: { bg: '#E8F5EE', text: '#2D7A4F', label: 'Verified' },
  3: { bg: '#FFF3E0', text: '#C4873A', label: 'Teacher' },
  4: { bg: '#EDE8F7', text: '#5C3D8F', label: 'Connector' },
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'teaching' | 'about'>('teaching');
  const [mySkills, setMySkills] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [editTeach, setEditTeach] = useState('');
  const [editLearn, setEditLearn] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || user.id === 'demo-user-bypass') return;
    supabase
      .from('skills')
      .select('*')
      .eq('teacher_id', user.id)
      .then(({ data }) => {
        if (data) setMySkills(data);
      });
  }, [user]);

  const openEditModal = () => {
    if (user) {
      setEditBio(user.bio || '');
      setEditNeighborhood(user.location || '');
      setEditLanguages(user.languages?.join(', ') || '');
      setEditTeach(user.what_i_teach?.join(', ') || '');
      setEditLearn(user.what_i_learn?.join(', ') || '');
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: editBio,
          neighborhood: editNeighborhood,
          languages: editLanguages.split(',').map(l => l.trim()).filter(l => l),
          what_i_teach: editTeach.split(',').map(s => s.trim()).filter(s => s),
          what_i_learn: editLearn.split(',').map(s => s.trim()).filter(s => s),
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to save profile');
      } else {
        toast.success('Profile updated successfully!');
        updateUser({});
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_method: 'id_card',
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to submit verification');
      } else {
        toast.success('Verification submitted! We\'ll review it shortly.');
        updateUser({});
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  if (!user) return null;

  const tierConfig = TIER_COLORS[user.trust_tier];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Profile Header Card */}
      <div className="sc-card overflow-hidden">
        {/* Banner */}
        <div
          className="h-28"
          style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, #5C3D8F 100%)' }}
        />
        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-white">
                <AvatarImage src={user.avatar} />
                <AvatarFallback
                  className="text-2xl font-heading font-bold"
                  style={{ background: 'var(--color-amber)', color: 'white' }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-card border border-[var(--color-border)] flex items-center justify-center hover:bg-parchment transition-colors">
                <Edit3 className="w-3.5 h-3.5 text-navy" />
              </button>
            </div>
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-navy hover:bg-parchment transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>

          {/* Name & tier */}
          <div className="mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-2xl text-navy">
                {user.firstName} {user.lastName}
              </h1>
              <span
                className="trust-badge text-xs"
                style={{ background: tierConfig.bg, color: tierConfig.text }}
              >
                {user.trust_tier >= 2 && <Shield className="w-3 h-3" />}
                {user.trust_tier === 3 && <GraduationCap className="w-3 h-3" />}
                {user.trust_tier === 4 && <Sparkles className="w-3 h-3" />}
                {TRUST_TIER_LABELS[user.trust_tier]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-body text-[var(--color-text-secondary)]">
              <MapPin className="w-3.5 h-3.5" />
              {user.location}
            </div>
          </div>

          {/* Bio */}
          <p className="font-body text-[var(--color-text-secondary)] leading-relaxed text-sm mb-4">
            {user.bio}
          </p>

          {/* Languages */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Globe className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            {user.languages.map((lang) => (
              <span
                key={lang}
                className="text-xs font-body px-2 py-1 rounded-full"
                style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}
              >
                {lang}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl" style={{ background: 'var(--color-bg)' }}>
            {[
              { label: 'Sessions', value: user.sessions_completed },
              { label: 'Reviews', value: user.reviews_count },
              { label: 'Trust Score', value: `★ ${user.trust_score}`, highlight: true },
              { label: 'Tier', value: TRUST_TIER_LABELS[user.trust_tier] },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="font-bold font-heading text-lg"
                  style={{ color: stat.highlight ? 'var(--color-amber)' : 'var(--color-navy)' }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] font-body text-[var(--color-text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Score Breakdown */}
      {user.trust_score > 0 && (
        <div className="sc-card p-5">
          <h3 className="font-heading text-navy mb-4" style={{ fontSize: '1.05rem' }}>
            Trust Score Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Session Quality', value: 95, color: 'var(--color-amber)' },
              { label: 'Reliability', value: 100, color: 'var(--color-forest)' },
              { label: 'Community Contribution', value: 80, color: 'var(--color-plum)' },
              { label: 'Review Quality', value: 88, color: '#1B2A4A' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-body font-medium text-navy">{item.label}</span>
                  <span className="text-xs font-bold font-body" style={{ color: item.color }}>{item.value}%</span>
                </div>
                <div className="h-1.5 bg-parchment-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.value}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Status */}
      <div className="sc-card p-5">
        <h3 className="font-heading text-navy mb-4" style={{ fontSize: '1.05rem' }}>
          Verification Status
        </h3>
        <div className="space-y-2.5 mb-4">
          {[
            { label: 'Email verified', done: true },
            { label: 'Phone verified', done: user.phone_verified },
            { label: 'Government ID verified', done: user.id_verified },
            { label: 'Teacher profile active', done: user.trust_tier >= 3 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: item.done ? 'var(--color-forest)' : '#E8E2D4' }}
              >
                {item.done ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-parchment-darker" />
                )}
              </div>
              <span
                className="text-sm font-body"
                style={{ color: item.done ? 'var(--color-navy)' : 'var(--color-text-muted)' }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        {!user.id_verified && (
          <button
            onClick={handleVerificationSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold font-body text-navy hover:bg-parchment transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Submit ID for Verification
          </button>
        )}
      </div>

      {/* Teaching / Learning Tabs */}
      <div className="sc-card overflow-hidden">
        <div className="flex border-b border-[var(--color-border)]">
          {[
            { key: 'teaching', label: '📚 What I Teach', icon: BookOpen },
            { key: 'about', label: '🌱 What I Learn', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'teaching' | 'about')}
              className={`flex-1 py-3.5 text-sm font-semibold font-body transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 text-amber-sc'
                  : 'text-[var(--color-text-secondary)] hover:text-navy'
              }`}
              style={activeTab === tab.key ? { borderBottomColor: 'var(--color-amber)' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'teaching' ? (
            <div className="space-y-3">
              {mySkills.length > 0 ? (
                mySkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-amber-sc transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skill.cover_gradient} flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold font-body text-navy text-sm">{skill.title}</div>
                      <div className="flex items-center gap-2 text-[11px] font-body text-[var(--color-text-muted)]">
                        <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                        {skill.avg_rating} · {skill.reviews_count} reviews · {skill.price_per_hour} {skill.currency}/hr
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full font-body"
                      style={{ background: '#E8F5EE', color: 'var(--color-forest)' }}
                    >
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="font-body text-sm text-[var(--color-text-secondary)]">No skills listed yet.</p>
                </div>
              )}

              {/* What they also teach (from user profile) */}
              {user.what_i_teach.filter((t) => !mySkills.some((s) => s.title === t)).map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[var(--color-border)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-parchment flex items-center justify-center text-lg">
                    🎵
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold font-body text-navy text-sm">{skill}</div>
                    <div className="text-[11px] font-body text-[var(--color-text-muted)]">Not yet listed as a skill</div>
                  </div>
                  <button
                    className="text-[11px] font-semibold font-body px-3 py-1.5 rounded-lg"
                    style={{ background: '#FFF3E0', color: 'var(--color-amber)' }}
                  >
                    + List it
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.what_i_learn.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-body font-medium"
                  style={{ background: '#EDE8F7', color: 'var(--color-plum)' }}
                >
                  🌱 {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message button (for others viewing) */}
      <button
        className="hidden w-full btn-amber justify-center"
      >
        <MessageCircle className="w-4 h-4" />
        Send a message
      </button>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="sc-card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-navy">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-parchment rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-semibold text-navy mb-1">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-sc/20"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-navy mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={editNeighborhood}
                  onChange={(e) => setEditNeighborhood(e.target.value)}
                  placeholder="e.g., Medina, Gueliz"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-sc/20"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-navy mb-1">
                  Languages (comma-separated)
                </label>
                <input
                  type="text"
                  value={editLanguages}
                  onChange={(e) => setEditLanguages(e.target.value)}
                  placeholder="e.g., Arabic, French, English"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-sc/20"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-navy mb-1">
                  What I Teach (comma-separated)
                </label>
                <input
                  type="text"
                  value={editTeach}
                  onChange={(e) => setEditTeach(e.target.value)}
                  placeholder="e.g., Piano, French, Cooking"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-sc/20"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-navy mb-1">
                  What I Learn (comma-separated)
                </label>
                <input
                  type="text"
                  value={editLearn}
                  onChange={(e) => setEditLearn(e.target.value)}
                  placeholder="e.g., Spanish, Photography, Yoga"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-sc/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] font-body text-sm font-semibold text-navy hover:bg-parchment transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 rounded-lg font-body text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: 'var(--color-amber)' }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
