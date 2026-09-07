'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the privacy notice
    // Stored in browser localStorage (local browser storage, not a cookie)
    const acknowledged = localStorage.getItem('whatsbill-privacy-acknowledged');
    if (!acknowledged) {
      // Delay visibility slightly for clean entry transition
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcknowledge = () => {
    // Persist user acknowledgement indicator in browser storage
    localStorage.setItem('whatsbill-privacy-acknowledged', 'acknowledged');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-2 duration-300 font-sans"
      id="cookie-consent-banner"
    >
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-2xl p-5 md:p-6 space-y-4">
        {/* Banner Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100" id="cookie-consent-title">
              Privacy & Session Notice
            </h3>
          </div>
          <button
            onClick={handleAcknowledge}
            aria-label="Dismiss privacy notice"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            id="cookie-consent-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Description */}
        <div className="space-y-2">
          <p className="text-xs text-slate-300 leading-relaxed" id="cookie-consent-desc">
            {APP_NAME} utilizes strictly essential first-party session cookies (set by Supabase) to authorize database queries and maintain login status. <strong>No non-essential tracking, marketing pixels, or analytical cookies are active.</strong>
          </p>
          <p className="text-[11px] text-slate-400 leading-normal">
            We use browser local storage (localStorage) only to retain essential workspace configurations and preference indicators. Review our{' '}
            <a href="/cookies" className="underline text-emerald-400 hover:text-emerald-300 font-semibold transition">
              Cookie Policy
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline text-emerald-400 hover:text-emerald-300 font-semibold transition">
              Privacy Policy
            </a>{' '}
            for complete, audited details.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end pt-1 text-xs">
          <button
            onClick={handleAcknowledge}
            className="px-4 py-2 rounded-lg font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition shadow-md flex items-center gap-1 cursor-pointer"
            id="cookie-consent-acknowledge-btn"
          >
            <span>Got It, Thanks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
