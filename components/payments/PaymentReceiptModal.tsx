'use client';

import React, { useRef, useState } from 'react';
import { X, Printer, Share2, Copy, Check, Building2, CheckCircle2, FileText, ArrowDownLeft } from 'lucide-react';
import { EnrichedPayment } from '@/lib/services/paymentsService';
import { Organization } from '@/types/database';
import { formatINR, getPaymentMethodConfig } from '@/lib/utils/formatters';

interface PaymentReceiptModalProps {
  payment: EnrichedPayment | null;
  organization: Organization;
  onClose: () => void;
}

export function PaymentReceiptModal({
  payment,
  organization,
  onClose,
}: PaymentReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!payment) return null;

  const cust = payment.customer;
  const inv = payment.invoice;
  const custName = cust?.business_name || cust?.name || 'Valued Customer';
  const methodConfig = getPaymentMethodConfig((payment.method as any) || 'cash');

  const formattedDate = new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const receiptSummaryText = `*PAYMENT ACKNOWLEDGEMENT RECEIPT*
Organization: ${organization.name}
Receipt No: RCP-${payment.id.slice(0, 8).toUpperCase()}
Date: ${formattedDate}
Customer: ${custName}
Amount Received: ₹${(Number(payment.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Payment Mode: ${methodConfig.label}
${payment.reference ? `Reference / UTR: ${payment.reference}\n` : ''}${inv ? `Allocated Invoice: #${inv.invoice_number}\nRemaining Invoice Balance: ₹${(payment.invoiceBalanceRemaining || 0).toLocaleString('en-IN')}\n` : ''}Status: ${payment.status.toUpperCase()}

Thank you for your business!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(receiptSummaryText);
    const phone = cust?.whatsapp_phone || cust?.phone;
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      id="payment-receipt-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Official Payment Receipt
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded-full">
              SETTLED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              id="print-receipt-btn"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              id="whatsapp-receipt-btn"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="printable-receipt-content">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
                  W
                </div>
                <h2 className="text-lg font-bold text-slate-900">{organization.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Official Money & Payment Receipt</p>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase font-bold text-slate-400">Receipt Voucher</div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                RCP-{payment.id.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{formattedDate}</div>
            </div>
          </div>

          {/* Customer & Payment Meta Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Received From (Payer)
              </span>
              <div className="font-bold text-slate-900 text-sm">{custName}</div>
              {cust?.business_name && cust?.name && (
                <div className="text-slate-600 mt-0.5">Attn: {cust.name}</div>
              )}
              {cust?.phone && <div className="text-slate-500 mt-0.5">Phone: {cust.phone}</div>}
              {cust?.gstin && <div className="text-slate-500 font-mono mt-0.5">GSTIN: {cust.gstin}</div>}
              {cust?.billing_address && cust.billing_address !== 'N/A' && (
                <div className="text-slate-500 mt-0.5 truncate">{cust.billing_address}</div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Settlement Details
              </span>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-semibold text-slate-900 capitalize">{methodConfig.label}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-emerald-700 uppercase font-mono">
                  {payment.status}
                </span>
              </div>
              {payment.reference && (
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">UTR / Ref No:</span>
                  <span className="font-mono text-slate-800 font-bold">{payment.reference}</span>
                </div>
              )}
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Gateway:</span>
                <span className="text-slate-700">{payment.gateway || 'Manual / Cash Counter'}</span>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Amount Received
              </span>
              <span className="text-xs text-emerald-700">Indian Rupees</span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-950">
              {formatINR(Number(payment.amount) || 0)}
            </div>
          </div>

          {/* Invoice Allocation Info */}
          {inv ? (
            <div className="p-3.5 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-700 pb-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Allocated Invoice: #{inv.invoice_number}</span>
                </span>
                <span className="text-slate-500">Dated: {inv.issue_date}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Invoice Total</span>
                  <span className="font-mono font-semibold text-slate-800">{formatINR(inv.total)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Amount Applied</span>
                  <span className="font-mono font-bold text-emerald-700">{formatINR(payment.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Remaining Balance</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(payment.invoiceBalanceRemaining ?? Math.max(0, Number(inv.total) - Number(payment.amount)))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Direct Customer Account Deposit / Unallocated Advance Credit</span>
            </div>
          )}

          {/* Notes if present */}
          {payment.metadata?.notes && (
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-600">Notes: </span>
              {payment.metadata.notes}
            </div>
          )}

          {/* Sign-off Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span>Generated electronically via WhatsBill</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-600">Authorized Signatory</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{organization.name}</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            id="copy-receipt-text-btn"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Summary' : 'Copy Text'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
