import { InvoiceTheme, ThemeCategory, ThemeID } from './types';
import { ClassicLedgerTheme } from './renderers/ClassicLedgerTheme';
import { GstProTheme } from './renderers/GstProTheme';
import { BusinessClassicTheme } from './renderers/BusinessClassicTheme';
import { ModernMinimalTheme } from './renderers/ModernMinimalTheme';
import { ExecutiveTheme } from './renderers/ExecutiveTheme';
import { RetailCompactTheme } from './renderers/RetailCompactTheme';
import { A5CompactTheme } from './renderers/A5CompactTheme';
import { WholesaleProTheme } from './renderers/WholesaleProTheme';
import { ManufacturingTheme } from './renderers/ManufacturingTheme';
import { ServiceProTheme } from './renderers/ServiceProTheme';
import { ElegantTheme } from './renderers/ElegantTheme';
import { WhatsAppCleanTheme } from './renderers/WhatsAppCleanTheme';
import { DarkHeaderTheme } from './renderers/DarkHeaderTheme';
import { MinimalGstTheme } from './renderers/MinimalGstTheme';
import { MultiBranchTheme } from './renderers/MultiBranchTheme';

export const DEFAULT_THEME_ID: ThemeID = 'classic_ledger';

export const INVOICE_THEMES: Record<ThemeID, InvoiceTheme> = {
  classic_ledger: {
    id: 'classic_ledger',
    name: 'Classic Ledger',
    description: 'Traditional accounting software layout with dense grid lines, double borders, and ledger feel.',
    category: 'accounting',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#0f172a',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: ClassicLedgerTheme,
  },
  gst_pro: {
    id: 'gst_pro',
    name: 'GST Pro B2B',
    description: 'B2B tax compliance layout featuring Place of Supply, HSN/SAC summary table, and CGST/SGST/IGST breakdown.',
    category: 'gst',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#064e3b',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: GstProTheme,
  },
  business_classic: {
    id: 'business_classic',
    name: 'Business Classic',
    description: 'Balanced corporate invoice layout with strong header branding and structured metadata cards.',
    category: 'accounting',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#1e293b',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: BusinessClassicTheme,
  },
  modern_minimal: {
    id: 'modern_minimal',
    name: 'Modern Minimal',
    description: 'Sleek frameless table layout with generous whitespace, subtle fills, and modern typography.',
    category: 'modern',
    density: 'spacious',
    paperSize: 'A4',
    previewAccentColor: '#64748b',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: ModernMinimalTheme,
  },
  executive: {
    id: 'executive',
    name: 'Executive Dark Accent',
    description: 'Premium corporate appearance with a dark slate header, gold accent line, and crisp visual hierarchy.',
    category: 'modern',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#0f172a',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: ExecutiveTheme,
  },
  retail_compact: {
    id: 'retail_compact',
    name: 'Retail Shop Compact',
    description: 'High-density, fast-print layout tailored for retail stores and counter billing.',
    category: 'compact',
    density: 'compact',
    paperSize: 'responsive',
    previewAccentColor: '#334155',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: RetailCompactTheme,
  },
  a5_compact: {
    id: 'a5_compact',
    name: 'A5 Paper Efficient',
    description: 'Designed specifically for A5 dimensions (148mm x 210mm) to halve paper consumption.',
    category: 'compact',
    density: 'compact',
    paperSize: 'A5',
    previewAccentColor: '#475569',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: A5CompactTheme,
  },
  wholesale_pro: {
    id: 'wholesale_pro',
    name: 'Wholesale Distributor',
    description: 'Trader focus featuring Qty, Unit, MRP, Wholesale Rate, Discount, and Tax columns.',
    category: 'industry',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#1e1b4b',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: WholesaleProTheme,
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing & Gate Pass',
    description: 'Industrial layout highlighting dispatch location, transport mode, and factory consignment details.',
    category: 'industry',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#111827',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: ManufacturingTheme,
  },
  service_pro: {
    id: 'service_pro',
    name: 'Service & Consulting Pro',
    description: 'Agency and consulting layout with SAC codes, hourly deliverable notes, and bank remittance terms.',
    category: 'industry',
    density: 'spacious',
    paperSize: 'A4',
    previewAccentColor: '#4338ca',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: ServiceProTheme,
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant Luxe',
    description: 'Premium display typography, subtle bronze borders, and elegant totals styling.',
    category: 'modern',
    density: 'spacious',
    paperSize: 'A4',
    previewAccentColor: '#78350f',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: ElegantTheme,
  },
  whatsapp_clean: {
    id: 'whatsapp_clean',
    name: 'WhatsApp Mobile Clean',
    description: 'Mobile-first layout with high contrast, large readable fonts (14px+), and instant UPI payment badge.',
    category: 'mobile',
    density: 'spacious',
    paperSize: 'responsive',
    previewAccentColor: '#059669',
    supportedFormats: ['whatsapp', 'screen', 'pdf'],
    component: WhatsAppCleanTheme,
  },
  dark_header: {
    id: 'dark_header',
    name: 'Dark Header Impact',
    description: 'Deep charcoal header block for maximum visual impact, remaining 80% print-friendly white canvas.',
    category: 'modern',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#020617',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: DarkHeaderTheme,
  },
  minimal_gst: {
    id: 'minimal_gst',
    name: 'Minimal GST Compliance',
    description: 'Form GST INV-01 inspired ultra-clean line layout focused strictly on tax compliance.',
    category: 'gst',
    density: 'compact',
    paperSize: 'A4',
    previewAccentColor: '#0f172a',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: MinimalGstTheme,
  },
  multi_branch: {
    id: 'multi_branch',
    name: 'Multi-Branch & Godown',
    description: 'Dual address layout displaying Head Office, Godown dispatch location, and GSTIN details.',
    category: 'industry',
    density: 'normal',
    paperSize: 'A4',
    previewAccentColor: '#18181b',
    supportedFormats: ['print', 'pdf', 'screen'],
    component: MultiBranchTheme,
  },
};

