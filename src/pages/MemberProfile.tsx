import { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth, type TrustTier } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerifiedProfileCard from '@/components/profile/VerifiedProfileCard';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Star, Shield, Loader2, MessageCircle, BookOpen } from 'lucide-react';
import type { User } from '@/contexts/AuthContext';

interface MemberData {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  neighborhood: string | null;
  city: string;
  trust_score: number;
  trust_tier: number;
  what_i_teach: string[];
  what_i_learn: string[];
  languages: string[];
  sessions_completed: number;
  reviews_count: number;
  id_verified: boolean;
}

interface MemberSkill {
  id: string;
  slug: string;
  title: string;
  category: string;
  cover_gradient: string;
  cover_image_url: string | null;
  avg_rating: number;
  reviews_count: number;
  price_per_hour: number;
  currency: string;
  is_free: boolean;
}

function memberToUser(member: MemberData): User {
  return {
    id: member.id,
    email: '',
    firstName: member.first_name,
    lastName: member.last_name,
    avatar: member.avatar_url ?? undefined,
    bio: member.bio ?? undefined,
    location: member.city ?? member.neighborhood ?? undefined,
    city: member.city || '',
    trust_tier: member.trust_tier as TrustTier,
    trust_score: member.trust_score,
    archetype: 'mixed',
    phone_verified: false,
    id_verified: member.id_verified,
    onboarding_completed: true,
    what_i_teach: member.what_i_teach || [],
    what_i_learn: member.what_i_learn || [],
    languages: member.languages || [],
    role: 'member',
    isDemo: false,
    sessions_completed: member.sessions_completed,
    reviews_count: member.reviews_count,
  };
}

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberData | null>(null);
  const [memberSkills, setMemberSkills] = useState<MemberSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);

  // Redirect to own profile
  if (id === user?.id) {
    return <Navigate to="/app/profile" replace />;
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, bio, neighborhood, city, trust_score, trust_tier, what_i_teach, what_i_learn, languages, sessions_completed, reviews_count, id_verified')
        .eq('id', id)
        .single(),
      supabase
        .from('skills')
        .select('id, slug, title, category, cover_gradient, cover_image_url, avg_rating, reviews_count, price_per_hour, currency, is_free')
        .eq('teacher_id', id)
        .eq('is_active', true),
    ]).then(([profileRes, skillsRes]) => {
      if (profileRes.error || !profileRes.data) {
        setNotFound(true);
      } else {
        setMember(profileRes.data as MemberData);
      }
      if (skillsRes.data) setMemberSkills(skillsRes.data as MemberSkill[]);
      setIsLoading(false);
    });
  }, [id]);

  const handleMessage = async () => {
    if (!user || user.id === 'demo-user-bypass' || !member) {
      toast.error('Sign in to message members');
      return;
    }
    setMessaging(true);

    // Check for existing direct conversation (no skill_id)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [user.id, member.id])
      .is('skill_id', null)
      .maybeSingle();

    if (existing) {
      navigate(`/app/messages?conv=${existing.id}`);
      return;
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ participant_ids: [user.id, member.id], skill_id: null })
      .select('id')
      .single();

    setMessaging(false);

    if (error || !newConv) {
      toast.error('Could not start conversation. Please try again.');
      return;
    }

    navigate(`/app/messages?conv=${newConv.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  if (notFound || !member) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="font-body text-[var(--color-text-secondary)]">Member not found.</p>
        <Link to="/app/browse" className="mt-4 inline-block text-sm font-semibold text-[var(--color-amber)] hover:underline">
          Back to Browse
        </Link>
      </div>
    );
  }

  const isVerifiedTier = member.trust_tier >= 2;
  const memberUser = memberToUser(member);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        to={-1 as never}
        className="inline-flex items-center gap-1.5 text-sm font-body text-[var(--color-text-secondary)] hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile header */}
      {isVerifiedTier ? (
        <VerifiedProfileCard user={memberUser} />
      ) : (
        <div className="sc-card p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-[var(--color-amber)]/30">
              <AvatarImage src={member.avatar_url ?? undefined} />
              <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white' }} className="text-lg font-semibold">
                {member.first_name[0]}{member.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl text-navy">
                {member.first_name} {member.last_name}
              </h1>
              {(member.neighborhood || member.city) && (
                <div className="flex items-center gap-1 mt-1 text-xs font-body text-[var(--color-text-muted)]">
                  <MapPin className="w-3 h-3" />
                  {member.neighborhood ? `${member.neighborhood}, ` : ''}{member.city}
                </div>
              )}
              {member.id_verified && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Shield className="w-3 h-3" style={{ color: 'var(--color-forest)' }} />
                  <span className="text-[11px] font-body font-semibold" style={{ color: 'var(--color-forest)' }}>Verified</span>
                </div>
              )}
            </div>
            {member.trust_score > 0 && (
              <div className="text-center">
                <div className="flex items-center gap-0.5 font-bold text-navy font-heading text-lg">
                  <Star className="w-4 h-4 fill-amber-sc text-amber-sc" />
                  {member.trust_score}
                </div>
                <div className="text-[10px] font-body text-[var(--color-text-muted)]">trust</div>
              </div>
            )}
          </div>

          {member.bio && (
            <p className="mt-4 font-body text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {member.bio}
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
            <div className="text-center">
              <div className="font-bold font-heading text-lg text-navy">{member.sessions_completed}</div>
              <div className="text-[11px] font-body text-[var(--color-text-muted)]">sessions</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-heading text-lg text-navy">{member.reviews_count}</div>
              <div className="text-[11px] font-body text-[var(--color-text-muted)]">reviews</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-heading text-lg text-navy">{member.languages?.length ?? 0}</div>
              <div className="text-[11px] font-body text-[var(--color-text-muted)]">languages</div>
            </div>
          </div>
        </div>
      )}

      {/* Message button */}
      {user && user.id !== member.id && (
        <button
          onClick={handleMessage}
          disabled={messaging}
          className="w-full flex items-center justify-center gap-2 btn-amber disabled:opacity-50"
          style={{ padding: '0.875rem 1rem' }}
        >
          {messaging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          {messaging ? 'Opening...' : `Message ${member.first_name}`}
        </button>
      )}

      {/* Skills offered */}
      {memberSkills.length > 0 && (
        <div className="sc-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
            <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>Skills offered</h3>
          </div>
          <div className="space-y-3">
            {memberSkills.map(skill => (
              <Link
                key={skill.id}
                to={`/app/skill/${skill.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-amber)] transition-colors group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden ${!skill.cover_image_url ? `bg-gradient-to-br ${skill.cover_gradient}` : 'bg-gray-200'}`}
                >
                  {skill.cover_image_url && (
                    <img src={skill.cover_image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-body text-navy text-sm group-hover:text-[var(--color-amber)] transition-colors truncate">
                    {skill.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-body text-[var(--color-text-muted)] mt-0.5">
                    <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                    {skill.avg_rating} · {skill.reviews_count} reviews
                  </div>
                </div>
                <div className="font-bold font-body text-sm flex-shrink-0" style={{ color: skill.is_free || skill.price_per_hour === 0 ? 'var(--color-forest)' : 'var(--color-amber)' }}>
                  {skill.is_free || skill.price_per_hour === 0 ? 'Free' : `${skill.price_per_hour} ${skill.currency}`}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Teach/Learn tags */}
      {member.what_i_teach?.length > 0 && (
        <div className="sc-card p-5">
          <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.05rem' }}>Teaches</h3>
          <div className="flex flex-wrap gap-2">
            {member.what_i_teach.map(s => (
              <span key={s} className="text-xs font-body px-2.5 py-1 rounded-full" style={{ background: 'var(--color-amber)', color: 'white' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {member.what_i_learn?.length > 0 && (
        <div className="sc-card p-5">
          <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.05rem' }}>Wants to learn</h3>
          <div className="flex flex-wrap gap-2">
            {member.what_i_learn.map(s => (
              <span key={s} className="text-xs font-body px-2.5 py-1 rounded-full" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-navy)' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {member.languages?.length > 0 && (
        <div className="sc-card p-5">
          <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.05rem' }}>Languages</h3>
          <div className="flex flex-wrap gap-2">
            {member.languages.map(l => (
              <span key={l} className="text-xs font-body px-2.5 py-1 rounded-full" style={{ background: 'var(--color-plum)', color: 'white' }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
