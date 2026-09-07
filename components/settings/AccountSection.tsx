'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { User, Save, CheckCircle2, AlertCircle, Loader2, LogOut, ShieldCheck, Mail, Phone, KeyRound } from 'lucide-react';

interface AccountSectionProps {
  userProfile?: UserProfile | null;
  currentUser: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role: string;
  };
  onUpdateProfile: (profile: UserProfile) => void;
}

export function AccountSection({
  userProfile,
  currentUser,
  onUpdateProfile,
}: AccountSectionProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(userProfile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          payload: {
            display_name: displayName.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user profile');
      }

      onUpdateProfile(data.userProfile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error during signout:', err);
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="settings-account-card">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Account & Authentication</h2>
              <p className="text-xs text-slate-500">Your profile details, linked credentials, and session management</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {saveStatus === 'success' && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Personal profile updated successfully.</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage || 'Failed to save changes.'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="user-display-name">
                Your Full Name / Display Name
              </label>
              <input
                id="user-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Anand Mahindra"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Appears next to notes, reminders, and payment receipts.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Organization Role
              </label>
              <div className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between">
                <span className="capitalize">{currentUser.role || 'Member'}</span>
                <span className="text-[10px] text-emerald-700 font-medium">Verified Active Role</span>
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={currentUser.email || 'No email registered'}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={currentUser.phone || 'No phone registered'}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                User Identifier (UUID)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={currentUser.id}
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition disabled:opacity-50 cursor-pointer"
              id="save-account-profile-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out / Session Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Session & Sign Out</h3>
          <p className="text-xs text-slate-500 mt-0.5">End your current session across all open browser tabs</p>
        </div>

        <button
          onClick={() => setShowSignoutConfirm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition cursor-pointer"
          id="account-signout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* Signout Confirmation Modal */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to sign out? You will need to log in again to access your invoices and dashboard.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setShowSignoutConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
