'use client';

import React from 'react';
import { SubscriptionInfo } from '@/types/database';
import { CreditCard, Check, Zap, Sparkles } from 'lucide-react';

interface SubscriptionSectionProps {
  subscription: SubscriptionInfo;
}

export function SubscriptionSection({ subscription }: SubscriptionSectionProps) {
  const invoicePercent = Math.min(
    100,
    Math.round((subscription.current_invoice_count / (subscription.max_invoices_per_month || 1)) * 100)
  );

  const memberPercent = Math.min(
    100,
    Math.round((subscription.current_member_count / (subscription.max_team_members || 1)) * 100)
  );

  return (
    <div className="space-y-6" id="settings-subscription-card">
      {/* Current Plan Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription & Plan Limits</h2>
              <p className="text-xs text-slate-500">Active merchant license, feature inclusions, and monthly usage metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Plan Active
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Merchant License
                </span>
                <span className="text-xs text-slate-300">Annual Billing</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
                {subscription.plan_name}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Full access to Indian GST statutory invoicing, automated WhatsApp collection queue, GSTR-1/3B exports, and team RBAC.
              </p>
            </div>

            <div className="shrink-0 text-left md:text-right">
              <div className="text-2xl font-black text-emerald-400">
                ₹1,499<span className="text-xs font-normal text-slate-300"> / month</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Billed annually • Next renewal in 2027</p>
            </div>
          </div>

          {/* Usage Gauges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Resource Quotas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Monthly Invoices Issued</span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.current_invoice_count} / {subscription.max_invoices_per_month.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, invoicePercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {subscription.max_invoices_per_month - subscription.current_invoice_count} invoices remaining in current cycle
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Active Team Seats</span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.current_member_count} / {subscription.max_team_members}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, memberPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {subscription.max_team_members - subscription.current_member_count} available seats for staff or accountants
                </p>
              </div>
            </div>
          </div>

          {/* Included Features Checklist */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Included Tier Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                'GST & E-Way Bill Compliant Tax Invoicing',
                'Dynamic UPI QR Codes on Printed Invoices',
                '1-Tap Direct WhatsApp Payment Reminders',
                'GSTR-1 & GSTR-3B JSON / Excel Filing Formats',
                'Multi-User Access with Role-Based Access Control',
                'Real-Time Customer Aging & Receivables Queue',
                'Item Batch, HSN Code, and Stock Tracking',
                'Bank Reconciliation & Ledger Statements',
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-slate-700 flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="font-medium text-[11px]">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
