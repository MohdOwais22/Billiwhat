'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { APP_NAME } from '@/config/brand';
import { PLAN_CONFIG } from '@/lib/auth/entitlements';

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '/month',
      effectivePrice: '₹0',
      billedText: 'Free forever • No credit card required',
      tagline: PLAN_CONFIG.free.tagline,
      isPopular: false,
      ctaText: 'Get Started Free',
      features: [
        '30 tax invoices & bills / month',
        '50 customer records & 50 catalog items',
        '30 WhatsBill WhatsApp messages / month',
        '15 AI voice & text invoice drafts / month',
        '1 team seat (Proprietor access)',
        '1 business workspace',
        '2 invoice themes (Classic Ledger & Retail Compact)',
        'Shareable PDF invoices via WhatsApp',
        'Basic payment tracking & ledger',
      ],
      watermarkNote: 'Includes WhatsBill footer watermark',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? '₹399' : '₹299',
      period: '/month',
      effectivePrice: '₹299',
      billedText:
        billingCycle === 'annual'
          ? '₹3,588 billed yearly (Save ₹1,200/yr • ₹299/mo effective)'
          : 'Billed monthly at ₹399/mo',
      tagline: PLAN_CONFIG.pro.tagline,
      isPopular: true,
      ctaText: 'Start with Pro',
      features: [
        '500 tax invoices & bills / month',
        'Unlimited customer records & catalog items',
        '500 WhatsBill WhatsApp messages / month',
        '150 AI voice & text invoice drafts / month',
        'Up to 3 team members (Counter, Accountant, Admin)',
        '1 business workspace',
        'All 6 professional invoice themes',
        'Whitelabel: WhatsBill watermark removed',
        'One-click GSTR-1 & Raw Excel/CSV export',
        'Automated WhatsApp payment reminders with dynamic UPI QR',
        'Priority customer support',
      ],
      watermarkNote: '100% Whitelabel — your brand only',
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'monthly' ? '₹1,499' : '₹1,124',
      period: '/month',
      effectivePrice: '₹1,124',
      billedText:
        billingCycle === 'annual'
          ? '₹13,488 billed yearly (Save ₹4,500/yr • ₹1,124/mo effective)'
          : 'Billed monthly at ₹1,499/mo',
      tagline: PLAN_CONFIG.business.tagline,
      isPopular: false,
      ctaText: 'Start with Business',
      features: [
        'Up to 5,000 tax invoices & bills / month',
        'Unlimited customer records & catalog items',
        '2,500 WhatsBill WhatsApp messages / month',
        '600 AI voice & text invoice drafts / month',
        'Up to 10 team seats with role permissions',
        'Up to 5 business workspaces (CA / Multi-branch hub)',
        'All 6 invoice themes + custom accent branding',
        'Whitelabel: WhatsBill watermark removed',
        'Advanced 30/60/90-day aging & customer payment habit scoring',
        'Batch reminder dispatch & collection workflows',
        'Dedicated onboarding & escalation support',
      ],
      watermarkNote: 'Multi-business hub & CA ready',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 relative border-b border-slate-200/80" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Simple, Transparent Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Fair pricing for Indian wholesale & retail trade.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No surprise add-ons. Exactly three customer tiers designed to scale with your invoice volume and team.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-semibold cursor-pointer ${
                billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly billing
            </span>

            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 bg-slate-200 rounded-full p-0.5 transition-colors relative cursor-pointer"
              aria-label="Toggle billing cycle"
            >
              <div
                className={`w-5 h-5 rounded-full bg-emerald-600 transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-500'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              <span>Annual billing</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Save 25%
              </span>
            </span>
          </div>
        </div>

        {/* 3 Customer Pricing Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                plan.isPopular
                  ? 'bg-white border-2 border-emerald-600 shadow-lg scale-100 md:-translate-y-2'
                  : 'bg-white border border-slate-200/90 shadow-2xs hover:shadow-md'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tracking-wide uppercase shadow-xs">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.id === 'pro' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Sparkles className="w-3 h-3" /> Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 font-sans">
                      {plan.price}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{plan.period}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{plan.billedText}</span>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.name)}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    plan.isPopular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Features List */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                      Included in {plan.name}:
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {plan.watermarkNote}
                    </span>
                  </div>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  {plan.id === 'free'
                    ? 'Forever Free • Upgrade anytime'
                    : 'Instant activation • Cancel anytime • Zero data loss'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Notice */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-xs text-slate-500">
            * All prices in Indian Rupees (INR). GST applicable as per prevailing tax regulations.
          </p>
        </div>
      </div>
    </section>
  );
}
