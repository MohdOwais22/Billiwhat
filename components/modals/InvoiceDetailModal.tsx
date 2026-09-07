'use client';

import React, { useEffect, useState } from 'react';
import { X, ReceiptText, Phone, CreditCard, Send, Clock } from 'lucide-react';
import { InvoiceWithDetails, Payment } from '@/types/database';
import { formatDate, formatINR, getInvoiceStatusConfig, getPaymentMethodConfig } from '@/lib/utils/formatters';
import { getInvoicePaymentHistory } from '@/lib/services/dashboardService';
import { APP_NAME } from '@/config/brand';

interface InvoiceDetailModalProps {
  invoice: InvoiceWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (invoice: InvoiceWithDetails) => void;
  onSendWhatsAppReminder: (invoice: InvoiceWithDetails) => void;
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onRecordPayment,
  onSendWhatsAppReminder,
}: InvoiceDetailModalProps) {
  const [history, setHistory] = useState<{
    payments: Payment[];
    totalPaid: number;
    totalAmount: number;
    outstanding: number;
  }>({
    payments: [],
    totalPaid: 0,
    totalAmount: 0,
    outstanding: 0,
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      setLoadingHistory(true);
      getInvoicePaymentHistory(invoice.id)
        .then((res) => {
          setHistory(res);
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const statusConfig = getInvoiceStatusConfig(invoice.status);
  const customer = invoice.customer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs" id="invoice-detail-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {invoice.invoice_number}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${statusConfig.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}></span>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">Tax Invoice • {APP_NAME} Core Ledger</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
            aria-label="Close modal"
            id="invoice-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed Party (Customer)
              </span>
              <p className="text-sm font-bold text-slate-900">
                {customer?.business_name || customer?.name || 'Customer'}
              </p>
              {customer?.business_name && customer.name && (
                <p className="text-xs text-slate-600 font-medium">{customer.name}</p>
              )}
              {customer?.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {customer.phone}
                </p>
              )}
              {customer?.gstin && (
                <p className="text-xs font-mono text-slate-600 mt-1">
                  GSTIN: <span className="font-semibold">{customer.gstin}</span>
                </p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Invoice Details
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Issue Date:</span>
                <span className="font-semibold text-slate-900">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Due Date:</span>
                <span className={`font-semibold ${invoice.days_overdue > 0 ? 'text-rose-700 font-bold' : 'text-slate-900'}`}>
                  {formatDate(invoice.due_date)} {invoice.days_overdue > 0 && `(${invoice.days_overdue}d overdue)`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Terms:</span>
                <span className="font-medium text-slate-700">
                  {customer?.credit_days && customer.credit_days > 0
                    ? `${customer.credit_days} Days Credit`
                    : 'Net / Immediate'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono font-medium">{formatINR(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>GST Total (CGST + SGST / IGST):</span>
              <span className="font-mono font-medium">{formatINR(invoice.cgst + invoice.sgst + invoice.igst + invoice.cess)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Invoice Amount:</span>
              <span className="font-mono">{formatINR(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 font-semibold pt-1">
              <span>Amount Paid / Settled:</span>
              <span className="font-mono">-{formatINR(invoice.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
              <span>Remaining Balance Due:</span>
              <span className={`font-mono ${invoice.balance_due > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {formatINR(invoice.balance_due)}
              </span>
            </div>
          </div>

          {/* Payment History Timeline */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment History Timeline</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                Total Paid: {formatINR(history.totalPaid)}
              </span>
            </div>

            {loadingHistory ? (
              <p className="text-xs text-slate-400 py-2 animate-pulse">Loading payment settlements...</p>
            ) : history.payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">No payment receipts recorded for this invoice yet.</p>
            ) : (
              <div className="space-y-2">
                {history.payments.map((p) => {
                  const methodConf = getPaymentMethodConfig(p.method);
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700">{formatINR(p.amount)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${methodConf.badgeClass}`}>
                            {methodConf.label}
                          </span>
                        </div>
                        {p.metadata?.notes && <p className="text-[11px] text-slate-500 mt-0.5">{p.metadata.notes}</p>}
                      </div>
                      <div className="text-right text-[11px] text-slate-500 font-sans">
                        <span>{formatDate(p.paid_at, 'medium')}</span>
                        {p.reference && (
                          <span className="block text-[10px] text-slate-400 font-mono">Ref: {p.reference}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {invoice.notes && (
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
              {invoice.notes}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onSendWhatsAppReminder(invoice);
              }}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition flex items-center gap-1.5 shadow-2xs"
              id="invoice-modal-whatsapp-btn"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Reminder</span>
            </button>

            {invoice.balance_due > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                id="invoice-modal-collect-btn"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment ({formatINR(invoice.balance_due)})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
