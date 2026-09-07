'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Building2,
  Phone,
  MessageCircle,
  CreditCard,
  ReceiptText,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  ClockAlert,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { Customer, InvoiceWithDetails, PaymentWithCustomer } from '@/types/database';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { deleteCustomer } from '@/lib/services/dashboardService';
import { AddCustomerModal } from '@/components/modals/AddCustomerModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';

type FilterTab = 'all' | 'active' | 'inactive' | 'credit' | 'outstanding' | 'overdue';
type SortOption = 'outstanding_high' | 'name_asc' | 'name_desc' | 'credit_limit_high' | 'newest';

export function CustomersPage() {
  const {
    dashboardData,
    isLoading,
    loadData,
    isAddCustomerOpen,
    setIsAddCustomerOpen,
    setIsCreateInvoiceOpen,
    handleOpenRecordPayment,
    handleQueueWhatsApp,
    setSelectedInvoice,
    setIsInvoiceDetailOpen,
  } = useDashboard();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('outstanding_high');

  // Modal selections
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Deletion feedback
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const rawCustomers = dashboardData?.customers || [];
  const allInvoices = dashboardData?.recentInvoices || [];
  const allPayments = dashboardData?.recentPayments || [];

  // Compute live per-customer balance and overdue maps from actual invoices and payments
  const customerFinancialMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalInvoiced: number;
        totalPaid: number;
        totalOutstanding: number;
        overdueAmount: number;
        invoiceCount: number;
        hasOverdue: boolean;
      }
    >();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize all customers
    rawCustomers.forEach((c) => {
      map.set(c.id, {
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        overdueAmount: 0,
        invoiceCount: 0,
        hasOverdue: false,
      });
    });

    // Populate from all invoices
    allInvoices.forEach((inv) => {
      if (inv.status === 'cancelled') return;

      const custEntry = map.get(inv.customer_id);
      if (!custEntry) return;

      const total = Number(inv.total) || 0;
      const paid = Number(inv.amount_paid) || 0;
      const balance = Number(inv.balance_due) || Math.max(0, total - paid);

      custEntry.totalInvoiced += total;
      custEntry.totalPaid += paid;
      custEntry.totalOutstanding += balance;
      custEntry.invoiceCount += 1;

      const isOverdue = Boolean(
        inv.due_date && new Date(inv.due_date).setHours(0, 0, 0, 0) < today.getTime()
      );

      if (balance > 0 && isOverdue) {
        custEntry.overdueAmount += balance;
        custEntry.hasOverdue = true;
      }
    });

    return map;
  }, [rawCustomers, allInvoices]);

  // Overall Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalCustomers = rawCustomers.length;
    let activeCreditParties = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;

    rawCustomers.forEach((c) => {
      const fin = customerFinancialMap.get(c.id);
      const isCreditParty = (c.credit_limit && c.credit_limit > 0) || (c.credit_days && c.credit_days > 0) || (fin && fin.totalOutstanding > 0);
      if (isCreditParty && c.is_active) {
        activeCreditParties += 1;
      }

      if (fin) {
        totalOutstanding += fin.totalOutstanding;
        overdueAmount += fin.overdueAmount;
      }
    });

    return {
      totalCustomers,
      activeCreditParties,
      totalOutstanding,
      overdueAmount,
    };
  }, [rawCustomers, customerFinancialMap]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let credit = 0;
    let outstanding = 0;
    let overdue = 0;

    rawCustomers.forEach((c) => {
      if (c.is_active) active += 1;
      else inactive += 1;

      if ((c.credit_limit && c.credit_limit > 0) || (c.credit_days && c.credit_days > 0)) {
        credit += 1;
      }

      const fin = customerFinancialMap.get(c.id);
      if (fin && fin.totalOutstanding > 0) {
        outstanding += 1;
      }
      if (fin && fin.overdueAmount > 0) {
        overdue += 1;
      }
    });

    return {
      all: rawCustomers.length,
      active,
      inactive,
      credit,
      outstanding,
      overdue,
    };
  }, [rawCustomers, customerFinancialMap]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return rawCustomers
      .filter((c) => {
        // Tab Filter
        const fin = customerFinancialMap.get(c.id);

        if (activeTab === 'active' && !c.is_active) return false;
        if (activeTab === 'inactive' && c.is_active) return false;
        if (activeTab === 'credit' && !((c.credit_limit && c.credit_limit > 0) || (c.credit_days && c.credit_days > 0))) return false;
        if (activeTab === 'outstanding' && (!fin || fin.totalOutstanding <= 0)) return false;
        if (activeTab === 'overdue' && (!fin || fin.overdueAmount <= 0)) return false;

        // Search Filter
        if (query) {
          const matchBusiness = c.business_name?.toLowerCase().includes(query);
          const matchName = c.name?.toLowerCase().includes(query);
          const matchPhone = c.phone?.includes(query);
          const matchWhatsapp = c.whatsapp_phone?.includes(query);
          const matchGstin = c.gstin?.toLowerCase().includes(query);
          const matchEmail = c.email?.toLowerCase().includes(query);

          if (!matchBusiness && !matchName && !matchPhone && !matchWhatsapp && !matchGstin && !matchEmail) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const finA = customerFinancialMap.get(a.id);
        const finB = customerFinancialMap.get(b.id);

        switch (sortBy) {
          case 'outstanding_high':
            return (finB?.totalOutstanding || 0) - (finA?.totalOutstanding || 0);
          case 'name_asc': {
            const nameA = (a.business_name || a.name || '').toLowerCase();
            const nameB = (b.business_name || b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          }
          case 'name_desc': {
            const nameA = (a.business_name || a.name || '').toLowerCase();
            const nameB = (b.business_name || b.name || '').toLowerCase();
            return nameB.localeCompare(nameA);
          }
          case 'credit_limit_high':
            return (b.credit_limit || 0) - (a.credit_limit || 0);
          case 'newest':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [rawCustomers, searchTerm, activeTab, sortBy, customerFinancialMap]);

  // Handlers
  const handleOpenDetail = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setIsEditModalOpen(true);
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    const custName = cust.business_name || cust.name;
    const confirm = window.confirm(`Are you sure you want to remove or archive customer "${custName}"?`);
    if (!confirm) return;

    try {
      setDeletingId(cust.id);
      setActionNotice(null);
      const res = await deleteCustomer(cust.id);
      setActionNotice({ type: 'success', message: res.message });
      await loadData();
      if (selectedCustomer?.id === cust.id) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err?.message || 'Failed to remove customer.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleWhatsAppAction = (cust: Customer, outstanding: number) => {
    const rawPhone = (cust.whatsapp_phone || cust.phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone) return;

    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const custName = cust.business_name || cust.name;
    const text = encodeURIComponent(
      `Hello ${custName},\nThis is an account statement update regarding your current outstanding balance of ${formatINR(
        outstanding
      )}.\nPlease let us know if you have any questions or require updated invoices.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;

    const headers = ['Business Name', 'Contact Person', 'Phone', 'WhatsApp', 'GSTIN', 'Credit Limit', 'Credit Days', 'Total Outstanding', 'Overdue Amount', 'Status'];
    const rows = filteredCustomers.map((c) => {
      const fin = customerFinancialMap.get(c.id);
      return [
        `"${c.business_name || ''}"`,
        `"${c.name || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.whatsapp_phone || ''}"`,
        `"${c.gstin || 'Unregistered'}"`,
        c.credit_limit || 0,
        c.credit_days || 0,
        fin?.totalOutstanding || 0,
        fin?.overdueAmount || 0,
        c.is_active ? 'Active' : 'Inactive',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6" id="customers-module-page">
      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customers & Credit Parties
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage wholesale buyer accounts, credit limits, payment terms, and dynamic receivables
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition disabled:opacity-40 cursor-pointer"
            id="export-customers-csv-btn"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            id="primary-add-customer-btn"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Customers</span>
            <div className="text-2xl font-bold text-slate-900">{summaryMetrics.totalCustomers}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Registered buyer accounts</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Credit Parties */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Active Credit Parties</span>
            <div className="text-2xl font-bold text-slate-900">{summaryMetrics.activeCreditParties}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">With credit terms & limits</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Outstanding</span>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {formatINR(summaryMetrics.totalOutstanding)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Live across all active invoices</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ReceiptText className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Overdue Amount</span>
            <div className={`text-2xl font-bold font-mono ${summaryMetrics.overdueAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatINR(summaryMetrics.overdueAmount)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Past agreed payment credit terms</span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${summaryMetrics.overdueAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            <ClockAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search, Filter Tabs & Sort Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business name, contact, phone, GSTIN..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
              id="search-customers-input"
            />
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              id="sort-customers-select"
            >
              <option value="outstanding_high">Highest Outstanding</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="credit_limit_high">Highest Credit Limit</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Customers ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({tabCounts.active})
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Credit Parties ({tabCounts.credit})
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'outstanding'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Has Outstanding ({tabCounts.outstanding})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Overdue ({tabCounts.overdue})
          </button>
          {tabCounts.inactive > 0 && (
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'inactive'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Inactive ({tabCounts.inactive})
            </button>
          )}
        </div>
      </div>

      {/* Main Customers List / Table */}
      {rawCustomers.length === 0 ? (
        /* Empty Database State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs" id="customers-empty-state">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No customers yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Add your first customer to start invoicing and tracking receivables.
          </p>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            id="empty-add-customer-btn"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        /* Search / Filter Zero Result State */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No matching customers</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            No customers match your search criteria or active tab filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveTab('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Customer / Business</th>
                    <th className="py-3.5 px-4">Phone / WhatsApp</th>
                    <th className="py-3.5 px-4">GSTIN</th>
                    <th className="py-3.5 px-4 text-right">Credit Limit</th>
                    <th className="py-3.5 px-4 text-right">Outstanding</th>
                    <th className="py-3.5 px-4">Credit Terms</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredCustomers.map((cust) => {
                    const fin = customerFinancialMap.get(cust.id);
                    const outstanding = fin?.totalOutstanding || 0;
                    const overdue = fin?.overdueAmount || 0;
                    const isCreditExceeded = cust.credit_limit && cust.credit_limit > 0 && outstanding > cust.credit_limit;

                    return (
                      <tr
                        key={cust.id}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                        onClick={() => handleOpenDetail(cust)}
                      >
                        {/* Customer / Business */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                                {cust.business_name || cust.name}
                              </div>
                              {cust.business_name && cust.name && cust.name !== cust.business_name && (
                                <div className="text-[11px] text-slate-400 truncate">{cust.name}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone / WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-900">{cust.phone}</div>
                          {cust.whatsapp_phone && cust.whatsapp_phone !== cust.phone && (
                            <div className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                              <span>WA:</span>
                              <span>{cust.whatsapp_phone}</span>
                            </div>
                          )}
                        </td>

                        {/* GSTIN */}
                        <td className="py-3.5 px-4">
                          {cust.gstin ? (
                            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {cust.gstin}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Unregistered</span>
                          )}
                        </td>

                        {/* Credit Limit */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                          {cust.credit_limit && cust.credit_limit > 0 ? (
                            formatINR(cust.credit_limit)
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">Not set</span>
                          )}
                        </td>

                        {/* Outstanding Balance */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-slate-900">
                            {formatINR(outstanding)}
                          </div>
                          {overdue > 0 ? (
                            <div className="text-[10px] font-mono font-bold text-rose-600">
                              Overdue: {formatINR(overdue)}
                            </div>
                          ) : isCreditExceeded ? (
                            <div className="text-[10px] font-bold text-amber-600">
                              Limit Exceeded
                            </div>
                          ) : outstanding > 0 ? (
                            <div className="text-[10px] text-emerald-600">
                              Current Balance
                            </div>
                          ) : null}
                        </td>

                        {/* Credit Terms */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-700">
                            {cust.credit_days > 0 ? `${cust.credit_days} Days` : 'Immediate (Net 0)'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              cust.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {cust.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {/* WhatsApp Direct */}
                            {(cust.whatsapp_phone || cust.phone) && outstanding > 0 && (
                              <button
                                onClick={() => handleWhatsAppAction(cust, outstanding)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Send WhatsApp balance update"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Record Payment */}
                            {outstanding > 0 && (
                              <button
                                onClick={() => handleOpenRecordPayment(undefined, cust.id, outstanding)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Record Settlement Payment"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(cust)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Customer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete / Archive */}
                            <button
                              onClick={() => handleDeleteCustomer(cust)}
                              disabled={deletingId === cust.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete / Archive Customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="block md:hidden space-y-3">
            {filteredCustomers.map((cust) => {
              const fin = customerFinancialMap.get(cust.id);
              const outstanding = fin?.totalOutstanding || 0;
              const overdue = fin?.overdueAmount || 0;

              return (
                <div
                  key={cust.id}
                  onClick={() => handleOpenDetail(cust)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {cust.business_name || cust.name}
                      </div>
                      {cust.business_name && cust.name && cust.name !== cust.business_name && (
                        <div className="text-xs text-slate-400">{cust.name}</div>
                      )}
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{cust.phone}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        cust.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cust.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Outstanding</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(outstanding)}
                      </span>
                      {overdue > 0 && (
                        <span className="block text-[10px] font-mono font-bold text-rose-600">
                          Overdue: {formatINR(overdue)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Credit Limit</span>
                      <span className="font-mono text-slate-700">
                        {cust.credit_limit && cust.credit_limit > 0 ? formatINR(cust.credit_limit) : 'Not set'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-slate-500">
                      Terms: {cust.credit_days > 0 ? `${cust.credit_days}d` : 'Net 0'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {outstanding > 0 && (
                        <button
                          onClick={() => handleWhatsAppAction(cust, outstanding)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg"
                        >
                          WhatsApp
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Global & Sub Modals */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={async () => {
          setIsAddCustomerOpen(false);
          await loadData();
          setActionNotice({ type: 'success', message: 'Customer successfully added to database.' });
        }}
      />

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCustomer(null);
          }}
          onSuccess={async () => {
            setIsEditModalOpen(false);
            setEditingCustomer(null);
            await loadData();
            setActionNotice({ type: 'success', message: 'Customer profile updated successfully.' });
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCustomer(null);
          }}
          invoices={allInvoices}
          payments={allPayments}
          onEdit={(cust) => {
            setIsDetailModalOpen(false);
            handleOpenEdit(cust);
          }}
          onCreateInvoice={(cust) => {
            setIsDetailModalOpen(false);
            setIsCreateInvoiceOpen(true);
          }}
          onRecordPayment={(cust, amount) => {
            setIsDetailModalOpen(false);
            handleOpenRecordPayment(undefined, cust.id, amount);
          }}
          onSendWhatsApp={(cust, amt) => {
            handleWhatsAppAction(cust, amt);
          }}
          onViewInvoice={(inv) => {
            setIsDetailModalOpen(false);
            setSelectedInvoice(inv);
            setIsInvoiceDetailOpen(true);
          }}
        />
      )}
    </div>
  );
}
