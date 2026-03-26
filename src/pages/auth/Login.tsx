import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the intended destination or default to feed
  const from = location.state?.from?.pathname || '/app/feed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Welcome back to the club!');
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('We couldn\'t find an account with those details. Want to join instead?');
      } else if (err.message.includes('email') && err.message.includes('not confirmed')) {
        // Email not verified - redirect to verification page
        toast.info('Please verify your email before logging in');
        navigate('/verify-email', { state: { email } });
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login('demo@fightclub.test', 'bypass');
      navigate(from, { replace: true });
    } catch (err) {
      setError('Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app/feed',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      setIsLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/login?reset=true',
      });

      if (error) throw error;

      toast.success('Password reset link sent! Check your email.');
      setForgotEmail('');
      setShowForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Could not send reset link. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dot-pattern" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-amber)] text-white flex items-center justify-center font-bold text-xl shadow-warm group-hover:scale-105 transition-transform duration-300">
              SC
            </div>
          </Link>
          <h1 className="mt-6 text-3xl font-heading text-[var(--color-navy)] mb-2">Welcome back</h1>
          <p className="text-[var(--color-text-secondary)]">Your community awaits.</p>
        </div>

        {/* Card */}
        <div className="sc-card-warm p-8 relative overflow-hidden">
          {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">Email</label>
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
                  placeholder="••••••••"
                  className="input-sc pl-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[var(--color-amber)] focus:ring-[var(--color-amber)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-[var(--color-amber)] hover:text-[#D4975A] transition-colors">
                Forgot password?
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="w-full btn-amber justify-center"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
              </button>

              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full btn-outline-navy justify-center"
                disabled={isLoading}
              >
                Bypass (Demo Only)
              </button>
            </div>
          </form>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100 flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-navy)] ml-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-sc pl-11"
                    disabled={isSendingReset}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  className="w-full btn-amber justify-center"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                    setError('');
                  }}
                  className="w-full text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-amber)] transition-colors"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {!showForgotPassword && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl font-medium text-[var(--color-navy)] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1f2937">G</text>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-[var(--color-text-secondary)]">
          Not a member yet?{' '}
          <Link to="/signup" className="text-[var(--color-amber)] font-semibold hover:underline decoration-2 underline-offset-4">
             Join the club
          </Link>
        </p>
      </div>
    </div>
  );
}
