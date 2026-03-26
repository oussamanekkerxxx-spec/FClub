import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const handleGoogleSignUp = async (setError: (error: string) => void, setIsLoading: (loading: boolean) => void) => {
  setIsLoading(true);
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app/feed',
      },
    });
  } catch (err: any) {
    setError(err.message || 'Google sign-up failed.');
    setIsLoading(false);
  }
};

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        // "User already registered" — tell them to log in instead
        if (
          signUpError.message?.toLowerCase().includes('already registered') ||
          signUpError.message?.toLowerCase().includes('already exists')
        ) {
          setError('An account with this email already exists. Try logging in.');
          return;
        }
        throw signUpError;
      }

      if (signUpData.session) {
        // Email confirmations disabled — user is already signed in
        toast.success('Account created! Welcome to SKILLCLUB.');
        navigate('/onboarding');
      } else {
        // Email confirmations enabled — user must verify via OTP
        toast.success('Account created! Check your email for the confirmation code.');
        navigate('/verify-email', { state: { email } });
      }
    } catch (err: any) {
      setError(err.message || 'Could not create account at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex md:flex-row flex-col">
      {/* Left side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-white shadow-[0_0_60px_rgba(27,42,74,0.05)]">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
             <div className="w-10 h-10 rounded-xl bg-[var(--color-amber)] text-white flex items-center justify-center font-bold text-lg shadow-warm group-hover:scale-105 transition-transform">
              SC
            </div>
            <span className="font-heading font-semibold text-xl text-[var(--color-navy)]">SKILLCLUB</span>
          </Link>

          <h1 className="text-3xl font-heading text-[var(--color-navy)] mb-2">Join SKILLCLUB</h1>
          <p className="text-[var(--color-text-secondary)] mb-8 text-lg">Share what you know. Learn what you don't.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="input-sc pl-11"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="input-sc pl-11"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">Email address</label>
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="input-sc pl-11"
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-2">
              By joining, you agree to our Terms of Service and Privacy Policy. You also agree to be kind, curious, and respectful to other members.
            </p>

            <button
              type="submit"
              className="w-full btn-navy mt-4 justify-center py-3.5 text-base"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoogleSignUp(setError, setIsLoading)}
            disabled={isLoading}
            className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl font-medium text-[var(--color-navy)] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1f2937">G</text>
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-[var(--color-text-secondary)] text-center">
            Already a member?{' '}
            <Link to="/login" className="text-[var(--color-navy)] font-semibold hover:underline decoration-2 underline-offset-4">
               Log in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Image/Quote (Hidden on small screens) */}
      <div className="hidden md:flex flex-1 relative bg-[var(--color-navy)] overflow-hidden items-end justify-start p-12">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop" 
          alt="Community Gathering" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
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
               <div className="text-[var(--color-amber)] text-sm">Founding Member, Marrakesh</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
