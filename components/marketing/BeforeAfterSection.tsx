import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  XCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';

export function BeforeAfterSection() {
  const comparisonItems = [
    {
      label: 'Order Intake',
      before: 'Orders dictated over phone or scattered across 15 unorganized WhatsApp chats; items forgotten.',
      after: 'Voice and text orders automatically parsed into verified draft invoices with pricing and stock check.',
    },
    {
      label: 'Invoicing & Tax',
      before: 'Counter clerk manually punches entries into desktop software at the end of the day or week.',
      after: 'Instant GST invoice PDF generated with proper HSN codes in 10 seconds and sent back on WhatsApp.',
    },
    {
      label: 'Payment Collection',
      before: 'Staff makes 40 awkward phone calls every morning; customers dispute whether bills are due.',
      after: 'Automated, polite WhatsApp payment reminders with dynamic UPI QR sent based on client payment habits.',
    },
    {
      label: 'Owner Visibility',
      before: 'Proprietor has to ask the accountant “Kitna baaki hai market mein?” and wait 2 days for an Excel sheet.',
      after: 'Live 24/7 executive receivables dashboard on the owner’s mobile phone with exact aging buckets.',
    },
    {
      label: 'Payment Tracking',
      before: 'Payment screenshots dumped in WhatsApp gallery; unmatched bank SMS credits at month-end.',
      after: 'Immediate reconciliation: UPI credits auto-matched to specific bills, and partial balances updated.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 relative border-b border-slate-200/80" id="comparison">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <span>The Transformation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            From scattered follow-ups to one connected workflow.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            See how {APP_NAME} eliminates the gap between taking an order on WhatsApp and seeing payment land in your bank account.
          </p>
        </div>

        {/* Comparison Architecture Cards */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Before Column */}
          <div className="bg-white rounded-2xl border border-rose-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">The Traditional Way</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">Scattered Chaos</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900 font-mono text-center">
              WhatsApp chats + Excel sheets + Manual bills + Phone calls + Bank SMS
            </div>

            <div className="space-y-4">
              {comparisonItems.map((item) => (
                <div key={item.label} className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 block">{item.label}</span>
                  <div className="flex items-start gap-2 text-slate-600">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{item.before}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* After Column */}
          <div className="bg-white rounded-2xl border border-emerald-300 p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">With {APP_NAME}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">One Connected Loop</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-mono text-center">
              Order → Invoice → Payment → Receivable → Reminder → Reconciled
            </div>

            <div className="space-y-4">
              {comparisonItems.map((item) => (
                <div key={item.label} className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 block">{item.label}</span>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{item.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
