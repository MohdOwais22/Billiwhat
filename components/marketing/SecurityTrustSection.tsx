import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Database,
  History,
  CreditCard,
  Server,
  KeyRound,
} from 'lucide-react';

export function SecurityTrustSection() {
  const securityPillars = [
    {
      icon: Lock,
      title: 'Organization-Level Data Isolation',
      desc: 'Each distributor organization operates in a strictly isolated tenant space. Your product margins, dealer credit lines, and customer contacts cannot be accessed or viewed by any other business.',
    },
    {
      icon: UserCheck,
      title: 'Role-Based Team Access (RBAC)',
      desc: 'Assign granular staff permissions. Counter clerks can generate draft invoices; delivery boys can log cash receipts; while bank account balances and profit reports remain visible solely to the proprietor.',
    },
    {
      icon: Database,
      title: 'Database-Level Access Controls',
      desc: 'Security rules are enforced directly at the relational database level (PostgreSQL). Every single query is verified against user session tokens before reading or modifying financial ledger entries.',
    },
    {
      icon: History,
      title: 'Comprehensive Financial Auditability',
      desc: 'Every invoice creation, discount modification, payment recording, and reminder dispatched is logged with user timestamp and IP address to prevent internal employee billing fraud.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payment Architecture',
      desc: `Payments route through encrypted UPI rails and RBI-compliant banking gateways. ${APP_NAME} does not hold customer bank passwords or store raw payment credentials.`,
    },
    {
      icon: Server,
      title: 'Production-Grade Infrastructure',
      desc: 'Hosted in dedicated Indian cloud data center regions with SSL/TLS 1.3 encryption in transit, AES-256 encryption at rest, and automated daily off-site database backups.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white relative border-b border-slate-200/80" id="security">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enterprise Security & Data Isolation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Protecting your company’s most sensitive financial records.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Your dealer pricing, ledger balances, and payment habits are your competitive edge. {APP_NAME} protects them with rigorous architectural controls.
          </p>
        </div>

        {/* 6 Security Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {securityPillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible Trust Statement */}
        <div className="mt-12 p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-center max-w-2xl mx-auto text-xs text-slate-600">
          <p>
            {APP_NAME} enforces bank-grade cryptographic standards, relational tenant separation, and daily backup snapshots to protect your daily trade operations.
          </p>
        </div>
      </div>
    </section>
  );
}
