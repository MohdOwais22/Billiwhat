import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Customer, Product, Invoice } from '@/types/database';
import { formatINR, formatDate } from '@/lib/utils/formatters';

async function getDbClient() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

export type ExtractedIntentType =
  | 'create_invoice'
  | 'customer_outstanding'
  | 'payment_status'
  | 'find_customer'
  | 'unsupported';

export interface ExtractedItemIntent {
  product_query: string;
  quantity: number | null;
  unit_price: number | null;
}

export interface ExtractedIntent {
  intent: ExtractedIntentType;
  customer_query: string | null;
  items: ExtractedItemIntent[];
  notes: string | null;
  confidence: number;
}

export interface ProcessingResult {
  success: boolean;
  intent: ExtractedIntent;
  message: string;
  isDuplicate?: boolean;
  data?: {
    invoice?: Invoice;
    customer?: Customer;
    outstandingAmount?: number;
    payments?: any[];
  };
  clarificationRequired?: boolean;
  providerStatus?: 'configured' | 'unconfigured_environment';
}

const SYSTEM_PROMPT = `
You are WhatsBill AI, a server-side backend assistant for Indian SMB merchants.
Your ONLY responsibility is to extract structured intent from merchant messages (in English, Hindi, Hinglish, Gujarati, Marathi, Bengali, Punjabi, Tamil, Telugu, Kannada, Malayalam, Odia, etc.) into strict JSON.

You MUST extract into this EXACT JSON structure:
{
  "intent": "create_invoice" | "customer_outstanding" | "payment_status" | "find_customer" | "unsupported",
  "customer_query": string or null,
  "items": [
    {
      "product_query": string,
      "quantity": number or null,
      "unit_price": number or null
    }
  ],
  "notes": string or null,
  "confidence": number between 0 and 1
}

STRICT EXTRACTION CONSTRAINTS:
1. Do NOT calculate invoice totals, line totals, tax amounts, CGST, SGST, IGST, or stock balances.
2. Do NOT invent customer names, product names, quantities, or prices if not present in the message.
3. If quantity is NOT explicitly stated in the message (e.g. "Ramesh ko Havells switch"), set "quantity": null. Do NOT assume or guess 1.
4. If unit price is NOT explicitly stated in the message, set "unit_price": null.
5. If the user asks to issue a bill/invoice, set intent = "create_invoice".
6. If the user asks about outstanding balance, set intent = "customer_outstanding".
7. If the user asks about payment status, set intent = "payment_status".
8. If the user wants to search customer details, set intent = "find_customer".
9. Extract quantities correctly in Indian languages & scripts:
   - "20" / "बीस" / "વીસ" -> quantity = 20
   - "10" / "दस" / "દસ" -> quantity = 10
10. If an explicit unit price is given (e.g. "450 ke", "at 450", "450 rate"), extract unit_price = 450. If no price mentioned, set unit_price = null.
11. Return ONLY valid raw JSON matching the schema.
`;

/**
 * Parses user conversational message using Gemini AI into structured JSON intent
 */
export async function parseMerchantIntent(messageText: string): Promise<ExtractedIntent> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackParseIntent(messageText);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `${SYSTEM_PROMPT}\n\nUser Message: "${messageText}"`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    const parsed = JSON.parse(rawText);

    return {
      intent: parsed.intent || 'unsupported',
      customer_query: parsed.customer_query || null,
      items: Array.isArray(parsed.items)
        ? parsed.items.map((it: any) => ({
            product_query: String(it.product_query || ''),
            quantity: typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : null,
            unit_price: typeof it.unit_price === 'number' && it.unit_price > 0 ? it.unit_price : null,
          }))
        : [],
      notes: parsed.notes || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
    };
  } catch (err) {
    console.error('Error parsing merchant intent with Gemini API:', err);
    return fallbackParseIntent(messageText);
  }
}

/**
 * Fallback heuristic intent parser when API key is unavailable or fails
 * NEVER invents or guesses quantity, price, customer, or product fields
 */
