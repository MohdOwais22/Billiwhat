'use client';

import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  ArrowRight,
  CheckCircle2,
  ClockAlert,
  CreditCard,
  FileText,
  IndianRupee,
  MessageSquare,
  Play,
  ShieldCheck,
  TrendingUp,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenApp: () => void;
  onOpenDemoModal: () => void;
  onScrollToWorkflow: () => void;
}

export function HeroSection({
  onOpenApp,
  onOpenDemoModal,
  onScrollToWorkflow,
}: HeroSectionProps) {
  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50">
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & Copy */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-900 text-xs font-bold tracking-wider uppercase shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BILL. COLLECT. RECONCILE.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-sans">
              Your business runs on WhatsApp.{' '}
              <span className="text-emerald-700 block sm:inline">Now your receivables can too.</span>
            </h1>

            {/* Supporting copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {APP_NAME} helps Indian distributors turn WhatsApp orders into invoices, collect payments, follow up on outstanding bills, and keep business records up to date.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={onOpenDemoModal}
                className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                id="hero-start-free-btn"
              >
                <span>Start free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onScrollToWorkflow}
                className="w-full sm:w-auto px-5 py-3.5 text-sm sm:text-base font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                id="hero-how-it-works-btn"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>See how it works</span>
              </button>
            </div>

            {/* Trust Line */}
            <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Built for distributors, wholesalers & credit-based businesses</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span>Electrical, Hardware, FMCG, Building Materials</span>
            </div>
          </div>

          {/* Right Column: High-Fidelity Illustrative Product Dashboard Mockup */}
          <div className="lg:col-span-6 relative">
            {/* Subtle glow backdrop */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/10 via-slate-200/20 to-teal-500/10 rounded-3xl blur-xl -z-10" />

            {/* Product UI Frame */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-900 font-sans">
              {/* Mockup Window Titlebar */}
              <div className="px-4 py-2.5 bg-slate-900 text-slate-300 flex items-center justify-between border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-semibold text-white ml-2">{APP_NAME} Executive Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Engine
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">GSTIN: 27AABCS1429B1Z8</span>
                </div>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Today's Collections
                    </span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                      <span>₹1,42,800</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                      <TrendingUp className="w-3 h-3" /> +14% vs yesterday
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Outstanding Credit
                    </span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      <span>₹18,45,200</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                      Across 28 dealer accounts
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Overdue Amount
                    </span>
                    <div className="text-base sm:text-lg font-bold text-rose-700 mt-1">
                      <span>₹4,12,000</span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">
                      5 accounts past terms
                    </span>
                  </div>
                </div>

                {/* Priority Collection Queue Mockup */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ClockAlert className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">Priority Collection Queue</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      WhatsApp Ready
                    </span>
                  </div>

                  {/* Customer Queue Item 1 */}
                  <div className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">Shree Balaji Electricals</span>
                        <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded">
                          12d overdue
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Balance: <strong className="text-slate-800">₹48,200</strong> • Usually pays in 7 days
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 rounded-md shrink-0 flex items-center gap-1 border border-emerald-200">
                      <MessageSquare className="w-3 h-3" />
                      <span>Send Reminder</span>
                    </span>
                  </div>

                  {/* Customer Queue Item 2 */}
                  <div className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">Mahavir Hardware Traders</span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                          Due today
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Balance: <strong className="text-slate-800">₹18,500</strong> • Promising payment at 4 PM
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-200/80 rounded-md shrink-0 flex items-center gap-1">
                      <span>UPI Link Ready</span>
                    </span>
                  </div>
                </div>

                {/* AI Collection Recommendation Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900">Receivables Intelligence Recommendation: </span>
                    <span className="text-emerald-800 text-[11px]">
                      Send WhatsApp payment reminder to 3 electrical dealers before 11:30 AM dispatch cut-off to clear ₹1,12,000 in working capital.
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer footer */}
              <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
                * Illustrative product interface showcasing core WhatsApp-to-Receivables engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
