'use client';

import React, { useState } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { addNewProduct } from '@/lib/services/dashboardService';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [hsn, setHSN] = useState('8544');
  const [unit, setUnit] = useState('Pcs');
  const [stockQuantity, setStockQuantity] = useState(50);
  const [minStockAlert, setMinStockAlert] = useState(15);
  const [unitPrice, setUnitPrice] = useState(1200);
  const [taxRate, setTaxRate] = useState(18);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || unitPrice <= 0) {
      setErrorMsg('Product name and valid unit price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await addNewProduct({
        name,
        sku: sku || name.slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        hsnSac: hsn,
        hsnCode: hsn,
        unit,
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(minStockAlert),
        reorderLevel: Number(minStockAlert),
        unitPrice: Number(unitPrice),
        sellingPrice: Number(unitPrice),
        gstRate: Number(taxRate),
        taxRate: Number(taxRate),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs" id="add-product-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Inventory Product</h3>
              <p className="text-xs text-slate-500">Item catalog, HSN & stock threshold</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item / Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Polycab Industrial Wire 2.5mm"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              id="prod-name-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Item Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. POL-WIR-25"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HSN / SAC Code
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Roll">Roll</option>
                <option value="Box">Box</option>
                <option value="Kg">Kg</option>
                <option value="Meter">Meter</option>
                <option value="Length">Length</option>
                <option value="Set">Set</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Stock
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Alert (Min)
              </label>
              <input
                type="number"
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs"
              id="submit-product-btn"
            >
              {isSubmitting ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
