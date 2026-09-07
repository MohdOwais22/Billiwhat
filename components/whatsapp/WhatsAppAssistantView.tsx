'use client';

import React, { useState } from 'react';
import {
  MessageSquareText,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Building,
  HelpCircle,
  FileText,
  Info,
} from 'lucide-react';
import { Organization } from '@/types/database';
import { formatINR } from '@/lib/utils/formatters';

interface WhatsAppAssistantViewProps {
  organization: Organization;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  pipelineDetails?: {
    intent?: any;
    resolvedCustomer?: string;
    resolvedProduct?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    clarificationRequired?: boolean;
    providerStatus?: string;
  };
}

const PRESET_PROMPTS = [
  {
    label: 'Hinglish Invoice Order',
    text: 'Ramesh ko 20 Havells switch 450 ke',
    desc: 'B2B order with product, quantity, and explicit price',
  },
  {
    label: 'English Order',
    text: 'Create invoice for Ramesh: 10 Anchor switches at ₹200 each',
    desc: 'Structured English order intent',
  },
  {
    label: 'Hindi Order',
    text: 'रमेश को बीस स्विच 450 रुपये के',
    desc: 'Hindi text command with quantities in Hindi script',
  },
  {
    label: 'Receivable Balance Query',
    text: 'Ramesh ka kitna baki hai?',
    desc: 'Query deterministic customer account ledger',
  },
  {
    label: 'Payment History Query',
    text: 'Ramesh ne payment kiya?',
    desc: 'Query real payment settlements from database',
  },
  {
    label: 'Customer Details Lookup',
    text: 'Find Ramesh details',
    desc: 'Retrieve customer directory profile and GSTIN',
  },
];

export function WhatsAppAssistantView({
  organization,
}: WhatsAppAssistantViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text:
        `*Namaste ${organization.name}!* I am your WhatsBill Conversational AI Assistant.\n\n` +
        `You can operate billing, customer balances, and payment queries conversationally in English, Hindi, Hinglish, Gujarati, and other Indian languages.\n\n` +
        `Try sending a message below or pick a sample prompt to see the interpretation pipeline in action!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || inputText.trim();
    if (!msg || isProcessing) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/whatsapp/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      const assistantMsgId = `assistant_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: data.message || 'Processing completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pipelineDetails: {
          intent: data.intent,
          resolvedCustomer: data.data?.customer?.name,
          resolvedProduct: data.intent?.items?.[0]?.product_query,
          invoiceNumber: data.data?.invoice?.invoice_number,
          totalAmount: data.data?.invoice?.total,
          clarificationRequired: data.clarificationRequired,
          providerStatus: data.providerStatus,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'An error occurred while connecting to the WhatsApp Assistant service. Please check your network connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" id="whatsapp-assistant-view">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-emerald-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Production Feature
            </span>
            <span className="text-xs text-slate-400 font-mono">Organization: {organization.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            WhatsApp Conversational Assistant
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            AI-powered natural language interpretation layer integrated directly with your deterministic GST billing, inventory, and payment engine.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="block text-xs text-slate-400 font-medium">Webhook Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Route
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[680px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">WhatsBill Assistant</h2>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online • Powered by Gemini AI
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'assistant',
                    text: 'Conversation reset. Send a message to begin.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
              title="Clear Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-2xs text-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>

                  {/* AI & Deterministic Audit Trail Card (For Assistant messages) */}
                  {msg.sender === 'assistant' && msg.pipelineDetails?.intent && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1.5 text-slate-800">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          AI Pipeline Interpretation
                        </span>
                        <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          intent: {msg.pipelineDetails.intent.intent}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 block">Identified Customer:</span>
                          <span className="font-semibold text-slate-800">
                            {msg.pipelineDetails.resolvedCustomer || 'Unresolved'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Product Query:</span>
                          <span className="font-semibold text-slate-800">
                            {msg.pipelineDetails.resolvedProduct || 'N/A'}
                          </span>
                        </div>
                        {msg.pipelineDetails.invoiceNumber && (
                          <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500">Atomic RPC Executed:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {msg.pipelineDetails.invoiceNumber} (₹{formatINR(msg.pipelineDetails.totalAmount || 0)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1 ${
                      msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Interpreting message with Gemini & executing business logic...</span>
              </div>
            )}
          </div>

          {/* Preset Prompts bar */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between px-1">
              <span>Quick Test Presets (Indian Languages):</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  disabled={isProcessing}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-lg whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Ramesh ko 20 Havells switch 450 ke..."
              disabled={isProcessing}
              className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Architecture & Integration Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Architecture Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pipeline Architecture Rules
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800">AI as Interpretation Layer</p>
                  <p className="text-slate-500 mt-0.5">
                    Gemini extracts structured intent JSON. It never directly calculates invoice totals, CGST, SGST, IGST, stock levels, or account balances.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Deterministic Resolution</p>
                  <p className="text-slate-500 mt-0.5">
                    Customers and products are matched strictly against organization-owned records in database. Ambiguous query results prompt for clarification without creating records.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Atomic Billing Engine Reuse</p>
                  <p className="text-slate-500 mt-0.5">
                    Invoices are created using the existing Supabase RPC <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">create_invoice_with_items</code> to guarantee identical tax and stock validation rules across Web, Mobile, and WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Configuration Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-slate-700" />
              Meta / WhatsApp Cloud API Webhook
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inbound Webhook Endpoint:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook`}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 select-all"
                  />
                  <button
                    onClick={copyWebhookUrl}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Verification Token:</span>
                  <span className="font-mono font-semibold text-slate-800">whatsbill_webhook_token</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Voice Support:</span>
                  <span className="font-medium text-amber-700">Pending Speech-to-Text</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Provider Credentials Status</span>
                </div>
                <p className="text-blue-700 leading-relaxed">
                  Inbound messages are fully processed by the AI interpretation engine. To enable live delivery via Meta WhatsApp Cloud API or Twilio, provide <code className="font-mono bg-blue-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> and <code className="font-mono bg-blue-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> in your environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
