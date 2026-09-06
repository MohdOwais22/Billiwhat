import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  Store,
  MessageSquare,
  TrendingUp,
  Workflow,
  CheckCircle2,
  Users2,
  HeartHandshake,
} from 'lucide-react';

export function AboutSection() {
  const realityChannels = [
    { label: 'WhatsApp', desc: 'Voice notes, lists, rate negotiations' },
    { label: 'Phone Calls', desc: 'Urgent stock inquiries & dispatch status' },
    { label: 'Accounting Software', desc: 'Tally / desktop systems for tax filing' },
    { label: 'Spreadsheets', desc: 'Credit balances & salesman route notes' },
    { label: 'Bank Payments', desc: 'UPI transfers, RTGS slips & cash counter' },
    { label: 'Customers & Suppliers', desc: 'Relationships built on decades of trust' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 relative border-b border-slate-200/80" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Eyebrow & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span>Our Origin & Purpose</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Built around the reality of Indian trade.
            </h2>
          </div>

          {/* Core Story Content */}
          <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8">
            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
              <p>
                Indian wholesale businesses don’t operate inside one neat, closed software box. They operate in the real world — where counter staff is attending three walk-in dealers, a delivery tempo is waiting outside, and five urgent orders arrive simultaneously as WhatsApp audio notes.
              </p>

              <p>
                For years, software vendors tried to force Indian merchants to sit behind complex desktop forms and type every single invoice line manually. But trade moved to WhatsApp because WhatsApp is fast, personal, and universally understood.
              </p>

              <p className="font-semibold text-slate-900">
                Yet working purely on WhatsApp created a second crisis: unrecorded orders, scattered payment promises, forgotten receivables, and endless awkward phone calls chasing money.
              </p>
            </div>

            {/* Visual Reality Matrix */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                The multi-channel reality of every distributor:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {realityChannels.map((c) => (
                  <div
                    key={c.label}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                  >
                    <span className="font-bold text-xs text-slate-900 block">{c.label}</span>
                    <span className="text-[11px] text-slate-500 block leading-tight">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* The {APP_NAME} Mission */}
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Workflow className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">
                  Our Mission: Connect that reality into one quiet operating workflow.
                </h4>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  {APP_NAME} doesn’t ask you to change how your dealers order or abandon your accountant. We simply ensure that every message, order, and rupee of credit is recognized, tracked, and safely collected without friction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
