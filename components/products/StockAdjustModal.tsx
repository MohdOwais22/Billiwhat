'use client';

import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertCircle, Plus, Minus, Check, ArrowRight } from 'lucide-react';
import { Product } from '@/types/database';
import { adjustProductStock } from '@/lib/services/dashboardService';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustModal({ product, isOpen, onClose, onSuccess }: StockAdjustModalProps) {
  const [mode, setMode] = useState<'set' | 'delta'>('delta');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [deltaValue, setDeltaValue] = useState<string>('');
  const [exactValue, setExactValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock_quantity) || 0;
  const deltaNum = parseFloat(deltaValue) || 0;
  const exactNum = parseFloat(exactValue) || 0;

  const calculatedNewStock =
    mode === 'set'
      ? Math.max(0, exactNum)
      : adjustmentType === 'add'
      ? currentStock + deltaNum
      : Math.max(0, currentStock - deltaNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'delta' && (isNaN(deltaNum) || deltaNum <= 0)) {
      setErrorMsg('Please enter a valid quantity greater than zero.');
      return;
    }

    if (mode === 'set' && (isNaN(exactNum) || exactNum < 0)) {
      setErrorMsg('Please enter a valid stock quantity (0 or greater).');
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === 'set') {
        await adjustProductStock(product.id, {
          newStockQuantity: Math.max(0, exactNum),
          reason: reason.trim() || 'Manual stock override',
        });
      } else {
        const delta = adjustmentType === 'add' ? deltaNum : -deltaNum;
        await adjustProductStock(product.id, {
          adjustmentDelta: delta,
          reason: reason.trim() || (adjustmentType === 'add' ? 'Stock received' : 'Stock reduced/consumed'),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update product stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      id="stock-adjust-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Product Stock</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{product.name}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Stock Indicator */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Current On-Hand Stock</p>
              <p className="text-lg font-bold text-slate-900">
                {currentStock.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-slate-500 font-medium">{product.unit || 'PCS'}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Reorder Alert</p>
              <p className="text-xs font-semibold text-slate-700">
                &le; {(product.low_stock_threshold ?? 10).toLocaleString('en-IN')} {product.unit || 'PCS'}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setMode('delta')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                mode === 'delta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Add / Deduct Quantity
            </button>
            <button
              type="button"
              onClick={() => setMode('set')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                mode === 'set' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Set Exact Count
            </button>
          </div>

          {mode === 'delta' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('add')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    adjustmentType === 'add'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Increase Stock (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('deduct')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    adjustmentType === 'deduct'
                      ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 text-rose-600" />
                  <span>Deduct Stock (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to {adjustmentType === 'add' ? 'Add' : 'Deduct'} ({product.unit || 'PCS'}) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={deltaValue}
                  onChange={(e) => setDeltaValue(e.target.value)}
                  placeholder="e.g. 25"
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Exact Total Stock ({product.unit || 'PCS'}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={exactValue}
                onChange={(e) => setExactValue(e.target.value)}
                placeholder="e.g. 150"
                required
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus
              />
            </div>
          )}

          {/* Preview Calculated Stock Result */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900">Resulting Stock Level:</span>
            <div className="flex items-center gap-2 font-mono font-bold text-amber-950">
              <span>{currentStock}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-sm bg-white px-2 py-0.5 rounded border border-amber-300">
                {calculatedNewStock.toLocaleString('en-IN')} {product.unit || 'PCS'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Reason <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Physical inventory count, Goods inward, Damaged"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

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
                  <span>Update Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
