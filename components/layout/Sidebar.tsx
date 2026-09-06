'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  Users,
  Package,
  ClockAlert,
  CreditCard,
  BarChart3,
  Settings,
  Building2,
  ChevronRight,
  ShieldCheck,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { Organization } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { APP_NAME, getBrandInitials } from '@/config/brand';

export type NavRoute =
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'customers'
  | 'inventory'
  | 'receivables'
  | 'payments'
  | 'expenses'
  | 'reports'
  | 'whatsapp_ai'
  | 'settings';

export interface SidebarProps {
  organization?: Organization;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentRoute?: NavRoute;
  onNavigate?: (route: NavRoute) => void;
  onBackToWebsite?: () => void;
}

interface NavItemDef {
  href: string;
  route: NavRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const PRIMARY_NAV: NavItemDef[] = [
  { href: '/dashboard', route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard', route: 'sales', label: 'Invoices & Sales', icon: ReceiptText },
  { href: '/dashboard', route: 'customers', label: 'Customers', icon: Users },
  { href: '/dashboard', route: 'inventory', label: 'Products & Inventory', icon: Package },
  { href: '/dashboard', route: 'receivables', label: 'Receivables', icon: ClockAlert, badge: 'WhatsApp' },
  { href: '/dashboard', route: 'payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard', route: 'reports', label: 'Reports & GST', icon: BarChart3 },
  { href: '/dashboard', route: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  organization,
  isMobileOpen = false,
  onCloseMobile,
  currentRoute,
  onNavigate,
  onBackToWebsite,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const client = createClient();
    await client.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-900/40">
            {getBrandInitials()[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Bill • Collect • Reconcile</p>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close menu"
            id="sidebar-close-mobile-btn"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Organization Switcher & Back to Website */}
      <div className="px-3 py-3 border-b border-slate-800/80 space-y-2">
        <button
          onClick={() => {
            if (onBackToWebsite) onBackToWebsite();
          }}
          className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
          id="sidebar-back-to-website-btn"
        >
          <span>← Marketing Website</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
        </button>

        <div className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition group cursor-pointer" id="sidebar-org-card">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition">
                {organization?.name || 'Active Business'}
              </p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                GST Verified • Main Branch
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {PRIMARY_NAV.map((item) => {
          const isActive = currentRoute ? currentRoute === item.route : pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.route}
              onClick={() => {
                if (onNavigate) {
                  onNavigate(item.route);
                }
                if (onCloseMobile) onCloseMobile();
              }}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group text-left cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Supabase Ledger</span>
          </div>
          <span className="text-[10px] text-slate-400">v3.0</span>
        </div>
        <div className="px-2 py-1 rounded bg-slate-900/90 text-[10px] text-slate-400 border border-slate-800">
          WhatsApp Automation: <span className="text-emerald-400 font-semibold">Active & Synced</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition font-medium cursor-pointer"
          id="sidebar-signout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0" id="desktop-sidebar">
        {content}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" id="mobile-sidebar-backdrop">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
