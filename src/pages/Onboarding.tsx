import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const INTEREST_CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'art', label: 'Art & Craft', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
];

const LEARN_ASPIRATIONS = [
  { id: 'music', label: 'Play an instrument', emoji: '🎵' },
  { id: 'cook', label: 'Cook traditional food', emoji: '🍳' },
  { id: 'language', label: 'Learn a language', emoji: '🌍' },
  { id: 'move', label: 'Move my body', emoji: '🧘' },
  { id: 'create', label: 'Make something with my hands', emoji: '✂️' },
  { id: 'tech', label: 'Get better with technology', emoji: '💻' },
  { id: 'photo', label: 'See through a camera', emoji: '📷' },
  { id: 'write', label: 'Put words on a page', emoji: '✍️' },
];

const TEACH_INTERESTS = [
  { id: 'yes-skill', label: 'Yes, and I know exactly what', emoji: '✓' },
  { id: 'yes-unsure', label: 'Yes, but I\'m not sure anyone would want to learn it', emoji: '🤔' },
  { id: 'maybe', label: 'Maybe one day', emoji: '✦' },
  { id: 'seeker', label: 'I\'m purely here to learn', emoji: '🌱' },
];

const STEPS = [
  {
    id: 'curiosity',
    question: 'What are you curious about lately?',
    subtext: 'This helps us find the right people and skills for you in your city.',
  },
  {
    id: 'aspiration',
    question: 'Is there something you\'ve always wanted to learn but never had the chance?',
    subtext: 'Be honest. There are no wrong answers — only interesting ones.',
  },
  {
    id: 'give',
    question: 'Is there something you could share with someone else?',
    subtext: 'A skill, a passion, a craft. The best clubs have givers and seekers.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    curiosity: [] as string[],
    aspiration: [] as string[],
    give: '',
    giveText: '',
  });
  const [transitioning, setTransitioning] = useState(false);

  const goNext = async () => {
    if (step < STEPS.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setTransitioning(false);
      }, 250);
    } else {
      // Final step — save to Supabase and go to feed
      if (user && user.id !== 'demo-user-bypass') {
        const what_i_learn = answers.aspiration;
        const what_i_teach = answers.give === 'yes-skill' || answers.give === 'yes-unsure'
          ? [...answers.curiosity, ...(answers.giveText ? [answers.giveText] : [])]
          : [];
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          what_i_learn,
          what_i_teach,
          onboarding_completed: true,
        }, { onConflict: 'id' });
        if (error) {
          toast.error('Could not save your preferences. Please try again.');
          return;
        }
        updateUser({ what_i_learn, what_i_teach, onboarding_completed: true });
        toast.success('Welcome to FightClub!');
      }
      navigate('/app/feed');
    }
  };

  const toggleCuriosity = (id: string) => {
    setAnswers((prev) => ({
      ...prev,
      curiosity: prev.curiosity.includes(id)
        ? prev.curiosity.filter((x) => x !== id)
        : [...prev.curiosity, id],
    }));
  };

  const toggleAspiration = (id: string) => {
    setAnswers((prev) => ({
      ...prev,
      aspiration: prev.aspiration.includes(id)
        ? prev.aspiration.filter((x) => x !== id)
        : [...prev.aspiration, id],
    }));
  };

  const canContinue =
    (step === 0 && answers.curiosity.length > 0) ||
    (step === 1 && answers.aspiration.length > 0) ||
    (step === 2 && answers.give !== '');

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
            style={{ background: 'var(--color-amber)' }}
          >
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

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? '24px' : '8px',
              height: '8px',
              background: i <= step ? 'var(--color-amber)' : 'var(--color-parchment-dark)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 transition-opacity duration-250 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-full max-w-lg text-center mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest font-body mb-3" style={{ color: 'var(--color-amber)' }}>
            Question {step + 1} of {STEPS.length}
          </div>
          <h1 className="font-heading text-navy mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            {STEPS[step].question}
          </h1>
          <p className="font-body text-[var(--color-text-secondary)] text-sm">
            {STEPS[step].subtext}
          </p>
        </div>

        {/* Step 0: Topic tags */}
        {step === 0 && (
          <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mx-auto">
            {INTEREST_CATEGORIES.map((cat) => {
              const selected = answers.curiosity.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCuriosity(cat.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold font-body transition-all border"
                  style={
                    selected
                      ? { background: 'var(--color-navy)', color: 'white', borderColor: 'var(--color-navy)' }
                      : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
                  }
                >
                  {cat.emoji} {cat.label}
                  {selected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: Aspirations */}
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg mx-auto">
            {LEARN_ASPIRATIONS.map((opt) => {
              const selected = answers.aspiration.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleAspiration(opt.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all border"
                  style={
                    selected
                      ? { background: '#FFF3E0', borderColor: 'var(--color-amber)', color: 'var(--color-navy)' }
                      : { background: 'white', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                  }
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="font-medium font-body text-sm">{opt.label}</span>
                  {selected && (
                    <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'var(--color-amber)' }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Give */}
        {step === 2 && (
          <div className="w-full max-w-lg space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {TEACH_INTERESTS.map((opt) => {
                const selected = answers.give === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, give: opt.id }))}
                    className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all border"
                    style={
                      selected
                        ? { background: 'var(--color-navy)', borderColor: 'var(--color-navy)' }
                        : { background: 'white', borderColor: 'var(--color-border)' }
                    }
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span
                      className="font-medium font-body text-sm"
                      style={{ color: selected ? 'white' : 'var(--color-text-secondary)' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {(answers.give === 'yes-skill' || answers.give === 'yes-unsure') && (
              <input
                type="text"
                value={answers.giveText}
                onChange={(e) => setAnswers((prev) => ({ ...prev, giveText: e.target.value }))}
                placeholder="What's the skill? (e.g. Arabic calligraphy, chess, bread making…)"
                className="input-sc"
                autoFocus
              />
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={goNext}
          disabled={!canContinue}
          className="mt-10 flex items-center gap-2 btn-amber disabled:opacity-40 transition-all"
          style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}
        >
          {step === STEPS.length - 1 ? (
            <>Enter the Ring <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        {step === 0 && (
          <p className="mt-3 text-[11px] font-body" style={{ color: 'var(--color-text-muted)' }}>
            Select at least one to continue
          </p>
        )}
      </div>
    </div>
  );
}
