import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Mail, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from location state
  const email = location.state?.email || '';

  // Redirect if no email provided
  if (!email && !verified) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="sc-card-warm p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading text-[var(--color-navy)] mb-3">Session Expired</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Please sign up again to receive a verification code.
          </p>
          <Link to="/signup" className="btn-amber inline-flex">
            Go to Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value].join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (fullCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: fullCode,
        type: 'signup',
      });

      if (verifyError) throw verifyError;

      if (data.session) {
        setVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/onboarding'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) throw resendError;

      toast.success('Verification code resent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Could not resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="sc-card-warm p-8 max-w-md text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading text-[var(--color-navy)] mb-3">Email Verified!</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Your email has been verified successfully. Redirecting you to onboarding...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--color-amber)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-amber)] text-white flex items-center justify-center font-bold text-xl shadow-warm group-hover:scale-105 transition-transform duration-300">
              FC
            </div>
          </Link>
          <h1 className="mt-6 text-3xl font-heading text-[var(--color-navy)] mb-2">Verify Your Email</h1>
          <p className="text-[var(--color-text-secondary)]">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        <div className="sc-card-warm p-8">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <Mail className="w-8 h-8" />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100 flex items-start gap-3 animate-fade-in mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleVerify(code.join('')); }} className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className="w-12 h-14 text-center text-2xl font-bold text-[var(--color-navy)] border-2 border-gray-200 rounded-xl focus:border-[var(--color-amber)] focus:outline-none transition-colors disabled:opacity-50"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full btn-navy justify-center py-3.5 text-base"
              disabled={isLoading || code.some(d => !d)}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-[var(--color-text-secondary)] text-sm">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[var(--color-amber)] font-semibold hover:underline decoration-2 underline-offset-4 disabled:opacity-50 transition-opacity"
            >
              {isResending ? 'Resending...' : 'Resend Code'}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-[var(--color-text-secondary)]">
          Wrong email?{' '}
          <Link to="/signup" className="text-[var(--color-amber)] font-semibold hover:underline decoration-2 underline-offset-4">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
