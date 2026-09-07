'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { APP_NAME, getBrandInitials } from '@/config/brand';

interface MarketingFooterProps {
  onOpenApp: () => void;
  onOpenContact: () => void;
}

export function MarketingFooter({ onOpenApp, onOpenContact }: MarketingFooterProps) {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1 & 2: Brand & Tagline */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-slate-950 flex items-center justify-center font-extrabold text-sm">
                {getBrandInitials()}
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                {APP_NAME}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-200">
              “Bill. Collect. Reconcile.”
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The AI business assistant built for Indian distributors, wholesalers, and credit-based traders. Turn WhatsApp messages into tax invoices, track outstanding receivables, and collect faster.
            </p>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollTo('#product')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Product
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#how-it-works')}
                  className="hover:text-white transition cursor-pointer"
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#who-its-for')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Who it’s for
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#pricing')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#about')}
                  className="hover:text-white transition cursor-pointer"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollTo('#faq')}
                  className="hover:text-white transition cursor-pointer"
                >
                  FAQ & Knowledge
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenContact}
                  className="hover:text-white transition cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#security')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Security Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#experience')}
                  className="hover:text-white transition cursor-pointer"
                >
                  WhatsApp Simulator
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Legal & Trust
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-white transition">
                  Cookie Policy
                </a>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block pt-2">
                  Independent B2B software not affiliated with WhatsApp Inc. or Meta.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & status line */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 {APP_NAME}. All rights reserved. Built for Indian Distributors & Wholesalers.
          </div>
        </div>
      </div>
    </footer>
  );
}
