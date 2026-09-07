'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, Lock, MessageSquare, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { APP_NAME, getBrandInitials } from '@/config/brand';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('redirectTo') || '/dashboard';
  const targetDestination = nextParam.startsWith('/') ? nextParam : '/dashboard';

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    !isSupabaseConfigured
      ? 'Supabase Authentication is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.'
      : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setErrorMsg('Supabase Authentication is not configured in this environment.');
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
        throw new Error('Supabase client authentication is unavailable. Please check environment configuration.');
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
      setErrorMsg(err?.message || 'Failed to send WhatsApp verification code. Please check your phone number and try again.');
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
        throw new Error('Supabase client authentication is unavailable.');
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

      setTimeout(() => {
        if (member?.organization_id) {
          router.push(targetDestination);
        } else {
          router.push('/onboarding?next=' + encodeURIComponent(targetDestination));
        }
        router.refresh();
      }, 600);
    } catch (err: any) {
      console.error('WhatsApp OTP Verification Error:', err);
      setErrorMsg(err?.message || 'Invalid or expired verification code. Please request a new code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto font-extrabold text-xl shadow-inner">
            {getBrandInitials()}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            {APP_NAME} Login
          </h1>
          <p className="text-xs text-slate-400">
            Official WhatsApp OTP Authentication for Distributors & Wholesalers
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                WhatsApp Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  id="login-phone-input"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your 10-digit mobile number registered with your trade account.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length < 10}
              className="w-full py-3.5 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              id="send-otp-btn"
            >
              {isLoading ? (
                <span>Sending WhatsApp Code...</span>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  WhatsApp Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setErrorMsg(null);
                  }}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Change Number
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  id="login-otp-input"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter the 6-digit security OTP sent to your WhatsApp account.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-3.5 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              id="verify-otp-btn"
            >
              {isLoading ? (
                <span>Verifying Security Token...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Code & Enter Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 space-y-1">
          <p>End-to-end encrypted session managed by Supabase Auth.</p>
          <p>© 2026 {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
