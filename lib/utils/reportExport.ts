import {
  CustomerStatementData,
  GstRateBreakdownItem,
  Gstr1PreparationRow,
  ReceivablesAgeingReportData,
  SalesReportBreakdownItem,
} from '@/lib/services/reportsService';
import { ReceivablesInvoiceItem } from '@/lib/services/collectionsService';
import { EnrichedPayment } from '@/lib/services/paymentsService';

/**
 * Downloads a generated CSV file directly in browser
 */
function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports Sales Invoices & Breakdowns to CSV
 */
export function exportSalesReportToCSV(
  invoices: Gstr1PreparationRow[],
  dailyBreakdown: SalesReportBreakdownItem[],
  dateRangeLabel: string
) {
  const lines: string[] = [];

  // Header
  lines.push(`WhatsBill - Sales & Revenue Report (${dateRangeLabel})`);
  lines.push(`Generated on,${new Date().toISOString()}`);
  lines.push('');

  // Daily Summary section
  lines.push('--- PERIOD BREAKDOWN ---');
  lines.push('Period / Date,Invoice Count,Taxable Value (INR),Tax Amount (INR),Total Sales (INR),Collected (INR)');
  dailyBreakdown.forEach((item) => {
    lines.push([
      escapeCSV(item.label),
      item.invoiceCount,
      item.taxableAmount.toFixed(2),
      item.taxAmount.toFixed(2),
      item.totalSales.toFixed(2),
      item.collectedAmount.toFixed(2),
    ].join(','));
  });

  lines.push('');
  lines.push('--- INVOICE REGISTER ---');
  lines.push('Invoice Number,Invoice Date,Customer Name,Customer GSTIN,Status,Place of Supply,Taxable Amount (INR),CGST (INR),SGST (INR),IGST (INR),Cess (INR),Total Tax (INR),Total Invoice Value (INR)');

  invoices.forEach((inv) => {
    lines.push([
      escapeCSV(inv.invoiceNumber),
      escapeCSV(inv.invoiceDate),
      escapeCSV(inv.customerBusinessName ? `${inv.customerName} (${inv.customerBusinessName})` : inv.customerName),
      escapeCSV(inv.customerGstin || 'Unregistered'),
      escapeCSV(inv.status.toUpperCase()),
      escapeCSV(inv.placeOfSupply),
      inv.taxableAmount.toFixed(2),
      inv.cgst.toFixed(2),
      inv.sgst.toFixed(2),
      inv.igst.toFixed(2),
      inv.cess.toFixed(2),
      inv.totalTax.toFixed(2),
      inv.total.toFixed(2),
    ].join(','));
  });

  const csvContent = lines.join('\n');
  const cleanFilename = `Sales_Report_${dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

/**
 * Exports GST Summary & Rate-wise breakdown to CSV
 */
export function exportGstSummaryToCSV(
  rateBreakdown: GstRateBreakdownItem[],
  summary: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
    totalInvoiceValue: number;
  },
  dateRangeLabel: string
) {
  const lines: string[] = [];

  lines.push(`WhatsBill - GST Outward Tax Summary (${dateRangeLabel})`);
  lines.push(`Generated on,${new Date().toISOString()}`);
  lines.push('');

  lines.push('--- OVERALL GST SUMMARY ---');
  lines.push(`Total Taxable Value (INR),${summary.taxableValue.toFixed(2)}`);
  lines.push(`Total Central GST (CGST) (INR),${summary.cgst.toFixed(2)}`);
  lines.push(`Total State GST (SGST) (INR),${summary.sgst.toFixed(2)}`);
  lines.push(`Total Integrated GST (IGST) (INR),${summary.igst.toFixed(2)}`);
  lines.push(`Total Cess (INR),${summary.cess.toFixed(2)}`);
  lines.push(`Total Tax Output (INR),${summary.totalTax.toFixed(2)}`);
  lines.push(`Total Invoiced Turnover (INR),${summary.totalInvoiceValue.toFixed(2)}`);
  lines.push('');

  lines.push('--- RATE-WISE TAX BREAKDOWN ---');
  lines.push('GST Rate (%),Item/Transaction Count,Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Cess (INR),Total Tax (INR),Total Value (INR)');

  rateBreakdown.forEach((r) => {
    lines.push([
      `${r.taxRate}%`,
      r.itemCount,
      r.taxableAmount.toFixed(2),
      r.cgst.toFixed(2),
      r.sgst.toFixed(2),
      r.igst.toFixed(2),
      r.cess.toFixed(2),
      r.totalTax.toFixed(2),
      r.totalValue.toFixed(2),
    ].join(','));
  });

  const csvContent = lines.join('\n');
  const cleanFilename = `GST_Rate_Summary_${dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

/**
 * Exports GSTR-1 preparation data to standardized CSV
 */
export function exportGstr1ToCSV(
  rows: Gstr1PreparationRow[],
  dateRangeLabel: string
) {
  const lines: string[] = [];

  lines.push('GSTR-1 Export Preparation Data');
  lines.push(`Period,${dateRangeLabel}`);
  lines.push(`Generated on,${new Date().toISOString()}`);
  lines.push('Note,Derived from verified outward sales invoices. For review and export preparation.');
  lines.push('');

  lines.push('Invoice Number,Invoice Date,Customer GSTIN,Customer Legal Name,Trade / Business Name,Invoice Type,Place of Supply,Status,Taxable Value,CGST Amount,SGST Amount,IGST Amount,Cess Amount,Total Tax,Total Invoice Value');

  rows.forEach((r) => {
    lines.push([
      escapeCSV(r.invoiceNumber),
      escapeCSV(r.invoiceDate),
      escapeCSV(r.customerGstin || 'URP'),
      escapeCSV(r.customerName),
      escapeCSV(r.customerBusinessName || ''),
      escapeCSV(r.isB2B ? 'B2B Regular' : 'B2C Small'),
      escapeCSV(r.placeOfSupply),
      escapeCSV(r.status.toUpperCase()),
      r.taxableAmount.toFixed(2),
      r.cgst.toFixed(2),
      r.sgst.toFixed(2),
      r.igst.toFixed(2),
      r.cess.toFixed(2),
      r.totalTax.toFixed(2),
      r.total.toFixed(2),
    ].join(','));
  });

  const csvContent = lines.join('\n');
  const cleanFilename = `GSTR1_Export_Prep_${dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

/**
 * Exports Customer Party Account Statement to CSV
 */
export function exportCustomerStatementToCSV(
  statement: CustomerStatementData,
  dateRangeLabel: string
) {
  const lines: string[] = [];
  const c = statement.customer;

  lines.push(`Account Statement of: ${c.name} ${c.business_name ? `(${c.business_name})` : ''}`);
  lines.push(`Phone,${c.phone}`);
  lines.push(`GSTIN,${c.gstin || 'Unregistered'}`);
  lines.push(`Period,${dateRangeLabel}`);
  lines.push(`Opening Balance (INR),${statement.openingBalance.toFixed(2)}`);
  lines.push(`Total Invoiced (Debits) (INR),${statement.totalDebits.toFixed(2)}`);
  lines.push(`Total Paid (Credits) (INR),${statement.totalCredits.toFixed(2)}`);
  lines.push(`Closing Balance (INR),${statement.closingBalance.toFixed(2)}`);
  lines.push('');

  lines.push('Date,Transaction Type,Reference / Voucher,Description,Debit (+) (INR),Credit (-) (INR),Running Balance (INR)');

  // Opening balance row
  lines.push([
    '',
    'Opening Balance',
    'B/F',
    'Balance brought forward prior to period',
    '',
    '',
    statement.openingBalance.toFixed(2),
  ].join(','));

  statement.entries.forEach((e) => {
    lines.push([
      escapeCSV(e.date),
      escapeCSV(e.type === 'invoice' ? 'Tax Invoice' : 'Payment Received'),
      escapeCSV(e.reference),
      escapeCSV(e.description),
      e.debit > 0 ? e.debit.toFixed(2) : '',
      e.credit > 0 ? e.credit.toFixed(2) : '',
      e.runningBalance.toFixed(2),
    ].join(','));
  });

  const csvContent = lines.join('\n');
  const cleanName = c.name.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanFilename = `Statement_${cleanName}_${dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

/**
 * Exports Receivables Ageing report to CSV
 */
export function exportReceivablesAgeingToCSV(
  ageing: ReceivablesAgeingReportData,
  dateRangeLabel: string
) {
  const lines: string[] = [];

  lines.push(`WhatsBill - Receivables Ageing Analysis`);
  lines.push(`As of,${new Date().toLocaleDateString('en-IN')}`);
  lines.push(`Total Outstanding (INR),${ageing.totalOutstanding.toFixed(2)}`);
  lines.push('');

  lines.push('--- BUCKET SUMMARY ---');
  lines.push('Ageing Bracket,Total Invoices,Outstanding Amount (INR),% Share');
  const total = ageing.totalOutstanding || 1;
  lines.push(`Current (Not Due),${ageing.bucketCounts.current},${ageing.bucketTotals.current.toFixed(2)},${((ageing.bucketTotals.current / total) * 100).toFixed(1)}%`);
  lines.push(`1-30 Days Overdue,${ageing.bucketCounts.days1to30},${ageing.bucketTotals.days1to30.toFixed(2)},${((ageing.bucketTotals.days1to30 / total) * 100).toFixed(1)}%`);
  lines.push(`31-60 Days Overdue,${ageing.bucketCounts.days31to60},${ageing.bucketTotals.days31to60.toFixed(2)},${((ageing.bucketTotals.days31to60 / total) * 100).toFixed(1)}%`);
  lines.push(`61-90 Days Overdue,${ageing.bucketCounts.days61to90},${ageing.bucketTotals.days61to90.toFixed(2)},${((ageing.bucketTotals.days61to90 / total) * 100).toFixed(1)}%`);
  lines.push(`90+ Days Overdue,${ageing.bucketCounts.days90Plus},${ageing.bucketTotals.days90Plus.toFixed(2)},${((ageing.bucketTotals.days90Plus / total) * 100).toFixed(1)}%`);
  lines.push('');

  lines.push('--- CUSTOMER-WISE AGEING LEDGER ---');
  lines.push('Customer Name,Business Name,Phone,GSTIN,Current (INR),1-30 Days (INR),31-60 Days (INR),61-90 Days (INR),90+ Days (INR),Total Outstanding (INR)');

  ageing.customerRows.forEach((r) => {
    lines.push([
      escapeCSV(r.customerName),
      escapeCSV(r.businessName || ''),
      escapeCSV(r.phone),
      escapeCSV(r.gstin || 'Unregistered'),
      r.current.toFixed(2),
      r.days1to30.toFixed(2),
      r.days31to60.toFixed(2),
      r.days61to90.toFixed(2),
      r.days90Plus.toFixed(2),
      r.totalOutstanding.toFixed(2),
    ].join(','));
  });

  const csvContent = lines.join('\n');
  const cleanFilename = `Receivables_Ageing_Report_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

/**
 * Exports Collections & Receivables Queue Register to CSV
 */
export function exportCollectionsRegisterToCSV(
  queue: ReceivablesInvoiceItem[],
  totalOutstanding: number
) {
  const lines: string[] = [];

  lines.push(`WhatsBill - Receivables & Collections Register`);
  lines.push(`Generated Date,${new Date().toLocaleDateString('en-IN')}`);
  lines.push(`Total Open Invoices,${queue.length}`);
  lines.push(`Total Outstanding Balance (INR),${totalOutstanding.toFixed(2)}`);
  lines.push('');

  lines.push(
    'Invoice #,Issue Date,Due Date,Days Overdue,Ageing Bucket,Priority,Customer Name,Business Name,Phone,GSTIN,Invoice Total (INR),Amount Paid (INR),Balance Due (INR),Suggested Action'
  );

  queue.forEach((item) => {
    lines.push(
      [
        escapeCSV(item.invoiceNumber),
        escapeCSV(item.issueDate),
        escapeCSV(item.dueDate),
        item.daysOverdue,
        escapeCSV(item.bucket.toUpperCase()),
        escapeCSV(item.priority.toUpperCase()),
        escapeCSV(item.customerName),
        escapeCSV(item.customerBusinessName || ''),
        escapeCSV(item.phone),
        escapeCSV(item.gstin || 'Unregistered'),
        item.total.toFixed(2),
        item.amountPaid.toFixed(2),
        item.balanceDue.toFixed(2),
        escapeCSV(item.suggestedAction),
      ].join(',')
    );
  });

  const csvContent = lines.join('\n');
  const cleanFilename = `Collections_Register_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

/**
 * Exports Payment Settlements Register to CSV
 */
export function exportPaymentRegisterToCSV(
  payments: EnrichedPayment[],
  totalCollected: number
) {
  const lines: string[] = [];

  lines.push(`WhatsBill - Payment Settlements Register`);
  lines.push(`Generated Date,${new Date().toLocaleDateString('en-IN')}`);
  lines.push(`Total Transactions,${payments.length}`);
  lines.push(`Total Collected Amount (INR),${totalCollected.toFixed(2)}`);
  lines.push('');

  lines.push(
    'Payment ID,Payment Date,Customer Name,Business Name,Phone,GSTIN,Invoice #,Amount (INR),Payment Method,Reference / UTR,Gateway,Status'
  );

  payments.forEach((p) => {
    const cust = p.customer;
    lines.push(
      [
        escapeCSV(p.id),
        escapeCSV((p.paid_at || p.created_at).split('T')[0]),
        escapeCSV(cust?.name || 'Customer'),
        escapeCSV(cust?.business_name || ''),
        escapeCSV(cust?.phone || ''),
        escapeCSV(cust?.gstin || 'Unregistered'),
        escapeCSV(p.invoice?.invoice_number || 'Unallocated'),
        (Number(p.amount) || 0).toFixed(2),
        escapeCSV((p.method || 'cash').toUpperCase()),
        escapeCSV(p.reference || p.gateway_payment_id || ''),
        escapeCSV(p.gateway || 'Manual'),
        escapeCSV((p.status || 'completed').toUpperCase()),
      ].join(',')
    );
  });

  const csvContent = lines.join('\n');
  const cleanFilename = `Payment_Settlements_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(cleanFilename, csvContent);
}

