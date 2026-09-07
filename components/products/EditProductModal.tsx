'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Check } from 'lucide-react';
import { Product } from '@/types/database';
import { updateProduct } from '@/lib/services/dashboardService';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({ product, isOpen, onClose, onSuccess }: EditProductModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsn, setHSN] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setHSN(product.hsn_sac || '');
      setUnit(product.unit || 'PCS');
      setSellingPrice(product.selling_price !== undefined ? String(product.selling_price) : '');
      setPurchasePrice(product.purchase_price !== undefined ? String(product.purchase_price) : '');
      setTaxRate(product.tax_rate ?? 18);
      setStockQuantity(product.stock_quantity !== undefined ? String(product.stock_quantity) : '0');
      setLowStockThreshold(product.low_stock_threshold !== undefined ? String(product.low_stock_threshold) : '10');
      setIsActive(product.is_active ?? true);
      setErrorMsg(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sellPriceNum = parseFloat(sellingPrice);
    if (!name.trim() || isNaN(sellPriceNum) || sellPriceNum < 0) {
      setErrorMsg('Product name and a valid non-negative selling price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const parsedStock = stockQuantity !== '' ? parseFloat(stockQuantity) : 0;
      const parsedLowStock = lowStockThreshold !== '' ? parseFloat(lowStockThreshold) : 10;
      const parsedPurchasePrice = purchasePrice !== '' ? parseFloat(purchasePrice) : 0;

      await updateProduct(product.id, {
        name: name.trim(),
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        hsnSac: hsn.trim() || null,
        unit: unit.trim() || 'PCS',
        sellingPrice: sellPriceNum,
        purchasePrice: parsedPurchasePrice,
        taxRate: Number(taxRate),
        stockQuantity: Math.max(0, parsedStock),
        lowStockThreshold: Math.max(0, parsedLowStock),
        isActive,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update product catalog record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      id="edit-product-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Product</h3>
              <p className="text-xs text-slate-500">Update specifications, pricing & GST details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product / Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Industrial Copper Cable 2.5 sq mm"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Item Code <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CBL-25-CU"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HSN / SAC Code <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={hsn}
                onChange={(e) => setHSN(e.target.value)}
                placeholder="e.g. 8544"
                maxLength={8}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode / EAN <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 8901234567890"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="NOS">NOS (Numbers)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="ROLL">ROLL (Rolls)</option>
                <option value="SET">SET (Sets)</option>
                <option value="LTR">LTR (Liters)</option>
                <option value="BAG">BAG (Bags)</option>
                <option value="SQFT">SQFT (Square Feet)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase / Cost Price (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
                <option value={18}>18% GST</option>
                <option value={12}>12% GST</option>
                <option value={28}>28% GST</option>
                <option value={5}>5% GST</option>
                <option value={0}>0% (Nil/Exempt)</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Alert
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Active / Inactive Status */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                Active in Catalog & Billing
              </span>
            </label>
            <p className="text-[11px] text-slate-500 ml-6">
              Inactive products are hidden from new invoice line-item dropdowns.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
