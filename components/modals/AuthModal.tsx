'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Edit2,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
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
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

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

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus phone input when modal opens on phone step
  useEffect(() => {
    if (isOpen && step === 'phone') {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Auto-focus first OTP slot when moving to OTP step
  useEffect(() => {
    if (isOpen && step === 'otp') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen, step]);

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

  const getDisplayFormattedPhone = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      const local = cleaned.slice(2);
      return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
    }
    return raw;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formatted = formatPhone(phone);
    if (!formatted || formatted.length < 12) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Send OTP request to server route (handles Master Phone check & standard supabase auth session)
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || 'Failed to send verification code. Please try again.');
      }

      // Show OTP verification UI
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setSuccessMsg(`Verification code sent to ${getDisplayFormattedPhone(phone)}`);
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setErrorMsg(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentOtpValue = otpDigits.join('');

  const submitOtpVerification = async (tokenToVerify: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!tokenToVerify || tokenToVerify.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      const formatted = formatPhone(phone);

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatted,
          token: tokenToVerify,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || 'Invalid credentials');
      }

      setSuccessMsg('Authentication successful! Directing to application...');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        if (result.isAdmin) {
          router.push('/dashboard');
        } else if (result.hasOrganization) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding?next=/dashboard');
        }
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      setErrorMsg(err?.message || 'Invalid credentials');
      // Focus on the first slot so user can re-type easily
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOtpVerification(currentOtpValue);
  };

  // Handle individual digit change in segmented OTP input
  const handleDigitChange = (index: number, value: string) => {
    // Keep only numbers
    const cleanVal = value.replace(/\D/g, '');

    // If user pasted multi-character string
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((ch, idx) => {
        if (idx < 6) newDigits[idx] = ch;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();

      // Auto submit if full 6 digits pasted
      if (newDigits.every((d) => d !== '')) {
        submitOtpVerification(newDigits.join(''));
      }
      return;
    }

    const singleChar = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleChar;
    setOtpDigits(newDigits);

    // Auto advance to next slot
    if (singleChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits completed, auto submit
    if (singleChar && index === 5 && newDigits.every((d) => d !== '')) {
      submitOtpVerification(newDigits.join(''));
    }
  };

  // Handle keyboard navigation (Backspace, Left/Right arrows)
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Move back and delete previous
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste on any OTP input
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedData) return;

    const chars = pastedData.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    chars.forEach((ch, idx) => {
      if (idx < 6) newDigits[idx] = ch;
    });
    setOtpDigits(newDigits);

    const focusIdx = Math.min(chars.length, 5);
    otpInputRefs.current[focusIdx]?.focus();

    if (chars.length === 6) {
      submitOtpVerification(newDigits.join(''));
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      id="auth-modal-backdrop"
    >
      <div
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-900/15 max-w-md w-full overflow-hidden text-slate-900 font-sans relative animate-in zoom-in-95 duration-200"
        id="auth-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100/80 transition-colors z-10 cursor-pointer flex items-center justify-center w-8 h-8"
          id="auth-modal-close-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-6 sm:px-8 text-center">
          <div className="relative inline-flex mb-3">
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-xl shadow-xs">
              {getBrandInitials()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
              <MessageSquare className="w-2.5 h-2.5" />
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight" id="auth-modal-title">
            {step === 'phone' ? 'Welcome to WhatsBill' : 'Enter Verification Code'}
          </h3>

          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {step === 'phone'
              ? 'Enter your WhatsApp mobile number to sign in or get started'
              : 'Enter the 6-digit verification code sent to your mobile number'}
          </p>

          {/* Number chip on OTP step with edit button */}
          {step === 'otp' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80 text-xs font-semibold text-slate-700">
              <span>{getDisplayFormattedPhone(phone)}</span>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtpDigits(['', '', '', '', '', '']);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1 cursor-pointer font-medium"
                title="Change phone number"
              >
                <Edit2 className="w-3 h-3" />
                <span className="text-[11px] underline">Change</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="px-6 sm:px-8 pb-8 space-y-5">
          {/* Error Alert */}
          {errorMsg && (
            <div
              className="p-3 bg-rose-50 border border-rose-200/70 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in"
              id="auth-modal-error"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="leading-snug font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success / Status Alert */}
          {successMsg && !errorMsg && (
            <div
              className="p-3 bg-emerald-50 border border-emerald-200/70 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in"
              id="auth-modal-success"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="leading-snug font-medium">{successMsg}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden shadow-2xs">
                  <div className="flex items-center gap-1.5 px-3.5 bg-slate-100/70 border-r border-slate-200 text-slate-700 font-semibold text-xs select-none">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    disabled={isLoading || isDemoLoading}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 text-sm bg-transparent focus:outline-hidden font-medium text-slate-900 placeholder:text-slate-400 tracking-wide"
                    id="auth-modal-phone-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isDemoLoading || phone.length < 10}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                id="auth-modal-submit-phone"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending code...</span>
                  </span>
                ) : (
                  <>
                    <span>Continue with WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo Account Access for internal testing */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="h-px bg-slate-100 flex-1" />
                  <span className="px-3 font-semibold uppercase tracking-widest text-[10px] text-slate-400">
                    Quick Preview
                  </span>
                  <span className="h-px bg-slate-100 flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading || isDemoLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                      <span>Explore with Demo Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 6-Slot Segmented PIN / OTP Input */}
              <div>
                <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Enter 6-Digit Code
                </label>

                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      disabled={isLoading}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all select-all ${
                        digit
                          ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 ring-2 ring-emerald-500/15'
                          : 'border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10'
                      } focus:outline-hidden`}
                      id={`auth-modal-otp-digit-${idx}`}
                    />
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || currentOtpValue.length !== 6}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                id="auth-modal-submit-otp"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying code...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Code & Helper */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setStep('phone');
                    setOtpDigits(['', '', '', '', '', '']);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer text-xs"
                >
                  ← Back to phone
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-slate-400 font-medium text-xs">
                    Resend code in <strong className="text-slate-600">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendOtp()}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 transition cursor-pointer text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Secure Trust Badge */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Direct, encrypted WhatsApp authentication</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              By continuing, you agree to our{' '}
              <a href="/terms" target="_blank" className="underline hover:text-slate-600 transition">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="underline hover:text-slate-600 transition">
                Privacy Policy
              </a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
