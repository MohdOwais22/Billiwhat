'use client';

import React, { useState } from 'react';
import { SubscriptionInfo } from '@/types/database';
import { PLAN_CONFIG, PlanId } from '@/lib/auth/entitlements';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  X,
  MessageSquare,
  Bot,
  Users,
  Building2,
  Receipt,
  Lock,
  FileSpreadsheet,
  Palette,
  Clock,
  Send,
  Headphones,
  QrCode,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface SubscriptionSectionProps {
  subscription: SubscriptionInfo;
  onRefresh?: () => void;
}

export function SubscriptionSection({ subscription, onRefresh }: SubscriptionSectionProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<'monthly' | 'yearly'>(
    subscription.billing_cycle || 'monthly'
  );
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const planId: PlanId = (subscription.plan as PlanId) || 'free';
  const planConfig = PLAN_CONFIG[planId] || PLAN_CONFIG.free;

  const maxInvoices = subscription.max_invoices_per_month || planConfig.limits.invoicesPerMonth;
  const maxTeam = subscription.max_team_members || planConfig.limits.maxTeamMembers;
  const maxWhatsapp = subscription.max_whatsapp_messages_per_month || planConfig.limits.whatsappMessagesPerMonth;
  const maxAi = subscription.max_ai_drafts_per_month || planConfig.limits.aiInvoiceDraftsPerMonth;

  const invoicePercent = Math.min(100, Math.round((subscription.current_invoice_count / maxInvoices) * 100));
  const memberPercent = Math.min(100, Math.round((subscription.current_member_count / maxTeam) * 100));
  const whatsappPercent = Math.min(
    100,
    Math.round(((subscription.current_whatsapp_count || 0) / maxWhatsapp) * 100)
  );
  const aiPercent = Math.min(100, Math.round(((subscription.current_ai_draft_count || 0) / maxAi) * 100));

  const isTeamOverLimit = subscription.current_member_count > maxTeam;

  async function handlePlanChange(targetPlan: PlanId) {
    setChangingPlan(targetPlan);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_plan',
          plan: targetPlan,
          billing_interval: selectedBillingInterval,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update subscription plan.');
      }

      setFeedbackMessage({
        type: 'success',
        text: `Successfully switched to the ${PLAN_CONFIG[targetPlan].name} plan (${selectedBillingInterval} billing).`,
      });
      setIsUpgradeModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Could not change plan.' });
    } finally {
      setChangingPlan(null);
    }
  }

  async function handleCancelSubscription() {
    setCanceling(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_subscription' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription.');
      }

      setFeedbackMessage({
        type: 'success',
        text: 'Your subscription renewal has been canceled. Your paid features remain active until the end of the billing period. Zero data will be deleted.',
      });
      setIsCancelModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to cancel subscription.' });
    } finally {
      setCanceling(false);
    }
  }

  const capabilities = [
    {
      name: 'GST Statutory Tax Invoicing',
      description: 'HSN, CGST, SGST & IGST compliant tax invoice formatting',
      included: true,
      badge: 'Active',
    },
    {
      name: 'Dynamic UPI QR Generation',
      description: 'Scannable NPCI-compliant payment QR codes on every bill',
      included: true,
      badge: 'Active',
    },
    {
      name: 'All 6 Invoice Print Themes',
      description: 'Professional themes: Ledger, Modern, Retail, Minimal & more',
      included: planConfig.limits.allowedThemesCount >= 6,
      badge: planConfig.limits.allowedThemesCount >= 6 ? 'Active' : 'Pro & Biz',
    },
    {
      name: 'Whitelabel (No Watermark)',
      description: 'Remove WhatsBill branding for 100% merchant-branded invoices',
      included: planConfig.features.removeWatermark,
      badge: planConfig.features.removeWatermark ? 'Active' : 'Pro & Biz',
    },
    {
      name: 'GSTR-1 & Raw Financial Exports',
      description: 'One-click CSV & Excel exports ready for CA filing',
      included: planConfig.features.rawDataExports,
      badge: planConfig.features.rawDataExports ? 'Active' : 'Pro & Biz',
    },
    {
      name: 'Automated WhatsApp Reminders',
      description: 'Scheduled overdue payment nudges with 1-tap payment links',
      included: planConfig.features.batchReminders,
      badge: planConfig.features.batchReminders ? 'Active' : 'Pro & Biz',
    },
    {
      name: '30/60/90-Day Aging & Risk Scores',
      description: 'Deep customer receivables intelligence & credit health',
      included: planConfig.features.advancedAging,
      badge: planConfig.features.advancedAging ? 'Active' : 'Business',
    },
    {
      name: 'CA / Multi-Branch Workspace Hub',
      description: 'Manage up to 5 distinct businesses under a single login',
      included: planConfig.features.caMultiClientHub,
      badge: planConfig.features.caMultiClientHub ? 'Active' : 'Business',
    },
    {
      name: 'Priority Phone & Chat Support',
      description: 'Dedicated merchant desk and priority issue escalation',
      included: planConfig.features.prioritySupport,
      badge: planConfig.features.prioritySupport ? 'Active' : 'Pro & Biz',
    },
  ];

  return (
    <div className="space-y-6" id="settings-subscription-card">
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100/80">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription & Plan Entitlements</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Merchant tier status, resource limits, and monthly usage metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {subscription.cancel_at_period_end ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Cancels at Period End
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Plan Active
              </span>
            )}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Plan</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-7">
          {/* Plan Banner */}
          <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Subtle decorative glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative space-y-2.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {planConfig.name.toUpperCase()} TIER
                </span>
                <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
                  {subscription.billing_cycle === 'yearly' ? 'Annual Billing' : 'Monthly Billing'}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  WhatsBill {planConfig.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {planConfig.tagline}
                </p>
              </div>
            </div>

            <div className="relative shrink-0 flex flex-col sm:items-end justify-between gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <div className="sm:text-right">
                <div className="flex items-baseline gap-1 sm:justify-end">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-sans tracking-tight">
                    ₹{planConfig.pricing.monthly === 0 ? '0' : planConfig.pricing.monthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {planId === 'free'
                    ? 'Forever Free • No renewal date'
                    : subscription.current_period_end
                    ? `Active until ${new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : 'Active subscription'}
                </p>
              </div>

              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{planId === 'free' ? 'Upgrade to Pro' : 'Change Plan'}</span>
              </button>
            </div>
          </div>

          {/* Usage Gauges */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deterministic Monthly Quotas
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quotas automatically reset on the 1st of every month
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Reset: 1st of month
              </span>
            </div>

            {/* 4 Quota Cards with Spacious Two-Tier Hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Invoices Quota */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">Invoices Issued</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono shrink-0">
                    {invoicePercent}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {subscription.current_invoice_count}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      / {maxInvoices.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        invoicePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(3, invoicePercent)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  {subscription.current_invoice_count >= maxInvoices ? (
                    <span className="text-rose-600 font-bold">Quota reached • Upgrade to continue</span>
                  ) : (
                    <span>{Math.max(0, maxInvoices - subscription.current_invoice_count)} remaining this month</span>
                  )}
                </div>
              </div>

              {/* WhatsApp Deliveries Quota */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">WhatsApp Delivery</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono shrink-0">
                    {whatsappPercent}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {subscription.current_whatsapp_count || 0}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      / {maxWhatsapp.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(3, whatsappPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Direct WhatsApp sharing is always unlimited
                </div>
              </div>

              {/* AI Voice & Text Drafts Quota */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">AI Invoice Drafts</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono shrink-0">
                    {aiPercent}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {subscription.current_ai_draft_count || 0}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      / {maxAi.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(3, aiPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Voice & natural text order intake
                </div>
              </div>

              {/* Team Seats Quota */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">Team Seats</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border font-mono shrink-0 ${
                      isTeamOverLimit
                        ? 'bg-amber-100 border-amber-200 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {memberPercent}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {subscription.current_member_count}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ {maxTeam}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTeamOverLimit ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, memberPercent))}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] font-medium">
                  {isTeamOverLimit ? (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Plan capacity reached ({maxTeam} seat)
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      {Math.max(0, maxTeam - subscription.current_member_count)} seat(s) available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Included Tier Capabilities */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tier Capabilities & Features
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Features enabled for your {planConfig.name} merchant workspace
                </p>
              </div>

              {planId !== 'business' && (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Compare all tiers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {capabilities.map((feat, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (!feat.included) setIsUpgradeModalOpen(true);
                  }}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                    feat.included
                      ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-800'
                      : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      feat.included
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {feat.included ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <Lock className="w-2.5 h-2.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`font-semibold text-xs leading-snug ${
                          feat.included ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {feat.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          feat.included
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downgrade / Cancel Footer */}
          {planId !== 'free' && !subscription.cancel_at_period_end && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-slate-500">
                Want to cancel your renewal? Your data remains completely safe and accessible.
              </div>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer text-left sm:text-right"
              >
                Cancel Subscription Renewal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade / Change Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Select Customer Plan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Change your tier anytime. Upgrades take effect immediately. Zero data is ever deleted.
                </p>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Billing Interval Toggle */}
            <div className="my-6 flex justify-center">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedBillingInterval('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedBillingInterval === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillingInterval('yearly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedBillingInterval === 'yearly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    Save 25%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['free', 'pro', 'business'] as PlanId[]).map((pId) => {
                const p = PLAN_CONFIG[pId];
                const isCurrent = planId === pId;
                const price =
                  pId === 'free'
                    ? '₹0'
                    : selectedBillingInterval === 'yearly'
                    ? `₹${p.pricing.effectiveMonthly}`
                    : `₹${p.pricing.monthly}`;

                return (
                  <div
                    key={pId}
                    className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 min-h-[32px]">{p.tagline}</p>

                      <div className="pt-1">
                        <span className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
                          {price}
                        </span>
                        <span className="text-xs text-slate-500"> / month</span>
                        {pId !== 'free' && selectedBillingInterval === 'yearly' && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Billed annually at ₹{p.pricing.annual.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                          Key Limits:
                        </div>
                        <div>• {p.limits.invoicesPerMonth.toLocaleString()} invoices/mo</div>
                        <div>
                          • {p.limits.maxCustomers === 50 ? '50 customers' : 'Unlimited customers'}
                        </div>
                        <div>• {p.limits.whatsappMessagesPerMonth} WhatsApp msgs/mo</div>
                        <div>• {p.limits.aiInvoiceDraftsPerMonth} AI drafts/mo</div>
                        <div>• {p.limits.maxTeamMembers} team seat(s)</div>
                        {p.features.removeWatermark && <div>• Whitelabel (No watermark)</div>}
                        {p.features.advancedAging && <div>• Advanced Aging & Risk</div>}
                        {p.features.caMultiClientHub && <div>• 5 Workspaces (CA Hub)</div>}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => handlePlanChange(pId)}
                        disabled={isCurrent || changingPlan !== null}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : pId === 'pro'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {changingPlan === pId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCurrent ? (
                          'Active Plan'
                        ) : (
                          `Switch to ${p.name}`
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Subscription Renewal?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your plan will remain active with full paid features until{' '}
              <span className="font-semibold text-slate-900">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'the end of your current cycle'}
              </span>
              . After that, your workspace will automatically revert to the Free plan.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              ✓ Zero invoices or customer records will be deleted.
              <br />
              ✓ You retain full read & download access to all past records.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-2 cursor-pointer"
              >
                {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
