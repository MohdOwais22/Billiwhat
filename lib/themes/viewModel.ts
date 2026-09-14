import {
  Customer,
  GstProfile,
  InvoiceItem,
  InvoiceWithDetails,
  Organization,
} from '@/types/database';
import {
  CanonicalBuyerInfo,
  CanonicalInvoiceMeta,
  CanonicalInvoiceTotals,
  CanonicalInvoiceViewModel,
  CanonicalItemView,
  CanonicalSellerInfo,
  CanonicalTaxSummaryRow,
} from './types';
import { numberToINRWords } from '@/lib/utils/formatters';

export function createCanonicalInvoiceViewModel(params: {
  invoice: InvoiceWithDetails;
  items: InvoiceItem[];
  organization?: Organization | null;
  gstProfile?: GstProfile | null;
  customer?: Customer | null;
}): CanonicalInvoiceViewModel {
  const { invoice, items, organization, gstProfile, customer: paramCustomer } = params;
  const customer = paramCustomer || invoice.customer || null;

  const sellerGstin = gstProfile?.gstin || organization?.gstin || null;
  const sellerLegalName = gstProfile?.legal_name || organization?.legal_name || organization?.name || 'Business Merchant';

  const sellerAddressParts = [
    organization?.address_line1,
    organization?.address_line2,
    organization?.city,
    organization?.state,
    organization?.pincode,
  ].filter(Boolean);

  const formattedSellerAddress = sellerAddressParts.join(', ');

  const seller: CanonicalSellerInfo = {
    id: organization?.id || 'org_unknown',
    name: organization?.name || 'Business Merchant',
    legalName: sellerLegalName,
    phone: organization?.phone || null,
    email: organization?.email || null,
    gstin: sellerGstin,
    addressLine1: organization?.address_line1 || null,
    addressLine2: organization?.address_line2 || null,
    city: organization?.city || null,
    state: organization?.state || null,
    stateCode: organization?.state_code || (sellerGstin ? sellerGstin.substring(0, 2) : '27'),
    pincode: organization?.pincode || null,
    country: organization?.country || 'India',
    currency: organization?.currency || 'INR',
    invoicePrefix: organization?.invoice_prefix || 'INV',
    formattedAddress: formattedSellerAddress,
  };

  const buyer: CanonicalBuyerInfo = {
    id: customer?.id || null,
    name: customer?.name || 'Cash Customer',
    businessName: customer?.business_name || null,
    phone: customer?.phone || null,
    email: customer?.email || null,
    gstin: customer?.gstin || null,
    billingAddress: customer?.billing_address || 'Walk-in Customer / Over the counter',
    shippingAddress: customer?.shipping_address || customer?.billing_address || undefined,
  };

  const isInterState = Boolean(invoice.igst && invoice.igst > 0);

  const meta: CanonicalInvoiceMeta = {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    invoiceType: invoice.invoice_type || (seller.gstin ? 'TAX INVOICE' : 'INVOICE'),
    status: invoice.status,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date || null,
    placeOfSupply: invoice.place_of_supply || gstProfile?.place_of_supply || '27-Maharashtra',
    notes: invoice.notes || null,
    terms: invoice.terms || null,
    source: invoice.source || 'web',
    isInterState,
  };

  const canonicalItems: CanonicalItemView[] = (items || []).map((item, idx) => ({
    id: item.id || `item_${idx}`,
    description: item.description,
    hsnSac: item.hsn_sac || '9983',
    quantity: item.quantity,
    unit: item.unit || 'Pcs',
    unitPrice: item.unit_price,
    discount: item.discount || 0,
    taxableAmount: item.taxable_amount,
    taxRate: item.tax_rate,
    cgst: item.cgst || 0,
    sgst: item.sgst || 0,
    igst: item.igst || 0,
    cess: item.cess || 0,
    lineTotal: item.line_total,
    sortOrder: item.sort_order ?? idx + 1,
  }));

  // Group items by HSN/SAC for summary table
  const hsnMap: Record<string, CanonicalTaxSummaryRow> = {};
  canonicalItems.forEach((item) => {
    const code = item.hsnSac || 'OTHER';
    if (!hsnMap[code]) {
      hsnMap[code] = {
        hsnSac: code,
        taxableAmount: 0,
        cgstRate: isInterState ? 0 : item.taxRate / 2,
        cgstAmount: 0,
        sgstRate: isInterState ? 0 : item.taxRate / 2,
        sgstAmount: 0,
        igstRate: isInterState ? item.taxRate : 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    hsnMap[code].taxableAmount += item.taxableAmount;
    hsnMap[code].cgstAmount += item.cgst;
    hsnMap[code].sgstAmount += item.sgst;
    hsnMap[code].igstAmount += item.igst;
    hsnMap[code].totalTax += item.cgst + item.sgst + item.igst + item.cess;
  });

  const hsnSummary = Object.values(hsnMap);

  const grandTotal = invoice.total;
  const totals: CanonicalInvoiceTotals = {
    subtotal: invoice.subtotal,
    discountTotal: invoice.discount_total || 0,
    taxableAmount: invoice.taxable_amount,
    cgst: invoice.cgst || 0,
    sgst: invoice.sgst || 0,
    igst: invoice.igst || 0,
    cess: invoice.cess || 0,
    roundOff: Number((grandTotal - Math.floor(grandTotal)).toFixed(2)),
    grandTotal,
    amountPaid: invoice.amount_paid || 0,
    balanceDue: invoice.balance_due ?? grandTotal - (invoice.amount_paid || 0),
    amountInWords: numberToINRWords(grandTotal),
  };

  return {
    seller,
    buyer,
    meta,
    items: canonicalItems,
    hsnSummary,
    totals,
    bankDetails: {
      accountName: seller.legalName || seller.name,
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      upiId: `${(seller.phone || 'whatsbill').replace(/[^0-9]/g, '')}@upi`,
    },
    termsAndConditions:
      invoice.terms ||
      '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within due date.\n3. Subject to local jurisdiction only.',
    signatureTitle: 'Authorized Signatory',
    isSampleData: false,
  };
}

export function getSampleCanonicalInvoiceViewModel(): CanonicalInvoiceViewModel {
  return {
    seller: {
      id: 'sample_seller',
      name: 'WhatsBill Technologies Pvt Ltd',
      legalName: 'WhatsBill Technologies Private Limited',
      phone: '+91 98765 43210',
      email: 'billing@whatsbill.in',
      gstin: '27AAAAA0000A1Z5',
      addressLine1: 'Suite 402, Trade Tower, Bandra Kurla Complex',
      addressLine2: 'G Block, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400051',
      country: 'India',
      currency: 'INR',
      invoicePrefix: 'INV',
      formattedAddress: 'Suite 402, Trade Tower, Bandra Kurla Complex, G Block, BKC, Mumbai, Maharashtra, 400051',
      branchAddress: 'Warehouse #B4, MIDC Industrial Estate, Thane West, Maharashtra - 400604',
    },
    buyer: {
      id: 'sample_buyer',
      name: 'Apex Retail Enterprises',
      businessName: 'Apex Retail Pvt Ltd',
      phone: '+91 91234 56789',
      email: 'accounts@apexretail.in',
      gstin: '27BBBBB1111B2Z3',
      billingAddress: 'Plot 12, Commercial Hub, Andheri East, Mumbai, Maharashtra - 400069',
      shippingAddress: 'Godown #3, Logistics Park, Bhiwandi, Maharashtra - 421302',
    },
    meta: {
      id: 'sample_inv_001',
      invoiceNumber: 'WB-2026-0089',
      invoiceType: 'TAX INVOICE',
      status: 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      placeOfSupply: '27-Maharashtra',
      notes: 'Thank you for your business. Please make timely payments.',
      terms: '1. Payment due within 15 days.\n2. Subject to Mumbai Jurisdiction.',
      source: 'web',
      isInterState: false,
    },
    items: [
      {
        id: 'item_1',
        description: 'Enterprise ERP Software License (Annual)',
        hsnSac: '998313',
        quantity: 2,
        unit: 'Nos',
        unitPrice: 25000,
        discount: 2500,
        taxableAmount: 47500,
        taxRate: 18,
        cgst: 4275,
        sgst: 4275,
        igst: 0,
        cess: 0,
        lineTotal: 56050,
        sortOrder: 1,
      },
      {
        id: 'item_2',
        description: 'Cloud Infrastructure & Automated Data Backup Setup',
        hsnSac: '998315',
        quantity: 1,
        unit: 'Job',
        unitPrice: 15000,
        discount: 0,
        taxableAmount: 15000,
        taxRate: 18,
        cgst: 1350,
        sgst: 1350,
        igst: 0,
        cess: 0,
        lineTotal: 17700,
        sortOrder: 2,
      },
      {
        id: 'item_3',
        description: 'POS Thermal Receipt Printer (Model WB-80)',
        hsnSac: '844332',
        quantity: 3,
        unit: 'Pcs',
        unitPrice: 4500,
        discount: 500,
        taxableAmount: 13000,
        taxRate: 18,
        cgst: 1170,
        sgst: 1170,
        igst: 0,
        cess: 0,
        lineTotal: 15340,
        sortOrder: 3,
      },
    ],
    hsnSummary: [
      {
        hsnSac: '998313',
        taxableAmount: 47500,
        cgstRate: 9,
        cgstAmount: 4275,
        sgstRate: 9,
        sgstAmount: 4275,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 8550,
      },
      {
        hsnSac: '998315',
        taxableAmount: 15000,
        cgstRate: 9,
        cgstAmount: 1350,
        sgstRate: 9,
        sgstAmount: 1350,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 2700,
      },
      {
        hsnSac: '844332',
        taxableAmount: 13000,
        cgstRate: 9,
        cgstAmount: 1170,
        sgstRate: 9,
        sgstAmount: 1170,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 2340,
      },
    ],
    totals: {
      subtotal: 82000,
      discountTotal: 3000,
      taxableAmount: 75500,
      cgst: 6795,
      sgst: 6795,
      igst: 0,
      cess: 0,
      roundOff: 0,
      grandTotal: 89090,
      amountPaid: 25000,
      balanceDue: 64090,
      amountInWords: numberToINRWords(89090),
    },
    bankDetails: {
      accountName: 'WhatsBill Technologies Pvt Ltd',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '502000987654321',
      ifscCode: 'HDFC0000123',
      upiId: 'whatsbill@hdfcbank',
    },
    termsAndConditions:
      '1. Goods/Services once billed are non-refundable.\n2. Interest @ 18% per annum will be charged on overdue balances.\n3. All disputes subject to Mumbai Jurisdiction.',
    signatureTitle: 'Authorized Signatory',
    isSampleData: true,
  };
}
