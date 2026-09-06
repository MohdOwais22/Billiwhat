import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  MessageSquareText,
  FileSpreadsheet,
  Boxes,
  LineChart,
  CreditCard,
  BrainCircuit,
  ArrowRight,
  Check,
} from 'lucide-react';

export function ProductFeatureGrid() {
  const features = [
    {
      icon: MessageSquareText,
      tag: 'Input Layer',
      title: 'WhatsApp-first billing',
      description:
        'Text, voice and natural language orders captured directly from chats without manual software entry.',
      bullets: [
        'Voice notes & Hinglish text interpretation',
        'Auto-extracts dealer name, SKUs, and quantities',
        'Instant draft preview before official confirmation',
      ],
      color: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-700 bg-emerald-100/80',
    },
    {
      icon: FileSpreadsheet,
      tag: 'Compliance & Tax',
      title: 'GST & invoicing engine',
      description:
        'Compliant GST & non-GST invoices, HSN/SAC code lookups, auto-calculated taxes, discounts, and credit notes.',
      bullets: [
        'B2B and B2C format compliance with QR codes',
        'Item-wise & trade cash discount support',
        'Credit/debit notes linked directly to parent bills',
      ],
      color: 'from-blue-500/10 to-indigo-500/5',
      iconColor: 'text-blue-700 bg-blue-100/80',
    },
    {
      icon: Boxes,
      tag: 'Operations',
      title: 'Inventory & stock control',
      description:
        'Products, live stock levels, multi-unit pricing, and real-time sales/purchase movement tracking.',
      bullets: [
        'Low-stock threshold alerts before stockouts',
        'Multi-tier wholesale pricing (Boxes, Pieces, Bundles)',
        'Track physical godown dispatches and pending batches',
      ],
      color: 'from-amber-500/10 to-orange-500/5',
      iconColor: 'text-amber-700 bg-amber-100/80',
    },
    {
      icon: LineChart,
      tag: 'Core Value',
      title: 'Receivables intelligence',
      description:
        'Know exactly what is due, what is overdue, and which customer requires urgent collection focus today.',
      bullets: [
        'Live aging buckets (0–15, 16–30, 31–45, 45+ days)',
        'Customer payment velocity and reliability scoring',
        'Priority collection queue arranged by recovery risk',
      ],
      color: 'from-rose-500/10 to-pink-500/5',
      iconColor: 'text-rose-700 bg-rose-100/80',
    },
    {
      icon: CreditCard,
      tag: 'Cash Flow',
      title: 'Payments & collection links',
      description:
        'Flexible payment options, instant dynamic UPI QR generation, payment logging, and live invoice settlement.',
      bullets: [
        'Direct UPI & NEFT payment links on WhatsApp',
        'Partial payment tracking with balance carried over',
        'Instant receipt generation sent back to dealer',
      ],
      color: 'from-teal-500/10 to-emerald-500/5',
      iconColor: 'text-teal-700 bg-teal-100/80',
    },
    {
      icon: BrainCircuit,
      tag: 'Moat',
      title: 'Connected business memory',
      description:
        'Customer history, negotiated rates, payment behavior, and previous orders stay permanently connected.',
      bullets: [
        'Remembers customer-specific credit terms (e.g. 21 days)',
        'Flags overdue balances before taking new orders',
        'Zero knowledge lost when counter staff or sales reps change',
      ],
      color: 'from-purple-500/10 to-indigo-500/5',
      iconColor: 'text-purple-700 bg-purple-100/80',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white relative border-b border-slate-200/80" id="product">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <span>Platform Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            More than billing software.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Most software stops once the PDF is printed. {APP_NAME} manages the entire credit cycle — from WhatsApp order intake to cash in the bank.
          </p>
        </div>

        {/* 6 Feature Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feat.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                      {feat.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {feat.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
