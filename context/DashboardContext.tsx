'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, notFound } from 'next/navigation';
import {
  CollectionQueueItem,
  DashboardData,
  GstProfile,
  InvoiceWithDetails,
  Organization,
  PeriodType,
} from '@/types/database';
import { fetchDashboardData } from '@/lib/services/dashboardService';
import { getSupabaseClient } from '@/lib/supabase/client';
import { NavRoute } from '@/components/layout/Sidebar';

interface DashboardContextType {
  // Navigation & Shell
  currentRoute: NavRoute;
  setCurrentRoute: (route: NavRoute) => void;
  handleNavigate: (route: NavRoute) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Filter State
  period: PeriodType;
  customRange: { startDate: string; endDate: string } | undefined;
  handlePeriodChange: (newPeriod: PeriodType, range?: { startDate: string; endDate: string }) => void;

  // Preserved Organization & User State
  organization: Organization | undefined;
  gstProfile: GstProfile | null | undefined;
  userEmail: string | undefined;
  dataSource: string | undefined;

  // Dashboard Data & Loading
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;

  // Modal States
  selectedInvoice: InvoiceWithDetails | null;
  setSelectedInvoice: (inv: InvoiceWithDetails | null) => void;
  isInvoiceDetailOpen: boolean;
  setIsInvoiceDetailOpen: (open: boolean) => void;

  isRecordPaymentOpen: boolean;
  setIsRecordPaymentOpen: (open: boolean) => void;
  paymentInitialInvoice: InvoiceWithDetails | null;
  paymentInitialCustomerId: string | undefined;
  paymentInitialAmount: number | undefined;
  handleOpenRecordPayment: (inv?: InvoiceWithDetails, customerId?: string, amount?: number) => void;

  isCreateInvoiceOpen: boolean;
  setIsCreateInvoiceOpen: (open: boolean) => void;
  isAddCustomerOpen: boolean;
  setIsAddCustomerOpen: (open: boolean) => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;

  whatsAppItem: CollectionQueueItem | (InvoiceWithDetails & { customerName?: string; outstandingAmount?: number }) | null;
  isWhatsAppOpen: boolean;
  setIsWhatsAppOpen: (open: boolean) => void;
  handleQueueWhatsApp: (item: CollectionQueueItem) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string } | undefined>();

  // Validate path during render time so Next.js App Router's notFound() error is correctly thrown during render (not inside client-side useEffect)
  if (pathname) {
    const slug = pathname.replace('/dashboard', '').replace(/^\//, '');
    const validSlugs = [
      '',
      'sales',
      'invoices',
      'purchases',
      'customers',
      'inventory',
      'products',
      'receivables',
      'payments',
      'expenses',
      'reports',
      'settings',
      'whatsapp',
      'whatsapp_ai',
    ];
    if (!validSlugs.includes(slug)) {
      notFound();
    }
  }

  // Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [organization, setOrganization] = useState<Organization | undefined>(undefined);
  const [gstProfile, setGstProfile] = useState<GstProfile | null | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [dataSource, setDataSource] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize route state with pathname seamlessly
  useEffect(() => {
    if (pathname) {
      const slug = pathname.replace('/dashboard', '').replace(/^\//, '');
      const validSlugs = [
        '',
        'sales',
        'invoices',
        'purchases',
        'customers',
        'inventory',
        'products',
        'receivables',
        'payments',
        'expenses',
        'reports',
        'settings',
        'whatsapp',
        'whatsapp_ai',
      ];
      
      if (!validSlugs.includes(slug)) {
        return;
      }

      if (!slug) {
        setCurrentRoute('dashboard');
      } else if (slug === 'invoices' || slug === 'sales') {
        setCurrentRoute('sales');
      } else if (slug === 'purchases') {
        setCurrentRoute('purchases');
      } else if (slug === 'customers') {
        setCurrentRoute('customers');
      } else if (slug === 'inventory' || slug === 'products') {
        setCurrentRoute('inventory');
      } else if (slug === 'receivables') {
        setCurrentRoute('receivables');
      } else if (slug === 'payments') {
        setCurrentRoute('payments');
      } else if (slug === 'expenses') {
        setCurrentRoute('expenses');
      } else if (slug === 'reports') {
        setCurrentRoute('reports');
      } else if (slug === 'settings') {
        setCurrentRoute('settings');
      } else if (slug === 'whatsapp' || slug === 'whatsapp_ai') {
        setCurrentRoute('whatsapp_ai');
      }
    }
  }, [pathname]);

  const handleNavigate = (route: NavRoute) => {
    setCurrentRoute(route);
    if (route === 'dashboard') {
      router.push('/dashboard');
    } else {
      router.push('/dashboard/' + route);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDashboardData(period, undefined, customRange);

      if (data.isAuthenticated === false) {
        router.push('/login');
        return;
      }
      if (data.hasOrganization === false) {
        router.push('/onboarding');
        return;
      }

      setDashboardData(data);

      // Preserve existing organization data across fetches and route switches
      if (data.organization) {
        setOrganization(data.organization);
      }
      if (data.gstProfile !== undefined) {
        setGstProfile(data.gstProfile);
      }
      if (data.userEmail) {
        setUserEmail(data.userEmail);
      }
      if (data.dataSource) {
        setDataSource(data.dataSource);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'Unable to retrieve dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [period, customRange, router]);

  useEffect(() => {
    loadData();

    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(() => {
        loadData();
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [loadData]);

  const handlePeriodChange = (newPeriod: PeriodType, range?: { startDate: string; endDate: string }) => {
    setPeriod(newPeriod);
    if (range) {
      setCustomRange(range);
    }
  };

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentInitialInvoice, setPaymentInitialInvoice] = useState<InvoiceWithDetails | null>(null);
  const [paymentInitialCustomerId, setPaymentInitialCustomerId] = useState<string | undefined>();
  const [paymentInitialAmount, setPaymentInitialAmount] = useState<number | undefined>();

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [whatsAppItem, setWhatsAppItem] = useState<
    CollectionQueueItem | (InvoiceWithDetails & { customerName?: string; outstandingAmount?: number }) | null
  >(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const handleOpenRecordPayment = (inv?: InvoiceWithDetails, customerId?: string, amount?: number) => {
    setPaymentInitialInvoice(inv || null);
    setPaymentInitialCustomerId(customerId);
    setPaymentInitialAmount(amount);
    setIsRecordPaymentOpen(true);
  };

  const handleQueueWhatsApp = (item: CollectionQueueItem) => {
    setWhatsAppItem(item);
    setIsWhatsAppOpen(true);
  };

  return (
    <DashboardContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        handleNavigate,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        period,
        customRange,
        handlePeriodChange,
        organization,
        gstProfile,
        userEmail,
        dataSource,
        dashboardData,
        isLoading,
        error,
        loadData,
        selectedInvoice,
        setSelectedInvoice,
        isInvoiceDetailOpen,
        setIsInvoiceDetailOpen,
        isRecordPaymentOpen,
        setIsRecordPaymentOpen,
        paymentInitialInvoice,
        paymentInitialCustomerId,
        paymentInitialAmount,
        handleOpenRecordPayment,
        isCreateInvoiceOpen,
        setIsCreateInvoiceOpen,
        isAddCustomerOpen,
        setIsAddCustomerOpen,
        isAddProductOpen,
        setIsAddProductOpen,
        whatsAppItem,
        isWhatsAppOpen,
        setIsWhatsAppOpen,
        handleQueueWhatsApp,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return ctx;
}
