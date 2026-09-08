'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Eye } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-slate-950 flex items-center justify-center font-extrabold text-[10px]">
              WB
            </span>
            <span>{APP_NAME} Privacy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <Eye className="w-4 h-4" />
              <span>Trust & Privacy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Effective Date: September 7, 2026 | Last Updated: September 7, 2026
            </p>
          </div>

          {/* Section: Introduction */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              1. Our Privacy Commitment
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              At <strong>{APP_NAME}</strong> ("we," "us," or "our"), we respect your digital privacy. We understand that your customer database, product catalog, and ledger histories constitute proprietary business intelligence. We are committed to maintaining a secure, isolated, and highly transparent software service for merchants.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              This Privacy Policy details the precise categories of data we process, the storage technologies we use, and our isolated data structure.
            </p>
          </section>

          {/* Section: What We Collect */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Information Processed by the Application
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We process only the business records and session markers explicitly provided to the service or configured by the merchant. The categories of data supported by our actual application structure include:
            </p>
            <div className="space-y-3 pl-3 border-l-2 border-slate-100 text-sm text-slate-600">
              <p>
                <strong>Authentication & Profile:</strong> Standard phone numbers (verified via OTP) and demo user logins used to authorize database sessions, along with user display names.
              </p>
              <p>
                <strong>Organization & GST Information:</strong> Business/trading names, legal entity names, state, city, pincode, country, and GSTIN profiles associated with the merchant workspace.
              </p>
              <p>
                <strong>Client & Customer Information:</strong> Customer directories entered by the merchant, including client names, trade titles, billing addresses, credit limits, credit terms (credit days), and phone contacts.
              </p>
              <p>
                <strong>Product Catalog:</strong> Stock items, SKUs, selling prices, unit titles, available quantities, GST tax rates, and associated HSN/SAC codes.
              </p>
              <p>
                <strong>Invoices & Ledger Transactions:</strong> Invoices generated (amounts, totals, issue dates, due dates), individual invoice lines, manual payment receipts (UPI/cash amounts, dates, and reference numbers), outstanding receivables, and communication reminders.
              </p>
              <p>
                <strong>Message Logs & Extracted Intent:</strong> Conversation metadata for inbound and outbound command tracking (timestamps, direction, message text, and mapped structured JSON intents).
              </p>
              <p>
                <strong>Technical Error Logs:</strong> Debugging metrics and crash reports compiled server-side.
              </p>
            </div>
          </section>

          {/* Section: Third-Party Service Providers */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              3. Processing by Third-Party Service Providers
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Third-party service providers may process information on our behalf to provide infrastructure, authentication, AI processing, messaging, or error monitoring. These include:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
              <li><strong>Cloud Infrastructure & Database Services:</strong> Provides secure cloud hosting, authentication, and user sessions. All records are isolated per merchant workspace using strict database Row-Level Security (RLS).</li>
              <li><strong>AI Language Models:</strong> WhatsBill may use third-party AI services to interpret conversational requests and convert them into structured information needed to provide certain features. Credentials, database records, and system secrets are not sent to these AI services.</li>
              <li><strong>Messaging Providers:</strong> Integrates conversational triggers via messaging APIs (such as the WhatsApp Business API) when configured with merchant credentials.</li>
              <li><strong>Error Monitoring Services:</strong> Analyzes errors and application crashes to improve reliability. These services are configured to redact browser cookies, authorization headers, and sensitive personal information automatically before logging.</li>
            </ul>
          </section>

          {/* Section: Data Isolation & Row-Level Security */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              4. Security & Isolation Controls
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              WhatsBill uses organizational access controls and database-level security measures designed to keep each merchant's business records isolated from other merchants:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
              <li><strong>Database Row-Level Security (RLS):</strong> Every database table is protected by active Row-Level Security policies. This ensures that users authenticated to Organization A are technically blocked from querying, modifying, inserting, or deleting records belonging to Organization B.</li>
              <li><strong>Session Safety:</strong> Browser-side session tokens are held in secure cookies, and API routes are routed through server-side authorization filters.</li>
            </ul>
          </section>

          {/* Section: Cookies vs. Local Storage */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              5. Truthful Cookie & Browser Storage Audit
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We clearly distinguish between HTTP cookies and local browser storage (localStorage). We load only strictly essential first-party items:
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-3">
              <p>
                <strong>A. HTTP Cookies:</strong> The only cookies set are strictly essential first-party session management markers (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">sb-access-token / sb-refresh-token</code>) and are required to authorize database queries.
              </p>
              <p>
                <strong>B. Browser Local Storage (localStorage):</strong> This is local browser storage and is not a cookie. It stores:
              </p>
              <ul className="list-disc list-inside pl-3 space-y-1">
                <li><code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">whatsbill-cookie-consent-choice</code>: Saves your explicit cookie and privacy preferences (holds the value &quot;accepted&quot; or &quot;declined&quot;) to manage preference states and hide the consent banner.</li>
              </ul>
              <p>
                <strong>C. No Non-Essential Tracking:</strong> This application does not use, load, or integrate any non-essential analytics tracking, marketing cookies, custom behavioral tracking scripts, or advertising pixels (such as Google Analytics or Meta Pixel).
              </p>
            </div>
          </section>

          {/* Section: Data Retention */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              6. Data Retention & Deletion Process
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>Data Retention:</strong> Because wholesalers, distributors, and traders require historical invoice and payment ledger data for accounting and business audits, {APP_NAME} does not enforce automated deletion timelines or automatically clear data after a set period. Your records remain stored securely in your isolated sandbox workspace.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>Manual Deletion:</strong> There is currently no self-serve account deletion feature in the dashboard. Workspace deletion and manual data clearing are conducted through manual support processes. To request manual removal of your records, contact support using the feedback channels inside your settings. We do not promise immediate or automated deletion guarantees outside of standard manual review.
            </p>
          </section>

          {/* Section: Contacts */}
          <section className="space-y-4 border-t border-slate-100 pt-6 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">7. Policy & Support Contact</p>
            <p>
              This Service is operated as a software staging application. Fabricated CIN registration numbers, corporate addresses, or official support email domains are not established in this workspace. For privacy questions or deletion requests, please contact the product developers using the designated feedback settings inside the merchant dashboard.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
