'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, MapPin, Receipt, Phone, Mail } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createOrganizationAndOwner } from '@/lib/services/dashboardService';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('redirectTo') || '/dashboard';
  const targetDestination = nextParam.startsWith('/') ? nextParam : '/dashboard';

  const [userPhone, setUserPhone] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndExistingOrg() {
      if (!isSupabaseConfigured) {
        setIsCheckingAuth(false);
        setErrorMsg('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.');
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setIsCheckingAuth(false);
        setErrorMsg('Authentication service unavailable.');
        return;
      }

      const { data: authData } = await client.auth.getUser();
      if (!authData?.user) {
        router.push('/login?next=' + encodeURIComponent(targetDestination));
        return;
      }

      const user = authData.user;
      setUserPhone(user.phone || '');
      setUserEmail(user.email || '');
      setPhone(user.phone?.replace('+91', '') || '');
      setEmail(user.email || '');

      // Check if user already belongs to an organization
      const { data: member } = await client
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (member?.organization_id) {
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
      setErrorMsg('Please enter your business or firm name.');
      return;
    }

    setIsLoading(true);

    try {
      await createOrganizationAndOwner({
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        phone: phone ? (phone.startsWith('+91') ? phone : '+91' + phone.replace(/\D/g, '')) : undefined,
        email: email.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
      });

      router.push(targetDestination);
      router.refresh();
    } catch (err: any) {
      console.error('Organization Creation Error:', err);
      setErrorMsg(err?.message || 'Failed to create organization. Please verify database connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying user session & organization state...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white py-12">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Set Up Your Organization
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are authenticated via WhatsApp OTP. Create your trading company account to manage real invoices and receivables.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Basic Info */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
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
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Legal Firm Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahavir Pvt Ltd"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-legal-name-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  GSTIN Number (Optional)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="27AABCM1429B1Z8"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-gstin-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                WhatsApp Phone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-phone-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="finance@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-email-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Address Details */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Billing Address
              </label>
              <input
                type="text"
                placeholder="Plot 42, Laxmi Industrial Estate, New Link Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                id="onboarding-address-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-city-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-state-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="400053"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition"
                  id="onboarding-pincode-input"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full py-3.5 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              id="create-org-btn"
            >
              {isLoading ? (
                <span>Registering Organization in Supabase...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Organization & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500">
          Your account will be designated as Organization Owner with full RLS permissions.
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
