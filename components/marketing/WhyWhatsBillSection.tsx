import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  MessageSquareCode,
  Coins,
  BrainCircuit,
  Binary,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function WhyWhatsBillSection() {
  const pillars = [
    {
      icon: MessageSquareCode,
      tag: 'No Form Fatigue',
      title: 'Conversation-First',
      headline: 'Work through WhatsApp instead of forcing every action into forms.',
      description:
        `Your staff and dealers don’t need to learn a 50-field desktop software interface. They already know WhatsApp. By accepting voice notes, informal Hindi/English messages, and photos, ${APP_NAME} fits effortlessly into your existing business habits.`,
      accent: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
    },
    {
      icon: Coins,
      tag: 'Cash Flow Protection',
      title: 'Collections-First',
      headline: 'The product focuses on getting money collected, not just generating invoices.',
      description:
        `Standard billing tools consider their job complete when the bill is printed. ${APP_NAME} treats invoice generation as merely step one. The real value is proactive aging analysis, prioritized payment reminders, and tracking every rupee of credit until it hits your bank.`,
      accent: 'border-teal-200 bg-teal-50/40 text-teal-900',
    },
    {
      icon: BrainCircuit,
      tag: 'Long-term Moat',
      title: 'Connected Business Memory',
      headline: 'Customer, product, invoice and payment context stays connected.',
      description:
        `When a customer asks for a discount, ${APP_NAME} knows their payment track record. When counter staff changes, historical customer rates and terms remain intact. Nothing gets lost in individual staff phone galleries.`,
      accent: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white relative border-b border-slate-200/80" id="why-whatsbill">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <span>Core Philosophy</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Software that fits the way Indian businesses already work.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            We didn’t build another Silicon Valley clone. We built for the proprietor sitting at the counter balancing dealer credit, supplier dispatches, and WhatsApp audio notes.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                      {p.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs font-bold text-emerald-800 mt-1">
                      {p.headline}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architectural Callout: AI vs Deterministic Logic */}
        <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Binary className="w-4 h-4" />
                <span>Deterministic Engine Principle</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white">
                “AI handles understanding. Deterministic systems handle business logic.”
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                We never let a generative AI model invent invoice totals, tax rates, or stock counts. AI is strictly deployed to interpret natural merchant speech into structured parameters. All financial math is computed with 100% deterministic precision.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 space-y-2 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Math Hallucinations</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>GST Rulebook Verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Double-Entry Balanced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
