'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  SlidersHorizontal,
  Edit3,
  ReceiptText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Tag,
  Hash,
  Barcode,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { Product } from '@/types/database';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { fetchProductSalesUsage } from '@/lib/services/dashboardService';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEditProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onSelectInvoice?: (invoiceId: string) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onEditProduct,
  onAdjustStock,
  onSelectInvoice,
}: ProductDetailModalProps) {
  const [salesData, setSalesData] = useState<{
    totalUnitsSold: number;
    totalRevenue: number;
    invoiceCount: number;
    sales: Array<{
      itemId: string;
      invoiceId: string;
      invoiceNumber: string;
      issueDate: string;
      dueDate: string;
      status: string;
      customerId: string;
      customerName: string;
      customerBusiness?: string | null;
      quantity: number;
      unit: string;
      unitPrice: number;
      taxRate: number;
      lineTotal: number;
    }>;
  } | null>(null);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales'>('overview');

  useEffect(() => {
    if (product && isOpen) {
      setIsLoadingSales(true);
      fetchProductSalesUsage(product.id)
        .then((res) => {
          setSalesData(res);
        })
        .catch((err) => {
          console.error('Error fetching sales usage for product:', err);
          setSalesData({ totalUnitsSold: 0, totalRevenue: 0, invoiceCount: 0, sales: [] });
        })
        .finally(() => {
          setIsLoadingSales(false);
        });
    } else {
      setSalesData(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock_quantity) || 0;
  const lowStockThreshold = Number(product.low_stock_threshold) || 10;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= lowStockThreshold;

  const sellingPrice = Number(product.selling_price) || 0;
  const purchasePrice = Number(product.purchase_price) || 0;
  const marginAmt = sellingPrice - purchasePrice;
  const marginPct = purchasePrice > 0 ? ((marginAmt / purchasePrice) * 100).toFixed(1) : null;

  const stockValuationAtCost = purchasePrice > 0 ? currentStock * purchasePrice : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      id="product-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">{product.name}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    product.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                {product.sku && <span className="font-mono font-medium">SKU: {product.sku}</span>}
                {product.hsn_sac && <span>• HSN: {product.hsn_sac}</span>}
                <span>• Unit: {product.unit || 'PCS'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                onClose();
                onAdjustStock(product);
              }}
              className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
              title="Adjust Stock"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onEditProduct(product);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              title="Edit Product"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/30 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Overview & Inventory
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sales & Invoiced Units</span>
            {salesData && salesData.totalUnitsSold > 0 && (
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono">
                {salesData.totalUnitsSold}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' ? (
            <>
              {/* Status Alert if low or out of stock */}
              {isOutOfStock ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>This item is currently <strong>Out of Stock</strong> (0 {product.unit || 'PCS'}).</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onAdjustStock(product);
                    }}
                    className="font-bold underline text-rose-900 hover:text-rose-950 cursor-pointer"
                  >
                    Adjust Stock
                  </button>
                </div>
              ) : isLowStock ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Stock level ({currentStock} {product.unit || 'PCS'}) is below reorder threshold ({lowStockThreshold} {product.unit || 'PCS'}).
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onAdjustStock(product);
                    }}
                    className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer"
                  >
                    Restock
                  </button>
                </div>
              ) : null}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Selling Price</p>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {formatINR(sellingPrice)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">+{product.tax_rate ?? 18}% GST</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cost / Purchase</p>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {purchasePrice > 0 ? formatINR(purchasePrice) : '—'}
                  </p>
                  {marginPct ? (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      +{marginPct}% margin
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">Not specified</p>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">On-Hand Stock</p>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentStock.toLocaleString('en-IN')}{' '}
                    <span className="text-xs text-slate-500 font-normal">{product.unit || 'PCS'}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Alert at &le; {lowStockThreshold}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indicative Stock at Cost</p>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {stockValuationAtCost !== null ? formatINR(stockValuationAtCost) : 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {purchasePrice > 0 ? 'Based on purchase cost' : 'Purchase cost not configured'}
                  </p>
                </div>
              </div>

              {/* Specifications Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Item Identification & GST Classification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs pt-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Product Name</span>
                    <span className="font-semibold text-slate-900 text-right">{product.name}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">SKU / Code</span>
                    <span className="font-mono font-bold text-slate-800 text-right">
                      {product.sku || 'None assigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">HSN / SAC Code</span>
                    <span className="font-mono font-semibold text-slate-800 text-right">
                      {product.hsn_sac || 'None'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Barcode / EAN</span>
                    <span className="font-mono text-slate-800 text-right">
                      {product.barcode || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Applicable GST Rate</span>
                    <span className="font-bold text-slate-900 text-right">
                      {product.tax_rate ?? 18}% GST
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Measurement Unit</span>
                    <span className="font-semibold text-slate-900 text-right">{product.unit || 'PCS'}</span>
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <span className="text-slate-500">Date Added</span>
                    <span className="text-slate-700 text-right">
                      {product.created_at ? formatDate(product.created_at) : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <span className="text-slate-500">Catalog Visibility</span>
                    <span
                      className={`font-semibold text-right ${
                        product.is_active ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {product.is_active ? 'Active for Invoicing' : 'Archived / Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Sales & Line Items Tab */
            <div className="space-y-4">
              {isLoadingSales ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                  <p className="text-xs">Loading sales history from invoices...</p>
                </div>
              ) : salesData && salesData.sales.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Total Units Invoiced</p>
                      <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                        {salesData.totalUnitsSold.toLocaleString('en-IN')} {product.unit || 'PCS'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Total B2B Revenue</p>
                      <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                        {formatINR(salesData.totalRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Invoices Billed</p>
                      <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                        {salesData.invoiceCount}
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Rate</th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesData.sales.map((sale) => (
                          <tr key={sale.itemId} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 text-slate-600">
                              {sale.issueDate ? formatDate(sale.issueDate) : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {onSelectInvoice ? (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onSelectInvoice(sale.invoiceId);
                                  }}
                                  className="font-mono font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{sale.invoiceNumber}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="font-mono font-semibold text-slate-900">{sale.invoiceNumber}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-900 block truncate max-w-[140px]">
                                {sale.customerName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {sale.quantity} {sale.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatINR(sale.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatINR(sale.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Sales Invoiced Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                    This item has not appeared on any issued invoices. When you bill this product, its sales history will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAdjustStock(product);
            }}
            className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProduct(product);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