export function getTheme(id?: string | null): InvoiceTheme {
  if (id && INVOICE_THEMES[id as ThemeID]) {
    return INVOICE_THEMES[id as ThemeID];
  }
  return INVOICE_THEMES[DEFAULT_THEME_ID];
}

export function getAllThemes(): InvoiceTheme[] {
  return Object.values(INVOICE_THEMES);
}

export function getThemesByCategory(category: ThemeCategory): InvoiceTheme[] {
  return Object.values(INVOICE_THEMES).filter((t) => t.category === category);
}

export function recommendThemeFromPrompt(prompt: string): ThemeID {
  const p = prompt.toLowerCase();
  if (p.includes('whatsapp') || p.includes('mobile') || p.includes('phone')) return 'whatsapp_clean';
  if (p.includes('gst') || p.includes('tax') || p.includes('hsn') || p.includes('b2b')) return 'gst_pro';
  if (p.includes('a5') || p.includes('half paper')) return 'a5_compact';
  if (p.includes('wholesale') || p.includes('distributor') || p.includes('trader')) return 'wholesale_pro';
  if (p.includes('factory') || p.includes('manufacturing') || p.includes('gate pass')) return 'manufacturing';
  if (p.includes('service') || p.includes('consulting') || p.includes('agency')) return 'service_pro';
  if (p.includes('minimal') || p.includes('clean')) return 'modern_minimal';
  if (p.includes('elegant') || p.includes('luxury') || p.includes('premium')) return 'elegant';
  if (p.includes('retail') || p.includes('shop') || p.includes('counter')) return 'retail_compact';
  if (p.includes('branch') || p.includes('godown')) return 'multi_branch';
  if (p.includes('executive') || p.includes('dark')) return 'executive';
  return DEFAULT_THEME_ID;
}
