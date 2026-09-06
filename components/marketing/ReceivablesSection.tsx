import React, { useState } from 'react';
import { APP_NAME } from '@/config/brand';
import {
  ClockAlert,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';

interface ReceivableRow {
  customer: string;
  category: string;
  outstanding: string;
  overdueDays: number;
  statusBadge: string;
  statusColor: string;
  behavior: string;
  lastPayment: string;
  recommendedAction: string;
  actionType: 'reminder' | 'due' | 'escalate' | 'healthy';
  previewMessage: string;
}

export function ReceivablesSection() {
  const [selectedCustomer, setSelectedCustomer] = useState<ReceivableRow | null>(null);

  const receivablesData: ReceivableRow[] = [
    {
      customer: 'Shree Balaji Electricals',
      category: 'Electrical Dealer (Pune)',
      outstanding: '₹48,200',
      overdueDays: 12,
      statusBadge: '12 days overdue',
      statusColor: 'bg-rose-50 text-rose-800 border-rose-200',
      behavior: 'Usually pays within 7 days; mild delay',
      lastPayment: '₹25,000 on 18 Aug',
      recommendedAction: 'Send WhatsApp reminder',
      actionType: 'reminder',
      previewMessage:
        'Namaste Shree Balaji Electricals! Reminder for bill INV-1042 (₹48,200) due on 24 Aug. Click here to view GST bill PDF or pay via instant UPI: https://wb.link/p/1042',
    },
    {
      customer: 'Mahavir Hardware Traders',
      category: 'Hardware Wholesaler (Nagpur)',
      outstanding: '₹18,500',
      overdueDays: 0,
      statusBadge: 'Due today',
      statusColor: 'bg-amber-50 text-amber-800 border-amber-200',
      behavior: 'Usually pays same day on reminder',
      lastPayment: '₹40,000 on 10 Aug',
      recommendedAction: 'Payment reminder',
      actionType: 'due',
      previewMessage:
        'Namaste Mahavir Traders! Invoice INV-1065 of ₹18,500 is due today. Please tap to clear or share UTR details: https://wb.link/p/1065. Thank you!',
    },
    {
      customer: 'Royal Industrial Supplies',
      category: 'Industrial Valves (Ahmedabad)',
      outstanding: '₹1,85,000',
      overdueDays: 28,
      statusBadge: '28 days overdue',
      statusColor: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
      behavior: 'Delayed payment; stop fresh credit',
      lastPayment: '₹50,000 on 22 Jul',
      recommendedAction: 'Hold dispatch & call proprietor',
      actionType: 'escalate',
      previewMessage:
        `Attention: Royal Industrial balance has exceeded ₹1.85L and 28 days credit terms. ${APP_NAME} recommends holding new dispatches until partial payment is logged.`,
    },
    {
      customer: 'Kothari Sanitary & Pipes',
      category: 'CPVC & Hardware (Surat)',
      outstanding: '₹32,400',
      overdueDays: -5,
      statusBadge: 'Due in 5 days',
      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      behavior: 'Prompt payer (avg 12 days)',
      lastPayment: '₹32,400 on 02 Aug',
      recommendedAction: 'Ready for next order',
      actionType: 'healthy',
      previewMessage:
        'Account in good standing. Credit limit available: ₹2,00,000. Ready to accept new WhatsApp order.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 relative border-b border-slate-200/80" id="receivables">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span>Receivables Intelligence</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Stop chasing payments blindly.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {APP_NAME} helps prioritize collections instead of making your team chase every customer manually. Know who usually pays on time, who is overdue, and exactly what action to take.
          </p>
        </div>

        {/* Sophisticated Receivables Dashboard Component */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Dashboard Table Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ₹
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dealer Receivables & Aging Matrix</h3>
                <p className="text-[11px] text-slate-400">Prioritized by payment risk & outstanding balance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                Sorted: Priority Collection Queue
              </span>
            </div>
          </div>

          {/* Desktop & Tablet Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status / Aging</th>
                  <th className="py-3 px-4">Payment Behavior</th>
                  <th className="py-3 px-4">Last Payment</th>
                  <th className="py-3 px-4 text-right">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivablesData.map((row) => (
                  <tr
                    key={row.customer}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setSelectedCustomer(row)}
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{row.customer}</div>
                      <div className="text-[11px] text-slate-500">{row.category}</div>
                    </td>

                    {/* Outstanding */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {row.outstanding}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.statusColor}`}
                      >
                        {row.statusBadge}
                      </span>
                    </td>

                    {/* Behavior */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="max-w-[200px] leading-tight text-[11px]">{row.behavior}</div>
                    </td>

                    {/* Last Payment */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {row.lastPayment}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(row);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                          row.actionType === 'reminder' || row.actionType === 'due'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : row.actionType === 'escalate'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {row.actionType === 'reminder' && <MessageSquare className="w-3.5 h-3.5" />}
                        {row.actionType === 'escalate' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {row.actionType === 'healthy' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{row.recommendedAction}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom explanatory bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Behavioral Prioritization:</strong> WhatsApp reminders are automatically suggested based on historic payment trends, not rigid calendar days.
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              * Click any row to preview WhatsApp reminder template
            </span>
          </div>
        </div>

        {/* Interactive Reminder Modal / Preview Box */}
        {selectedCustomer && (
          <div className="mt-6 p-5 rounded-2xl bg-white border border-emerald-300 shadow-md animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">
                  Pre-configured WhatsApp Reminder for {selectedCustomer.customer}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded bg-slate-100"
              >
                Close Preview
              </button>
            </div>

            <div className="mt-3 bg-[#DCF8C6]/50 border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-2">
              <p className="font-sans leading-relaxed">
                {selectedCustomer.previewMessage}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-[10px] text-slate-500">
                <span>Includes auto-generated UPI QR code + GST Invoice link</span>
                <span className="text-emerald-800 font-bold">1-Click Dispatch from {APP_NAME}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
