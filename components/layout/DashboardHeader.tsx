'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  Calendar,
  ChevronDown,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { Organization, GstProfile } from '@/types/database';
import { getTimeOfDayGreeting, formatDate } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

interface DashboardHeaderProps {
  organization?: Organization;
  gstProfile?: GstProfile | null;
  isLoading?: boolean;
  onOpenMobileMenu: () => void;
  onSearch?: (query: string) => void;
  userEmail?: string;
  dataSource?: string;
}

export function DashboardHeader({
  organization,
  gstProfile,
  isLoading = false,
  onOpenMobileMenu,
  onSearch,
  userEmail,
}: DashboardHeaderProps) {
  const router = useRouter();
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3.5" id="dashboard-main-header">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Context Greetings */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle navigation"
            id="mobile-nav-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{greeting},</span>
                {organization?.name ? (
                  <span className="text-emerald-700 font-extrabold truncate">
                    {organization.name}
                  </span>
                ) : isLoading ? (
                  <span className="inline-block h-4 w-32 bg-slate-200 rounded animate-pulse my-0.5" id="header-org-skeleton" />
                ) : null}
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
            </div>
          </div>
        </div>

        {/* Right: Search, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Notifications"
              id="header-notifications-btn"
            >
              <Bell className="w-4 h-4" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150" id="header-notifications-popover">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] text-slate-400">Live</span>
                </div>
                <div className="py-4 text-center">
                  <Bell className="w-5 h-5 mx-auto mb-1.5 text-slate-300 stroke-1" />
                  <p className="text-xs font-medium text-slate-600">No unread alerts</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automated WhatsApp status updates appear here</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition text-left cursor-pointer"
              id="header-user-menu-btn"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'WB'}
              </div>
              <div className="hidden xl:block text-left leading-tight">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                  {userEmail || 'Account User'}
                </p>
                <p className="text-[10px] text-slate-400">Authenticated Member</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150" id="header-user-menu-popover">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    User Profile
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                    {userEmail || 'Active session'}
                  </p>
                </div>
                <div className="py-1 text-xs text-slate-700 space-y-0.5">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-slate-50 transition"
                  >
                    Organization Settings
                  </Link>
                  <Link
                    href="/dashboard/reports"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-1.5 rounded-md hover:bg-slate-50 transition"
                  >
                    GST Reports
                  </Link>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition font-medium cursor-pointer"
                    id="header-logout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
