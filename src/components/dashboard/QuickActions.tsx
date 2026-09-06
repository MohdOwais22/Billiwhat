import React from 'react';
import { PlusCircle, UserPlus, PackagePlus, CreditCard } from 'lucide-react';

interface QuickActionsProps {
  onCreateInvoice: () => void;
  onAddCustomer: () => void;
  onAddProduct: () => void;
  onRecordPayment: () => void;
}

export function QuickActions({
  onCreateInvoice,
  onAddCustomer,
  onAddProduct,
  onRecordPayment,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'quick-create-invoice',
      label: 'Create Invoice',
      sublabel: 'GST & E-Way Ready',
      icon: PlusCircle,
      onClick: onCreateInvoice,
      primary: true,
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
      iconBg: 'bg-white/20 text-white',
    },
    {
      id: 'quick-record-payment',
      label: 'Record Payment',
      sublabel: 'UPI, Bank, Cheque',
      icon: CreditCard,
      onClick: onRecordPayment,
      buttonClass: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      id: 'quick-add-customer',
      label: 'Add Customer',
      sublabel: 'Buyer & Credit Limit',
      icon: UserPlus,
      onClick: onAddCustomer,
      buttonClass: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300',
      iconBg: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    {
      id: 'quick-add-product',
      label: 'Add Product',
      sublabel: 'SKU, HSN & Stock',
      icon: PackagePlus,
      onClick: onAddProduct,
      buttonClass: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300',
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5" id="quick-actions-bar">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            id={act.id}
            onClick={act.onClick}
            className={`p-3 sm:p-3.5 rounded-xl flex items-center gap-3 transition active:scale-[0.98] text-left group ${act.buttonClass}`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition ${act.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold truncate group-hover:underline decoration-1 underline-offset-2">
                {act.label}
              </span>
              <span className={`block text-[10px] sm:text-[11px] truncate font-medium ${act.primary ? 'text-emerald-100' : 'text-slate-500'}`}>
                {act.sublabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
