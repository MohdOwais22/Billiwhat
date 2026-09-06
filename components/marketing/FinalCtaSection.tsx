'use client';

import React from 'react';
import { ArrowRight, MessageSquare, PhoneCall, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FinalCtaSectionProps {
  onStartFree: () => void;
  onTalkToUs: () => void;
  onOpenApp: () => void;
}

export function FinalCtaSection({ onStartFree, onTalkToUs, onOpenApp }: FinalCtaSectionProps) {
  return (
    <section className="py-20 sm:py-28 bg-slate-900 text-white relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Start in 5 Minutes</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Spend less time chasing bills.{' '}
          <span className="text-emerald-400 block sm:inline">Spend more time growing the business.</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Bring billing, payments and receivables together—starting with the WhatsApp workflow your team already uses.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm sm:text-base transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer group"
            id="final-cta-start-free-btn"
          >
            <span>Start free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onTalkToUs}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm sm:text-base border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            id="final-cta-talk-to-us-btn"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Talk to us</span>
          </button>

          <button
            onClick={onOpenApp}
            className="w-full sm:w-auto px-5 py-4 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5"
            id="final-cta-open-dashboard-btn"
          >
            <span>Open Live Dashboard</span>
          </button>
        </div>

        {/* Trust Points */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>14-Day Free Evaluation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Keep Using WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  );
}
