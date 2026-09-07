import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  MessageSquare,
  Cpu,
  CheckCircle2,
  FileCheck2,
  Send,
  LineChart,
  BellRing,
  RefreshCw,
  ShieldAlert,
  Calculator,
  ArrowRight,
} from 'lucide-react';

interface BigIdeaSectionProps {
  onTryLive: () => void;
}

export function BigIdeaSection({ onTryLive }: BigIdeaSectionProps) {
  const workflowSteps = [
    {
      step: '01',
      title: 'WhatsApp Order',
      desc: 'Voice or text message from customer or sales rep in normal language',
      icon: MessageSquare,
      badge: 'Input',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      step: '02',
      title: 'AI Understands',
      desc: 'Extracts buyer name, product, quantity, rates, and dispatch notes',
      icon: Cpu,
      badge: 'AI Layer',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    {
      step: '03',
      title: 'Validate',
      desc: 'Verifies customer credit limits, inventory stock, and negotiated pricing',
      icon: CheckCircle2,
      badge: 'Rules',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      step: '04',
      title: 'Create Invoice',
      desc: 'Deterministic engine applies exact HSN, CGST/SGST/IGST, and discounts',
      icon: FileCheck2,
      badge: 'Tax Engine',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      step: '05',
      title: 'Collect Payment',
      desc: 'Instant PDF bill + dynamic UPI QR & bank details sent back to WhatsApp',
      icon: Send,
      badge: 'Checkout',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      step: '06',
      title: 'Track Receivable',
      desc: 'Automatically logs into 0-30, 31-45, 45+ day aging ledger',
      icon: LineChart,
      badge: 'Ledger',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      step: '07',
      title: 'Smart Reminder',
      desc: 'Polite WhatsApp payment reminders calibrated to customer payment habit',
      icon: BellRing,
      badge: 'Follow-up',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      step: '08',
      title: 'Reconcile',
      desc: 'Payment cleared, ledger updated, owner and accountant notified',
      icon: RefreshCw,
      badge: 'Closed Loop',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 relative border-b border-slate-200/80" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <span>The Big Idea</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            One conversation. One connected workflow.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Billing is just the wedge. Collections are the value. Receivables data is your long-term moat. {APP_NAME} brings all of it into one unified loop.
          </p>
        </div>

        {/* The Core Architectural Distinction: AI vs Deterministic Engine */}
        <div className="mt-12 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">AI understands intent</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Handles conversational voice notes, typing typos, mixed Hinglish/regional dialects, and noisy WhatsApp messages from dealers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Business rules handle the numbers</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                GST rates, HSN codes, discounts, round-offs, credit terms, and ledger balancing are computed strictly by deterministic financial algorithms — never hallucinations.
              </p>
            </div>
          </div>
        </div>

        {/* 8-Step Visual Horizontal Pipeline */}
        <div className="mt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group relative"
                >
                  {/* Top: step count and badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Step {step.step}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${step.badgeColor}`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon & Details */}
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 transition-colors flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 pt-1 group-hover:text-emerald-700 transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Flow Arrow for desktop */}
                  {idx < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-slate-200/70 border border-white text-slate-500 flex items-center justify-center shadow-2xs">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contextual CTA for Live Demo */}
        <div className="mt-14 pt-8 border-t border-slate-200/60 text-center max-w-xl mx-auto space-y-4">
          <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
            Want to see it in action?
          </p>
          <button
            onClick={onTryLive}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-sm font-semibold text-slate-800 hover:text-emerald-800 rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap group"
            id="how-it-works-try-live-btn"
          >
            <span>Try WhatsBill Live</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </section>
  );
}