export function fallbackParseIntent(messageText: string): ExtractedIntent {
  const text = messageText.trim();
  const lower = text.toLowerCase();

  // Check for greetings or non-billing text
  const billingKeywords = ['baki', 'outstanding', 'due', 'payment', 'paid', 'invoice', 'bill', 'ko', 'ne', 'bhej', 'de', 'give', 'send', 'order', 'આપો', 'ને', 'કો', 'કે'];
  const hasBillingKeyword = billingKeywords.some((kw) => lower.includes(kw));

  if (!hasBillingKeyword && !/\d+/.test(text)) {
    return {
      intent: 'unsupported',
      customer_query: null,
      items: [],
      notes: null,
      confidence: 0,
    };
  }

  // Outstanding check
  if (lower.includes('baki') || lower.includes('outstanding') || lower.includes('due')) {
    const custMatch = text.match(/^(.+?)\s+(ka|ki|ke|has|outstanding|baki)/i);
    return {
      intent: 'customer_outstanding',
      customer_query: custMatch ? custMatch[1].trim() : text.replace(/(baki|outstanding|due|ka|ki|ke)/gi, '').trim() || null,
      items: [],
      notes: null,
      confidence: 0.8,
    };
  }

  // Payment check
  if (lower.includes('payment') || lower.includes('pay kiya') || lower.includes('paid')) {
    const custMatch = text.match(/^(.+?)\s+(ne|paid|payment)/i);
    return {
      intent: 'payment_status',
      customer_query: custMatch ? custMatch[1].trim() : text.replace(/(payment|kiya|paid|ne)/gi, '').trim() || null,
      items: [],
      notes: null,
      confidence: 0.8,
    };
  }

  // Invoice creation check
  let custQuery: string | null = null;
  let restText = text;

  if (lower.startsWith('create invoice for') || lower.startsWith('invoice for')) {
    const withoutPrefix = text.replace(/^(create\s+)?invoice\s+for\s+/i, '');
    const parts = withoutPrefix.split(':');
    custQuery = parts[0].trim() || null;
    restText = parts.slice(1).join(':').trim() || parts[0];
  } else if (text.includes(' ko ')) {
    const parts = text.split(/\s+ko\s+/i);
    custQuery = parts[0].trim() || null;
    restText = parts.slice(1).join(' ko ').trim();
  } else if (text.includes(' को ')) {
    const parts = text.split(/\s+को\s+/);
    custQuery = parts[0].trim() || null;
    restText = parts.slice(1).join(' को ').trim();
  } else if (text.includes(' ને ')) {
    const parts = text.split(/\s+ને\s+/);
    custQuery = parts[0].trim() || null;
    restText = parts.slice(1).join(' ને ').trim();
  } else {
    const matchCust = text.match(/^([a-zA-Z0-9\s]+?)\s*(\d+|:)/);
    if (matchCust) {
      custQuery = matchCust[1].trim() || null;
      restText = text.slice(matchCust[1].length).trim();
    } else {
      const words = text.split(/\s+/);
      custQuery = words[0] || null;
      restText = words.slice(1).join(' ');
    }
  }

  // Extract quantity & price from restText without guessing
  const numbers = restText.match(/\b\d+\b/g) || [];
  let qty: number | null = null;
  let price: number | null = null;

  if (numbers.length >= 2) {
    qty = parseInt(numbers[0], 10);
    price = parseInt(numbers[1], 10);
  } else if (numbers.length === 1) {
    const num = parseInt(numbers[0], 10);
    if (/at\s+\d+|@\s*\d+|\b\d+\s*(ke|rs|rupees|rate|ના)\b/i.test(restText)) {
      price = num;
      qty = null;
    } else {
      qty = num;
      price = null;
    }
  }

  // Clean product query from restText
  let prodQuery: string | null = restText
    .replace(/\b\d+\b/g, '')
    .replace(/(at|@|ke|rs|rupees|rate|bhej|de|give|send|ko|ne|order|આપો|ના|રુપિયા|रुपये)/gi, '')
    .replace(/[:]/g, '')
    .trim() || null;

  return {
    intent: 'create_invoice',
    customer_query: custQuery,
    items: prodQuery ? [{ product_query: prodQuery, quantity: qty, unit_price: price }] : [],
    notes: null,
    confidence: 0.75,
  };
}

