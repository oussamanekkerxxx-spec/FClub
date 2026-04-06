import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch {
      // Even if insert fails (e.g. duplicate), show success to avoid enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex md:flex-row flex-col">
      {/* Left side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-white shadow-[0_0_60px_rgba(27,42,74,0.05)]">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-amber)] text-white flex items-center justify-center font-bold text-lg shadow-warm group-hover:scale-105 transition-transform">
              SC
            </div>
            <span className="font-heading font-semibold text-xl text-[var(--color-navy)]">FightClub</span>
          </Link>

          {/* Coming soon badge */}
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Clock className="w-4 h-4" />
            Currently in private testing
          </div>

          {!submitted ? (
            <>
              <h1 className="text-3xl font-heading text-[var(--color-navy)] mb-2">Coming Soon</h1>
              <p className="text-[var(--color-text-secondary)] mb-8 text-lg leading-relaxed">
                We're putting the finishing touches on something special. Leave your email and we'll reach out when a spot opens up.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">Your email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="input-sc pl-11"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-navy mt-2 justify-center py-3.5 text-base flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>Notify me <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-6 text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
                No spam — just one message when we're ready to let you in.
              </p>
            </>
          ) : (
            <div className="text-center py-8 animate-fade-in-up">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-heading text-[var(--color-navy)] mb-3">You're on the list</h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                We'll email <span className="font-semibold text-[var(--color-navy)]">{email}</span> as soon as we open access. Stay tuned.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 mt-8 text-[var(--color-amber)] font-semibold hover:underline underline-offset-4">
                Back to home
              </Link>
            </div>
          )}

          <p className="mt-8 text-[var(--color-text-secondary)] text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-navy)] font-semibold hover:underline decoration-2 underline-offset-4">
              Log in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="hidden md:flex flex-1 relative bg-[var(--color-navy)] overflow-hidden items-end justify-start p-12">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)] via-[var(--color-navy)]/60 to-transparent" />
        <div className="relative z-10 max-w-lg mb-10 animate-slide-in-right">
          <blockquote className="text-3xl font-heading text-white leading-tight mb-6">
            "I came to learn Arabic calligraphy. I stayed because I found my people. Now I teach piano here every Saturday."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--color-amber)]">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="Member Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-semibold">Amina Berrada</div>
              <div className="text-[var(--color-amber)] text-sm">Founding Member, Morocco</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
