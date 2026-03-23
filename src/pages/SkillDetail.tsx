import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { skills, reviews } from '@/data/mockData';
import NewBookingModal from '@/components/bookings/NewBookingModal';
import {
  Star,
  MapPin,
  Clock,
  Globe,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  Shield,
  ChevronRight,
} from 'lucide-react';

const LEVEL_LABELS: Record<string, string> = {
  'all levels': '✦ All levels welcome',
  beginner: '🌱 Great for beginners',
  intermediate: '📈 Intermediate level',
  advanced: '🚀 Advanced practitioners',
};

export default function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const skill = skills.find((s) => s.slug === slug);
  const skillReviews = reviews.filter((r) => r.skill_id === skill?.id);

  if (!skill) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="font-heading text-xl text-navy mb-2">Skill not found</div>
        <Link to="/app/browse" className="text-amber-sc font-body text-sm">
          ← Back to Browse
        </Link>
      </div>
    );
  }

  const handleMessageTeacher = () => {
    navigate('/app/messages');
  };


  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-body text-[var(--color-text-secondary)] hover:text-navy transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hero Card */}
          <div className="sc-card overflow-hidden">
            <div className={`h-48 bg-gradient-to-br ${skill.cover_gradient} flex items-end p-6`}>
              <div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest font-body px-2 py-1 rounded-full bg-white/20 text-white mb-2 inline-block"
                >
                  {skill.category}
                </span>
                <h1 className="font-heading text-3xl text-white">{skill.title}</h1>
              </div>
            </div>

            <div className="p-6">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mb-5 pb-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-sc text-amber-sc" />
                  <span className="font-bold font-body text-navy text-sm">{skill.avg_rating}</span>
                  <span className="text-xs font-body text-[var(--color-text-muted)]">({skill.reviews_count} reviews)</span>
                </div>
                {skill.location && (
                  <div className="flex items-center gap-1 text-xs font-body text-[var(--color-text-secondary)]">
                    <MapPin className="w-3.5 h-3.5" />
                    {skill.location}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs font-body text-[var(--color-text-secondary)]">
                  <Globe className="w-3.5 h-3.5" />
                  {skill.languages.join(' · ')}
                </div>
                <div className="text-xs font-semibold font-body" style={{ color: 'var(--color-forest)' }}>
                  {LEVEL_LABELS[skill.level]}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="font-body text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                  {skill.description}
                </p>
              </div>

              {/* Philosophy */}
              <div
                className="rounded-2xl p-5 mb-6"
                style={{ background: '#FFF3E0', borderLeft: '3px solid var(--color-amber)' }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider font-body mb-2" style={{ color: 'var(--color-amber)' }}>
                  Teaching Philosophy
                </div>
                <p className="font-heading italic text-navy text-lg leading-relaxed">
                  "{skill.philosophy}"
                </p>
              </div>

              {/* Who is this for */}
              <div className="mb-6">
                <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.1rem' }}>
                  Who is this for?
                </h3>
                <p className="font-body text-[var(--color-text-secondary)] leading-relaxed">
                  {skill.who_for}
                </p>
              </div>

              {/* What a session looks like */}
              <div className="mb-5">
                <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.1rem' }}>
                  What a session looks like
                </h3>
                <p className="font-body text-[var(--color-text-secondary)] leading-relaxed">
                  {skill.what_session_looks_like}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-body px-3 py-1.5 rounded-full font-medium"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews */}
          {skillReviews.length > 0 && (
            <div className="sc-card p-6">
              <h3 className="font-heading text-navy mb-5" style={{ fontSize: '1.1rem' }}>
                What members say ({skillReviews.length})
              </h3>
              <div className="space-y-5">
                {skillReviews.map((review) => (
                  <div key={review.id} className="pb-5 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                    <div className="flex items-start gap-3 mb-2">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={review.reviewer.avatar} />
                        <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '11px' }}>
                          {review.reviewer.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold font-body text-navy text-sm">
                            {review.reviewer.firstName} {review.reviewer.lastName}
                          </span>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-sc text-amber-sc" />
                            ))}
                          </div>
                        </div>
                        <div className="text-[11px] font-body text-[var(--color-text-muted)] mt-0.5">
                          {review.reviewer.city} · {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <p className="font-body text-[var(--color-text-secondary)] text-sm leading-relaxed pl-12">
                      {review.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pl-12">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-body font-medium px-2 py-0.5 rounded-full"
                          style={{ background: '#E8F5EE', color: '#2D7A4F' }}
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Booking Card */}
          <div className="sc-card-warm p-5 sticky top-20">
            {/* Price */}
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-heading text-3xl text-navy">{skill.price_per_hour}</span>
              <span className="font-body text-[var(--color-text-secondary)] text-sm">{skill.currency} / hour</span>
            </div>

            {/* Format */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-amber)' }} />
              <span className="font-body text-sm text-navy">
                {skill.format === 'both' ? 'Online & In-person' : skill.format === 'online' ? 'Online' : 'In-person only'}
              </span>
            </div>

            {/* Main CTA */}
            <button
              onClick={() => setIsBookingOpen(true)}
              className="w-full btn-amber justify-center text-sm mb-2"
              style={{ padding: '0.875rem 1rem' }}
            >
              Request a Session
            </button>

            <button
              onClick={handleMessageTeacher}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold font-body mb-3 py-2.5 rounded-xl border transition-colors hover:bg-parchment"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <MessageCircle className="w-4 h-4" />
              Message {skill.teacher.firstName} first
            </button>

            <p className="text-center text-[11px] font-body text-[var(--color-text-muted)] pb-4 border-b border-[var(--color-border)]">
              No payment required. Sessions are agreed directly.
            </p>

            {/* Trust items */}
            <div className="space-y-2 pt-4">
              {[
                'Verified member profile',
                'Two-way review system',
                'Safe community guidelines',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-body text-[var(--color-text-secondary)]">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-forest)' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Card */}
          <div className="sc-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-14 h-14 ring-2" style={{ '--tw-ring-color': 'rgba(196,135,58,0.3)' } as React.CSSProperties}>
                <AvatarImage src={skill.teacher.avatar} />
                <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white' }}>
                  {skill.teacher.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold font-body text-navy">
                  {skill.teacher.firstName} {skill.teacher.lastName}
                </div>
                <div className="text-xs font-body text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {skill.teacher.location}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3" style={{ color: 'var(--color-forest)' }} />
                  <span className="text-[10px] font-body" style={{ color: 'var(--color-forest)' }}>
                    Verified Teacher
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs font-body text-[var(--color-text-secondary)] leading-relaxed mb-3">
              {skill.teacher.bio?.substring(0, 120)}…
            </p>
            <div className="flex items-center justify-between text-xs font-body">
              <div className="text-center">
                <div className="font-bold text-navy">{skill.teacher.sessions_completed}</div>
                <div className="text-[var(--color-text-muted)]">sessions</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-0.5 font-bold text-navy justify-center">
                  <Star className="w-3 h-3 fill-amber-sc text-amber-sc" />
                  {skill.teacher.trust_score}
                </div>
                <div className="text-[var(--color-text-muted)]">trust score</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-navy">{skill.teacher.reviews_count}</div>
                <div className="text-[var(--color-text-muted)]">reviews</div>
              </div>
            </div>
            <Link
              to="/app/profile"
              className="flex items-center justify-center gap-1 w-full mt-4 py-2 rounded-xl text-xs font-semibold font-body border border-[var(--color-border)] text-navy hover:bg-parchment transition-colors"
            >
              View full profile
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <NewBookingModal
        skill={skill}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
