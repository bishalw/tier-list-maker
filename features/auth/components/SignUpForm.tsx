'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { AuthCard } from './AuthCard';
import { Mail, Lock, Loader2, Github } from 'lucide-react';

interface SignUpFormProps {
  onSuccess?: () => void;
  bare?: boolean;
  next?: string;
}

export function SignUpForm({ onSuccess, bare, next = '/profile' }: SignUpFormProps = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOAuthSignUp = async (provider: 'github' | 'google' | 'apple') => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    const successContent = (
      <div className="text-center space-y-4 py-4">
        <p className="text-text-main font-medium">Check your email</p>
        <p className="text-text-muted text-sm">
          We&apos;ve sent a verification link to <strong>{email}</strong>.{' '}
          {onSuccess
            ? 'Your ranking is saved — click the link to confirm your account and your remix will be submitted automatically.'
            : 'Please click the link to confirm your account and start ranking!'}
        </p>
        {!onSuccess && (
          <Link
            href="/login"
            className="inline-block w-full bg-accent hover:bg-accent-hover text-accent-foreground font-black py-3 rounded-item shadow-panel transition-all uppercase tracking-widest"
          >
            Back to Login
          </Link>
        )}
      </div>
    );

    if (bare || onSuccess) return successContent;

    return (
      <AuthCard title="Check your email" subtitle="We've sent you a verification link">
        {successContent}
      </AuthCard>
    );
  }

  const form = (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-bold text-text-main uppercase tracking-wider">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg-main border border-border-main rounded-item py-2.5 pl-10 pr-4 text-text-main focus:ring-2 focus:ring-focus-ring outline-none transition-all"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-text-main uppercase tracking-wider">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-bg-main border border-border-main rounded-item py-2.5 pl-10 pr-4 text-text-main focus:ring-2 focus:ring-focus-ring outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-text-main uppercase tracking-wider">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-bg-main border border-border-main rounded-item py-2.5 pl-10 pr-4 text-text-main focus:ring-2 focus:ring-focus-ring outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-danger-soft border border-danger/20 text-danger text-sm p-3 rounded-item font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-accent hover:bg-accent-hover text-accent-foreground font-black py-3 rounded-item shadow-panel transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
      </button>

      {!onSuccess && (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-main"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthSignUp('github')}
              className="flex items-center justify-center gap-2 bg-surface border border-border-main hover:border-text-muted py-2.5 rounded-item transition-all font-bold text-text-main"
            >
              <Github size={20} />
              GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignUp('google')}
              className="flex items-center justify-center gap-2 bg-surface border border-border-main hover:border-text-muted py-2.5 rounded-item transition-all font-bold text-text-main"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignUp('apple')}
              className="flex items-center justify-center gap-2 bg-surface border border-border-main hover:border-text-muted py-2.5 rounded-item transition-all font-bold text-text-main"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                />
              </svg>
              Apple
            </button>
          </div>
        </>
      )}
    </form>
  );

  if (bare) return form;

  return (
    <AuthCard
      title="Join the Club"
      subtitle="Create your account to start ranking"
      footer={
        <p className="text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline font-bold">
            Sign In
          </Link>
        </p>
      }
    >
      {form}
    </AuthCard>
  );
}
