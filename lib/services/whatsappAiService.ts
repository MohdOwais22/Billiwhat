import { GoogleGenAI } from '@google/genai';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Customer, Product, Invoice } from '@/types/database';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export type ExtractedIntentType =
  | 'create_invoice'
  | 'customer_outstanding'
  | 'payment_status'
  | 'find_customer'
  | 'unsupported';

export interface ExtractedItemIntent {
  product_query: string;
  quantity: number;
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
You are WhatsBill AI, an assistant for Indian SMB merchants.
Your ONLY job is to extract structured intent from merchant messages (in English, Hindi, Hinglish, Gujarati, Marathi, Bengali, Punjabi, Tamil, Telugu, Kannada, Malayalam, Odia, etc.) into a strict JSON format.

You MUST extract into this EXACT JSON structure:
{
  "intent": "create_invoice" | "customer_outstanding" | "payment_status" | "find_customer" | "unsupported",
  "customer_query": string or null,
  "items": [
    {
      "product_query": string,
      "quantity": number,
      "unit_price": number or null
    }
  ],
  "notes": string or null,
  "confidence": number between 0 and 1
}

STRICT EXTRACTION RULES:
1. Do NOT calculate invoice totals, line totals, tax amounts, CGST, SGST, IGST, or stock balances.
2. Do NOT invent customer names, product names, quantities, or prices if not present in the message.
3. If the user asks to issue a bill/invoice (e.g. "Ramesh ko 20 Havells switch 450 ke"), set intent = "create_invoice".
4. If the user asks about outstanding balance (e.g. "Ramesh ka kitna baki hai?"), set intent = "customer_outstanding".
5. If the user asks about payment status (e.g. "Ramesh ne payment kiya?"), set intent = "payment_status".
6. If the user wants to search customer details (e.g. "Find Ramesh details"), set intent = "find_customer".
7. Extract quantities correctly in Indian languages:
   - "20" / "बीस" / "વીસ" -> quantity = 20
   - "10" / "दस" / "દસ" -> quantity = 10
8. If explicit price is given (e.g. "450 ke", "at 450", "450 rate"), extract unit_price = 450. If no price mentioned, set unit_price = null.
9. Return ONLY valid raw JSON matching the schema.
`;

/**
 * Parses user conversational message using Gemini AI into structured JSON intent
 */
export async function parseMerchantIntent(messageText: string): Promise<ExtractedIntent> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback heuristic intent parser if GEMINI_API_KEY is missing
    return fallbackParseIntent(messageText);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
            quantity: Math.max(1, Number(it.quantity) || 1),
            unit_price: typeof it.unit_price === 'number' ? it.unit_price : null,
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
 */
function fallbackParseIntent(messageText: string): ExtractedIntent {
  const text = messageText.trim();
  const lower = text.toLowerCase();

  // Outstanding query pattern
  if (lower.includes('baki') || lower.includes('outstanding') || lower.includes('due')) {
    const match = text.match(/^([a-zA-Z0-9\s]+?)\s+(ka|ki|ke|has|outstanding|baki)/i);
    return {
      intent: 'customer_outstanding',
      customer_query: match ? match[1].trim() : text.replace(/(baki|outstanding|due|ka|ki|ke)/gi, '').trim(),
      items: [],
      notes: null,
      confidence: 0.8,
    };
  }

  // Payment status pattern
  if (lower.includes('payment') || lower.includes('pay kiya') || lower.includes('paid')) {
    const match = text.match(/^([a-zA-Z0-9\s]+?)\s+(ne|paid|payment)/i);
    return {
      intent: 'payment_status',
      customer_query: match ? match[1].trim() : text.replace(/(payment|kiya|paid|ne)/gi, '').trim(),
      items: [],
      notes: null,
      confidence: 0.8,
    };
  }

  // Invoice creation pattern heuristic (e.g. "Ramesh 20 switch 450")
  const words = text.split(/\s+/);
  if (words.length >= 3) {
    const custQuery = words[0];
    const qtyMatch = text.match(/\b(\d+)\b/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    
    // Check if price is mentioned after quantity
    const priceMatch = text.match(/\b\d+\b.*?\b(\d+)\s*(ke|rupee|rs|inr|rate)?\b/i);
    const price = priceMatch ? parseInt(priceMatch[1], 10) : null;

    const prodQuery = words.slice(1).join(' ').replace(/\b\d+\b/g, '').replace(/(ko|bhej|de|ke|rs|rupees)/gi, '').trim();

    return {
      intent: 'create_invoice',
      customer_query: custQuery,
      items: [
        {
          product_query: prodQuery || 'Switch',
          quantity: qty,
          unit_price: price,
        },
      ],
      notes: null,
      confidence: 0.7,
    };
  }

  return {
    intent: 'unsupported',
    customer_query: null,
    items: [],
    notes: null,
    confidence: 0,
  };
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
  const supabase = await createServerClient();

  // 1. Check Idempotency via external_message_id
  if (externalMessageId) {
    const { data: existingLog } = await supabase
      .from('message_logs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('external_message_id', externalMessageId)
      .single();

    if (existingLog && existingLog.parsed_intent) {
      return {
        success: true,
        intent: JSON.parse(existingLog.parsed_intent),
        message: 'This message was already processed.',
      };
    }
  }

  // 2. Parse Intent with Gemini AI
  const intent = await parseMerchantIntent(messageText);

  // Check external provider credentials status
  const isProviderConfigured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  );
  const providerStatus = isProviderConfigured ? 'configured' : 'unconfigured_environment';

  // 3. Handle Unsupported Intent
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
    const respMsg = `Customer '${intent.customer_query}' was not found in your business directory. Please check customer name or create a new customer.`;
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

      // Determine price
      const finalPrice =
        typeof itemIntent.unit_price === 'number' && itemIntent.unit_price > 0
          ? itemIntent.unit_price
          : resolvedProduct.selling_price;

      resolvedItems.push({
        product: resolvedProduct,
        quantity: itemIntent.quantity,
        unitPrice: finalPrice,
      });
    }

    // Call Atomic Database RPC `create_invoice_with_items`
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (resolvedCustomer.credit_days || 7));

    const rpcPayload = {
      p_customer_id: resolvedCustomer.id,
      p_due_date: dueDate.toISOString().split('T')[0],
      p_issue_date: new Date().toISOString().split('T')[0],
      p_invoice_type: 'tax_invoice',
      p_place_of_supply: resolvedCustomer.billing_address || null,
      p_notes: intent.notes || 'Created via WhatsBill WhatsApp Assistant',
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

    if (rpcErr || !rpcRes || !rpcRes.success) {
      const respMsg = `Failed to generate invoice: ${rpcErr?.message || 'Database execution error'}`;
      await logMessage(supabase, orgId, resolvedCustomer.id, messageText, intent, 'failed', externalMessageId);
      return {
        success: false,
        intent,
        message: respMsg,
        providerStatus,
      };
    }

    // Retrieve inserted invoice record
    const { data: insertedInv } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', rpcRes.id)
      .single();

    const createdInvoice: Invoice = insertedInv || {
      id: rpcRes.id,
      invoice_number: rpcRes.invoice_number || 'INV-1001',
      total: rpcRes.total || 0,
    } as any;

    const itemLines = resolvedItems
      .map((ri) => `• ${ri.product.name} × ${ri.quantity} @ ₹${formatINR(ri.unitPrice)}`)
      .join('\n');

    const totalTax = (createdInvoice.cgst || 0) + (createdInvoice.sgst || 0) + (createdInvoice.igst || 0);

    const successMsg =
      `✅ *Tax Invoice ${createdInvoice.invoice_number} Created!*\n\n` +
      `👤 *Customer:* ${resolvedCustomer.name}\n` +
      `📦 *Items:*\n${itemLines}\n\n` +
      `💵 *Subtotal:* ₹${formatINR(createdInvoice.subtotal || 0)}\n` +
      `🏛️ *GST:* ₹${formatINR(totalTax)}\n` +
      `💰 *Total Amount:* ₹${formatINR(createdInvoice.total)}\n` +
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
