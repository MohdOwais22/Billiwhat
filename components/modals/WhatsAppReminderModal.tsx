'use client';

import React, { useState } from 'react';
import { X, MessageSquareText, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { CollectionQueueItem, InvoiceWithDetails } from '@/types/database';
import { formatINR } from '@/lib/utils/formatters';

interface WhatsAppReminderModalProps {
  item: CollectionQueueItem | (InvoiceWithDetails & { customerName?: string; outstandingAmount?: number }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export function WhatsAppReminderModal({
  item,
  isOpen,
  onClose,
  onSent,
}: WhatsAppReminderModalProps) {
  const [templateLanguage, setTemplateLanguage] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');
  const [copied, setCopied] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  if (!isOpen || !item) return null;

  const anyItem = item as any;
  const customerName = anyItem.customerName || anyItem.customer?.company_name || anyItem.customer?.name || 'Valued Client';
  const outstandingAmount = typeof anyItem.outstandingAmount === 'number' ? anyItem.outstandingAmount : (anyItem.balance_due ?? anyItem.total_amount ?? 0);
  const invoiceNumber = anyItem.invoiceNumber || anyItem.invoice_number || 'WB/26-27/0842';
  const phone = anyItem.phone || anyItem.customer?.phone || '+91 98765 43210';

  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const templates = {
    hinglish: `Namaste ${customerName} ji,

Yeh *Shree Balaji Enterprises* se payment reminder hai.

Aapke Invoice *#${invoiceNumber}* ka balance *${formatINR(outstandingAmount)}* pending hai.

Kripya niche diye gaye UPI link se direct payment settle karein:
upi://pay?pa=shreebalaji@okaxis&pn=ShreeBalajiEnterprises&am=${outstandingAmount}&cu=INR

Payment ke baad screenshot share karein reconciliation ke liye. Dhanyawaad!`,

    english: `Dear ${customerName},

Greetings from *Shree Balaji Enterprises*.

This is a gentle payment reminder regarding Invoice *#${invoiceNumber}* with an outstanding balance of *${formatINR(outstandingAmount)}*.

Please settle the amount via our verified UPI or bank transfer:
UPI ID: shreebalaji@okaxis
Amount: ${formatINR(outstandingAmount)}

Thank you for your continued business partnership.`,

    hindi: `नमस्ते ${customerName} जी,

यह *श्री बालाजी एंटरप्राइजेज* की ओर से भुगतान अनुस्मारक है।

आपके चालान संख्या *#${invoiceNumber}* की बकाया राशि *${formatINR(outstandingAmount)}* देय है।

कृपया समय पर भुगतान कर सहयोग प्रदान करें।
UPI: shreebalaji@okaxis

धन्यवाद!`,
  };

  const currentMessage = templates[templateLanguage];
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(currentMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsLogged(true);
    setTimeout(() => {
      if (onSent) onSent();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs" id="whatsapp-reminder-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <MessageSquareText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">WhatsApp Payment Reminder</h3>
              <p className="text-xs text-emerald-100">
                Ready-to-send invoice summary with UPI payment link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient Party</span>
              <p className="font-bold text-slate-900">{customerName}</p>
              <p className="text-slate-500 font-mono text-[11px]">{phone}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Amount</span>
              <span className="text-sm font-extrabold text-rose-700">{formatINR(outstandingAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setTemplateLanguage('hinglish')}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition ${
                templateLanguage === 'hinglish' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Hinglish (Standard)
            </button>
            <button
              onClick={() => setTemplateLanguage('english')}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition ${
                templateLanguage === 'english' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setTemplateLanguage('hindi')}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition ${
                templateLanguage === 'hindi' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          <div className="relative p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-2xs">
            <div className="absolute top-2 right-2">
              <button
                onClick={handleCopy}
                className="p-1.5 bg-white border border-emerald-200 rounded-md text-slate-600 hover:text-slate-900 shadow-2xs transition flex items-center gap-1 text-[11px]"
                title="Copy Text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {currentMessage}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Opens WhatsApp directly with the pre-filled invoice and UPI payment link.</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleOpenWhatsApp}
              disabled={isLogged}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
              id="confirm-send-whatsapp-btn"
            >
              {isLogged ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Opened WhatsApp!</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
