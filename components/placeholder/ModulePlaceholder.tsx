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
  }
> = {
  sales: {
    title: 'Sales & Invoicing',
    description: 'B2B GST invoices, delivery challans, and credit memos.',
    icon: ReceiptText,
  },
  purchases: {
    title: 'Purchases & Vendor Bills',
    description: 'Purchase data not available yet in current organization catalog.',
    icon: ShoppingBag,
  },
  customers: {
    title: 'Customers',
    description: 'Customer directory, billing addresses, GSTIN records, and contact details.',
    icon: Users,
  },
  inventory: {
    title: 'Products & Stock',
    description: 'Product catalog, HSN/SAC classification, pricing, and on-hand stock quantities.',
    icon: Package,
  },
  receivables: {
    title: 'Receivables',
    description: 'Track outstanding balances, payment terms, and collection timelines.',
    icon: ClockAlert,
  },
  payments: {
    title: 'Payment Settlements',
    description: 'Payment records, reconciliation, and payment receipts.',
    icon: CreditCard,
  },
  expenses: {
    title: 'Operating Expenses',
    description: 'Expense records and operational cost tracking.',
    icon: TrendingDown,
  },
  reports: {
    title: 'Reports & GST',
    description: 'Financial reports, GST summaries, and customer account statements.',
    icon: BarChart3,
  },
  whatsapp_ai: {
    title: 'WhatsApp Workflows',
    description: 'WhatsApp communication and payment notifications.',
    icon: BotMessageSquare,
  },
  settings: {
    title: 'Settings & Business Profile',
    description: 'Manage business identity, GST profile, team roles, and system preferences.',
    icon: Settings,
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition mb-6 cursor-pointer"
        id="back-to-dashboard-btn"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{config.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{config.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

