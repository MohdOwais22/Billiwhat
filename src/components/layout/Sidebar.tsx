import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  Users,
  Package,
  ClockAlert,
  CreditCard,
  TrendingDown,
  BarChart3,
  BotMessageSquare,
  Settings,
  Building2,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Organization } from '../../types/database';

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

interface SidebarProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  organization?: Organization;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItemDef {
  id: NavRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const PRIMARY_NAV: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales', icon: ReceiptText },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'receivables', label: 'Receivables', icon: ClockAlert, badge: 'Due' },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'whatsapp_ai', label: 'WhatsApp AI', icon: BotMessageSquare, badge: 'Smart' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentRoute,
  onNavigate,
  organization,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-900/40">
            W
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">Whatsbill</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Bill • Collect • Reconcile</p>
          </div>
        </div>

        {/* Mobile close */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close menu"
            id="sidebar-close-mobile-btn"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Organization Switcher Card */}
      <div className="px-3 py-3 border-b border-slate-800/80">
        <div className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition group cursor-pointer" id="sidebar-org-card">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition">
                {organization?.name || 'Shree Balaji Enterprises'}
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
          const isActive = currentRoute === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              id={`nav-item-${item.id}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group text-left ${
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
                      : item.id === 'whatsapp_ai'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RLS Protected</span>
          </div>
          <span className="text-[10px] text-slate-400">v2.4 (IN)</span>
        </div>
        <div className="px-2 py-1 rounded bg-slate-900/90 text-[10px] text-slate-400 border border-slate-800">
          WhatsApp Bot: <span className="text-emerald-400 font-semibold">Active & Synced</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0" id="desktop-sidebar">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" id="mobile-sidebar-backdrop">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
