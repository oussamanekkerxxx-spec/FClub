import { useState, useEffect, useRef } from 'react';
import { useAuth, TRUST_TIER_LABELS, type TrustTier } from '@/contexts/AuthContext';
import { MOROCCO_REGIONS } from '@/lib/morocco';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import TrustProgress from '@/components/profile/TrustProgress';
import BookingsDashboard from '@/components/bookings/BookingsDashboard';
import {
  Star,
  Shield,
  Edit3,
  Globe,
  BookOpen,
  Sparkles,
  Check,
  Upload,
  X,
  Phone,
  Camera,
  BadgeCheck,
  Palette,
} from 'lucide-react';
import '@/styles/ProfileCard.css';

const TIER_COLORS: Record<TrustTier, { bg: string; text: string; label: string }> = {
  0: { bg: '#EDF2FF', text: '#4C6EF5', label: 'Explorer' },
  1: { bg: '#E3F2FD', text: '#1976D2', label: 'Member' },
  2: { bg: '#E8F5EE', text: '#2D7A4F', label: 'Verified' },
  3: { bg: '#FFF3E0', text: '#C4873A', label: 'Teacher' },
  4: { bg: '#EDE8F7', text: '#5C3D8F', label: 'Connector' },
};

const COVER_GRADIENTS = [
  { label: 'Navy Glow',      value: 'linear-gradient(135deg,#1B2A4A 0%,#3a4b70 100%)' },
  { label: 'Amber Warmth',   value: 'linear-gradient(135deg,#C4873A 0%,#e0a358 100%)' },
  { label: 'Forest Depths',  value: 'linear-gradient(135deg,#2D7A4F 0%,#46966a 100%)' },
  { label: 'Plum Twilight',  value: 'linear-gradient(135deg,#5C3D8F 0%,#7d5ab8 100%)' },
  { label: 'Sunrise',        value: 'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)' },
  { label: 'Ocean',          value: 'linear-gradient(135deg,#3b82f6 0%,#06b6d4 100%)' },
  { label: 'Midnight',       value: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)' },
  { label: 'Rose Gold',      value: 'linear-gradient(135deg,#fda4af 0%,#f43f5e 100%)' },
];