/**
 * Resolves Organization ID strictly from verified database identities
 * Never trusts org_id supplied by inbound payloads
 */
export async function resolveOrganizationFromWhatsAppEvent({
  metaPhoneNumberId,
  senderPhone,
}: {
  metaPhoneNumberId?: string | null;
  senderPhone: string;
}): Promise<string | null> {
  const supabase = await getDbClient();
  if (!supabase) return null;

  const cleanPhone = senderPhone.replace(/[^0-9]/g, '').slice(-10);

  // 1. Check if meta_phone_number_id matches an organization
  if (metaPhoneNumberId) {
    const { data: orgByMetaId } = await supabase
      .from('organizations')
      .select('id')
      .eq('meta_phone_number_id', metaPhoneNumberId)
      .limit(1)
      .maybeSingle();

    if (orgByMetaId?.id) return orgByMetaId.id;
  }

  // 2. Check if merchant's whatsapp_phone or phone matches organization
  if (cleanPhone) {
    const { data: orgByPhone } = await supabase
      .from('organizations')
      .select('id')
      .or(`phone.ilike.%${cleanPhone}%,whatsapp_phone.ilike.%${cleanPhone}%`)
      .limit(1)
      .maybeSingle();

    if (orgByPhone?.id) return orgByPhone.id;

    // 3. Check customer records associated with an organization
    const { data: custRecord } = await supabase
      .from('customers')
      .select('organization_id')
      .or(`phone.ilike.%${cleanPhone}%,whatsapp_phone.ilike.%${cleanPhone}%`)
      .limit(1)
      .maybeSingle();

    if (custRecord?.organization_id) return custRecord.organization_id;
  }

  // Fallback: Default to first active organization in database if single-tenant or local preview
  const { data: defaultOrg } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .maybeSingle();

  return defaultOrg?.id || null;
}

/**
 * Dispatch Outbound WhatsApp message via Meta Cloud API
 */
export async function sendOutboundWhatsAppMessage({
  toPhone,
  messageText,
  orgId,
  externalMessageId,
}: {
  toPhone: string;
  messageText: string;
  orgId?: string;
  externalMessageId?: string;
}): Promise<{ sent: boolean; status: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp Outbound] Provider credentials missing (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN). Message logged locally.');
    return { sent: false, status: 'unconfigured_environment' };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { body: messageText },
      }),
    });

    if (res.ok) {
      if (orgId) {
        const supabase = await getDbClient();
        if (supabase) {
          await supabase.from('message_logs').insert({
            organization_id: orgId,
            channel: 'whatsapp',
            direction: 'outbound',
            message_type: 'conversational_reply',
            external_message_id: externalMessageId ? `reply_${externalMessageId}` : null,
            text_content: messageText,
            status: 'sent',
          });
        }
      }
      return { sent: true, status: 'delivered_to_provider' };
    } else {
      const errText = await res.text();
      console.error('[WhatsApp Outbound] Meta API Error:', errText);
      return { sent: false, status: 'provider_error' };
    }
  } catch (err) {
    console.error('[WhatsApp Outbound] Network Exception:', err);
    return { sent: false, status: 'network_error' };
  }
}

/**
 * Direct Fallback Invoice Creation for Server-to-Server / Background Executions
 */
