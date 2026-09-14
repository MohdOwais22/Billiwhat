'use client';

import React, { useState } from 'react';
import { SubscriptionInfo } from '@/types/database';
import { PLAN_CONFIG, PlanId } from '@/lib/auth/entitlements';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  X,
  MessageSquare,
  Bot,
  Users,
  Building2,
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
  const maxWorkspaces = subscription.max_workspaces || planConfig.limits.maxWorkspaces;

  const invoicePercent = Math.min(100, Math.round((subscription.current_invoice_count / maxInvoices) * 100));
  const memberPercent = Math.min(100, Math.round((subscription.current_member_count / maxTeam) * 100));
  const whatsappPercent = Math.min(
    100,
    Math.round(((subscription.current_whatsapp_count || 0) / maxWhatsapp) * 100)
  );
  const aiPercent = Math.min(100, Math.round(((subscription.current_ai_draft_count || 0) / maxAi) * 100));

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

  return (
    <div className="space-y-6" id="settings-subscription-card">
      {/* Feedback Banner */}
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

      {/* Current Plan Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription & Plan Entitlements</h2>
              <p className="text-xs text-slate-500">
                Active merchant tier, deterministic resource limits, and monthly usage metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {subscription.cancel_at_period_end ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Cancels at Period End
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Plan Active
              </span>
            )}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Plan</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {planConfig.name} Tier
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  {subscription.billing_cycle || 'Monthly'} Billing
                </span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
                WhatsBill {planConfig.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">{planConfig.tagline}</p>
            </div>

            <div className="shrink-0 text-left md:text-right space-y-1">
              <div className="text-3xl font-black text-emerald-400">
                ₹{planConfig.pricing.monthly === 0 ? '0' : planConfig.pricing.monthly.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-300"> / month</span>
              </div>
              <p className="text-[11px] text-slate-400">
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
          </div>

          {/* Usage Gauges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Deterministic Monthly Quotas
              </h3>
              <span className="text-[11px] text-slate-500">Resets on the 1st of every month</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Invoices Gauge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Invoices Issued</span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.current_invoice_count} / {maxInvoices.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, invoicePercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {Math.max(0, maxInvoices - subscription.current_invoice_count)} remaining this month
                </p>
              </div>

              {/* WhatsApp Messages Gauge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp Delivery
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.current_whatsapp_count || 0} / {maxWhatsapp.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, whatsappPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct WhatsApp sharing is always unlimited
                </p>
              </div>

              {/* AI Voice & Text Drafts Gauge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-purple-600" /> AI Invoice Drafts
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.current_ai_draft_count || 0} / {maxAi.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, aiPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Voice & natural text order intake</p>
              </div>

              {/* Team Seats Gauge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" /> Team Seats
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {subscription.current_member_count} / {maxTeam}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, memberPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {Math.max(0, maxTeam - subscription.current_member_count)} seat(s) available
                </p>
              </div>
            </div>
          </div>

          {/* Included Features Checklist */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Included Tier Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { name: 'GST Statutory Tax Invoicing', included: true },
                { name: 'Dynamic UPI QR Code Generation', included: true },
                {
                  name: 'Whitelabel (No WhatsBill Watermark)',
                  included: planConfig.features.removeWatermark,
                },
                {
                  name: 'GSTR-1 & Raw Financial Exports',
                  included: planConfig.features.rawDataExports,
                },
                {
                  name: 'Automated WhatsApp Reminders',
                  included: planConfig.features.batchReminders,
                },
                {
                  name: 'Advanced 30/60/90-Day Aging & Risk',
                  included: planConfig.features.advancedAging,
                },
                {
                  name: 'CA / Multi-Branch Workspace Hub',
                  included: planConfig.features.caMultiClientHub,
                },
                {
                  name: 'All 6 Invoice Print Themes',
                  included: planConfig.limits.allowedThemesCount >= 6,
                },
                {
                  name: 'Priority Support & Escalations',
                  included: planConfig.features.prioritySupport,
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    feat.included
                      ? 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      feat.included ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="font-medium text-[11px]">{feat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Downgrade / Cancel Footer */}
          {planId !== 'free' && !subscription.cancel_at_period_end && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500">
                Want to cancel your renewal? Your data remains completely safe and accessible.
              </div>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
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
                    className={`rounded-xl p-5 flex flex-col justify-between border transition-all ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 min-h-[32px]">{p.tagline}</p>

                      <div className="pt-1">
                        <span className="text-3xl font-extrabold text-slate-900 font-sans">{price}</span>
                        <span className="text-xs text-slate-500"> / month</span>
                        {pId !== 'free' && selectedBillingInterval === 'yearly' && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Billed annually at ₹{p.pricing.annual.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
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
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
