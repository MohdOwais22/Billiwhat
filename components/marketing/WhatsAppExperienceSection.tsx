'use client';

import React, { useState } from 'react';
import { APP_NAME, getBrandInitials } from '@/config/brand';
import {
  MessageSquare,
  Mic,
  Check,
  CheckCheck,
  FileText,
  CreditCard,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Languages,
  Send,
  Volume2,
} from 'lucide-react';

interface LanguageSample {
  id: string;
  lang: string;
  native: string;
  merchantMessage: string;
  isVoice?: boolean;
  voiceDuration?: string;
  transcription?: string;
  extractedItem: string;
  quantity: string;
  rate: string;
  subtotal: string;
  gst: string;
  total: string;
  invoiceNumber: string;
}

export function WhatsAppExperienceSection() {
  const [activeLang, setActiveLang] = useState<string>('hinglish');

  const languageSamples: Record<string, LanguageSample> = {
    hinglish: {
      id: 'hinglish',
      lang: 'Hinglish',
      native: 'हिंदी + English',
      merchantMessage: 'Rakesh ko 20 switches bhej dena 1450 ke.',
      extractedItem: 'Anchor Roma 16A Modular Switch (White)',
      quantity: '20 units',
      rate: '₹1,450.00 / unit',
      subtotal: '₹29,000.00',
      gst: '₹5,220.00 (18% GST)',
      total: '₹34,220.00',
      invoiceNumber: 'INV-1042',
    },
    gujarati: {
      id: 'gujarati',
      lang: 'Gujarati',
      native: 'ગુજરાતી',
      merchantMessage: 'રાકેશભાઈને ૨૦ સ્વિચ મોકલી આપો ૧૪૫૦ ના ભાવે.',
      extractedItem: 'Anchor Roma 16A Modular Switch (White)',
      quantity: '20 units',
      rate: '₹1,450.00 / unit',
      subtotal: '₹29,000.00',
      gst: '₹5,220.00 (18% GST)',
      total: '₹34,220.00',
      invoiceNumber: 'INV-1043',
    },
    hindi: {
      id: 'hindi',
      lang: 'Hindi',
      native: 'हिन्दी',
      merchantMessage: 'राकेश जी को 20 स्विच भेज देना 1450 वाले.',
      extractedItem: 'Anchor Roma 16A Modular Switch (White)',
      quantity: '20 units',
      rate: '₹1,450.00 / unit',
      subtotal: '₹29,000.00',
      gst: '₹5,220.00 (18% GST)',
      total: '₹34,220.00',
      invoiceNumber: 'INV-1044',
    },
    marathi: {
      id: 'marathi',
      lang: 'Marathi',
      native: 'मराठी',
      merchantMessage: 'राकेशला १४५० रुपयांचे २० स्विचेस पाठवून द्या.',
      extractedItem: 'Anchor Roma 16A Modular Switch (White)',
      quantity: '20 units',
      rate: '₹1,450.00 / unit',
      subtotal: '₹29,000.00',
      gst: '₹5,220.00 (18% GST)',
      total: '₹34,220.00',
      invoiceNumber: 'INV-1045',
    },
    voice: {
      id: 'voice',
      lang: 'Voice Note',
      native: 'Audio Note',
      isVoice: true,
      voiceDuration: '0:06',
      merchantMessage: '🎙️ Voice Note: "Rakesh ko 20 switches bhej dena 1450 ke."',
      transcription: 'Voice recognized (Hindi/English mix): "Rakesh ko 20 switches bhej dena 1450 ke"',
      extractedItem: 'Anchor Roma 16A Modular Switch (White)',
      quantity: '20 units',
      rate: '₹1,450.00 / unit',
      subtotal: '₹29,000.00',
      gst: '₹5,220.00 (18% GST)',
      total: '₹34,220.00',
      invoiceNumber: 'INV-1046',
    },
  };

  const current = languageSamples[activeLang] || languageSamples.hinglish;

  return (
    <section className="py-20 sm:py-28 bg-white relative border-b border-slate-200/80" id="experience">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>The Natural WhatsApp Experience</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Order in WhatsApp. Invoice in 10 seconds.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No complicated forms. No desktop keyboards required for counter staff. Your merchant speaks or types naturally, and {APP_NAME} handles the validation, GST, and collection loop.
          </p>
        </div>

        {/* Interactive Language & Mode Selector */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {Object.values(languageSamples).map((sample) => (
            <button
              key={sample.id}
              onClick={() => setActiveLang(sample.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeLang === sample.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sample.isVoice ? <Mic className="w-3.5 h-3.5 text-rose-400" /> : <Languages className="w-3.5 h-3.5 text-emerald-500" />}
              <span>{sample.lang}</span>
              <span className="text-[10px] opacity-75 font-normal">({sample.native})</span>
            </button>
          ))}
        </div>

        {/* Realistic Chat Mockup Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left: WhatsApp Chat Screen */}
          <div className="lg:col-span-7 bg-[#EFEAE2] rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col font-sans">
            {/* WhatsApp Header */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-800 border border-emerald-700 flex items-center justify-center font-bold text-sm">
                  {getBrandInitials()}
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <span>{APP_NAME} Assistant</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </h4>
                  <p className="text-[10px] text-emerald-100">Verified Business AI • Online</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-200 font-mono">24x7 Ready</span>
            </div>

            {/* Chat Bubble Canvas */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-800 min-h-[380px] flex flex-col justify-end bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Message 1: Merchant input */}
              <div className="self-end max-w-[85%] bg-[#DCF8C6] rounded-xl rounded-tr-xs p-3 shadow-2xs space-y-1">
                {current.isVoice ? (
                  <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-emerald-300 rounded-full w-28 animate-pulse" />
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{current.voiceDuration}</span>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium text-slate-900 leading-relaxed">
                    “{current.merchantMessage}”
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500">
                  <span>10:42 AM</span>
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                </div>
              </div>

              {/* Message 2: WhatsBill Confirmation */}
              <div className="self-start max-w-[85%] bg-white rounded-xl rounded-tl-xs p-3 shadow-2xs space-y-2 border border-slate-200/60">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <Sparkles className="w-3 h-3" />
                  <span>{APP_NAME} Interpretation</span>
                </div>
                {current.isVoice && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                    {current.transcription}
                  </p>
                )}
                <p className="text-slate-700">
                  Got it. <strong>20 switches</strong> for <strong>Rakesh</strong> at <strong>₹1,450</strong> each.
                </p>
                <p className="text-slate-900 font-semibold">
                  Create invoice?
                </p>
                <div className="flex items-center justify-end text-[9px] text-slate-400">
                  <span>10:42 AM</span>
                </div>
              </div>

              {/* Message 3: Merchant confirms */}
              <div className="self-end max-w-[50%] bg-[#DCF8C6] rounded-xl rounded-tr-xs px-3 py-1.5 shadow-2xs">
                <p className="font-semibold text-slate-900">Yes</p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500">
                  <span>10:43 AM</span>
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                </div>
              </div>

              {/* Message 4: WhatsBill Invoice Generated & Sent */}
              <div className="self-start max-w-[90%] bg-white rounded-xl rounded-tl-xs p-3.5 shadow-2xs space-y-2.5 border border-slate-200/80">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Invoice {current.invoiceNumber} created</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    GST Compliant
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal (20 units):</span>
                    <span className="font-mono text-slate-800">{current.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>18% GST (CGST+SGST):</span>
                    <span className="font-mono text-slate-800">{current.gst}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 text-xs">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700 font-mono">{current.total}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60">
                  ✅ Payment link & PDF invoice automatically shared with Rakesh on WhatsApp.
                </p>

                <div className="flex items-center justify-end text-[9px] text-slate-400">
                  <span>10:43 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Payment & Reconciliation Progression */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                What happens behind the scenes:
              </h3>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Tax Invoice Created</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Deterministic calculation applied: {current.subtotal} + {current.gst} = {current.total}.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Payment Requested via WhatsApp</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Rakesh receives official PDF + dynamic UPI QR with 15-day credit due date.
                    </p>
                  </div>
                </div>

                {/* Step 3: Partial Payment Received */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">₹20,000 Received via UPI</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Partial payment detected. Ledger adjusted immediately: <strong className="font-mono">₹14,220</strong> remaining.
                    </p>
                  </div>
                </div>

                {/* Step 4: Next Action Scheduled */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Next Reminder Calibrated</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Remaining ₹14,220 queued for polite reminder 2 days before due date.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Language Coverage Note */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900">Multilingual Voice & Text Support:</span>
              <p className="text-[11px] text-slate-500">
                Understands spoken and written business orders in Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, and mixed Hinglish.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
