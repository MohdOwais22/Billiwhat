import React from 'react';
import { APP_NAME } from '@/config/brand';
import {
  Zap,
  Wrench,
  Building2,
  ShoppingBag,
  Car,
  Factory,
  ArrowLeftRight,
  BookOpenCheck,
  CheckCircle2,
} from 'lucide-react';

export function WhoItsForSection() {
  const industries = [
    {
      icon: Zap,
      name: 'Electrical Distributors',
      subtitle: 'Switches, Wires, MCBs, Cables & Lighting',
      reality:
        'Dealers order 30–50 items in audio notes or rapid WhatsApp lists. Selling on 30–45 days credit with tiered volume discounts makes tracking overdue amounts messy.',
      benefit: 'Extracts exact multi-item orders and prevents credit leaks.',
      color: 'text-amber-700 bg-amber-100',
    },
    {
      icon: Wrench,
      name: 'Hardware Wholesalers',
      subtitle: 'Fasteners, Tools, Hinges & Fittings',
      reality:
        'High SKU catalogs with hundreds of small unit sizes. Counter staff often forgets to record verbal additions made just before the delivery tempo leaves.',
      benefit: 'Logs orders in real-time right at the counter or godown.',
      color: 'text-blue-700 bg-blue-100',
    },
    {
      icon: Building2,
      name: 'Building Material Businesses',
      subtitle: 'Cement, CPVC Pipes, Tiles & Sanitaryware',
      reality:
        'Large invoice amounts dispatched in partial truckloads to active construction sites. Contractors pay in erratic partial installments over 60 days.',
      benefit: 'Tracks partial payments per site bill with auto-receipts.',
      color: 'text-stone-700 bg-stone-100',
    },
    {
      icon: ShoppingBag,
      name: 'FMCG Distributors',
      subtitle: 'Packaged Goods, Beverages & Staples',
      reality:
        'Salesmen visit 40+ kirana stores daily, collecting orders on WhatsApp. Strict weekly credit terms must be enforced before next week’s replenishment.',
      benefit: 'Enforces credit limits before salesman can take the next order.',
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      icon: Car,
      name: 'Auto Parts Distributors',
      subtitle: 'Spares, Filters, Lubricants & Batteries',
      reality:
        'Garages and retail mechanics demand instant delivery with informal promises to clear dues on Saturday. Unrecorded credits lead to chronic bad debts.',
      benefit: 'Automated WhatsApp payment reminder with instant UPI link.',
      color: 'text-red-700 bg-red-100',
    },
    {
      icon: Factory,
      name: 'Industrial Suppliers',
      subtitle: 'Valves, Bearings, Motors & Safety Gear',
      reality:
        'Factory procurement managers send informal RFQs and urgent POs on WhatsApp. Keeping quotes, delivery challans, and GST bills in sync is chaotic.',
      benefit: 'Instant GST e-invoices with HSN and PO cross-referencing.',
      color: 'text-indigo-700 bg-indigo-100',
    },
    {
      icon: ArrowLeftRight,
      name: 'Trading Businesses',
      subtitle: 'Commodities, Plastics, Paper & Textiles',
      reality:
        'Operating on razor-thin wholesale margins where working capital speed is everything. A single delayed ₹5 Lakh payment blocks procurement from mills.',
      benefit: 'Clear 24/7 visibility into aging buckets so cash flows smoothly.',
      color: 'text-purple-700 bg-purple-100',
    },
    {
      icon: BookOpenCheck,
      name: 'CA & Accountant-Managed Firms',
      subtitle: 'Businesses with dedicated external accounts',
      reality:
        'Proprietors hate learning complicated accounting software. Accountants spend tax week chasing missing sales bills, unclear bank entries, and invoices.',
      benefit: 'Clean, structured data exports ready for Tally and GST filing.',
      color: 'text-teal-700 bg-teal-100',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white relative border-b border-slate-200/80" id="who-its-for">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Tailored for Indian Trade</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Built for businesses that sell today and collect later.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            If your business revolves around WhatsApp orders and providing credit to dealers, retailers, or contractors — {APP_NAME} was designed specifically for your daily operations.
          </p>
        </div>

        {/* 8 Sector Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.name}
                className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ind.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {ind.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {ind.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {ind.reality}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{ind.benefit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
