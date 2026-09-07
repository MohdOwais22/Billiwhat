'use client';

import React, { useState } from 'react';
import { X, MessageSquareText, Copy, Check, ExternalLink } from 'lucide-react';
import { CollectionQueueItem, InvoiceWithDetails, Organization } from '@/types/database';
import { formatINR } from '@/lib/utils/formatters';

interface WhatsAppReminderModalProps {
  item: CollectionQueueItem | (InvoiceWithDetails & { customerName?: string; outstandingAmount?: number }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
  organization?: Organization | null;
}

export function WhatsAppReminderModal({
  item,
  isOpen,
  onClose,
  onSent,
  organization,
}: WhatsAppReminderModalProps) {
  const [templateLanguage, setTemplateLanguage] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const anyItem = item as any;
  const customerName = anyItem.customerName || anyItem.customer?.business_name || anyItem.customer?.name || 'Customer';
  const outstandingAmount = typeof anyItem.outstandingAmount === 'number' ? anyItem.outstandingAmount : (anyItem.balance_due ?? anyItem.total ?? 0);
  const invoiceNumber = anyItem.invoiceNumber || anyItem.invoice_number || 'Pending Invoice';
  const phone = anyItem.phone || anyItem.customer?.phone || anyItem.customer?.whatsapp_phone || anyItem.whatsappPhone || '';

  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const businessName = organization?.name || organization?.legal_name || 'Accounts Department';

  const templates = {
    hinglish: `Namaste ${customerName} ji,

Yeh *${businessName}* se payment reminder hai.

Aapke Invoice *#${invoiceNumber}* ka balance *${formatINR(outstandingAmount)}* pending hai.

Kripya payment jald se jald transfer/UPI se settle karein aur reference screenshot share karein reconciliation ke liye.

Dhanyawaad!
*${businessName}*`,

    english: `Dear ${customerName},

Greetings from *${businessName}*.

This is a gentle payment reminder regarding Invoice *#${invoiceNumber}* with an outstanding balance of *${formatINR(outstandingAmount)}*.

Kindly remit the payment via your preferred bank transfer or UPI mode and share the transaction reference for ledger update.

Thank you,
*${businessName}*`,

    hindi: `नमस्ते ${customerName} जी,

यह *${businessName}* की ओर से भुगतान अनुस्मारक है।

आपके चालान संख्या *#${invoiceNumber}* की बकाया राशि *${formatINR(outstandingAmount)}* देय है।

कृपया समय पर भुगतान कर सहयोग प्रदान करें और भुगतान पावती साझा करें।

धन्यवाद!
*${businessName}*`,
  };

  const currentMessage = templates[templateLanguage];
  const waUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(currentMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(currentMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      if (onSent) onSent();
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      id="whatsapp-reminder-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <MessageSquareText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">WhatsApp Payment Reminder</h3>
              <p className="text-xs text-emerald-100">
                Ready-to-send payment follow-up message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient Party</span>
              <p className="font-bold text-slate-900">{customerName}</p>
              <p className="text-slate-500 font-mono text-[11px]">{phone || 'No phone recorded'}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Amount</span>
              <span className="text-sm font-extrabold text-rose-700">{formatINR(outstandingAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setTemplateLanguage('hinglish')}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition cursor-pointer ${
                templateLanguage === 'hinglish' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Hinglish
            </button>
            <button
              onClick={() => setTemplateLanguage('english')}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition cursor-pointer ${
                templateLanguage === 'english' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setTemplateLanguage('hindi')}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition cursor-pointer ${
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
                className="p-1.5 bg-white border border-emerald-200 rounded-md text-slate-600 hover:text-slate-900 shadow-2xs transition flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copy Text"
              >
                {copied ? (
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
            {currentMessage}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              id="send-whatsapp-btn"
            >
              <span>Send via WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
