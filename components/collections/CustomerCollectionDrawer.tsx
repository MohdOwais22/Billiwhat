'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  ReceiptText,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ClockAlert,
  AlertTriangle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  CustomerReceivablesSummary,
  ReceivablesInvoiceItem,
} from '@/lib/services/collectionsService';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { Organization } from '@/types/database';

interface CustomerCollectionDrawerProps {
  customerSummary: CustomerReceivablesSummary | null;
  organization?: Organization | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (inv?: ReceivablesInvoiceItem, customerId?: string, amount?: number) => void;
  onOpenInvoiceDetail: (invoiceId: string) => void;
}

export function CustomerCollectionDrawer({
  customerSummary,
  organization,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onOpenInvoiceDetail,
}: CustomerCollectionDrawerProps) {
  const [templateLanguage, setTemplateLanguage] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');
  const [copiedStatement, setCopiedStatement] = useState(false);

  if (!isOpen || !customerSummary) return null;

  const businessName = organization?.name || organization?.legal_name || 'Accounts Department';
  const cleanPhone = (customerSummary.phone || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Build Statement Text for WhatsApp
  const invoiceLines = customerSummary.invoices
    .map(
      (inv) =>
        `• Inv #${inv.invoiceNumber} (Due: ${formatDate(inv.dueDate, 'short')}): *${formatINR(inv.balanceDue)}*`
    )
    .join('\n');

  const statementTemplates = {
    hinglish: `Namaste ${customerSummary.customerName} ji,

Yeh *${businessName}* se aapka outstanding account balance summary hai:

*Total Pending Balance:* *${formatINR(customerSummary.totalOutstanding)}*
*Open Invoices (${customerSummary.invoices.length}):*
${invoiceLines}

Kripya outstanding balance ko transfer/UPI dwara clear karein aur reference screenshot share karein reconciliation ke liye.

Dhanyawaad!
*${businessName}*`,

    english: `Dear ${customerSummary.customerName},

Greetings from *${businessName}*.

Here is the current outstanding statement for your account:

*Total Outstanding:* *${formatINR(customerSummary.totalOutstanding)}*
*Pending Invoices (${customerSummary.invoices.length}):*
${invoiceLines}

Kindly arrange payment via your preferred bank transfer or UPI channel at the earliest.

Thank you,
*${businessName}*`,

    hindi: `नमस्ते ${customerSummary.customerName} जी,

यह *${businessName}* की ओर से आपके खाते का बकाया विवरण है:

*कुल देय राशि:* *${formatINR(customerSummary.totalOutstanding)}*
*लंबित चालान (${customerSummary.invoices.length}):*
${invoiceLines}

कृपया उपरोक्त बकाया राशि का समय पर भुगतान कर सहयोग करें।

धन्यवाद!
*${businessName}*`,
  };

  const currentStatementMessage = statementTemplates[templateLanguage];
  const statementWaUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(currentStatementMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(currentStatementMessage)}`;

  const handleCopyStatement = () => {
    navigator.clipboard.writeText(currentStatementMessage);
    setCopiedStatement(true);
    setTimeout(() => setCopiedStatement(false), 2500);
  };

  const handleSendStatementWhatsApp = () => {
    window.open(statementWaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      id="customer-collection-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Party Collection Profile
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {customerSummary.customerName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
              {customerSummary.businessName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {customerSummary.businessName}
                </span>
              )}
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customerSummary.phone || 'No phone'}
              </span>
              {customerSummary.gstin && (
                <span className="font-mono text-slate-400">GST: {customerSummary.gstin}</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Outstanding</span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {formatINR(customerSummary.totalOutstanding)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {customerSummary.invoices.length} open bills
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current (Not Due)</span>
              <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                {formatINR(customerSummary.current)}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">On schedule</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overdue Debt</span>
              <span className="text-base font-bold text-rose-700 mt-0.5 block">
                {formatINR(customerSummary.days1to30 + customerSummary.days31to60 + customerSummary.days61to90 + customerSummary.days90Plus)}
              </span>
              <span className="text-[10px] text-rose-600 block mt-0.5">
                {customerSummary.overdueInvoicesCount} overdue
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Terms</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {customerSummary.creditDays ? `${customerSummary.creditDays} Days` : 'Net 0'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Limit: {customerSummary.creditLimit ? formatINR(customerSummary.creditLimit) : 'No limit'}
              </span>
            </div>
          </div>

          {/* Unsettled Invoices Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Unsettled Invoices ({customerSummary.invoices.length})
              </h3>
              <button
                onClick={() => onOpenRecordPayment(undefined, customerSummary.customerId, customerSummary.totalOutstanding)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Settle Full Balance</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Invoice Total</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {customerSummary.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onOpenInvoiceDetail(inv.id)}
                          className="font-mono font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </button>
                        <span className="text-[10px] text-slate-400 block">
                          {formatDate(inv.issueDate, 'short')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {inv.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-bold text-[11px] block">
                            {inv.daysOverdue}d overdue
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px] block">
                            Due {formatDate(inv.dueDate, 'short')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {inv.bucket}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatINR(inv.total)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                        {formatINR(inv.balanceDue)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onOpenRecordPayment(inv, customerSummary.customerId, inv.balanceDue)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WhatsApp Statement Composer */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Send Account Statement via WhatsApp</h3>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                {(['hinglish', 'english', 'hindi'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setTemplateLanguage(lang)}
                    className={`px-2 py-0.5 rounded capitalize font-medium transition cursor-pointer ${
                      templateLanguage === lang ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    {lang === 'hindi' ? 'हिन्दी' : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="relative p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-2xs">
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleCopyStatement}
                  className="p-1.5 bg-white border border-emerald-200 rounded-md text-slate-600 hover:text-slate-900 shadow-2xs transition flex items-center gap-1 text-[11px] cursor-pointer"
                  title="Copy Text"
                >
                  {copiedStatement ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              {currentStatementMessage}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendStatementWhatsApp}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {customerSummary.invoices.length} active invoices pending reconciliation
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
