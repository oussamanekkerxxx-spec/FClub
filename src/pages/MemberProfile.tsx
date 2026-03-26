import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Star, Shield, Loader2 } from 'lucide-react';

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

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [member, setMember] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // If viewing own profile, redirect to /app/profile
  if (id === user?.id) {
    return <Navigate to="/app/profile" replace />;
  }

  useEffect(() => {
    if (!id) return;
    supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, bio, neighborhood, city, trust_score, trust_tier, what_i_teach, what_i_learn, languages, sessions_completed, reviews_count, id_verified')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setMember(data as MemberData);
        }
        setIsLoading(false);
      });
  }, [id]);

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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        to={-1 as never}
        className="inline-flex items-center gap-1.5 text-sm font-body text-[var(--color-text-secondary)] hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile Card */}
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
            <div className="font-bold font-heading text-lg text-navy">{member.trust_tier}</div>
            <div className="text-[11px] font-body text-[var(--color-text-muted)]">tier</div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {member.what_i_teach?.length > 0 && (
        <div className="sc-card p-5">
          <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.05rem' }}>Teaches</h3>
          <div className="flex flex-wrap gap-2">
            {member.what_i_teach.map((s) => (
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
            {member.what_i_learn.map((s) => (
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
            {member.languages.map((l) => (
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
