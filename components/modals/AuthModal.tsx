'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, Lock, MessageSquare, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { APP_NAME, getBrandInitials } from '@/config/brand';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  entryContext?: 'login' | 'start' | 'try';
}

export function AuthModal({ isOpen, onClose, onSuccess, entryContext = 'start' }: AuthModalProps) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    !isSupabaseConfigured
      ? 'Authentication service is not configured. Please verify environment credentials.'
      : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDemoLoading(true);

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate demo account.');
      }

      setSuccessMsg('Demo session active! Loading workspace...');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        router.push(data.targetUrl || '/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error('Demo login failed:', err);
      setErrorMsg(
        err?.message ||
          'Demo login unavailable. WhatsApp OTP requires an active SMS/WhatsApp provider.'
      );
    } finally {
      setIsDemoLoading(false);
    }
  };

  const formatPhone = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      return '+' + cleaned;
    }
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return input.startsWith('+') ? input : '+' + cleaned;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication is not configured in this environment.');
      return;
    }

    const formatted = formatPhone(phone);
    if (!formatted || formatted.length < 12) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Authentication client is unavailable.');
      }

      const { error } = await client.auth.signInWithOtp({
        phone: formatted,
        options: {
          channel: 'whatsapp',
        },
      });

      if (error) {
        const { error: fallbackErr } = await client.auth.signInWithOtp({
          phone: formatted,
        });
        if (fallbackErr) throw fallbackErr;
      }

      setStep('otp');
      setSuccessMsg(`WhatsApp verification code sent to ${formatted}`);
    } catch (err: any) {
      console.error('WhatsApp OTP Send Error:', err);
      setErrorMsg(err?.message || 'Failed to send WhatsApp verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Authentication client is unavailable.');
      }

      const formatted = formatPhone(phone);
      const { data, error } = await client.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Authentication succeeded but no user session was returned.');

      // Check whether user belongs to an organization
      const { data: member } = await client
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .limit(1)
        .maybeSingle();

      setSuccessMsg('Authentication successful! Directing to application...');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        if (member?.organization_id) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding?next=/dashboard');
        }
        router.refresh();
      }, 600);
    } catch (err: any) {
      console.error('WhatsApp OTP Verification Error:', err);
      setErrorMsg(err?.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      id="auth-modal-backdrop"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-900 font-sans relative animate-in zoom-in-95 duration-150"
        id="auth-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition z-10 cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 py-6 border-b border-slate-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto font-extrabold text-xl shadow-xs mb-3">
            {getBrandInitials()}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900" id="auth-modal-title">
            {step === 'phone' ? 'Continue with WhatsApp' : 'Enter Verification Code'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'phone'
              ? 'Enter your WhatsApp mobile number to receive a one-time verification code'
              : 'Please enter the 6-digit WhatsApp OTP sent to your number'}
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex gap-2" id="auth-modal-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex gap-2" id="auth-modal-success">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 font-semibold text-xs select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    disabled={isLoading || isDemoLoading}
                    autoFocus
                    placeholder="98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 text-sm rounded-r-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition font-medium"
                    id="auth-modal-phone-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isDemoLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                id="auth-modal-submit-phone"
              >
                {isLoading ? (
                  <span>Sending WhatsApp OTP...</span>
                ) : (
                  <>
                    <span>Continue with WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Explicit Demo Account Section for internal testing / demos */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="h-px bg-slate-100 flex-1" />
                  <span className="px-2 font-medium uppercase tracking-wider text-[10px] text-slate-400">
                    Testing & Demos
                  </span>
                  <span className="h-px bg-slate-100 flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading || isDemoLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  id="auth-modal-demo-login-btn"
                >
                  {isDemoLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating demo session...</span>
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Use Demo Account (Skip OTP)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center leading-normal">
                  Demo account for internal evaluation while WhatsApp OTP provider is configured.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    disabled={isLoading}
                    autoFocus
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition text-center tracking-[0.5em] font-mono font-bold"
                    id="auth-modal-otp-input"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-200 font-semibold text-slate-500 hover:text-slate-800 transition text-xs cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-2.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-600/50 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
                  id="auth-modal-submit-otp"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2.5 border-t border-slate-100 text-center">
            <div className="flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsBill OTP is direct, secure, and WhatsApp-authenticated</span>
            </div>
            <p className="leading-normal max-w-[280px] mx-auto">
              By proceeding, you agree to our{' '}
              <a href="/terms" target="_blank" className="underline font-semibold hover:text-slate-600 transition">
                Terms of Service
              </a>{' '}
              and acknowledge our{' '}
              <a href="/privacy" target="_blank" className="underline font-semibold hover:text-slate-600 transition">
                Privacy Policy
              </a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
