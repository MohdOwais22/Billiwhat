import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  AlertTriangle,
  MessageSquareOff,
  Clock,
  PhoneOff,
  Receipt,
  HelpCircle,
} from 'lucide-react';

export function ProblemSection() {
  const painPoints = [
    {
      icon: MessageSquareOff,
      title: 'Scattered WhatsApp Orders',
      description:
        'Orders arrive via voice notes, photo lists, and informal chats across multiple staff phones. Items get missed, quantities get mixed up, and verbal commitments disappear.',
    },
    {
      icon: Clock,
      title: 'Delayed GST Invoicing',
      description:
        'Counter staff is too busy attending walk-in dealers to punch bills into desktop accounting software immediately. Billing gets delayed by days or done in late-night batches.',
    },
    {
      icon: PhoneOff,
      title: 'Exhaustive Payment Chasing',
      description:
        'Sales reps and proprietors spend hours calling dealers every morning asking "Bhaiya, payment kab aayega?". Disputed invoice amounts and lost paper bills cause friction.',
    },
    {
      icon: Receipt,
      title: 'Unreconciled Bank Credits',
      description:
        'UPI transfers and RTGS payments land in bank accounts without clear invoice reference numbers. Matching bank SMS logs to customer ledger entries takes endless hours.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 relative border-b border-slate-200/80" id="problem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>The Ground Reality</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Wholesale trade moved to WhatsApp. Your tools didn't.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Indian distributors and traders face constant friction between taking rapid orders on messaging apps and managing credit ledgers on traditional software.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {painPoints.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs hover:shadow-xs transition space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
