import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
  Lock,
  Menu,
  Play,
  Shield,
  X,
} from 'lucide-react';
import { reportError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import './LandingPage.css';

const NAV_LINKS = [
  { label: 'Why FightClub', href: '#problem' },
  { label: 'Features', href: '#features' },
  { label: 'Community', href: '#proof' },
  { label: 'Pricing', href: '#pricing' },
];

const DEFAULT_HERO_STATS = [
  { value: '...', label: 'Active Members' },
  { value: '...', label: 'Skills Shared' },
  { value: '...', label: 'Moroccan Cities' },
  { value: '...', label: 'Active Clubs' },
];

const PAIN_ITEMS = [
  { marker: '01', text: "Scrolling through 200+ hour courses you'll never finish" },
  { marker: '02', text: 'Paying for tutors when talented peers sit two rows behind you' },
  { marker: '03', text: 'Feeling isolated on a campus of thousands who share your interests' },
  { marker: '04', text: "Wasting semesters before realizing you need skills universities don't teach" },
];

const PAIN_CARDS = [
  {
    number: '87%',
    text: 'of members abandon online courses before completing them',
    source: 'Source: Harvard Business Review',
  },
  {
    number: '3x',
    text: 'faster learning with peer-to-peer instruction vs. passive video',
    source: 'Source: Journal of Education',
  },
  {
    number: '72%',
    text: 'of Moroccan members want practical skills not taught in university',
    source: 'Source: Member Survey 2025',
  },
  {
    number: '0',
    text: 'platforms exist connecting members locally for skill sharing in Morocco',
    source: 'FightClub fills this gap',
  },
];

const FEATURES = [
  {
    icon: 'SD',
    tone: 'rgba(254,138,57,0.1)',
    title: 'Skill Discovery',
    benefit: 'Stop guessing who knows what. Browse skills by category, location, and rating, then book a session in two taps.',
  },
  {
    icon: 'CC',
    tone: 'rgba(59,130,246,0.1)',
    title: 'Clubs & Communities',
    benefit: 'Join clubs like Frontend Guild or Photography Circle. Share projects, vote on topics, and grow together as a micro-community.',
  },
  {
    icon: 'TV',
    tone: 'rgba(168,85,247,0.1)',
    title: 'Trust & Verification',
    benefit: 'Feel safe booking strangers. Verified IDs and peer reviews help you know exactly who you are meeting.',
  },
  {
    icon: 'HM',
    tone: 'rgba(34,211,153,0.1)',
    title: 'Hyperlocal Matching',
    benefit: 'Every match is within walking distance. Learn guitar from someone in your dorm, not a stranger three time zones away.',
  },
  {
    icon: 'LP',
    tone: 'rgba(234,179,8,0.1)',
    title: 'Leaderboards & Points',
    benefit: 'Earn trust points for every session taught and reviewed. Top contributors unlock recognition and community perks.',
  },
  {
    icon: 'VR',
    tone: 'rgba(253,56,56,0.1)',
    title: 'Voice Rooms & Events',
    benefit: 'Drop into live voice rooms for spontaneous discussions, or RSVP to hackathons, workshops, and member meetups.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I learned more React in 3 peer sessions than in an entire semester of YouTube tutorials. And I made a friend who became my co-founder.',
    name: 'Amina K.',
    role: 'CS Member, Essaouira',
    avatar: 'https://i.pravatar.cc/76?img=5',
  },
  {
    quote:
      'I was charging 0 MAD for my design skills. Now I teach Figma on FightClub, have 4.9 stars, and freelance clients find me through my profile.',
    name: 'Layla B.',
    role: 'Design Member, Marrakech',
    avatar: 'https://i.pravatar.cc/76?img=15',
  },
  {
    quote:
      "The trust system made me feel comfortable meeting someone I'd never spoken to. We practiced English together every week for 2 months.",
    name: 'Reda T.',
    role: 'Business Member, Casablanca',
    avatar: 'https://i.pravatar.cc/76?img=22',
  },
];

const STEPS = [
  {
    title: 'Create Your Profile',
    text: 'Tell us what you want to learn and what you can teach. It takes about 60 seconds.',
  },
  {
    title: 'Browse & Book',
    text: 'Find members near you with the exact skill you need. Book a session that fits your schedule.',
  },
  {
    title: 'Learn & Grow',
    text: 'Meet up, learn, leave a review, earn points, and watch your skills compound.',
  },
];

const BEFORE_ITEMS = [
  'Learning alone from impersonal YouTube videos',
  'No idea which members around you share your interests',
  'Paying 500+ MAD/month for generic online courses',
  'Dropping out of courses after week 2',
  'Skills stay theoretical with no real-world practice',
  'No portfolio, no proof, no network',
];

const AFTER_ITEMS = [
  'Learning face-to-face from peers who speak your language',
  'Matched with the right members within walking distance',
  'Free skill exchange: teach what you know, learn what you do not',
  'Accountability through clubs, streaks, and real relationships',
  'Hands-on projects with real feedback and peer review',
  'A verified profile that proves your expertise to future employers',
];

const PRICING = [
  {
    name: 'Explorer',
    price: '0',
    suffix: 'MAD',
    period: 'Free forever',
    highlight: false,
    features: [
      'Browse and book up to 5 sessions per month',
      'Join up to 3 clubs',
      'Basic profile and trust score',
      'Access voice rooms',
      'Community feed and messaging',
    ],
    ctaLabel: 'Start Free',
    ctaKind: 'secondary',
    href: '/signup',
  },
  {
    name: 'Verified',
    price: '49',
    suffix: 'MAD/mo',
    period: 'Less than a coffee a day',
    badge: 'Most Popular',
    highlight: true,
    features: [
      'Unlimited sessions and clubs',
      'Verified badge and priority matching',
      'Advanced analytics and progress tracking',
      'Create and manage your own clubs',
      'Resource library and playlists',
      'Priority support',
    ],
    ctaLabel: 'Start My Free Trial',
    ctaKind: 'primary',
    href: '/signup',
  },
  {
    name: 'Campus',
    price: 'Custom',
    suffix: '',
    period: 'For universities and organizations',
    highlight: false,
    features: [
      'White-label for your institution',
      'Admin dashboard and analytics',
      'Bulk member onboarding',
      'Custom clubs and event management',
      'Dedicated account manager',
    ],
    ctaLabel: 'Contact Sales',
    ctaKind: 'secondary',
    href: 'mailto:partnerships@fightclub.ma',
  },
];

const COUNTDOWN_START = 6 * 86400 + 14 * 3600 + 32 * 60 + 8;

function countdownParts(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [stats, setStats] = useState(DEFAULT_HERO_STATS);

  const timer = countdownParts(countdown);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: membersCount },
          { count: skillsCount },
          { data: citiesData },
          { count: clubsCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('skills').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('city'),
          supabase.from('clubs').select('*', { count: 'exact', head: true })
        ]);

        const uniqueCitiesCount = new Set((citiesData || []).map(c => c.city).filter(Boolean)).size;

        setStats([
          { value: membersCount ? `${membersCount}` : '0', label: 'Active Members' },
          { value: skillsCount ? `${skillsCount}` : '0', label: 'Skills Shared' },
          { value: `${uniqueCitiesCount || 0}`, label: 'Moroccan Cities' },
          { value: `${clubsCount || 0}`, label: 'Active Clubs' },
        ]);
      } catch (err) {
        reportError('landing.stats_fetch', err);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = previous;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const nodes = document.querySelectorAll('.landing-reveal');
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="landing-page">
      <header className={`lp-nav ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="lp-container lp-nav__inner">
          <Link to="/" className="lp-nav__logo flex items-center gap-2.5" onClick={closeMobileMenu}>
            <img src="/logo.png" alt="FightClub Logo" className="w-8 h-8 object-contain rounded-xl overflow-hidden" />
            <div>Fight<span className="lp-grad-text">Club</span></div>
          </Link>

          <nav className="lp-nav__links" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="lp-nav__link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lp-nav__actions">
            <Link to="/login" className="lp-nav__ghost">
              Log In
            </Link>
            <Link to="/signup" className="lp-nav__cta">
              Join Free
            </Link>
            <button
              type="button"
              className="lp-nav__menu"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="lp-nav__mobile">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="lp-nav__mobile-link" onClick={closeMobileMenu}>
                {link.label}
              </a>
            ))}
            <div className="lp-nav__mobile-actions">
              <Link to="/login" className="lp-nav__mobile-secondary" onClick={closeMobileMenu}>
                Log In
              </Link>
              <Link to="/signup" className="lp-nav__mobile-primary" onClick={closeMobileMenu}>
                Join Free
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero__grid" />
          <div className="lp-container">
            <div className="lp-hero__content">
              <div className="lp-kicker landing-reveal">
                <span className="lp-kicker__dot" />
                Join {stats.find(s => s.label === 'Active Members')?.value || '...'} members across {stats.find(s => s.label === 'Moroccan Cities')?.value || '...'} cities
              </div>

              <h1 className="lp-hero__title landing-reveal lp-delay-1">
                Learn Any Skill From
                <br />
                Members <span className="lp-grad-text">Near You</span> -
                <br />
                In 7 Days or Less
              </h1>

              <p className="lp-hero__sub landing-reveal lp-delay-2">
                You do not need expensive courses or distant mentors. FightClub connects you with fellow
                members who already master what you want to learn, and they are a 10-minute walk away.
              </p>

              <div className="lp-hero__actions landing-reveal lp-delay-3">
                <Link to="/signup" className="lp-btn lp-btn--primary">
                  Start My Free Journey <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how" className="lp-btn lp-btn--secondary">
                  <Play className="h-4 w-4" />
                  See How It Works
                </a>
              </div>

              <p className="lp-hero__micro landing-reveal lp-delay-3">
                <Shield className="h-3.5 w-3.5" />
                Free forever. No credit card. Cancel anytime.
              </p>

              <div className="lp-hero__stats landing-reveal lp-delay-4">
                {stats.map((item) => (
                  <div key={item.label} className="lp-stat">
                    <div className="lp-stat__value lp-grad-text">{item.value}</div>
                    <div className="lp-stat__label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--surface" id="problem">
          <div className="lp-container">
            <div className="lp-pain">
              <div className="landing-reveal">
                <div className="lp-section-label">The Problem</div>
                <h2 className="lp-section-title">
                  You Have Ambitions.
                  <br />
                  Your Campus Has <span className="lp-grad-text">Barriers.</span>
                </h2>
                <p className="lp-section-copy">
                  You want to learn video editing, speak better English, code a website, or play guitar.
                  But online courses feel distant. Professors do not teach real-world skills. And the
                  members who could help you? You never find them.
                </p>
                <ul className="lp-pain__list">
                  {PAIN_ITEMS.map((item) => (
                    <li key={item.text} className="lp-pain__item">
                      <span className="lp-pain__icon">{item.marker}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lp-pain__cards landing-reveal lp-delay-2">
                {PAIN_CARDS.map((item) => (
                  <article key={item.text} className="lp-pain-card">
                    <div className="lp-pain-card__number">{item.number}</div>
                    <div className="lp-pain-card__text">{item.text}</div>
                    <div className="lp-pain-card__source">{item.source}</div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-container">
            <div className="lp-section-header landing-reveal">
              <div className="lp-section-label">The Solution</div>
              <h2 className="lp-section-title">
                Everything You Need to <span className="lp-grad-text">Learn, Teach & Connect</span>
              </h2>
              <p className="lp-section-copy lp-section-copy--center">
                Not another course platform. A living community of members who teach each other what
                actually matters.
              </p>
            </div>

            <div className="lp-features">
              {FEATURES.map((feature, index) => (
                <article key={feature.title} className={`lp-feature landing-reveal lp-delay-${(index % 4) + 1}`}>
                  <div className="lp-feature__icon" style={{ background: feature.tone }}>
                    {feature.icon}
                  </div>
                  <h3 className="lp-feature__title">{feature.title}</h3>
                  <p className="lp-feature__copy">{feature.benefit}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--surface" id="proof">
          <div className="lp-container">
            <div className="lp-section-header landing-reveal">
              <div className="lp-section-label">Community Voices</div>
              <h2 className="lp-section-title">
                Do Not Take Our Word for It. <span className="lp-grad-text">Take Theirs.</span>
              </h2>
              <p className="lp-section-copy lp-section-copy--center">
                Real members. Real results. Real friendships built through shared skills.
              </p>
            </div>

            <div className="lp-testimonials">
              {TESTIMONIALS.map((testimonial, index) => (
                <article key={testimonial.name} className={`lp-testimonial landing-reveal lp-delay-${index + 1}`}>
                  <div className="lp-testimonial__stars">5/5</div>
                  <p className="lp-testimonial__quote">"{testimonial.quote}"</p>
                  <div className="lp-testimonial__author">
                    <img src={testimonial.avatar} alt={testimonial.name} className="lp-testimonial__avatar" />
                    <div>
                      <div className="lp-testimonial__name">{testimonial.name}</div>
                      <div className="lp-testimonial__role">{testimonial.role}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="lp-logos landing-reveal">
              <span>TRUSTED BY STUDENTS AT</span>
              <span>UM6P</span>
              <span>UIR</span>
              <span>ENSA</span>
              <span>ENCG</span>
              <span>EMSI</span>
              <span>FST</span>
            </div>
          </div>
        </section>

        <section className="lp-section" id="how">
          <div className="lp-container">
            <div className="lp-section-header landing-reveal">
              <div className="lp-section-label">How It Works</div>
              <h2 className="lp-section-title">
                Three Steps to Your <span className="lp-grad-text">First Session</span>
              </h2>
              <p className="lp-section-copy lp-section-copy--center">
                From signup to learning something new, in under 5 minutes.
              </p>
            </div>

            <div className="lp-steps">
              {STEPS.map((step, index) => (
                <article key={step.title} className={`lp-step landing-reveal lp-delay-${index + 1}`}>
                  <div className="lp-step__number">{index + 1}</div>
                  <h3 className="lp-step__title">{step.title}</h3>
                  <p className="lp-step__copy">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--surface">
          <div className="lp-container">
            <div className="lp-section-header landing-reveal">
              <div className="lp-section-label">The Transformation</div>
              <h2 className="lp-section-title">
                Life <span className="lp-grad-text">Before</span> vs. <span className="lp-grad-text">After</span>{' '}
                FightClub
              </h2>
            </div>

            <div className="lp-transform landing-reveal">
              <div className="lp-transform__col lp-transform__col--before">
                <div className="lp-transform__label lp-transform__label--before">Without FightClub</div>
                <ul className="lp-transform__list">
                  {BEFORE_ITEMS.map((item) => (
                    <li key={item} className="lp-transform__item">
                      <span>X</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lp-transform__col lp-transform__col--after">
                <div className="lp-transform__label lp-transform__label--after">With FightClub</div>
                <ul className="lp-transform__list">
                  {AFTER_ITEMS.map((item) => (
                    <li key={item} className="lp-transform__item">
                      <span>+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" id="pricing">
          <div className="lp-container">
            <div className="lp-section-header landing-reveal">
              <div className="lp-section-label">Simple Pricing</div>
              <h2 className="lp-section-title">
                Start Free. <span className="lp-grad-text">Upgrade When Ready.</span>
              </h2>
              <p className="lp-section-copy lp-section-copy--center">
                No hidden fees. No lock-in. Just tools that grow with you.
              </p>
            </div>

            <div className="lp-pricing">
              {PRICING.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`lp-price-card ${plan.highlight ? 'is-featured' : ''} landing-reveal lp-delay-${index + 1}`}
                >
                  {plan.badge ? <div className="lp-price-card__badge">{plan.badge}</div> : null}
                  <div className="lp-price-card__name">{plan.name}</div>
                  <div className="lp-price-card__price">
                    {plan.price}
                    {plan.suffix ? <span>{plan.suffix}</span> : null}
                  </div>
                  <div className="lp-price-card__period">{plan.period}</div>

                  <ul className="lp-price-card__features">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check className="h-3.5 w-3.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.href.startsWith('mailto:') ? (
                    <a
                      href={plan.href}
                      className={`lp-price-card__cta ${plan.ctaKind === 'primary' ? 'is-primary' : 'is-secondary'}`}
                    >
                      {plan.ctaLabel}
                    </a>
                  ) : (
                    <Link
                      to={plan.href}
                      className={`lp-price-card__cta ${plan.ctaKind === 'primary' ? 'is-primary' : 'is-secondary'}`}
                    >
                      {plan.ctaLabel}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-urgency">
          <div className="lp-container">
            <div className="lp-urgency__inner landing-reveal">
              <div className="lp-urgency__badge">Limited Early Access</div>
              <h2 className="lp-urgency__title">
                Early Adopters Get <span className="lp-grad-text">Lifetime Verified</span> - Free
              </h2>
              <p className="lp-urgency__copy">
                The first 500 members who sign up get the Verified tier permanently unlocked at no cost.
                Once the spots are filled, they are gone.
              </p>

              <div className="lp-countdown">
                <div className="lp-countdown__block">
                  <div className="lp-countdown__value">{timer.days}</div>
                  <div className="lp-countdown__label">Days</div>
                </div>
                <div className="lp-countdown__block">
                  <div className="lp-countdown__value">{timer.hours}</div>
                  <div className="lp-countdown__label">Hours</div>
                </div>
                <div className="lp-countdown__block">
                  <div className="lp-countdown__value">{timer.minutes}</div>
                  <div className="lp-countdown__label">Min</div>
                </div>
                <div className="lp-countdown__block">
                  <div className="lp-countdown__value">{timer.seconds}</div>
                  <div className="lp-countdown__label">Sec</div>
                </div>
              </div>

              <div className="lp-proof">
                <div className="lp-proof__avatars">
                  {[5, 11, 15, 22, 33].map((image) => (
                    <img key={image} src={`https://i.pravatar.cc/40?img=${image}`} alt="" />
                  ))}
                </div>
                <span className="lp-proof__dot" />
                <span>347 of 500 spots claimed</span>
              </div>

              <Link to="/signup" className="lp-btn lp-btn--primary">
                Claim My Free Spot <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-final" id="final">
          <div className="lp-container">
            <div className="lp-final__inner landing-reveal">
              <div className="lp-section-label lp-section-label--center">Join Your Community</div>
              <h2 className="lp-final__title">
                Your Campus Is Full of
                <br />
                <span className="lp-grad-text">Untapped Potential.</span>
                <br />
                Start Unlocking It Today.
              </h2>
              <p className="lp-final__copy">
                Every skill you have ever wanted to learn is already being mastered by someone walking the
                same halls as you. The only thing missing is the connection.
              </p>
              <Link to="/signup" className="lp-btn lp-btn--primary lp-final__cta">
                Start My Free Journey <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="lp-final__proof">
                <Lock className="h-3.5 w-3.5" />
                Free forever | No credit card | Join 2,400+ members
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__logo flex items-center gap-2.5">
            <img src="/logo.png" alt="FightClub Logo" className="w-8 h-8 object-contain rounded-xl overflow-hidden opacity-90" />
            <div>Fight<span className="lp-grad-text">Club</span></div>
          </div>
          <div className="lp-footer__links">
            <a href="#features">About</a>
            <a href="#proof">Privacy</a>
            <a href="#pricing">Terms</a>
            <a href="mailto:hello@fightclub.ma">Contact</a>
          </div>
          <div className="lp-footer__copy">
            (c) 2026 FightClub. Made with <Flame className="h-3.5 w-3.5" /> in Essaouira.
          </div>
        </div>
      </footer>
    </div>
  );
}
