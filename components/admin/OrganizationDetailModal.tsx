'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Building2,
  Users,
  Package,
  Receipt,
  CreditCard,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface OrgDetailData {
  organization: any;
  members: any[];
  customers: any[];
  products: any[];
  invoices: any[];
  payments: any[];
  gstProfile: any;
  messageLogs: any[];
}

interface Props {
  orgId: string | null;
  onClose: () => void;
  onDelete?: (orgId: string, orgName: string) => void;
}

export function OrganizationDetailModal({ orgId, onClose, onDelete }: Props) {
  const [data, setData] = useState<OrgDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'customers' | 'products' | 'invoices' | 'payments' | 'messages'>('summary');

  useEffect(() => {
    if (!orgId) {
      setData(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/organization-detail?id=${encodeURIComponent(orgId)}`);
        if (!res.ok) {
          throw new Error('Failed to load organization details');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error('Org detail fetch error:', err);
        setError(err?.message || 'Error loading organization details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [orgId]);

  if (!orgId) return null;

  const org = data?.organization;
  const totalInvoiced = data?.invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0;
  const totalPaid = data?.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const outstanding = Math.max(0, Math.round((totalInvoiced - totalPaid) * 100) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0D1322] border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  {org?.name || 'Loading Organization...'}
                </h3>
                {org?.gstin ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    GSTIN: {org.gstin}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400">
                    Non-GST
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: {orgId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
            <p className="text-sm">Retrieving organization profile...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/20 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveSubTab('summary')}
                className={`pb-2.5 font-medium px-2 border-b-2 transition cursor-pointer ${
                  activeSubTab === 'summary'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveSubTab('customers')}
                className={`pb-2.5 font-medium px-2 border-b-2 transition cursor-pointer ${
                  activeSubTab === 'customers'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Customers ({data?.customers.length || 0})
              </button>
              <button
                onClick={() => setActiveSubTab('products')}
                className={`pb-2.5 font-medium px-2 border-b-2 transition cursor-pointer ${
                  activeSubTab === 'products'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Products ({data?.products.length || 0})
              </button>
              <button
                onClick={() => setActiveSubTab('invoices')}
                className={`pb-2.5 font-medium px-2 border-b-2 transition cursor-pointer ${
                  activeSubTab === 'invoices'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Invoices ({data?.invoices.length || 0})
              </button>
              <button
                onClick={() => setActiveSubTab('payments')}
                className={`pb-2.5 font-medium px-2 border-b-2 transition cursor-pointer ${
                  activeSubTab === 'payments'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Payments ({data?.payments.length || 0})
              </button>
              <button
                onClick={() => setActiveSubTab('messages')}
                className={`pb-2.5 font-medium px-2 border-b-2 transition cursor-pointer ${
                  activeSubTab === 'messages'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                WhatsApp Logs ({data?.messageLogs.length || 0})
              </button>
            </div>

            {/* Sub-tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSubTab === 'summary' && (
                <div className="space-y-6">
                  {/* Financial Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Total Invoiced
                      </span>
                      <p className="text-xl font-bold text-white mt-1">
                        {formatCurrency(totalInvoiced)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {data?.invoices.length || 0} invoices created
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Total Collected
                      </span>
                      <p className="text-xl font-bold text-emerald-400 mt-1">
                        {formatCurrency(totalPaid)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {data?.payments.length || 0} payment entries
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Outstanding Balance
                      </span>
                      <p className="text-xl font-bold text-amber-400 mt-1">
                        {formatCurrency(outstanding)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Uncollected receivables
                      </p>
                    </div>
                  </div>

                  {/* Organization Health Checks */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Operational Health
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0D1322] border border-slate-800/80">
                        {org?.gstin ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>GSTIN Status: {org?.gstin ? `Configured (${org.gstin})` : 'Pending Registration'}</span>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0D1322] border border-slate-800/80">
                        {data && data.products.length > 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>Product Catalog: {data?.products.length || 0} items active</span>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0D1322] border border-slate-800/80">
                        {data && data.customers.length > 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>Customer Roster: {data?.customers.length || 0} buyers recorded</span>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0D1322] border border-slate-800/80">
                        {org?.whatsapp_phone || org?.meta_phone_number_id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>WhatsApp Cloud: {org?.whatsapp_phone || 'Unlinked'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2 text-xs">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Business Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div><span className="text-slate-500">Legal Name:</span> {org?.legal_name || org?.name}</div>
                      <div><span className="text-slate-500">Phone:</span> {org?.phone || '—'}</div>
                      <div><span className="text-slate-500">Email:</span> {org?.email || '—'}</div>
                      <div><span className="text-slate-500">Currency:</span> {org?.currency || 'INR'} ({org?.timezone || 'Asia/Kolkata'})</div>
                      <div><span className="text-slate-500">Address:</span> {[org?.address_line1, org?.city, org?.state, org?.pincode].filter(Boolean).join(', ') || '—'}</div>
                      <div><span className="text-slate-500">Created:</span> {formatDate(org?.created_at, 'long')}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'customers' && (
                <div className="space-y-3">
                  {data?.customers.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No customers registered for this organization.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden text-xs">
                      {data?.customers.map((c: any) => (
                        <div key={c.id} className="p-3 bg-slate-950/40 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{c.name}</p>
                            <p className="text-slate-400">{c.phone} {c.gstin ? `• GSTIN: ${c.gstin}` : ''}</p>
                          </div>
                          <span className="text-slate-400">{c.billing_address || 'No address'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'products' && (
                <div className="space-y-3">
                  {data?.products.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No products in catalog.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden text-xs">
                      {data?.products.map((p: any) => (
                        <div key={p.id} className="p-3 bg-slate-950/40 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{p.name}</p>
                            <p className="text-slate-400">HSN: {p.hsn_sac || '—'} • Tax: {p.tax_rate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-400">{formatCurrency(p.selling_price)}</p>
                            <p className="text-[10px] text-slate-500">Stock: {p.stock_quantity} {p.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'invoices' && (
                <div className="space-y-3">
                  {data?.invoices.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No invoices generated yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden text-xs">
                      {data?.invoices.map((inv: any) => (
                        <div key={inv.id} className="p-3 bg-slate-950/40 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white font-mono">{inv.invoice_number}</p>
                            <p className="text-slate-400">{formatDate(inv.issue_date, 'short')} • Status: <span className="capitalize text-slate-200">{inv.status}</span></p>
                          </div>
                          <p className="font-semibold text-white">{formatCurrency(inv.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'payments' && (
                <div className="space-y-3">
                  {data?.payments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No payments logged yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden text-xs">
                      {data?.payments.map((p: any) => (
                        <div key={p.id} className="p-3 bg-slate-950/40 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white uppercase">{p.method} Payment</p>
                            <p className="text-slate-400">{formatDate(p.paid_at, 'short')} {p.reference ? `• Ref: ${p.reference}` : ''}</p>
                          </div>
                          <p className="font-semibold text-emerald-400">{formatCurrency(p.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'messages' && (
                <div className="space-y-3">
                  {data?.messageLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No WhatsApp messages recorded for this organization.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden text-xs">
                      {data?.messageLogs.map((m: any) => (
                        <div key={m.id} className="p-3 bg-slate-950/40 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{m.direction === 'inbound' ? 'Inbound Message' : 'Outbound Dispatch'}</p>
                            <p className="text-slate-400">{m.text_content ? `"${m.text_content.slice(0, 60)}..."` : 'No preview'} • Status: {m.status}</p>
                          </div>
                          <span className="text-slate-500 text-[10px]">{formatDate(m.created_at, 'short')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to permanently delete "${org?.name}"?`)) {
                      onDelete(org.id, org.name);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Organization</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="ml-auto px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
