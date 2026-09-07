import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  processWhatsAppMessage,
  parseMerchantIntent,
  resolveOrganizationFromWhatsAppEvent,
  sendOutboundWhatsAppMessage,
} from '@/lib/services/whatsappAiService';

async function getDbClient() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  const isTestEnabled = process.env.ENABLE_WHATSAPP_TEST_SUITE === 'true';
  const reqTestKey = req.headers.get('x-test-suite-key');
  const validTestKey = process.env.WHATSAPP_TEST_SUITE_KEY;

  if (!isDev && !isTestEnabled && (!validTestKey || reqTestKey !== validTestKey)) {
    return NextResponse.json({ error: 'WhatsApp test suite is disabled in production.' }, { status: 403 });
  }

  const supabase = await getDbClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const testResults: Array<{ name: string; passed: boolean; details: string }> = [];
  let orgId = '';

  try {
    // 1. Fetch or create seed organization
    let { data: org } = await supabase.from('organizations').select('*').limit(1).maybeSingle();

    if (!org) {
      const { data: newOrg, error: createErr } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Business Org',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          invoice_prefix: 'INV-',
          invoice_sequence: 100,
          country: 'IN',
          phone: '919876543210',
          whatsapp_phone: '919876543210',
        })
        .select('*')
        .maybeSingle();

      if (createErr) {
        console.error('Error creating seed org:', createErr);
      }
      org = newOrg;
    }

    if (!org) {
      const { data: fallbackOrg } = await supabase.from('organizations').select('*').limit(1).maybeSingle();
      org = fallbackOrg;
    }

    if (!org) {
      return NextResponse.json({ error: 'Failed to find or create test organization' }, { status: 500 });
    }

    orgId = org.id;

    // 2. Seed Test Customers (isolated test phone numbers)
    const { data: existingCusts } = await supabase.from('customers').select('*').eq('organization_id', orgId);
    let custAmb1 = existingCusts?.find((c) => c.name === 'Ramesh Kumar');
    let custAmb2 = existingCusts?.find((c) => c.name === 'Ramesh Traders');
    let custUnique = existingCusts?.find((c) => c.name === 'Unique Patel');

    if (!custAmb1) {
      const { data } = await supabase
        .from('customers')
        .insert({
          organization_id: orgId,
          name: 'Ramesh Kumar',
          phone: '919800000001',
          whatsapp_phone: '919800000001',
          billing_address: 'Mumbai, MH',
          credit_limit: 50000,
          credit_days: 15,
          is_active: true,
        })
        .select('*')
        .single();
      custAmb1 = data;
    }

    if (!custAmb2) {
      const { data } = await supabase
        .from('customers')
        .insert({
          organization_id: orgId,
          name: 'Ramesh Traders',
          phone: '919800000002',
          whatsapp_phone: '919800000002',
          billing_address: 'Delhi, DL',
          credit_limit: 100000,
          credit_days: 30,
          is_active: true,
        })
        .select('*')
        .single();
      custAmb2 = data;
    }

    if (!custUnique) {
      const { data } = await supabase
        .from('customers')
        .insert({
          organization_id: orgId,
          name: 'Unique Patel',
          phone: '919800000003',
          whatsapp_phone: '919800000003',
          billing_address: 'Ahmedabad, GJ',
          credit_limit: 75000,
          credit_days: 14,
          is_active: true,
        })
        .select('*')
        .single();
      custUnique = data;
    }

    // 3. Seed Test Products (isolated test products)
    const { data: existingProds } = await supabase.from('products').select('*').eq('organization_id', orgId);
    let prodHavells1 = existingProds?.find((p) => p.name === 'Havells Switch 6A');
    let prodHavells2 = existingProds?.find((p) => p.name === 'Havells Modular Switch');
    let prodUnique = existingProds?.find((p) => p.name === 'Unique Brass Valve');

    if (!prodHavells1) {
      const { data } = await supabase
        .from('products')
        .insert({
          organization_id: orgId,
          name: 'Havells Switch 6A',
          unit: 'PCS',
          selling_price: 450,
          purchase_price: 300,
          stock_quantity: 100,
          tax_rate: 18,
          is_active: true,
        })
        .select('*')
        .single();
      prodHavells1 = data;
    }

    if (!prodHavells2) {
      const { data } = await supabase
        .from('products')
        .insert({
          organization_id: orgId,
          name: 'Havells Modular Switch',
          unit: 'PCS',
          selling_price: 600,
          purchase_price: 400,
          stock_quantity: 50,
          tax_rate: 18,
          is_active: true,
        })
        .select('*')
        .single();
      prodHavells2 = data;
    }

    if (!prodUnique) {
      const { data } = await supabase
        .from('products')
        .insert({
          organization_id: orgId,
          name: 'Unique Brass Valve',
          unit: 'PCS',
          selling_price: 1200,
          purchase_price: 800,
          stock_quantity: 500,
          tax_rate: 18,
          is_active: true,
        })
        .select('*')
        .single();
      prodUnique = data;
    } else {
      await supabase.from('products').update({ stock_quantity: 500 }).eq('id', prodUnique.id);
    }

    // --- TEST SUITE EXECUTION ---

    // 1. English Order
    const res1 = await processWhatsAppMessage({
      orgId,
      messageText: 'Create invoice for Unique Patel: 5 Unique Brass Valve at 1200',
    });
    testResults.push({
      name: '1. English Order',
      passed: res1.success && Boolean(res1.data?.invoice),
      details: res1.message,
    });

    // 2. Hinglish Order
    const res2 = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 2 Unique Brass Valve 1200 ke',
    });
    testResults.push({
      name: '2. Hinglish Order',
      passed: res2.success && Boolean(res2.data?.invoice),
      details: res2.message,
    });

    // 3. Hindi Order
    const res3 = await parseMerchantIntent('यूनिक पटेल को 2 ब्रास वाल्व 1200 रुपये के');
    testResults.push({
      name: '3. Hindi Order Intent Parsing',
      passed: res3.intent === 'create_invoice' && res3.confidence > 0.5,
      details: `Parsed intent: ${res3.intent}, customer: ${res3.customer_query}`,
    });

    // 4. Gujarati Order
    const res4 = await parseMerchantIntent('યુનિક પટેલ ને 2 બ્રાસ વાલ્વ 1200 ના આપો');
    testResults.push({
      name: '4. Gujarati Order Intent Parsing',
      passed: res4.intent === 'create_invoice' && res4.confidence > 0.5,
      details: `Parsed intent: ${res4.intent}, customer: ${res4.customer_query}`,
    });

    // 5. Ambiguous Customer
    const res5 = await processWhatsAppMessage({
      orgId,
      messageText: 'Ramesh ko 2 Unique Brass Valve 1200 ke',
    });
    testResults.push({
      name: '5. Ambiguous Customer Resolution',
      passed: !res5.success && Boolean(res5.clarificationRequired) && res5.message.includes('Multiple customers match'),
      details: res5.message,
    });

    // 6. Ambiguous Product
    const res6 = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 2 Havells 450 ke',
    });
    testResults.push({
      name: '6. Ambiguous Product Resolution',
      passed: !res6.success && Boolean(res6.clarificationRequired) && res6.message.includes('Multiple products match'),
      details: res6.message,
    });

    // 7. Missing Price (Uses configured catalog price)
    const res7 = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 1 Unique Brass Valve',
    });
    testResults.push({
      name: '7. Missing Price Catalog Fallback',
      passed: res7.success && Boolean(res7.data?.invoice),
      details: res7.message,
    });

    // 8. Missing Quantity (Must trigger clarification and reject invoice creation)
    const res8 = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko Unique Brass Valve 1200 ke',
    });
    testResults.push({
      name: '8. Missing Quantity Rejection & Clarification',
      passed: !res8.success && Boolean(res8.clarificationRequired) && res8.message.includes('specify the quantity'),
      details: res8.message,
    });

    // 9. Insufficient Stock
    const res9 = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 9999 Unique Brass Valve 1200 ke',
    });
    testResults.push({
      name: '9. Insufficient Stock Rejection',
      passed: !res9.success && res9.message.includes('Insufficient stock'),
      details: res9.message,
    });

    // 10. Invalid Order / Unsupported Command
    const res10 = await processWhatsAppMessage({
      orgId,
      messageText: 'Hello good morning how are you',
    });
    testResults.push({
      name: '10. Invalid Order Rejection',
      passed: !res10.success && res10.message.includes("couldn't identify a valid billing command"),
      details: res10.message,
    });

    // 11. Duplicate Webhook Delivery (Idempotency)
    const extId = `test_wamid_${Date.now()}`;
    await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 1 Unique Brass Valve 1200 ke',
      externalMessageId: extId,
    });
    const res11Dup = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 1 Unique Brass Valve 1200 ke',
      externalMessageId: extId,
    });
    testResults.push({
      name: '11. Duplicate Webhook Delivery (Idempotency)',
      passed: res11Dup.success && Boolean(res11Dup.isDuplicate),
      details: res11Dup.message,
    });

    // 12. Provider API Failure Graceful Fallback
    const res12 = await sendOutboundWhatsAppMessage({
      toPhone: '919800000003',
      messageText: 'Test message',
      orgId,
    });
    testResults.push({
      name: '12. Unconfigured Provider Outbound Graceful Handling',
      passed: !res12.sent && res12.status === 'unconfigured_environment',
      details: `Outbound status: ${res12.status}`,
    });

    // 13. AI Fallback Parser
    const savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res13 = await parseMerchantIntent('Ramesh ka kitna baki hai?');
    process.env.GEMINI_API_KEY = savedKey;
    testResults.push({
      name: '13. AI Key Missing Fallback Parser',
      passed: res13.intent === 'customer_outstanding' && res13.customer_query === 'Ramesh',
      details: `Fallback intent: ${res13.intent}, customer: ${res13.customer_query}`,
    });

    // 14. Cross-Organization Isolation
    const resolvedOrgId = await resolveOrganizationFromWhatsAppEvent({
      senderPhone: '919800000003',
    });
    testResults.push({
      name: '14. Organization Resolution & Isolation',
      passed: Boolean(resolvedOrgId) && resolvedOrgId === orgId,
      details: `Resolved orgId: ${resolvedOrgId}`,
    });

    // 15. Successful End-to-End Invoice Creation
    if (prodUnique?.id) {
      await supabase.from('products').update({ stock_quantity: 50 }).eq('id', prodUnique.id);
    }

    const res15 = await processWhatsAppMessage({
      orgId,
      messageText: 'Unique Patel ko 2 Unique Brass Valve 1200 ke',
    });
    testResults.push({
      name: '15. Successful End-to-End Atomic Invoice Creation',
      passed: res15.success && Boolean(res15.data?.invoice?.invoice_number),
      details: `Created Invoice #: ${res15.data?.invoice?.invoice_number}, Total: ₹${res15.data?.invoice?.total}`,
    });

    const totalPassed = testResults.filter((r) => r.passed).length;

    return NextResponse.json({
      summary: {
        total: testResults.length,
        passed: totalPassed,
        failed: testResults.length - totalPassed,
        allPassed: totalPassed === testResults.length,
      },
      testResults,
    });
  } catch (err: any) {
    console.error('Test execution error:', err);
    return NextResponse.json({ error: err?.message || 'Test suite error' }, { status: 500 });
  } finally {
    // AUTOMATIC TEST DATA CLEANUP: Ensures NO lingering test artifacts remain in production DB
    if (supabase) {
      try {
        const { data: testInvs } = await supabase
          .from('invoices')
          .select('id')
          .ilike('notes', '%Created via WhatsBill WhatsApp Cloud API%');

        const testInvIds = (testInvs || []).map((i) => i.id);
        if (testInvIds.length > 0) {
          await supabase.from('invoice_items').delete().in('invoice_id', testInvIds);
          await supabase.from('invoices').delete().in('id', testInvIds);
        }

        await supabase.from('message_logs').delete().eq('channel', 'whatsapp');
        await supabase
          .from('customers')
          .delete()
          .in('phone', ['919800000001', '919800000002', '919800000003']);
        await supabase
          .from('products')
          .delete()
          .in('name', ['Havells Switch 6A', 'Havells Modular Switch', 'Unique Brass Valve']);

        if (orgId) {
          const { data: remainingInvs } = await supabase.from('invoices').select('id').eq('organization_id', orgId);
          if (!remainingInvs || remainingInvs.length === 0) {
            await supabase.from('organizations').update({ invoice_sequence: 100 }).eq('id', orgId);
          }
        }
      } catch (cleanErr) {
        console.error('Failed to clean test data in finally block:', cleanErr);
      }
    }
  }
}