const COVER_PHOTOS = [
  { label: 'Mountains',  url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=320&fit=crop' },
  { label: 'Forest',     url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=320&fit=crop' },
  { label: 'Ocean',      url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=320&fit=crop' },
  { label: 'Desert',     url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=320&fit=crop' },
  { label: 'City',       url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=320&fit=crop' },
  { label: 'Abstract',   url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=320&fit=crop' },
  { label: 'Stars',      url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975de51?w=800&h=320&fit=crop' },
  { label: 'Morocco',    url: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=800&h=320&fit=crop' },
];

const ID_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  not_submitted: { label: 'Not submitted', color: '#9BAAC4', bg: '#F4F0E8' },
  pending:       { label: 'Under review', color: '#C4873A', bg: '#FFF3E0' },
  approved:      { label: 'Approved',     color: '#2D7A4F', bg: '#E8F5EE' },
  rejected:      { label: 'Rejected',     color: '#E53935', bg: '#FFEBEE' },
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'#about' | '#bookings' | '#verification'>('#about');
  const [mySkills, setMySkills] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [editTeach, setEditTeach] = useState('');
  const [editLearn, setEditLearn] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverPickerTab, setCoverPickerTab] = useState<'gradients' | 'photos'>('gradients');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

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
      setEditCity(user.city || '');
      setEditRegion(user.region || '');
      setEditPhone(user.phone || '');
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
          city: editCity || null,
          region: editRegion || null,
          phone: editPhone || null,
          languages: editLanguages.split(',').map(l => l.trim()).filter(l => l),
          what_i_teach: editTeach.split(',').map(s => s.trim()).filter(s => s),
          what_i_learn: editLearn.split(',').map(s => s.trim()).filter(s => s),
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to save profile');
      } else {
        toast.success('Profile updated!');
        updateUser({
          bio: editBio,
          city: editCity || undefined,
          region: editRegion || undefined,
          location: editCity || undefined,
          phone: editPhone || undefined,
          languages: editLanguages.split(',').map(l => l.trim()).filter(l => l),
          what_i_teach: editTeach.split(',').map(s => s.trim()).filter(s => s),
          what_i_learn: editLearn.split(',').map(s => s.trim()).filter(s => s),
        });
        setIsEditing(false);
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/profile.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      updateUser({ avatar: publicUrl });
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setIsUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/cover.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      updateUser({ cover_url: publicUrl });
      toast.success('Cover photo updated!');
      setShowCoverPicker(false);
    } catch {
      toast.error('Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleCoverPreset = async (gradient: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ cover_url: gradient })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to update cover');
    } else {
      updateUser({ cover_url: gradient });
      toast.success('Cover updated!');
      setShowCoverPicker(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB');
      return;
    }

    setIsUploadingId(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/id.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ id_card_url: path, id_card_status: 'pending' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      updateUser({ id_card_status: 'pending' });
      toast.success('ID submitted for review!');
    } catch {
      toast.error('Failed to upload ID');
    } finally {
      setIsUploadingId(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  const idStatus = ID_STATUS_LABEL[user.id_card_status || 'not_submitted'];

  return (
    <div className="profile-container-wrapper">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />
      <input
        ref={idInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleIdUpload}
      />

      <div className={`profile-card ${activeTab !== '#about' ? 'is-active' : ''}`} data-state={activeTab}>
        <div className="card-header">
          {/* Cover image / gradient */}
          <div
            className="card-cover"
            style={
              user.cover_url?.startsWith('linear-gradient')
                ? { background: user.cover_url }
                : { backgroundImage: `url('${user.cover_url || user.avatar || 'https://images.unsplash.com/photo-1549068106-b024baf5062d'}')` }
            }
          />

          {/* Cover change button — always visible, hides when card is collapsed */}
          <button
            className="cover-change-btn"
            onClick={() => setShowCoverPicker(true)}
            disabled={isUploadingCover}
          >
            {isUploadingCover
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera className="w-3 h-3" />}
            Change cover
          </button>

          {/* Avatar + edit button wrapped together so they animate as one unit */}
          <div className="relative z-10 mx-auto w-full h-full">
            <div className="card-avatar-wrap">
              <img className="card-avatar" src={user.avatar || 'https://images.unsplash.com/photo-1549068106-b024baf5062d'} alt="avatar" />
              <button
                className="card-avatar-edit-btn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Change photo"
              >
                {isUploadingAvatar
                  ? <div className="w-2.5 h-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  : <Edit3 className="w-2.5 h-2.5 text-navy" />}
              </button>
            </div>
            <h1 className="card-fullname flex items-center justify-center gap-1.5">
              {user.firstName} {user.lastName}
              {user.trust_tier >= 2 && <BadgeCheck className="w-5 h-5 text-amber-500" />}
            </h1>
            <h2 className="card-jobtitle">{TRUST_TIER_LABELS[user.trust_tier]} {user.city ? `• ${user.city}` : ''}</h2>
          </div>
        </div>

        <div className="card-main">
          {/* ABOUT SECTION */}
          <div className={`card-section ${activeTab === '#about' ? 'is-active' : ''}`} id="about">
            <div className="card-content">
              <div className="flex justify-end items-center mb-2 mt-2">
                <button onClick={openEditModal} className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/> Edit</button>
              </div>
              <p className="card-desc mb-8 text-center text-[15px]">{user.bio || 'Tell us about yourself. Add a bio to help others know you better.'}</p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5"><BookOpen className="w-3 h-3"/> What I Teach</div>
                  <div className="flex flex-wrap gap-2">
                    {user.what_i_teach.length > 0 ? user.what_i_teach.map(t => (
                      <span key={t} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[13px] font-medium border border-amber-200/50">{t}</span>
                    )) : <span className="text-sm text-gray-400 italic">None listed</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> What I Learn</div>
                  <div className="flex flex-wrap gap-2">
                    {user.what_i_learn.length > 0 ? user.what_i_learn.map(l => (
                      <span key={l} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[13px] font-medium border border-purple-200/50">{l}</span>
                    )) : <span className="text-sm text-gray-400 italic">None listed</span>}
                  </div>
                </div>
                {user.languages.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Globe className="w-3 h-3"/> Languages</div>
                    <div className="flex flex-wrap gap-2">
                      {user.languages.map(lang => (
                        <span key={lang} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[13px] font-medium border border-slate-200">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Social / Extra info area from template */}
            <div className="flex justify-center border-t border-gray-100 pt-5 pb-2 mt-4 mx-5">
              <div className="grid grid-cols-3 gap-4 w-full">
                 <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/50 hover:bg-emerald-50 hover:scale-105 transition-all cursor-default">
                    <div className="font-bold text-xl text-navy">{user.sessions_completed}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Activities</div>
                 </div>
                 <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/50 hover:bg-amber-50 hover:scale-105 transition-all cursor-default">
                    <div className="font-bold text-xl text-amber-600 flex items-center justify-center gap-1">
                      {user.trust_score}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Position</div>
                 </div>
                 <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/50 hover:bg-blue-50 hover:scale-105 transition-all cursor-default">
                    <div className="font-bold text-xl text-navy">{user.reviews_count}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Connections</div>
                 </div>
              </div>
            </div>
          </div>

          {/* BOOKINGS SECTION */}
          <div className={`card-section ${activeTab === '#bookings' ? 'is-active' : ''}`} id="bookings">
            <div className="card-content">
              <div className="card-subtitle">MY RELATIONS</div>
              <div className="mt-2 -mx-2">
                <BookingsDashboard />
              </div>
            </div>
          </div>

          {/* VERIFICATION SECTION */}
          <div className={`card-section ${activeTab === '#verification' ? 'is-active' : ''}`} id="verification">
            <div className="card-content">
              <div className="card-subtitle">VERIFICATION & TRUST</div>
              <div className="mb-6"><TrustProgress user={user} /></div>

              <div className="card-subtitle mt-8">CONTACT INFO & STATUS</div>
              <div className="mt-5 space-y-4">
                {[
                  { label: 'Email verified', done: true, icon: Check },
                  { label: 'Phone number added', done: !!user.phone, icon: Phone },
                  { label: 'Government ID verified', done: user.id_verified, icon: Shield },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                       <item.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[13px] font-medium ${item.done ? 'text-navy' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Upload ID button */}
              {(!user.id_card_status || user.id_card_status === 'not_submitted' || user.id_card_status === 'rejected') && !user.id_verified && (
                <button
                  onClick={() => idInputRef.current?.click()}
                  disabled={isUploadingId}
                  className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
                >
                  {isUploadingId ? (
                    <><div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> {user.id_card_status === 'rejected' ? 'Re-submit Government ID' : 'Submit ID for Verification'}</>
                  )}
                </button>
              )}
              {user.id_card_status && user.id_card_status !== 'not_submitted' && !user.id_verified && (
                <div className="mt-8 text-center px-4 py-3 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
                  ID Document is currently under review
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-buttons">
          <button className={activeTab === '#about' ? 'is-active' : ''} onClick={() => setActiveTab('#about')}>ABOUT</button>
          <button className={activeTab === '#bookings' ? 'is-active' : ''} onClick={() => setActiveTab('#bookings')}>RELATIONS</button>
          <button className={activeTab === '#verification' ? 'is-active' : ''} onClick={() => setActiveTab('#verification')}>TRUST</button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-xl text-navy">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">City</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="e.g. Casablanca, Rabat, Fès…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Region</label>
                <select
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Select region…</option>
                  {MOROCCO_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone number</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g., +212 6XX XXX XXX"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Languages (comma-separated)</label>
                <input
                  type="text"
                  value={editLanguages}
                  onChange={(e) => setEditLanguages(e.target.value)}
                  placeholder="e.g., Arabic, French, English"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">What I Teach (comma-separated)</label>
                <input
                  type="text"
                  value={editTeach}
                  onChange={(e) => setEditTeach(e.target.value)}
                  placeholder="e.g., Piano, French, Cooking"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">What I Learn (comma-separated)</label>
                <input
                  type="text"
                  value={editLearn}
                  onChange={(e) => setEditLearn(e.target.value)}
                  placeholder="e.g., Spanish, Photography, Yoga"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                  style={{ background: 'var(--color-amber)' }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Picker Modal */}
      {showCoverPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCoverPicker(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-[15px] text-navy">Profile Background</span>
              </div>
              <button
                onClick={() => setShowCoverPicker(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-5 pt-3 gap-1">
              {(['gradients', 'photos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCoverPickerTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all capitalize ${
                    coverPickerTab === tab
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'gradients' ? 'Colors' : 'Photos'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              {coverPickerTab === 'gradients' ? (
                <div className="grid grid-cols-4 gap-3">
                  {COVER_GRADIENTS.map(g => (
                    <button
                      key={g.label}
                      onClick={() => handleCoverPreset(g.value)}
                      title={g.label}
                      className={`h-16 rounded-xl border-[3px] transition-all hover:scale-105 ${
                        user.cover_url === g.value ? 'border-amber-400 shadow-md' : 'border-transparent'
                      }`}
                      style={{ background: g.value }}
                    >
                      {user.cover_url === g.value && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {COVER_PHOTOS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => handleCoverPreset(p.url)}
                      title={p.label}
                      className={`h-20 rounded-xl border-[3px] transition-all hover:scale-[1.02] bg-cover bg-center relative overflow-hidden ${
                        user.cover_url === p.url ? 'border-amber-400 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundImage: `url('${p.url}')` }}
                    >
                      <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white drop-shadow">{p.label}</span>
                      {user.cover_url === p.url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check className="w-6 h-6 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload own photo */}
            <div className="px-5 pb-6">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 text-[13px] font-semibold text-gray-500 hover:text-amber-600 transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload your own photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