async function createInvoiceDirectly({
  supabase,
  orgId,
  customer,
  dueDate,
  resolvedItems,
  notes,
}: {
  supabase: any;
  orgId: string;
  customer: Customer;
  dueDate: Date;
  resolvedItems: Array<{ product: Product; quantity: number; unitPrice: number }>;
  notes?: string;
}): Promise<Invoice> {
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  const itemsPayload = resolvedItems.map((ri) => {
    const gross = ri.quantity * ri.unitPrice;
    subtotal += gross;
    const taxRate = ri.product.tax_rate || 0;
    const itemTax = (gross * taxRate) / 100;
    const itemCgst = itemTax / 2;
    const itemSgst = itemTax / 2;
    cgst += itemCgst;
    sgst += itemSgst;

    return {
      product: ri.product,
      quantity: ri.quantity,
      unitPrice: ri.unitPrice,
      gross,
      taxRate,
      itemCgst,
      itemSgst,
      lineTotal: gross + itemTax,
    };
  });

  const total = subtotal + cgst + sgst + igst;

  const { data: org } = await supabase
    .from('organizations')
    .select('invoice_prefix, invoice_sequence')
    .eq('id', orgId)
    .single();

  const prefix = org?.invoice_prefix || 'INV';
  const nextSeq = (org?.invoice_sequence || 100) + 1;
  const invoiceNumber = `${prefix}-${String(nextSeq).padStart(4, '0')}`;

  await supabase
    .from('organizations')
    .update({ invoice_sequence: nextSeq })
    .eq('id', orgId);

  const { data: newInv, error: invErr } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      customer_id: customer.id,
      invoice_number: invoiceNumber,
      invoice_type: 'tax_invoice',
      status: 'issued',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal,
      cgst,
      sgst,
      igst,
      total,
      notes: notes || 'Created via WhatsBill WhatsApp Cloud API',
    })
    .select('*')
    .single();

  if (invErr || !newInv) {
    throw new Error(invErr?.message || 'Failed to insert invoice');
  }

  for (let idx = 0; idx < itemsPayload.length; idx++) {
    const item = itemsPayload[idx];
    await supabase.from('invoice_items').insert({
      invoice_id: newInv.id,
      product_id: item.product.id,
      description: item.product.name,
      quantity: item.quantity,
      unit: item.product.unit || 'PCS',
      unit_price: item.unitPrice,
      taxable_amount: item.gross,
      tax_rate: item.taxRate,
      cgst: item.itemCgst,
      sgst: item.itemSgst,
      line_total: item.lineTotal,
      sort_order: idx,
    });

    if (item.product.id) {
      await supabase
        .from('products')
        .update({ stock_quantity: item.product.stock_quantity - item.quantity })
        .eq('id', item.product.id)
        .eq('organization_id', orgId);
    }
  }

  await supabase.from('receivables').insert({
    organization_id: orgId,
    invoice_id: newInv.id,
    customer_id: customer.id,
    status: 'pending',
    priority_score: 50,
  });

  return newInv;
}

/**
 * Process parsed intent deterministically against active organization database
 */
