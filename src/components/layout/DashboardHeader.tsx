import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  Database,
} from 'lucide-react';
import { Organization, GstProfile } from '../../types/database';
import { getTimeOfDayGreeting, formatDate } from '../../utils/formatters';
import { isSupabaseConfigured } from '../../lib/supabase';

interface DashboardHeaderProps {
  organization?: Organization;
  gstProfile?: GstProfile | null;
  onOpenMobileMenu: () => void;
  onSearch?: (query: string) => void;
  onOpenQuickPayment?: () => void;
}

export function DashboardHeader({
  organization,
  gstProfile,
  onOpenMobileMenu,
  onSearch,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const greeting = getTimeOfDayGreeting();
  const currentDateFormatted = formatDate(new Date(), 'long');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3.5" id="dashboard-main-header">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Context Greetings */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Toggle navigation"
            id="mobile-nav-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{greeting},</span>
                <span className="text-emerald-700 font-extrabold truncate">
                  {organization?.name || 'Shree Balaji Enterprises'}
                </span>
              </h1>
              {gstProfile?.gstin && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  GSTIN: {gstProfile.gstin}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentDateFormatted}
              </span>
              <span className="hidden md:inline-block text-slate-300">•</span>
              <span className="hidden md:flex items-center gap-1 text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Credit Cycle: Active
              </span>
            </div>
          </div>
        </div>

        {/* Right: Global Search, Live Status, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Global Search */}
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search invoice, customer, GSTIN..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              id="global-search-input"
            />
          </div>

          {/* Database Connection indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium" id="supabase-status-chip">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Mode (Seed)'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          </div>

          {/* Notification Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              aria-label="Notifications"
              id="header-notifications-btn"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150" id="header-notifications-popover">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-900">Notifications & Alerts</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                    3 New
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-900">
                    <p className="font-semibold text-rose-800">Payment Overdue (18 days)</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">Raj Electricals (₹42,500) overdue since 19 Aug.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                    <p className="font-semibold text-emerald-800">Payment Cleared</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">₹53,100 received from Joshi Building via UPI.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-900">
                    <p className="font-semibold text-amber-800">Low Stock Alert</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Astral CPVC Pipe (2 units remaining).</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition text-left"
              id="header-user-menu-btn"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                SB
              </div>
              <div className="hidden xl:block text-left leading-tight">
                <p className="text-xs font-semibold text-slate-900">Suresh Balaji</p>
                <p className="text-[10px] text-slate-400">Managing Director</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150" id="header-user-menu-popover">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Suresh Balaji</p>
                  <p className="text-[10px] text-slate-500 font-mono">accounts@shreebalajient.com</p>
                </div>
                <div className="py-1 text-xs text-slate-700 space-y-0.5">
                  <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-50 transition">
                    Organization Settings
                  </button>
                  <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-50 transition">
                    GST & Invoice Config
                  </button>
                  <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-50 transition">
                    Team Permissions (RLS)
                  </button>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <div className="px-3 py-1.5 text-[10px] text-slate-400">
                    Tenant ID: <span className="font-mono">{organization?.id?.substring(0, 12)}...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
