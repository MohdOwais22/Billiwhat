'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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
  X,
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
  isLoading?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentRoute?: NavRoute;
  onNavigate?: (route: NavRoute) => void;
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
  { href: '/dashboard/sales', route: 'sales', label: 'Invoices & Sales', icon: ReceiptText },
  { href: '/dashboard/customers', route: 'customers', label: 'Customers', icon: Users },
  { href: '/dashboard/inventory', route: 'inventory', label: 'Products & Stock', icon: Package },
  { href: '/dashboard/receivables', route: 'receivables', label: 'Receivables', icon: ClockAlert, badge: 'WhatsApp' },
  { href: '/dashboard/payments', route: 'payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/reports', route: 'reports', label: 'Reports & GST', icon: BarChart3 },
  { href: '/dashboard/settings', route: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  organization,
  isLoading = false,
  isMobileOpen = false,
  onCloseMobile,
  currentRoute,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const handleSignOut = async () => {
    const client = createClient();
    await client.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-200 select-none overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/90 flex items-center justify-between shrink-0">
        <Link
          href="/dashboard"
          onClick={() => {
            if (onNavigate) onNavigate('dashboard');
            if (isMobileView && onCloseMobile) onCloseMobile();
          }}
          className="flex items-center gap-3 group"
          id="sidebar-brand-link"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-950/50 group-hover:bg-emerald-500 transition">
            {getBrandInitials()[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-base tracking-tight">{APP_NAME}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">Bill • Collect • Reconcile</p>
          </div>
        </Link>

        {isMobileView && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close menu"
            id="sidebar-close-mobile-btn"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Organization Info Card */}
      <div className="px-3 py-3 border-b border-slate-800/80 shrink-0">
        <button
          onClick={() => {
            if (onNavigate) onNavigate('settings');
            if (isMobileView && onCloseMobile) onCloseMobile();
          }}
          type="button"
          className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition group cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          id="sidebar-org-card"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 group-hover:text-emerald-400 transition">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              {organization?.name ? (
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">
                  {organization.name}
                </p>
              ) : isLoading ? (
                <div className="h-3.5 w-24 bg-slate-700/80 rounded animate-pulse my-0.5" id="sidebar-org-skeleton" />
              ) : (
                <p className="text-xs font-bold text-slate-200 truncate">
                  My Business
                </p>
              )}

              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="truncate">{organization?.gstin ? `GST: ${organization.gstin}` : 'Active Account'}</span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1" />
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-1" id="sidebar-nav-scroll">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                if (isMobileView && onCloseMobile) onCloseMobile();
              }}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition duration-150 text-left cursor-pointer active:scale-[0.98] ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-tight transition-colors duration-150 ml-1.5 ${
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

      {/* Footer Status & Sign Out */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-950/50 shrink-0 space-y-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition font-semibold cursor-pointer"
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
      {/* Desktop Sidebar: Permanent, Fixed height, Border Right */}
      <aside className="hidden lg:flex w-64 h-full shrink-0 flex-col border-r border-slate-800 bg-slate-900 z-20" id="desktop-sidebar">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop & Sliding Panel */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" id="mobile-sidebar-backdrop">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col bg-slate-900 border-r border-slate-800"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

