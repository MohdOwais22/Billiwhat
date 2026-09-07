/**
 * Deterministic Tax & Accounting Calculations for WhatsBill
 * Strictly adheres to Indian GST rules, paise-level precision (2 decimal places),
 * and deterministic inter-state vs intra-state computation.
 */

export const GST_TAX_RATES = [0, 5, 12, 18, 28] as const;
export type GstTaxRate = (typeof GST_TAX_RATES)[number];

/**
 * Rounds an amount to exactly 2 decimal places (paise precision)
 * Uses Number.EPSILON to prevent floating-point representation drift.
 */
export function roundPaise(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export interface LineItemInput {
  productId?: string | null;
  productName: string;
  quantity: number | string;
  unitPrice: number | string;
  discount?: number | string;
  taxRate?: number;
  cess?: number | string;
  unit?: string;
  hsnSac?: string;
}

export interface ComputedLineItem {
  productId?: string | null;
  productName: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  gross: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  lineTotal: number;
}

export interface InvoiceCalculationSummary {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  grandTotal: number;
  isInterState: boolean;
  items: ComputedLineItem[];
}

/**
 * Computes deterministic line item amounts and tax splits.
 */
export function computeLineItem(
  item: LineItemInput,
  isInterState: boolean
): ComputedLineItem {
  const quantity = Math.max(0, parseFloat(String(item.quantity)) || 0);
  const unitPrice = Math.max(0, parseFloat(String(item.unitPrice)) || 0);
  const discount = Math.max(0, parseFloat(String(item.discount)) || 0);
  const taxRate = typeof item.taxRate === 'number' && !isNaN(item.taxRate) && item.taxRate >= 0 ? item.taxRate : 0;
  const cess = Math.max(0, parseFloat(String(item.cess)) || 0);

  const gross = roundPaise(quantity * unitPrice);
  const taxableAmount = roundPaise(Math.max(0, gross - discount));
  const taxAmount = roundPaise((taxableAmount * taxRate) / 100);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = taxAmount;
  } else {
    cgst = roundPaise(taxAmount / 2);
    // Preserves exact total tax without paise loss
    sgst = roundPaise(taxAmount - cgst);
  }

  const lineTotal = roundPaise(taxableAmount + (isInterState ? igst : cgst + sgst) + cess);

  return {
    productId: item.productId || null,
    productName: item.productName || '',
    hsnSac: item.hsnSac || '',
    quantity,
    unit: item.unit || 'PCS',
    unitPrice,
    discount,
    gross,
    taxableAmount,
    taxRate,
    taxAmount,
    cgst,
    sgst,
    igst,
    cess,
    lineTotal,
  };
}

/**
 * Computes authoritative invoice totals across all line items.
 * Does NOT round total to whole rupee; preserves paise precision.
 */
export function computeInvoiceSummary(
  items: LineItemInput[],
  isInterState: boolean
): InvoiceCalculationSummary {
  const computedItems = items.map((it) => computeLineItem(it, isInterState));

  let subtotal = 0;
  let discountTotal = 0;
  let taxableAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let cess = 0;

  computedItems.forEach((it) => {
    subtotal += it.gross;
    discountTotal += it.discount;
    taxableAmount += it.taxableAmount;
    cgst += it.cgst;
    sgst += it.sgst;
    igst += it.igst;
    cess += it.cess;
  });

  subtotal = roundPaise(subtotal);
  discountTotal = roundPaise(discountTotal);
  taxableAmount = roundPaise(taxableAmount);
  cgst = roundPaise(cgst);
  sgst = roundPaise(sgst);
  igst = roundPaise(igst);
  cess = roundPaise(cess);

  const totalTax = isInterState ? igst : roundPaise(cgst + sgst);
  const grandTotal = roundPaise(taxableAmount + totalTax + cess);

  return {
    subtotal,
    discountTotal,
    taxableAmount,
    cgst,
    sgst,
    igst,
    cess,
    totalTax,
    grandTotal,
    isInterState,
    items: computedItems,
  };
}

/**
 * Determines whether a transaction is Inter-State (IGST) or Intra-State (CGST + SGST)
 * based strictly on seller state and place of supply state.
 * Returns error message if seller state is missing and tax is applicable.
 */
export function determineGstState(
  sellerStateCode?: string | null,
  placeOfSupplyCode?: string | null
): {
  isInterState: boolean;
  sellerStateCode: string | null;
  placeOfSupplyCode: string | null;
  hasSellerState: boolean;
} {
  const seller = (sellerStateCode || '').trim() || null;
  const pos = (placeOfSupplyCode || '').trim() || null;

  const hasSellerState = Boolean(seller);
  const isInterState = Boolean(seller && pos && seller !== pos);

  return {
    isInterState,
    sellerStateCode: seller,
    placeOfSupplyCode: pos,
    hasSellerState,
  };
}
