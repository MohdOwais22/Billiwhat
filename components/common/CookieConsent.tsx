'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already selected their cookie consent choice
    const choice = localStorage.getItem('whatsbill-cookie-consent-choice');
    if (!choice) {
      // Delay visibility slightly for clean entry transition
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Persist accepted choice in browser local storage
    localStorage.setItem('whatsbill-cookie-consent-choice', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Persist declined choice in browser local storage
    localStorage.setItem('whatsbill-cookie-consent-choice', 'declined');
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
              Privacy & Cookie Preference
            </h3>
          </div>
          <button
            onClick={handleDecline}
            aria-label="Dismiss privacy notice"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            id="cookie-consent-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Description */}
        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed" id="cookie-consent-desc">
            WhatsBill uses essential session cookies required for authentication and maintaining your signed-in state. These essential cookies cannot be disabled because they are required for the service to work.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            We currently do not use non-essential analytics or advertising cookies. If optional technologies are introduced in the future, your preference will be respected.
          </p>
          <p className="text-[11px] text-slate-400 leading-normal">
            WhatsBill may also use browser local storage for essential preferences and acknowledgement settings. See our{' '}
            <a href="/cookies" className="underline text-emerald-400 hover:text-emerald-300 font-semibold transition">
              Cookie Policy
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline text-emerald-400 hover:text-emerald-300 font-semibold transition">
              Privacy Policy
            </a>{' '}
            for details.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1 text-xs">
          <button
            onClick={handleDecline}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer text-center"
            id="cookie-consent-decline-btn"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition shadow-md flex items-center justify-center gap-1 cursor-pointer text-center"
            id="cookie-consent-accept-btn"
          >
            <span>Accept</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