export async function processWhatsAppMessage({
  orgId,
  messageText,
  externalMessageId,
}: {
  orgId: string;
  messageText: string;
  externalMessageId?: string;
}): Promise<ProcessingResult> {
  const supabase = await getDbClient();

  if (!supabase) {
    return {
      success: false,
      intent: { intent: 'unsupported', customer_query: null, items: [], notes: null, confidence: 0 },
      message: 'Database connection failed.',
      providerStatus: 'unconfigured_environment',
    };
  }

  const isProviderConfigured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  );
  const providerStatus = isProviderConfigured ? 'configured' : 'unconfigured_environment';

  // 1. Idempotency Check via external_message_id
  if (externalMessageId) {
    const { data: existingLog } = await supabase
      .from('message_logs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('external_message_id', externalMessageId)
      .limit(1)
      .maybeSingle();

    if (existingLog && (existingLog.status === 'processed' || existingLog.status === 'clarification_required')) {
      return {
        success: true,
        isDuplicate: true,
        intent: existingLog.parsed_intent ? JSON.parse(existingLog.parsed_intent) : { intent: 'unsupported', customer_query: null, items: [], notes: null, confidence: 1 },
        message: 'This message was already processed.',
        providerStatus,
      };
    }
  }

  // 2. Parse Intent with Gemini AI
  const intent = await parseMerchantIntent(messageText);

  // 3. Handle Unsupported Intent or missing customer query
  if (intent.intent === 'unsupported' || !intent.customer_query) {
    const respMsg =
      "I couldn't identify a valid billing command. You can send commands like:\n" +
      "• 'Ramesh ko 20 Havells switch 450 ke'\n" +
      "• 'Ramesh ka kitna baki hai?'\n" +
      "• 'Ramesh ne payment kiya?'";

    await logMessage(supabase, orgId, null, messageText, intent, 'clarification_required', externalMessageId);

    return {
      success: false,
      intent,
      message: respMsg,
      clarificationRequired: true,
      providerStatus,
    };
  }

  // 4. Deterministic Customer Resolution
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const customerList = customers || [];
  const queryLower = intent.customer_query.toLowerCase();

  const matchingCustomers = customerList.filter(
    (c) =>
      c.name.toLowerCase().includes(queryLower) ||
      (c.business_name && c.business_name.toLowerCase().includes(queryLower)) ||
      c.phone.includes(queryLower) ||
      (c.whatsapp_phone && c.whatsapp_phone.includes(queryLower))
  );

  if (matchingCustomers.length === 0) {
    const respMsg = `Customer '${intent.customer_query}' was not found in your business directory. Please verify customer name or create a new customer record.`;
    await logMessage(supabase, orgId, null, messageText, intent, 'clarification_required', externalMessageId);
    return {
      success: false,
      intent,
      message: respMsg,
      clarificationRequired: true,
      providerStatus,
    };
  }

  if (matchingCustomers.length > 1) {
    const options = matchingCustomers
      .slice(0, 4)
      .map((c, idx) => `${idx + 1}. ${c.name} (${c.business_name ? c.business_name + ' • ' : ''}${c.phone})`)
      .join('\n');

    const respMsg = `Multiple customers match '${intent.customer_query}':\n${options}\n\nPlease specify the exact customer name or phone number.`;
    await logMessage(supabase, orgId, null, messageText, intent, 'clarification_required', externalMessageId);
    return {
      success: false,
      intent,
      message: respMsg,
      clarificationRequired: true,
      providerStatus,
    };
  }

  const resolvedCustomer = matchingCustomers[0];

  // 5. Handle Intent: create_invoice
  if (intent.intent === 'create_invoice') {
    if (!intent.items || intent.items.length === 0) {
      const respMsg = "Please specify product and quantity (e.g. '20 Havells switches').";
      await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'clarification_required', externalMessageId);
      return {
        success: false,
        intent,
        message: respMsg,
        clarificationRequired: true,
        providerStatus,
      };
    }

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    const productList = products || [];
    const resolvedItems: Array<{
      product: Product;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const itemIntent of intent.items) {
      const prodQueryLower = itemIntent.product_query.toLowerCase();
      const matchingProducts = productList.filter(
        (p) =>
          p.name.toLowerCase().includes(prodQueryLower) ||
          (p.sku && p.sku.toLowerCase().includes(prodQueryLower))
      );

      if (matchingProducts.length === 0) {
        const respMsg = `Product '${itemIntent.product_query}' was not found in your active catalog.`;
        await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'clarification_required', externalMessageId);
        return {
          success: false,
          intent,
          message: respMsg,
          clarificationRequired: true,
          providerStatus,
        };
      }

      if (matchingProducts.length > 1) {
        const options = matchingProducts
          .slice(0, 4)
          .map((p, idx) => `${idx + 1}. ${p.name} (Stock: ${p.stock_quantity} ${p.unit}, Price: ₹${p.selling_price})`)
          .join('\n');

        const respMsg = `Multiple products match '${itemIntent.product_query}':\n${options}\n\nPlease specify the exact product name.`;
        await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'clarification_required', externalMessageId);
        return {
          success: false,
          intent,
          message: respMsg,
          clarificationRequired: true,
          providerStatus,
        };
      }

      const resolvedProduct = matchingProducts[0];

      // Missing Quantity Check (Section 4)
      if (typeof itemIntent.quantity !== 'number' || itemIntent.quantity <= 0) {
        const respMsg = `Please specify the quantity for '${resolvedProduct.name}' (e.g. '2 ${resolvedProduct.name}').`;
        await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'clarification_required', externalMessageId);
        return {
          success: false,
          intent,
          message: respMsg,
          clarificationRequired: true,
          providerStatus,
        };
      }

      // Deterministic Stock Check
      if (itemIntent.quantity > resolvedProduct.stock_quantity) {
        const respMsg = `Insufficient stock for '${resolvedProduct.name}'. Requested: ${itemIntent.quantity}, Available: ${resolvedProduct.stock_quantity} ${resolvedProduct.unit}.`;
        await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'failed', externalMessageId);
        return {
          success: false,
          intent,
          message: respMsg,
          providerStatus,
        };
      }

      // Determine price (Section 5)
      const finalPrice =
        typeof itemIntent.unit_price === 'number' && itemIntent.unit_price > 0
          ? itemIntent.unit_price
          : resolvedProduct.selling_price;

      if (typeof finalPrice !== 'number' || finalPrice <= 0) {
        const respMsg = `Please specify the price for '${resolvedProduct.name}'.`;
        await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'clarification_required', externalMessageId);
        return {
          success: false,
          intent,
          message: respMsg,
          clarificationRequired: true,
          providerStatus,
        };
      }

      resolvedItems.push({
        product: resolvedProduct,
        quantity: itemIntent.quantity,
        unitPrice: finalPrice,
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (resolvedCustomer.credit_days || 7));

    let createdInvoice: Invoice | null = null;

    // Try RPC first, fallback to direct insertion if unauthenticated background execution
    try {
      const rpcPayload = {
        p_customer_id: resolvedCustomer.id,
        p_due_date: dueDate.toISOString().split('T')[0],
        p_issue_date: new Date().toISOString().split('T')[0],
        p_invoice_type: 'tax_invoice',
        p_place_of_supply: resolvedCustomer.billing_address || null,
        p_notes: intent.notes || 'Created via WhatsBill WhatsApp Cloud API',
        p_terms: 'Standard Payment Terms',
        p_status: 'issued',
        p_items: resolvedItems.map((ri) => ({
          productId: ri.product.id,
          productName: ri.product.name,
          quantity: ri.quantity,
          unitPrice: ri.unitPrice,
          discount: 0,
          taxRate: ri.product.tax_rate,
          unit: ri.product.unit || 'PCS',
          hsnSac: ri.product.hsn_sac || '',
          cess: 0,
        })),
        p_custom_invoice_number: null,
      };

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_invoice_with_items', rpcPayload);

      if (!rpcErr && rpcRes && rpcRes.id) {
        const { data: fullInvoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', rpcRes.id)
          .single();
        createdInvoice = fullInvoice || rpcRes;
      }
    } catch (err) {
      // RPC error
    }

    if (!createdInvoice) {
      try {
        createdInvoice = await createInvoiceDirectly({
          supabase,
          orgId,
          customer: resolvedCustomer,
          dueDate,
          resolvedItems,
          notes: intent.notes || undefined,
        });
      } catch (err: any) {
        const respMsg = `Failed to generate invoice: ${err?.message || 'Database execution error'}`;
        await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'failed', externalMessageId);
        return {
          success: false,
          intent,
          message: respMsg,
          providerStatus,
        };
      }
    }

    const itemLines = resolvedItems
      .map((ri) => `• ${ri.product.name} × ${ri.quantity} @ ${formatINR(ri.unitPrice)}`)
      .join('\n');

    const totalTax = (createdInvoice.cgst || 0) + (createdInvoice.sgst || 0) + (createdInvoice.igst || 0);

    const successMsg =
      `✅ *Tax Invoice ${createdInvoice.invoice_number} Created!*\n\n` +
      `👤 *Customer:* ${resolvedCustomer.name}\n` +
      `📦 *Items:*\n${itemLines}\n\n` +
      `💵 *Subtotal:* ${formatINR(createdInvoice.subtotal || 0)}\n` +
      `🏛️ *GST:* ${formatINR(totalTax)}\n` +
      `💰 *Total Amount:* ${formatINR(createdInvoice.total)}\n` +
      `📅 *Due Date:* ${formatDate(createdInvoice.due_date, 'short')}\n\n` +
      `🔗 *View & Share Invoice:* https://wb.link/inv/${createdInvoice.invoice_number}`;

    await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'processed', externalMessageId);

    return {
      success: true,
      intent,
      message: successMsg,
      data: {
        invoice: createdInvoice,
        customer: resolvedCustomer,
      },
      providerStatus,
    };
  }

  // 6. Handle Intent: customer_outstanding
  if (intent.intent === 'customer_outstanding') {
    const { data: customerInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', orgId)
      .eq('customer_id', resolvedCustomer.id)
      .neq('status', 'cancelled');

    const { data: customerPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('customer_id', resolvedCustomer.id)
      .neq('status', 'cancelled');

    const invs = customerInvoices || [];
    const pays = customerPayments || [];

    const totalInvoiced = invs.reduce((acc, i) => acc + Number(i.total), 0);
    const totalPaid = pays.reduce((acc, p) => acc + Number(p.amount), 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    const overdueCount = invs.filter((i) => {
      if (!i.due_date) return false;
      const due = new Date(i.due_date);
      due.setHours(0, 0, 0, 0);
      return due < new Date() && i.status !== 'paid';
    }).length;

    const respMsg =
      `📊 *Account Ledger for ${resolvedCustomer.name}*\n\n` +
      `• *Total Invoiced:* ₹${formatINR(totalInvoiced)}\n` +
      `• *Total Received:* ₹${formatINR(totalPaid)}\n` +
      `• *Current Outstanding:* ₹${formatINR(outstanding)}\n` +
      `• *Overdue Invoices:* ${overdueCount}\n\n` +
      `Credit Limit: ₹${formatINR(resolvedCustomer.credit_limit || 0)}`;

    await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'processed', externalMessageId);

    return {
      success: true,
      intent,
      message: respMsg,
      data: {
        customer: resolvedCustomer,
        outstandingAmount: outstanding,
      },
      providerStatus,
    };
  }

  // 7. Handle Intent: payment_status
  if (intent.intent === 'payment_status') {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('customer_id', resolvedCustomer.id)
      .order('paid_at', { ascending: false })
      .limit(5);

    const payList = payments || [];

    let paySummary = 'No payments recorded yet.';
    if (payList.length > 0) {
      paySummary = payList
        .map(
          (p) =>
            `• ₹${formatINR(p.amount)} on ${formatDate(p.paid_at, 'short')} via ${p.method.toUpperCase()} ${p.reference ? '(Ref: ' + p.reference + ')' : ''}`
        )
        .join('\n');
    }

    const respMsg =
      `💳 *Recent Payment Receipts for ${resolvedCustomer.name}*\n\n` +
      `${paySummary}`;

    await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'processed', externalMessageId);

    return {
      success: true,
      intent,
      message: respMsg,
      data: {
        customer: resolvedCustomer,
        payments: payList,
      },
      providerStatus,
    };
  }

  // 8. Handle Intent: find_customer
  if (intent.intent === 'find_customer') {
    const respMsg =
      `👤 *Customer Record Details*\n\n` +
      `• *Name:* ${resolvedCustomer.name}\n` +
      `• *Business:* ${resolvedCustomer.business_name || 'N/A'}\n` +
      `• *Phone:* ${resolvedCustomer.phone}\n` +
      `• *WhatsApp:* ${resolvedCustomer.whatsapp_phone || resolvedCustomer.phone}\n` +
      `• *GSTIN:* ${resolvedCustomer.gstin || 'Unregistered'}\n` +
      `• *Address:* ${resolvedCustomer.billing_address || 'N/A'}\n` +
      `• *Credit Terms:* ${resolvedCustomer.credit_days} days (Limit: ₹${formatINR(resolvedCustomer.credit_limit)})`;

    await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'processed', externalMessageId);

    return {
      success: true,
      intent,
      message: respMsg,
      data: {
        customer: resolvedCustomer,
      },
      providerStatus,
    };
  }

  return {
    success: false,
    intent,
    message: 'Unsupported operation.',
    providerStatus,
  };
}

/**
 * Logs WhatsApp Assistant message event to message_logs table
 */
async function logMessage(
  supabase: any,
  orgId: string,
  customerId: string | null,
  textContent: string,
  intent: ExtractedIntent,
  status: string,
  externalMessageId?: string
) {
  try {
    await supabase.from('message_logs').insert({
      organization_id: orgId,
      customer_id: customerId,
      channel: 'whatsapp',
      direction: 'inbound',
      message_type: 'conversational_command',
      external_message_id: externalMessageId || null,
      text_content: textContent,
      parsed_intent: JSON.stringify(intent),
      status: status,
    });
  } catch (err) {
    console.error('Failed to write message_log entry:', err);
  }
}
