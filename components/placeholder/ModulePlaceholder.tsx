'use client';

import React from 'react';
import { NavRoute } from '@/components/layout/Sidebar';
import {
  ReceiptText,
  ShoppingBag,
  Users,
  Package,
  ClockAlert,
  CreditCard,
  TrendingDown,
  BarChart3,
  BotMessageSquare,
  Settings,
  ArrowLeft,
} from 'lucide-react';

interface ModulePlaceholderProps {
  route: NavRoute;
  onBackToDashboard: () => void;
}

const MODULE_CONFIG: Record<
  Exclude<NavRoute, 'dashboard'>,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    features: string[];
  }
> = {
  sales: {
    title: 'Sales & Invoicing',
    description: 'B2B GST invoices, E-way bill generation, delivery challans, and credit memos.',
    icon: ReceiptText,
    features: ['E-Way Bill 2.0 Integration', 'Multiple GST Rate Invoices', 'Custom Print Templates (A4 & Thermal)'],
  },
  purchases: {
    title: 'Purchases & Vendor Bills',
    description: 'Record vendor purchase bills, track input tax credit (ITC), and manage supplier ledgers.',
    icon: ShoppingBag,
    features: ['GSTR-2B Auto-matching', 'Vendor Ledger Reconciliation', 'Purchase Order Workflow'],
  },
  customers: {
    title: 'Customers & Credit Parties',
    description: 'Wholesale buyers directory, credit limits, payment terms, and WhatsApp message logs.',
    icon: Users,
    features: ['Credit Limit Hard Stops', 'Multi-contact Ledger Sharing', 'Customer Aging Analysis'],
  },
  inventory: {
    title: 'Inventory & Stock Management',
    description: 'Real-time SKU quantities, batch tracking, low-stock reorder thresholds, and HSN catalog.',
    icon: Package,
    features: ['Barcode / QR Scanner Support', 'Batch & Expiry Date Alerts', 'Warehouse Multi-location Transfers'],
  },
  receivables: {
    title: 'Receivables & Ageing Analysis',
    description: 'Follow-up tracking, overdue brackets (0-30, 31-60, 60+ days), and collection pipelines.',
    icon: ClockAlert,
    features: ['Aging Debt Buckets', 'Automated Dispute Tracking', 'Staff Collection Assignment'],
  },
  payments: {
    title: 'Payment Settlements & Ledger',
    description: 'Bank reconciliation, UPI Dynamic QR payments, cheque deposits, and cash register.',
    icon: CreditCard,
    features: ['Instant UPI Intent Links', 'Bank Statement OCR Parser', 'Cheque Clearing Logs'],
  },
  expenses: {
    title: 'Operating Expenses & Overhead',
    description: 'Track rent, freight & transport charges, salaries, and operational costs.',
    icon: TrendingDown,
    features: ['Category-wise Expense Ledgers', 'GST Input Credit Tracking', 'Cash Drawer Balancing'],
  },
  reports: {
    title: 'Financial Reports & GST Filing',
    description: 'GSTR-1, GSTR-3B JSON exports, Profit & Loss statements, and Party Statement of Accounts.',
    icon: BarChart3,
    features: ['GSTR-1 Ready JSON & Excel', 'Party Account Statements with UPI QR', 'Salesman Performance Matrix'],
  },
  whatsapp_ai: {
    title: 'WhatsApp AI Workflows',
    description: 'Conversational ledger balance, auto-payment reminders, and WhatsApp billing.',
    icon: BotMessageSquare,
    features: ['Customer Balance Inquiries', 'Daily Collection Queue', 'Payment Receipt Confirmations'],
  },
  settings: {
    title: 'Settings & Business Profile',
    description: 'Manage business identity, GST profile, team roles, and system preferences.',
    icon: Settings,
    features: ['Business Details & Addresses', 'GSTIN & Tax Profiles', 'Team Role Permissions'],
  },
};

export function ModulePlaceholder({ route, onBackToDashboard }: ModulePlaceholderProps) {
  if (route === 'dashboard') return null;

  const config = MODULE_CONFIG[route];
  const Icon = config.icon;

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto" id={`module-placeholder-${route}`}>
      <button
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition mb-6"
        id="back-to-dashboard-btn"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{config.title}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Available Operations:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {config.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
