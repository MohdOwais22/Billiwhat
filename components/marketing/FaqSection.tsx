import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

interface FaqItem {
  q: string;
  a: string;
  category: 'general' | 'whatsapp' | 'invoicing' | 'receivables' | 'security';
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FaqItem[] = [
    {
      category: 'general',
      q: `What is ${APP_NAME}?`,
      a: `${APP_NAME} is an AI-first business assistant for Indian distributors, wholesalers, traders, and credit-based businesses. It connects WhatsApp order intake directly with GST invoicing, automated payment collection links, receivables tracking, and smart follow-up reminders in one unified workflow.`,
    },
    {
      category: 'general',
      q: `Who is ${APP_NAME} for?`,
      a: 'It is built primarily for Indian distributors, wholesalers, and traders who sell goods on 15–45 days credit — such as Electrical, Hardware, Building Materials, FMCG, Auto Spares, and Industrial Supply distributors. It is also ideal for growing multi-user trading firms and businesses managed by external CAs and accountants.',
    },
    {
      category: 'whatsapp',
      q: 'Can I create invoices through WhatsApp?',
      a: `Yes! You or your sales team can simply type or forward an order into your ${APP_NAME} WhatsApp channel (e.g. “Rakesh ko 20 switches bhej dena 1450 ke”). ${APP_NAME} verifies dealer information, applies tax rates, generates a formal GST invoice PDF, and shares a link with the merchant in seconds.`,
    },
    {
      category: 'whatsapp',
      q: 'Can I send voice messages?',
      a: `Absolutely. ${APP_NAME} accepts audio voice notes sent from WhatsApp. The speech interpretation model transcribes and parses the voice note to detect item names, quantities, and agreed prices, showing you a quick draft for confirmation before finalizing the bill.`,
    },
    {
      category: 'whatsapp',
      q: `Does ${APP_NAME} support Indian languages?`,
      a: `Yes. ${APP_NAME} understands order instructions in Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, and mixed Hinglish. It accurately maps regional terminology to your standard product inventory and generates professional English GST tax invoices.`,
    },
    {
      category: 'receivables',
      q: `Can ${APP_NAME} track outstanding payments?`,
      a: `Yes, this is one of ${APP_NAME}’s core values. It maintains a live receivables ledger with automatic aging buckets (0–15, 16–30, 31–45, and 45+ days overdue). You can instantly see your total market credit, total overdue amount, and which accounts need priority follow-up.`,
    },
    {
      category: 'receivables',
      q: 'Can I send payment reminders?',
      a: `Yes. ${APP_NAME} generates polite, personalized WhatsApp payment reminders containing the invoice summary and a 1-tap dynamic UPI payment QR code. Reminders can be sent with a single click or scheduled based on each customer’s past payment behavior.`,
    },
    {
      category: 'invoicing',
      q: 'Does it support GST invoicing?',
      a: `Yes. ${APP_NAME} fully complies with Indian GST laws. It handles B2B & B2C tax invoices, HSN/SAC codes, CGST, SGST, IGST, reverse charges, item discounts, transport challans, and credit/debit notes with complete mathematical precision.`,
    },
    {
      category: 'invoicing',
      q: 'Can my accountant access the business?',
      a: 'Yes. You can invite your CA or in-house accountant with dedicated read/export permissions. They can download sales ledgers, customer aging sheets, and GST-ready CSV/Excel files compatible with Tally and other major accounting systems.',
    },
    {
      category: 'general',
      q: `Can I use ${APP_NAME} on web and mobile?`,
      a: `Yes. You can operate ${APP_NAME} via WhatsApp from any smartphone, and you can also access the rich ${APP_NAME} Web Dashboard on desktop or tablet for deep receivables analysis, customer management, inventory setup, and reports.`,
    },
    {
      category: 'whatsapp',
      q: 'How does WhatsApp authentication work?',
      a: `${APP_NAME} connects via official WhatsApp Business APIs and verified webhooks. When you register, you link your authorized phone numbers. Commands are accepted only from authorized staff numbers, ensuring unauthorized persons cannot create bills or view balances.`,
    },
    {
      category: 'security',
      q: 'Is my business data secure?',
      a: 'Yes. Your business records are completely isolated in your own tenant space with database-level Row-Level Security (RLS) on PostgreSQL. We use encrypted SSL/TLS connections, strict authentication protocols, and daily offsite backups. Your prices and customer margins remain 100% private to your company.',
    },
    {
      category: 'general',
      q: 'What happens if I have no customers or products yet?',
      a: `You can start completely fresh. When you first receive an order on WhatsApp for a new customer or new item, ${APP_NAME} helps you save the customer details and product rate in real time, building your digital catalog and customer ledger organically as you trade.`,
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-20 sm:py-28 bg-white relative border-b border-slate-200/80" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-slate-600 leading-relaxed">
            Everything you need to know about {APP_NAME}, WhatsApp invoicing, and receivables management.
          </p>
        </div>

        {/* Search Input */}
        <div className="mt-8 relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions (e.g. GST, voice, Tally, languages)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Accordion List */}
        <div className="mt-10 space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-slate-50/90 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-4 px-5 sm:px-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-slate-900">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-500">
              No questions found matching “{searchQuery}”. Please reach out directly to our team!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
