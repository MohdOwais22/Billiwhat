'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { APP_NAME } from '@/config/brand';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'playground';
  text: string;
  intent?: string;
  data?: any;
  timestamp: string;
}

const INITIAL_SUGGESTIONS = [
  '20 Anchor switches for Sharma Electricals',
  '20 switches and 10 bulbs for Sharma Electricals',
  'Show Sharma Electricals outstanding',
  'Send a payment reminder to Sharma Electricals',
  'How much is outstanding today?',
  'What did Sharma Electricals pay last time?',
];

export function PlaygroundModal({ isOpen, onClose, onOpenAuthModal }: PlaygroundModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'playground',
      text: `Welcome to the ${APP_NAME} Interactive Playground!\n\nExperience our WhatsApp-driven dispatch, invoicing, and receivables workflow without creating an account.`,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [previewInvoiceData, setPreviewInvoiceData] = useState<any | null>(null);
  const [previewReminderData, setPreviewReminderData] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, messages]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewInvoiceData) {
          setPreviewInvoiceData(null);
        } else if (previewReminderData) {
          setPreviewReminderData(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, previewInvoiceData, previewReminderData]);

  const handleReset = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'playground',
        text: `Playground reset.\n\nSend a business request the way you normally would on WhatsApp.`,
        timestamp: 'Just now',
      },
    ]);
    setInputValue('');
    setMessageCount(0);
    setPreviewInvoiceData(null);
    setPreviewReminderData(null);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (messageCount >= 5) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    const newCount = messageCount + 1;
    setMessageCount(newCount);

    try {
      // Deterministic fast processing via backend route
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionMessageCount: messageCount,
        }),
      });

      const data = await res.json();

      // Artificial short delay to simulate realistic WhatsApp response
      await new Promise((resolve) => setTimeout(resolve, 350));

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'playground',
        text: data.message || 'Understood.',
        intent: data.intent,
        data: data.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'playground',
          text: 'Temporary connection glitch in demo simulator. Please try a suggested prompt.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[86vh] text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp Style Top Header Bar */}
        <div className="bg-emerald-800 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 font-extrabold text-sm sm:text-base text-emerald-200">
                WB
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-800 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base leading-tight">
                  {APP_NAME} Playground
                </h2>
                <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded-full font-medium tracking-wide border border-emerald-600">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 flex items-center gap-1.5 mt-0.5">
                <span>WhatsApp Business Dispatch Engine</span>
                <span className="text-emerald-300">•</span>
                <span className="text-emerald-200 font-semibold">{5 - messageCount} msgs left</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Close Playground"
              aria-label="Close Playground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Disclaimer Banner */}
        <div className="bg-amber-50 border-b border-amber-200/70 px-4 py-1.5 text-[11px] text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Simulated sandbox:</strong> Synthetic demo dataset only. Nothing is saved, filed with GST, or sent to WhatsApp.
            </span>
          </div>
          <span className="font-bold text-[10px] tracking-wider uppercase text-amber-900 bg-amber-200/60 px-1.5 py-0.2 rounded">
            Safe Mode
          </span>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 rounded-tl-xs shadow-xs border border-slate-200/80'
                }`}
              >
                {msg.text}

                {/* Structured Card Action: ORDER_TO_INVOICE */}
                {msg.intent === 'ORDER_TO_INVOICE' && msg.data && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 text-xs text-emerald-950 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          Draft Invoice Generated
                        </span>
                        <span className="font-bold">{msg.data.customer?.name}</span>
                        <span className="text-emerald-700 ml-1.5">
                          (₹{msg.data.grandTotal?.toLocaleString('en-IN')})
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                        Simulated
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPreviewInvoiceData(msg.data)}
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        id="playground-preview-invoice-btn"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Preview invoice</span>
                      </button>
                      <button
                        onClick={() => setInputValue('Add 10 more bulbs for Sharma Electricals')}
                        className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Change order
                      </button>
                    </div>
                  </div>
                )}

                {/* Structured Card Action: OUTSTANDING */}
                {msg.intent === 'OUTSTANDING' && msg.data && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-900 text-sm">
                          {msg.data.customerName}
                        </span>
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          {msg.data.overdueDays} days overdue
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Outstanding</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            ₹{msg.data.outstandingAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Payment Behavior</span>
                          <span className="font-semibold text-slate-700">
                            Pays in ~{msg.data.avgPaymentDays} days
                          </span>
                        </div>
                      </div>

                      <div className="p-2 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-amber-900">
                        <strong>Recommended Action:</strong> Send WhatsApp payment reminder with instant UPI link.
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setInputValue(`Send a payment reminder to ${msg.data.customerName}`);
                          handleSend(`Send a payment reminder to ${msg.data.customerName}`);
                        }}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send simulated reminder</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAuthModal();
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Try in my workspace →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Structured Card Action: PAYMENT_REMINDER */}
                {msg.intent === 'PAYMENT_REMINDER' && msg.data && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-3 text-xs">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Simulated WhatsApp Message
                      </span>
                      <p className="text-slate-800 italic leading-relaxed">
                        &ldquo;{msg.data.sampleReminderText}&rdquo;
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-2">
                        * Simulated preview — not sent to actual recipient.
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Create my workspace to send real reminders →</span>
                    </button>
                  </div>
                )}

                {/* Structured Card Action: COLLECTION_SUMMARY */}
                {msg.intent === 'COLLECTION_SUMMARY' && msg.data && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Collected Today</span>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          ₹{msg.data.totalCollected?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1">
                        {msg.data.breakdown?.map((b: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{b.customer} ({b.method})</span>
                            <span className="font-semibold text-slate-800">
                              ₹{b.amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Automate daily collection tallies in your workspace →</span>
                    </button>
                  </div>
                )}

                <span
                  className={`text-[10px] block mt-1 text-right ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs border border-slate-200/80 flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1.5 text-[11px] font-medium text-slate-400">Processing business intent...</span>
              </div>
            </div>
          )}

          {/* Rate limit reached banner */}
          {messageCount >= 5 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3 animate-in fade-in">
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                You’ve reached the Playground demo limit (5 messages).
              </p>
              <p className="text-xs text-emerald-800">
                Ready to bill orders and collect payments for real with your own business data?
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Create my WhatsBill workspace →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messageCount < 5 && (
          <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/80 overflow-x-auto scrollbar-none flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Try:
            </span>
            {INITIAL_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                disabled={isLoading}
                className="shrink-0 text-xs font-semibold px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90 rounded-lg text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={isLoading || messageCount >= 5}
            maxLength={500}
            placeholder={
              messageCount >= 5
                ? 'Playground limit reached. Start free to use WhatsBill.'
                : 'Type a command, e.g. "20 switches for Sharma Electricals"...'
            }
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition disabled:bg-slate-100 disabled:text-slate-400"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading || messageCount >= 5}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">Send</span>
          </button>
        </div>

        {/* Simulated Invoice Preview Overlay */}
        {previewInvoiceData && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-30 flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90%]">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    WhatsBill Simulated Engine
                  </span>
                  <h3 className="font-extrabold text-base">DEMO INVOICE</h3>
                </div>
                <button
                  onClick={() => setPreviewInvoiceData(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invoice Content */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-center font-bold text-[11px] tracking-wide uppercase">
                  ⚠️ DEMO — NOT A TAX INVOICE • NO RECORD SAVED
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Billed To:</span>
                    <strong className="text-slate-900 text-sm block">
                      {previewInvoiceData.customer?.name}
                    </strong>
                    <span className="text-slate-500 block">{previewInvoiceData.customer?.address}</span>
                    <span className="text-slate-500 block font-mono text-[11px]">
                      GSTIN: {previewInvoiceData.customer?.gstin}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Invoice #</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {previewInvoiceData.invoiceNumber}
                    </span>
                    <span className="text-slate-400 block text-[10px] mt-1">Date</span>
                    <span className="text-slate-700">{previewInvoiceData.date}</span>
                  </div>
                </div>

                {/* Line Items */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                      <th className="py-1.5">Item</th>
                      <th className="py-1.5 text-center">Qty</th>
                      <th className="py-1.5 text-right">Rate</th>
                      <th className="py-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewInvoiceData.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 font-medium text-slate-900">{item.productName}</td>
                        <td className="py-2 text-center text-slate-700">{item.quantity}</td>
                        <td className="py-2 text-right text-slate-700">₹{item.unitPrice}</td>
                        <td className="py-2 text-right font-semibold text-slate-900">
                          ₹{item.subtotal?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Calculation Totals */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span>₹{previewInvoiceData.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span>₹{previewInvoiceData.cgst?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span>₹{previewInvoiceData.sgst?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700">
                      ₹{previewInvoiceData.grandTotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 text-center italic pt-2">
                  Demo only — nothing is saved, sent, or filed.
                </p>
              </div>

              {/* Footer CTA */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setPreviewInvoiceData(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Back to Chat
                </button>
                <button
                  onClick={() => {
                    setPreviewInvoiceData(null);
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Create my WhatsBill workspace →</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
