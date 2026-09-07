'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  ReceiptText,
  CreditCard,
  MessageCircle,
  Edit3,
  Plus,
  ClockAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import { Customer, InvoiceWithDetails, PaymentWithCustomer } from '@/types/database';
import { formatINR, formatDate, getInvoiceStatusConfig } from '@/lib/utils/formatters';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceWithDetails[];
  payments: PaymentWithCustomer[];
  onEdit: (customer: Customer) => void;
  onCreateInvoice: (customer: Customer) => void;
  onRecordPayment: (customer: Customer, suggestedAmount?: number) => void;
  onSendWhatsApp: (customer: Customer, outstandingAmount: number) => void;
  onViewInvoice?: (invoice: InvoiceWithDetails) => void;
}

type DetailTab = 'invoices' | 'payments' | 'overview' | 'notes';

export function CustomerDetailModal({
  customer,
  isOpen,
  onClose,
  invoices,
  payments,
  onEdit,
  onCreateInvoice,
  onRecordPayment,
  onSendWhatsApp,
  onViewInvoice,
}: CustomerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('invoices');

  // Filter invoices for this specific customer
  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices
      .filter((inv) => inv.customer_id === customer.id)
      .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  }, [invoices, customer]);

  // Filter payments for this specific customer
  const customerPayments = useMemo(() => {
    if (!customer) return [];
    return payments
      .filter((p) => p.customer_id === customer.id)
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }, [payments, customer]);

  // Compute live receivables & credit metrics dynamically
  const customerFinancials = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let currentAmount = 0;
    let overdueCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    customerInvoices.forEach((inv) => {
      if (inv.status === 'cancelled') return;

      const total = Number(inv.total) || 0;
      const paid = Number(inv.amount_paid) || 0;
      const balance = Number(inv.balance_due) || Math.max(0, total - paid);

      totalInvoiced += total;
      totalPaid += paid;
      totalOutstanding += balance;

      if (balance > 0) {
        const isOverdue = Boolean(
          inv.due_date && new Date(inv.due_date).setHours(0, 0, 0, 0) < today.getTime()
        );
        if (isOverdue) {
          overdueAmount += balance;
          overdueCount += 1;
        } else {
          currentAmount += balance;
        }
      }
    });

    const creditLimit = Number(customer?.credit_limit) || 0;
    const hasCreditLimit = creditLimit > 0;
    const availableCredit = hasCreditLimit ? creditLimit - totalOutstanding : null;
    const isCreditExceeded = hasCreditLimit && totalOutstanding > creditLimit;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      currentAmount,
      overdueCount,
      invoiceCount: customerInvoices.length,
      paymentCount: customerPayments.length,
      creditLimit,
      hasCreditLimit,
      availableCredit,
      isCreditExceeded,
    };
  }, [customerInvoices, customerPayments, customer]);

  if (!isOpen || !customer) return null;

  const displayName = customer.business_name || customer.name;
  const contactName = customer.name && customer.business_name && customer.name !== customer.business_name ? customer.name : null;

  const handleDirectWhatsApp = () => {
    const rawPhone = (customer.whatsapp_phone || customer.phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone) return;

    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(
      `Hello ${displayName},\nThis is a friendly statement update regarding your account ledger. Your current outstanding balance is ${formatINR(
        customerFinancials.totalOutstanding
      )}.\nPlease let us know if you need any clarification or the invoice copies.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      id="customer-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 truncate tracking-tight">{displayName}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    customer.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {customer.is_active ? 'Active Customer' : 'Inactive'}
                </span>
                {customer.gstin ? (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    GSTIN: {customer.gstin}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                    Unregistered
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                {contactName && <span>Contact: <strong>{contactName}</strong></span>}
                <span className="font-mono text-slate-600">{customer.phone}</span>
                {customer.email && <span className="text-slate-500">{customer.email}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => onEdit(customer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
              title="Edit customer details"
              id="detail-edit-customer-btn"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Highlights & Receivables Summary */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Outstanding */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Outstanding
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
              {formatINR(customerFinancials.totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Overdue:</span>
              <span className={customerFinancials.overdueAmount > 0 ? 'text-rose-400 font-bold font-mono' : 'text-slate-400 font-mono'}>
                {formatINR(customerFinancials.overdueAmount)}
              </span>
            </div>
          </div>

          {/* Credit Limit & Available Credit */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Credit Limit
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {customerFinancials.hasCreditLimit ? formatINR(customerFinancials.creditLimit) : 'Not set'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Available:</span>
              <span
                className={`font-mono font-bold ${
                  !customerFinancials.hasCreditLimit
                    ? 'text-slate-400'
                    : customerFinancials.availableCredit! < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {customerFinancials.hasCreditLimit ? formatINR(customerFinancials.availableCredit!) : 'Not set'}
              </span>
            </div>
          </div>

          {/* Total Invoiced */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Invoiced
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatINR(customerFinancials.totalInvoiced)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Invoices:</span>
              <span className="text-slate-300 font-bold">{customerFinancials.invoiceCount}</span>
            </div>
          </div>

          {/* Credit Terms */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Credit Terms
            </span>
            <div className="text-lg sm:text-xl font-bold text-white">
              {customer.credit_days > 0 ? `${customer.credit_days} Days` : 'Immediate (Net 0)'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Paid To Date:</span>
              <span className="text-slate-300 font-mono">{formatINR(customerFinancials.totalPaid)}</span>
            </div>
          </div>
        </div>

        {/* Credit Limit Alert Banner */}
        {customerFinancials.isCreditExceeded && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-y border-amber-500/20 text-amber-900 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Notice:</strong> This customer has exceeded their configured credit limit by{' '}
                <strong className="font-mono text-rose-700">{formatINR(Math.abs(customerFinancials.availableCredit!))}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Invoices ({customerFinancials.invoiceCount})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Payments ({customerFinancials.paymentCount})
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Party Profile & Addresses
            </button>
            {customer.notes && (
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Notes
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onCreateInvoice(customer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
              id="customer-new-invoice-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>

            {customerFinancials.totalOutstanding > 0 && (
              <button
                onClick={() => onRecordPayment(customer, customerFinancials.totalOutstanding)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                id="customer-record-payment-btn"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            {(customer.whatsapp_phone || customer.phone) && customerFinancials.totalOutstanding > 0 && (
              <button
                onClick={handleDirectWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                title="Send WhatsApp payment reminder"
                id="customer-whatsapp-reminder-btn"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {customerInvoices.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No invoices issued for this customer yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Create a GST tax invoice to initiate credit ledger and billing history.
                  </p>
                  <button
                    onClick={() => onCreateInvoice(customer)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Invoice</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right">Balance Due</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customerInvoices.map((inv) => {
                        const statusConfig = getInvoiceStatusConfig(inv.status);
                        const isOverdue = inv.balance_due > 0 && inv.days_overdue > 0;
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {inv.invoice_number}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{formatDate(inv.issue_date)}</td>
                            <td className="py-3 px-4">
                              {inv.due_date ? (
                                <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                  {formatDate(inv.due_date)}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {formatINR(inv.total)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium">
                              {formatINR(inv.amount_paid)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              <span className={inv.balance_due > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-600') : 'text-slate-400'}>
                                {formatINR(inv.balance_due)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.badgeClass}`}
                              >
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {onViewInvoice && (
                                <button
                                  onClick={() => onViewInvoice(inv)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                                  title="View Invoice Details"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {customerPayments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No payment records found for this customer</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Recorded settlements via UPI, Bank Transfer, Cash, or Cheque will appear here.
                  </p>
                  {customerFinancials.totalOutstanding > 0 && (
                    <button
                      onClick={() => onRecordPayment(customer, customerFinancials.totalOutstanding)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment Mode</th>
                        <th className="py-3 px-4">Reference / UTR / Cheque</th>
                        <th className="py-3 px-4">Allocated Invoice</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customerPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 text-slate-600">{formatDate(p.paid_at)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600">{formatINR(p.amount)}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                              {p.method.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {p.reference || <span className="text-slate-400 font-sans">-</span>}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900 font-semibold">
                            {p.invoice?.invoice_number || (p.invoice_id ? 'Linked' : 'On Account')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                p.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="capitalize">{p.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OVERVIEW & ADDRESSES */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity & Contact Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Customer Identity & Contacts</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Trade / Business Name</span>
                    <span className="font-bold text-slate-900">{customer.business_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Contact Person / Owner</span>
                    <span className="font-semibold text-slate-800">{customer.name || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Primary Phone</span>
                      <span className="font-mono font-semibold text-slate-900">{customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">WhatsApp Phone</span>
                      <span className="font-mono font-semibold text-slate-900">{customer.whatsapp_phone || customer.phone}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email Address</span>
                    <span className="text-slate-800">{customer.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">GST Identification Number (GSTIN)</span>
                    <span className="font-mono font-bold text-slate-900">{customer.gstin || 'Unregistered'}</span>
                  </div>
                </div>
              </div>

              {/* Credit Terms & Ledger Info */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>Credit Policy & Terms</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Credit Limit:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {customerFinancials.hasCreditLimit ? formatINR(customerFinancials.creditLimit) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Outstanding:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(customerFinancials.totalOutstanding)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Available Credit:</span>
                    <span
                      className={`font-mono font-bold ${
                        !customerFinancials.hasCreditLimit
                          ? 'text-slate-500'
                          : customerFinancials.availableCredit! < 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {customerFinancials.hasCreditLimit ? formatINR(customerFinancials.availableCredit!) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Credit Period (Payment Terms):</span>
                    <span className="font-semibold text-slate-900">
                      {customer.credit_days > 0 ? `${customer.credit_days} Days` : 'Immediate / Net 0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Member Since:</span>
                    <span className="text-slate-700">{formatDate(customer.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 md:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Registered Addresses</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold mb-1">Billing Address</span>
                    <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed min-h-[60px]">
                      {customer.billing_address && customer.billing_address !== 'N/A'
                        ? customer.billing_address
                        : 'No billing address recorded.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold mb-1">Shipping / Delivery Address</span>
                    <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed min-h-[60px]">
                      {customer.shipping_address
                        ? customer.shipping_address
                        : customer.billing_address && customer.billing_address !== 'N/A'
                        ? `${customer.billing_address} (Same as billing)`
                        : 'No shipping address recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Internal Account Notes</span>
              </h4>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed p-3 bg-white rounded-lg border border-slate-200">
                {customer.notes || 'No internal notes added.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
