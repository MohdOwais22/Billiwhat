'use client';

import React, { useState } from 'react';
import {
  ClockAlert,
  MessageSquareText,
  Clock,
  CreditCard,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { CollectionQueueItem } from '@/types/database';
import { formatINR, getPriorityConfig } from '@/lib/utils/formatters';

interface CollectionQueueProps {
  items: CollectionQueueItem[];
  onTriggerWhatsApp: (item: CollectionQueueItem) => void;
  onRecordPaymentForQueue: (item: CollectionQueueItem) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export function CollectionQueue({
  items,
  onTriggerWhatsApp,
  onRecordPaymentForQueue,
  onSelectInvoice,
}: CollectionQueueProps) {
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high'>('all');

  const filteredItems = items.filter((item) => {
    if (filterPriority === 'critical') return item.priority === 'critical';
    if (filterPriority === 'high') return item.priority === 'critical' || item.priority === 'high';
    return true;
  });

  const totalOutstandingInQueue = items.reduce((acc, it) => acc + it.outstandingAmount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col h-full overflow-hidden min-w-0" id="priority-collection-queue-section">
      <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ClockAlert className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              Priority Collection Queue
            </h2>
          </div>
          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            {items.length} Follow-ups
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-slate-500 min-w-0 flex-1">
            Rule-based ranking by overdue aging & credit exposure
          </p>
          <div className="flex items-center gap-1 text-xs bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-2 py-0.5 rounded font-semibold text-[11px] transition ${
                filterPriority === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterPriority('critical')}
              className={`px-2 py-0.5 rounded font-semibold text-[11px] transition ${
                filterPriority === 'critical' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 mb-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          Total Pending Attention:
        </span>
        <span className="font-bold text-slate-900 font-mono text-sm">
          {formatINR(totalOutstandingInQueue)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px] pr-1">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No accounts match the current filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const priorityConfig = getPriorityConfig(item.priority);

            return (
              <div
                key={item.id}
                id={`queue-item-${item.invoiceId}`}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition duration-150 relative group shadow-2xs"
              >
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${priorityConfig.indicatorClass}`}
                />

                <div className="flex items-start justify-between gap-3 pl-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => onSelectInvoice(item.invoiceId)}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition truncate"
                      >
                        {item.companyName || item.customerName}
                      </h3>

                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityConfig.badgeClass}`}>
                        {priorityConfig.label}
                      </span>
                    </div>

                    {item.companyName && (
                      <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        Buyer: {item.customerName} • {item.phone}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                        {item.invoiceNumber}
                      </span>

                      {item.daysOverdue > 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {item.daysOverdue} days overdue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          <Clock className="w-3 h-3" />
                          Due today
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Outstanding
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
                      {formatINR(item.outstandingAmount)}
                    </span>
                    {item.totalAmount > item.outstandingAmount && (
                      <span className="block text-[10px] text-slate-400">
                        of {formatINR(item.totalAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pl-1">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium">Action:</span>
                    <span className="font-semibold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded text-[11px]">
                      {item.suggestedAction}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => onRecordPaymentForQueue(item)}
                      title="Record Received Payment"
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition flex items-center gap-1"
                      id={`queue-record-pay-btn-${item.invoiceId}`}
                    >
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      <span>Collect</span>
                    </button>

                    <button
                      onClick={() => onTriggerWhatsApp(item)}
                      title="Send WhatsApp Reminder"
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shadow-2xs flex items-center gap-1 active:scale-95"
                      id={`queue-whatsapp-btn-${item.invoiceId}`}
                    >
                      <MessageSquareText className="w-3 h-3" />
                      <span>Send WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
