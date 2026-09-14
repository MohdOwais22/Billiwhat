import { getAllThemes, getTheme, INVOICE_THEMES } from '../lib/themes/registry';
import { ThemeID } from '../lib/themes/types';
import { createCanonicalInvoiceViewModel, getSampleCanonicalInvoiceViewModel } from '../lib/themes/viewModel';
import { InvoiceWithDetails, Organization, GstProfile, InvoiceItem } from '../types/database';

async function runThemeEngineVerificationSuite() {
  console.log('====================================================');
  console.log('WHATSBILL INVOICE THEME ENGINE VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedTests++;
    }
  }

  // TEST 1: Theme Registry Completeness
  console.log('--- TEST GROUP 1: Theme Registry Completeness ---');
  const allThemes = getAllThemes();
  assert(allThemes.length === 13, `All 13 themes must be registered (Found: ${allThemes.length})`);

  const expectedIds: ThemeID[] = [
    'classic_ledger',
    'tally_prime',
    'gst_pro',
    'business_classic',
    'modern_minimal',
    'retail_compact',
    'a5_compact',
    'manufacturing',
    'service_pro',
    'elegant',
    'whatsapp_clean',
    'minimal_gst',
    'multi_branch',
  ];

  expectedIds.forEach((themeId) => {
    const theme = getTheme(themeId);
    assert(theme.id === themeId, `Theme '${themeId}' resolves accurately`);
    assert(Boolean(theme.name && theme.description), `Theme '${themeId}' has name and description`);
    assert(Boolean(theme.component), `Theme '${themeId}' has a valid React component`);
  });

  // TEST 2: Fallback Theme Handling
  console.log('\n--- TEST GROUP 2: Error & Unknown Theme Fallback ---');
  const unknownTheme = getTheme('unknown_non_existent_theme_xyz');
  assert(
    unknownTheme.id === 'classic_ledger',
    `Unknown theme ID falls back seamlessly to default 'classic_ledger'`
  );

  // TEST 3: Canonical View-Model Immutability
  console.log('\n--- TEST GROUP 3: Canonical View-Model Financial Immutability ---');
  const sampleData = getSampleCanonicalInvoiceViewModel();
  assert(Boolean(sampleData.seller.name), 'Sample data contains seller information');
  assert(Boolean(sampleData.buyer.name), 'Sample data contains buyer information');
  assert(sampleData.items.length === 3, 'Sample data contains 3 items');
  assert(sampleData.totals.grandTotal === 89090, 'Grand total matches expected financial sum (89,090)');
  assert(
    sampleData.totals.taxableAmount + sampleData.totals.cgst + sampleData.totals.sgst + sampleData.totals.igst + sampleData.totals.roundOff ===
      sampleData.totals.grandTotal,
    'Financial calculation (taxableAmount + CGST + SGST + IGST + roundOff) is 100% mathematically consistent'
  );

  // TEST 4: Verification against Real Database Models
  console.log('\n--- TEST GROUP 4: Database Model Conversion ---');
  const dummyOrg: Organization = {
    id: 'org_test_123',
    name: 'Mahavir Trading Co.',
    legal_name: 'Mahavir Trading Company Private Limited',
    phone: '+91 98200 12345',
    email: 'sales@mahavir.in',
    gstin: '27ABCDE1234F1Z5',
    address_line1: 'Gala 10, Commerce Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    state_code: '27',
    pincode: '400001',
    country: 'India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    invoice_prefix: 'MTR',
    invoice_sequence: 101,
    invoice_theme_id: 'gst_pro',
    created_at: new Date().toISOString(),
  };

  const dummyInvoice: InvoiceWithDetails = {
    id: 'inv_test_001',
    organization_id: dummyOrg.id,
    customer_id: 'cust_999',
    invoice_number: 'MTR-2026-0042',
    invoice_type: 'TAX INVOICE',
    status: 'issued',
    issue_date: '2026-09-14',
    subtotal: 50000,
    discount_total: 2000,
    taxable_amount: 48000,
    cgst: 4320,
    sgst: 4320,
    igst: 0,
    cess: 0,
    total: 56640,
    place_of_supply: '27-Maharashtra',
    source: 'web',
    created_at: new Date().toISOString(),
    amount_paid: 20000,
    balance_due: 36640,
    days_overdue: 0,
  };

  const dummyItems: InvoiceItem[] = [
    {
      id: 'item_1',
      invoice_id: dummyInvoice.id,
      description: 'Industrial Bearings Heavy Duty',
      hsn_sac: '8482',
      quantity: 10,
      unit: 'Boxes',
      unit_price: 5000,
      discount: 2000,
      taxable_amount: 48000,
      tax_rate: 18,
      cgst: 4320,
      sgst: 4320,
      igst: 0,
      cess: 0,
      line_total: 56640,
      sort_order: 1,
      created_at: new Date().toISOString(),
    },
  ];

  const vm = createCanonicalInvoiceViewModel({
    invoice: dummyInvoice,
    items: dummyItems,
    organization: dummyOrg,
  });

  assert(vm.seller.name === 'Mahavir Trading Co.', 'Seller name converted accurately');
  assert(vm.meta.invoiceNumber === 'MTR-2026-0042', 'Invoice number preserved');
  assert(vm.totals.grandTotal === 56640, 'Grand total preserved');
  assert(vm.totals.balanceDue === 36640, 'Balance due preserved');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runThemeEngineVerificationSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
