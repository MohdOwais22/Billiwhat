'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, Database, CheckCircle2, AlertCircle, LogIn, UserPlus, LogOut } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  isLiveActive?: boolean;
  onAuthSuccess: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUserEmail,
  isLiveActive,
  onAuthSuccess,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const client = getSupabaseClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      setErrorMsg('Supabase is not configured in this environment.');
      return;
    }
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error, data } = await client.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          setSuccessMsg('Account created and signed in successfully!');
          setTimeout(() => {
            onAuthSuccess();
            onClose();
          }, 800);
        } else {
          setSuccessMsg('Account created! If confirmation is required, please check your email.');
        }
      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error('Supabase authentication error:', err);
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      await client.auth.signOut();
      setSuccessMsg('Signed out.');
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isLiveActive ? 'Cloud Account & Organization' : 'Supabase Cloud Sync'}
              </h2>
              <p className="text-xs text-slate-300">
                {isLiveActive ? 'Connected to live database' : 'Sign in to access your organization records'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isLiveActive ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-900">Signed In (Live Cloud Active)</h3>
                  <p className="text-xs text-emerald-700 mt-0.5 font-mono break-all">
                    {currentUserEmail || 'Active session'}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-800">
                All invoices, payments, and customer ledger entries are synchronizing directly with your Supabase organization.
              </p>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition flex items-center justify-center gap-2"
                id="sign-out-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
              <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 font-medium">Connect your Supabase account. </span>
                <span>Sign in below to connect your real Supabase company ledger.</span>
              </div>
            </div>
          )}

          {!isLiveActive && (
            <form onSubmit={handleAuth} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="finance@yourcompany.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    id="auth-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    id="auth-password-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isSupabaseConfigured}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                id="submit-auth-btn"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account & Sign In</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Live Database</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-emerald-700 hover:underline font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
