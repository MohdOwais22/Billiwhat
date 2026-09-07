'use client';

import React, { useState, useEffect } from 'react';
import { SettingsData, Organization, GstProfile, UserProfile } from '@/types/database';
import { BusinessSection } from './BusinessSection';
import { GstTaxSection } from './GstTaxSection';
import { InvoiceSection } from './InvoiceSection';
import { TeamSection } from './TeamSection';
import { WhatsAppSection } from './WhatsAppSection';
import { AccountSection } from './AccountSection';
import { SubscriptionSection } from './SubscriptionSection';
import {
  Building2,
  ShieldCheck,
  ReceiptText,
  Users,
  MessageSquare,
  User,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export type SettingsTab =
  | 'business'
  | 'gst'
  | 'invoice'
  | 'team'
  | 'whatsapp'
  | 'account'
  | 'subscription';

interface SettingsViewProps {
  onBackToDashboard: () => void;
  initialTab?: SettingsTab;
}

const SETTINGS_TABS: Array<{
  id: SettingsTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'business',
    label: 'Business Details',
    description: 'Trading name, registered address & contacts',
    icon: Building2,
  },
  {
    id: 'gst',
    label: 'GST & Tax',
    description: 'GSTIN, state code, place of supply & E-way',
    icon: ShieldCheck,
  },
  {
    id: 'invoice',
    label: 'Invoice Defaults',
    description: 'Series prefix, sequence numbering & terms',
    icon: ReceiptText,
  },
  {
    id: 'team',
    label: 'Team & Access',
    description: 'Staff members, accountant roles & permissions',
    icon: Users,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Sender phone number & Cloud API webhook',
    icon: MessageSquare,
  },
  {
    id: 'account',
    label: 'My Account',
    description: 'User profile, credentials & active session',
    icon: User,
  },
  {
    id: 'subscription',
    label: 'Subscription',
    description: 'License tier, billing cycle & resource usage',
    icon: CreditCard,
  },
];

export function SettingsView({ onBackToDashboard, initialTab = 'business' }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/settings');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load organization settings');
      }

      setData(json.data);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setErrorMessage(err.message || 'Unable to load settings from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOrganizationUpdate = (updatedOrg: Organization) => {
    setData((prev) => (prev ? { ...prev, organization: updatedOrg } : null));
  };

  const handleGstUpdate = (updatedGst: GstProfile) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            gstProfile: updatedGst,
            organization: {
              ...prev.organization,
              gstin: updatedGst.gstin || prev.organization.gstin,
            },
          }
        : null
    );
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setData((prev) => (prev ? { ...prev, userProfile: updatedProfile } : null));
  };

  const canEditOrganization =
    data?.currentUser.role === 'owner' || data?.currentUser.role === 'admin';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" id="settings-view-root">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition mb-3 cursor-pointer"
            id="settings-back-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Settings & Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your statutory identity, invoice configuration, team access, and communication channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            id="settings-refresh-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-pulse" id="settings-loading-skeleton">
          <div className="lg:col-span-1 space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-24 bg-slate-100 rounded-lg" />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchSettings}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Settings Grid */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Navigation Menu */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-2 shadow-xs space-y-1" id="settings-nav-menu">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Settings Sections
            </div>
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  id={`settings-tab-${tab.id}`}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight">{tab.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 truncate ${
                        isActive ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 min-w-0" id="settings-content-area">
            {activeTab === 'business' && (
              <BusinessSection
                organization={data.organization}
                onUpdate={handleOrganizationUpdate}
                canEdit={canEditOrganization}
              />
            )}

            {activeTab === 'gst' && (
              <GstTaxSection
                gstProfile={data.gstProfile}
                organization={data.organization}
                onUpdate={handleGstUpdate}
                canEdit={canEditOrganization}
              />
            )}

            {activeTab === 'invoice' && (
              <InvoiceSection
                organization={data.organization}
                onUpdate={handleOrganizationUpdate}
                canEdit={canEditOrganization}
              />
            )}

            {activeTab === 'team' && (
              <TeamSection
                members={data.members}
                currentUserRole={data.currentUser.role}
                currentUserId={data.currentUser.id}
                onRefresh={fetchSettings}
                canEdit={canEditOrganization}
              />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppSection
                organization={data.organization}
                onUpdate={handleOrganizationUpdate}
                canEdit={canEditOrganization}
              />
            )}

            {activeTab === 'account' && (
              <AccountSection
                userProfile={data.userProfile}
                currentUser={data.currentUser}
                onUpdateProfile={handleProfileUpdate}
              />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionSection subscription={data.subscription} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
