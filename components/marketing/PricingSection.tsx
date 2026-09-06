'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? '₹299' : '₹249',
      period: '/month',
      billedText: billingCycle === 'annual' ? 'Billed annually (save ₹600/yr)' : 'Billed monthly',
      tagline: 'For small teams getting control of billing and receivables.',
      isPopular: false,
      ctaText: 'Start with Starter',
      features: [
        'Up to 150 invoices & credit notes / month',
        'WhatsApp natural language order intake (Text & Voice)',
        'GST & Non-GST tax invoicing with HSN lookups',
        'Shareable PDF invoice links via WhatsApp',
        'Basic receivables ledger & payment tracking',
        'Single user access (Proprietor)',
        'Standard email & chat assistance',
      ],
    },
    {
      name: 'Business',
      price: billingCycle === 'monthly' ? '₹699' : '₹579',
      period: '/month',
      billedText: billingCycle === 'annual' ? 'Billed annually (save ₹1,440/yr)' : 'Billed monthly',
      tagline: 'For growing distributors who need automated collections.',
      isPopular: true,
      ctaText: 'Start with Business',
      features: [
        'Unlimited invoices, orders & credit notes',
        'Advanced multilingual WhatsApp intake (Hinglish, Gujarati, Hindi)',
        'Automated WhatsApp payment reminders with dynamic UPI QR',
        'Priority Collection Queue & customer payment habit scoring',
        'Live inventory tracking & low stock warnings',
        'Multi-user team roles (Counter clerk, Sales rep, Accountant)',
        'One-click Excel & accounting export',
        'Priority WhatsApp support',
      ],
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? '₹1,499' : '₹1,249',
      period: '/month',
      billedText: billingCycle === 'annual' ? 'Billed annually (save ₹3,000/yr)' : 'Billed monthly',
      tagline: 'For established businesses and teams with more operational needs.',
      isPopular: false,
      ctaText: 'Start with Pro',
      features: [
        'Everything in Business plan included',
        'Multi-branch and multi-GSTIN organization support',
        'Dedicated WhatsApp Business API number connection',
        'Custom invoice design templates with company watermark',
        'Advanced customer credit risk limits & auto-hold rules',
        'Comprehensive audit logs for all team operations',
        'Dedicated account onboarding manager',
        'Phone & priority escalation channel',
      ],
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
            Fair pricing for Indian wholesale trade.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No hidden setup fees. Choose a plan based on your monthly order volume and team size.
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
                Save ~18%
              </span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards */}
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
                  Most Popular for Wholesalers
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
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
                  <span className="text-[11px] text-slate-400 block mt-0.5">{plan.billedText}</span>
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
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    What's included:
                  </span>
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
                  Free 14-day trial • No credit card needed
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Disclaimer Requirement */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-xs text-slate-500">
            * Plans shown are introductory pricing and may evolve as {APP_NAME} expands.
          </p>
        </div>
      </div>
    </section>
  );
}
