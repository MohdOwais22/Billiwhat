'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Scale } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export default function TermsOfServicePage() {
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
            <span>{APP_NAME} Terms</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Merchant Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Effective Date: September 7, 2026 | Last Updated: September 7, 2026
            </p>
          </div>

          {/* Section: Overview */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Welcome to <strong>{APP_NAME}</strong> ("we," "us," or "our"). These Terms of Service apply to your use of our application, local database sandboxes, and conversational integration features. By accessing the Service, you confirm that you are acting in a commercial, business, wholesale, or sole proprietor capacity, and that you agree to these Terms.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you do not agree to these Terms, you must not access or use our application.
            </p>
          </section>

          {/* Section: Feature Architecture */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Technical Configuration & Implemented Features
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {APP_NAME} is an independent business assistant designed to simplify invoice preparation, outstanding receivables tracking, and ledger monitoring.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600 space-y-2">
              <p>
                <strong>Currently Implemented & Active:</strong> Local multi-user business database sandboxing, manual payment recording, customer directories, product catalogs, invoice generation previews, and local message simulation logs.
              </p>
              <p>
                <strong>Future / Requires Business Configuration:</strong> Official live Meta WhatsApp Cloud API connectivity and SMS/WhatsApp OTP carrier delivery depend on active, merchant-specific API tokens and phone numbers. In unconfigured sandboxes, communications and logins use simulated configurations and password-based demo evaluation.
              </p>
            </div>
          </section>

          {/* Section: AI & Gemini Disclosure */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              3. AI-Assisted Intent Interpretation & Verification
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {APP_NAME} utilizes server-side artificial intelligence models to process natural language messages submitted by merchants (such as "Ramesh ko 20 switches bhej do").
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
              <li><strong>Intent Mapping:</strong> The AI acts purely as a parsing helper to interpret merchant intent and map conversational inputs into structured data drafts.</li>
              <li><strong>Deterministic Authoritative Calculations:</strong> All final mathematical calculations, tax distributions (CGST, SGST, IGST), ledger totalizations, credit limits, and receivable totals are computed strictly by deterministic database logic, never by AI models.</li>
              <li><strong>Verification Obligation:</strong> You acknowledge that AI outputs are drafts. You are solely responsible for reviewing and verifying all parsed product lines, quantities, and prices prior to authorizing, issuing, or sharing a tax invoice with your clients.</li>
              <li><strong>Disclaimer of Expertise:</strong> {APP_NAME} and its underlying AI models do not provide formal tax, accounting, audit, financial, or legal advice.</li>
            </ul>
          </section>

          {/* Section: WhatsApp & Meta Platform */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              4. WhatsApp Integration & Merchant Responsibilities
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              WhatsBill may process WhatsApp messages through the WhatsApp Business Platform when the merchant has configured the integration.
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
              <li><strong>Platform Disclaimers:</strong> {APP_NAME} is an independent software tool and is not owned, certified, approved, or officially endorsed by Meta Platforms, Inc. or WhatsApp Inc.</li>
              <li><strong>Customer Communication Responsibility:</strong> The merchant is responsible for ensuring that it has the necessary rights, permissions, notices, and lawful basis to communicate with its customers through WhatsApp and to use customer information in connection with the service. We do not provide legal advice regarding appropriate customer contact regulations.</li>
            </ul>
          </section>

          {/* Section: Account Registration & Security */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              5. Account Registration & Storage Controls
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Authentication is conducted using password-based demo endpoints or OTP session indicators. To safeguard your B2B database:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
              <li>You must safeguard your active session cookies and local browser preferences.</li>
              <li>You taking full commercial responsibility for entries, updates, and invoice mutations triggered from your authenticated session.</li>
              <li>We implement PostgreSQL Row-Level Security (RLS) to ensure Organization A cannot view or mutate Organization B's data under any circumstances.</li>
            </ul>
          </section>

          {/* Section: Subscription & Refunds */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              6. Subscription, Billing & Refund Policies
            </h2>
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3.5 leading-relaxed">
              <strong>Currently Implemented Status:</strong> Automated self-serve online subscriptions, card processing, and integrated refund triggers are not active in the application layer. Any future subscription fees or commercial configuration agreements are handled through separate, manual business channels. Consequently, automated subscription cancellation or refund policies do not apply within this software preview.
            </p>
          </section>

          {/* Section: Service Disclaimers */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              7. Service Disclaimers & Limits of Liability
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR BUSINESS DAMAGES RESULTING FROM DATA LOSS, DISCREPANCIES IN STOCK LEVELS, METRICS OUTAGES, OR MESSAGING GATEWAY DELAYS.
            </p>
          </section>

          {/* Section: Governing Law & Jurisdiction */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              8. Governing Law & Dispute Resolution
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising under these Terms shall be subject to the jurisdiction of the competent courts of India.
            </p>
          </section>

          {/* Section: Contact */}
          <section className="space-y-4 border-t border-slate-100 pt-6 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">9. Service Contacts</p>
            <p>
              WhatsBill is offered as a business application. Official corporate legal entity names, registered office addresses, registration numbers (CIN), and dedicated support emails are subject to final corporate setup and are omitted during this staging phase. For any product-related queries or feedback, please utilize the interactive support options available in your workspace settings.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
