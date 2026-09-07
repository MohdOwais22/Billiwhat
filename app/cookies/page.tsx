'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export default function CookiePolicyPage() {
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
            <span>{APP_NAME} Cookies</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <Info className="w-4 h-4" />
              <span>Cookies Disclosure</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Effective Date: September 7, 2026 | Last Updated: September 7, 2026
            </p>
          </div>

          {/* Section: Overview */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              1. What Are Cookies and Browser Storage?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We believe in digital minimalism and absolute clarity. To keep our B2B application lightweight, secure, and private, we clearly distinguish between <strong>HTTP Cookies</strong> and <strong>Browser Storage</strong>:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
              <li><strong>HTTP Cookies:</strong> Text files containing authorization keys stored by your browser that are automatically appended to server network requests.</li>
              <li><strong>Browser Storage (localStorage):</strong> Storage structures configured inside your local browser. They are not cookies, are not transmitted automatically to servers, and are accessed only by client-side application logic to save transient preference indicators.</li>
            </ul>
          </section>

          {/* Section: Strict Audit of Storage */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Technical Audit of Browser-Side Technologies
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We do not integrate any non-essential cookies or third-party analytical/advertising trackers (such as Google Analytics or Meta Pixels) in this workspace. The following is a complete audit of the active storage items:
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-3">Technical Key</th>
                    <th className="p-3">Technology Type</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Specific Purpose</th>
                    <th className="p-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">sb-[project-ref]-auth-token</td>
                    <td className="p-3 text-slate-500">HTTP Cookie</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                        Strictly Essential
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      Standard first-party authentication tokens generated by Supabase SSR to identify and authorize merchant database queries.
                    </td>
                    <td className="p-3 text-slate-500">JWT Session length</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">whatsbill-privacy-acknowledged</td>
                    <td className="p-3 text-slate-500">LocalStorage (Browser)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                        Strictly Essential
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      Remembers that you acknowledged our Privacy and Session Notice to prevent re-displaying the bottom banner.
                    </td>
                    <td className="p-3 text-slate-500">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">whatsbill-playground-state</td>
                    <td className="p-3 text-slate-500">LocalStorage (Browser)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                        Functional Simulation
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      Caches the transient text messages inside your local browser layout for our visual WhatsApp simulator.
                    </td>
                    <td className="p-3 text-slate-500">Transient</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: Cookie Control */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              3. Managing Cookie Settings
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You can block or purge cookies via your web browser configuration panels. For details, inspect your browser's documentation (e.g., in Chrome: Settings &gt; Privacy and Security &gt; Cookies).
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
              <strong>Crucial Operational Disclaimer:</strong> Because our first-party cookie (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">sb-[project-ref]-auth-token</code>) is strictly essential for Supabase database query authorizations, disabling or blocking it will block the application from loading and prevent you from accessing your merchant dashboard.
            </div>
          </section>

          {/* Section: Policy Contact */}
          <section className="space-y-4 border-t border-slate-100 pt-6 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">4. Support Inquiries</p>
            <p>
              WhatsBill is operated as an independent business application. Fabricated addresses, CIN registration records, or official support email domains are not established. For queries about browser storage indicators, please use the interactive feedback features inside your workspace settings.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
