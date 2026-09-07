'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Phone,
  Mail,
  X,
  SlidersHorizontal,
  ChevronDown,
  User,
  MapPin,
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createOrganizationAndOwner } from '@/lib/services/dashboardService';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const GST_STATE_CODE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('redirectTo') || '/dashboard';
  const targetDestination = nextParam.startsWith('/') ? nextParam : '/dashboard';

  // Authenticated user attributes (canonical identity is auth.users.id)
  const [accountPhone, setAccountPhone] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');

  // Required Field
  const [name, setName] = useState('');

  // Optional Fields
  const [legalName, setLegalName] = useState('');
  const [gstin, setGstin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Collapsible toggle for optional fields
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Escape key support to return to homepage without signing out
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Auth and membership check
  useEffect(() => {
    async function checkAuthAndExistingOrg() {
      if (!isSupabaseConfigured) {
        setIsCheckingAuth(false);
        setErrorMsg(
          'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setIsCheckingAuth(false);
        setErrorMsg('Authentication service unavailable.');
        return;
      }

      const { data: authData, error: authErr } = await client.auth.getUser();
      if (authErr || !authData?.user) {
        router.push('/login?next=' + encodeURIComponent(targetDestination));
        return;
      }

      const user = authData.user;
      setAccountPhone(user.phone || '');
      setAccountEmail(user.email || '');

      // Integrate with existing public.user_profiles table (id references auth.users.id)
      try {
        const { data: profile } = await client
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.display_name) {
          setDisplayName(profile.display_name);
        }
      } catch (profileErr) {
        console.warn('Could not read user profile:', profileErr);
      }

      // Check if user already belongs to an organization in organization_members
      const { data: member } = await client
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (member?.organization_id) {
        // Returning user or user who already has an organization
        router.push(targetDestination);
        return;
      }

      setIsCheckingAuth(false);
    }

    checkAuthAndExistingOrg();
  }, [router, targetDestination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your business or trading name.');
      return;
    }

    setIsLoading(true);

    try {
      let derivedStateCode: string | undefined = undefined;
      if (gstin.trim().length >= 2) {
        derivedStateCode = gstin.trim().substring(0, 2);
      }

      await createOrganizationAndOwner({
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        // Only include phone and email if user explicitly entered business contact details
        phone: phone.trim() ? (phone.startsWith('+91') ? phone.trim() : '+91' + phone.replace(/\D/g, '')) : undefined,
        email: email.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        displayName: displayName.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        stateCode: derivedStateCode,
        pincode: pincode.trim() || undefined,
        country: 'India',
      });

      router.push(targetDestination);
      router.refresh();
    } catch (err: any) {
      console.error('Organization Creation Error:', err);
      setErrorMsg('Something went wrong while creating your workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying workspace status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white py-12">
      {/* Background Subtle Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Top-Right Exit Control Button */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 active:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-700"
          aria-label="Return to homepage"
          id="onboarding-close-btn"
          title="Return to homepage"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Set up your WhatsBill workspace
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tell us your business name. You can add the rest later.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Required Field: Business Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200 tracking-wide">
              Business / Trading Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mahavir Electricals & Hardware"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              id="onboarding-name-input"
              autoFocus
            />
            <p className="text-[11px] text-slate-500">
              The customer-facing name printed on WhatsApp invoices and payment receipts.
            </p>
          </div>

          {/* Optional Collapsed Section */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-xl text-left transition-colors group cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-700"
              id="toggle-business-details-btn"
              aria-expanded={isDetailsOpen}
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Add business details (optional)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Legal name, GSTIN, business contact, and address
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isDetailsOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {isDetailsOpen && (
              <div className="mt-3 space-y-4 p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Legal Name & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Legal Firm Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mahavir Electricals Pvt Ltd"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                      id="onboarding-legal-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 27AABCM1429B1Z8"
                      value={gstin}
                      onChange={(e) => {
                        const upper = e.target.value.toUpperCase();
                        setGstin(upper);
                        if (upper.length >= 2) {
                          const code = upper.substring(0, 2);
                          if (GST_STATE_CODE_MAP[code] && !state) {
                            setState(GST_STATE_CODE_MAP[code]);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                      id="onboarding-gstin-input"
                    />
                  </div>
                </div>

                {/* Contact Person Name (user_profiles.display_name) */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Your Name / Contact Person
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Shah"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                      id="onboarding-display-name-input"
                    />
                  </div>
                </div>

                {/* Business Phone & Business Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-400">
                        Business Phone
                      </label>
                      {accountPhone && !phone && (
                        <button
                          type="button"
                          onClick={() => setPhone(accountPhone.replace('+91', ''))}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          Use account phone
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="e.g. 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                        id="onboarding-phone-input"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-400">
                        Business Email
                      </label>
                      {accountEmail && !email && (
                        <button
                          type="button"
                          onClick={() => setEmail(accountEmail)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          Use account email
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="e.g. orders@yourbusiness.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                        id="onboarding-email-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      placeholder="Shop / Plot No., Building, Street"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                      id="onboarding-address-line1-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Address Line 2 (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Area, Landmark, or Market"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                      id="onboarding-address-line2-input"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Ahmedabad"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                        id="onboarding-city-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">State</label>
                      <input
                        type="text"
                        list="indian-states-list"
                        placeholder="Select state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                        id="onboarding-state-input"
                      />
                      <datalist id="indian-states-list">
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Pincode</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 380001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                        id="onboarding-pincode-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full py-3.5 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              id="create-workspace-btn"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating workspace...</span>
                </div>
              ) : (
                <>
                  <span>Create workspace →</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500">
          You can add GST, address and other details later from Settings.
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
