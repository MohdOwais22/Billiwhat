import React from 'react';
import {
  Customer,
  GstProfile,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Organization,
} from '@/types/database';

export type ThemeID =
  | 'classic_ledger'
  | 'gst_pro'
  | 'business_classic'
  | 'modern_minimal'
  | 'executive'
  | 'retail_compact'
  | 'a5_compact'
  | 'wholesale_pro'
  | 'manufacturing'
  | 'service_pro'
  | 'elegant'
  | 'whatsapp_clean'
  | 'dark_header'
  | 'minimal_gst'
  | 'multi_branch';

export type ThemeCategory = 'accounting' | 'gst' | 'modern' | 'compact' | 'industry' | 'mobile';
export type ThemeDensity = 'compact' | 'normal' | 'spacious';
export type ThemePaperSize = 'A4' | 'A5' | 'responsive';

export interface ThemeBrandingOptions {
  logoUrl?: string | null;
  accentColor?: string;
  fontFamily?: string;
  footerText?: string;
  showWatermark?: boolean;
}

export interface CanonicalSellerInfo {
  id: string;
  name: string;
  legalName?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  country: string;
  currency: string;
  invoicePrefix: string;
  formattedAddress: string;
  branchAddress?: string | null;
}

export interface CanonicalBuyerInfo {
  id?: string | null;
  name: string;
  businessName?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  billingAddress: string;
  shippingAddress?: string | null;
  state?: string | null;
  stateCode?: string | null;
}

export interface CanonicalInvoiceMeta {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  placeOfSupply?: string | null;
  notes?: string | null;
  terms?: string | null;
  source: string;
  isInterState: boolean;
}

export interface CanonicalItemView {
  id: string;
  description: string;
  hsnSac?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  lineTotal: number;
  sortOrder: number;
}

export interface CanonicalTaxSummaryRow {
  hsnSac: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface CanonicalInvoiceTotals {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  amountInWords: string;
}

export interface CanonicalInvoiceViewModel {
  seller: CanonicalSellerInfo;
  buyer: CanonicalBuyerInfo;
  meta: CanonicalInvoiceMeta;
  items: CanonicalItemView[];
  hsnSummary: CanonicalTaxSummaryRow[];
  totals: CanonicalInvoiceTotals;
  bankDetails?: {
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  } | null;
  termsAndConditions: string;
  signatureTitle: string;
  isSampleData?: boolean;
}

export interface InvoiceThemeProps {
  data: CanonicalInvoiceViewModel;
  branding?: ThemeBrandingOptions;
  isPrintMode?: boolean;
}

export interface InvoiceTheme {
  id: ThemeID;
  name: string;
  description: string;
  category: ThemeCategory;
  density: ThemeDensity;
  paperSize: ThemePaperSize;
  previewAccentColor: string;
  supportedFormats: Array<'print' | 'pdf' | 'whatsapp' | 'screen'>;
  component: React.ComponentType<InvoiceThemeProps>;
}
