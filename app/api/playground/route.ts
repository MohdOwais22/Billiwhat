import { NextRequest, NextResponse } from 'next/server';

// Synthetic in-memory demo data isolated from production
export const DEMO_CUSTOMERS = [
  {
    id: 'cust_demo_1',
    name: 'Sharma Electricals',
    contactPerson: 'Rakesh Sharma',
    phone: '+91 98765 43210',
    gstin: '07AAAAA0000A1Z5',
    address: 'Shop 14, Bhagirath Palace, Chandni Chowk, Delhi - 110006',
    outstandingAmount: 48200,
    overdueDays: 12,
    avgPaymentDays: 7,
    creditLimit: 100000,
    lastPayment: { amount: 25000, date: '4 days ago', method: 'UPI' },
  },
  {
    id: 'cust_demo_2',
    name: 'Mahavir Hardware Traders',
    contactPerson: 'Sanjay Jain',
    phone: '+91 98111 22334',
    gstin: '07BBBBB1111B1Z2',
    address: 'Plot 45, G.T. Road Industrial Area, Ghaziabad - 201001',
    outstandingAmount: 24800,
    overdueDays: 3,
    avgPaymentDays: 14,
    creditLimit: 75000,
    lastPayment: { amount: 15000, date: '10 days ago', method: 'NEFT' },
  },
  {
    id: 'cust_demo_3',
    name: 'Ramesh Electricals',
    contactPerson: 'Ramesh Patel',
    phone: '+91 98222 33445',
    gstin: '07CCCCC2222C1Z9',
    address: 'Near Old Bus Stand, Panipat, Haryana - 132103',
    outstandingAmount: 0,
    overdueDays: 0,
    avgPaymentDays: 5,
    creditLimit: 50000,
    lastPayment: { amount: 35000, date: 'Yesterday', method: 'UPI' },
  },
];

export const DEMO_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'Anchor Switch (Modular 6A)',
    shortName: 'Anchor Switch',
    hsn: '8536',
    unitPrice: 200,
    gstRate: 18,
    unit: 'pcs',
  },
  {
    id: 'prod_2',
    name: 'Havells 20W LED Bulb',
    shortName: 'Havells 20W Bulb',
    hsn: '8539',
    unitPrice: 160,
    gstRate: 18,
    unit: 'pcs',
  },
  {
    id: 'prod_3',
    name: 'Polycab 1.5 sq mm Wire (90m coil)',
    shortName: 'Polycab Wire',
    hsn: '8544',
    unitPrice: 1850,
    gstRate: 18,
    unit: 'coil',
  },
];

// In-memory rate limiting map (IP -> timestamps[])
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((time) => now - time < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// Banned keywords list to immediately reject general AI requests without LLM calls
const BANNED_PATTERNS = [
  /\bpython\b/i,
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\breact\b/i,
  /\bcode\b/i,
  /\bprogramming\b/i,
  /\bhtml\b/i,
  /\bcss\b/i,
  /\bsql\b/i,
  /\bessay\b/i,
  /\bpoem\b/i,
  /\bnews\b/i,
  /\bhack\b/i,
  /\bweather\b/i,
  /\bjoke\b/i,
  /\btranslate\b/i,
  /\bwrite a\b/i,
  /\bcreate a website\b/i,
  /\bbuild me a\b/i,
  /\bgenerate an image\b/i,
  /\bsearch the internet\b/i,
  /\bwho is\b/i,
  /\bwhat is the capital\b/i,
];

// Allowed business domain keywords
const BUSINESS_KEYWORDS = [
  'switch',
  'switches',
  'bulb',
  'bulbs',
  'wire',
  'anchor',
  'havells',
  'polycab',
  'sharma',
  'mahavir',
  'ramesh',
  'invoice',
  'bill',
  'order',
  'outstanding',
  'due',
  'balance',
  'udhaar',
  'payment',
  'reminder',
  'remind',
  'collection',
  'collect',
  'collected',
  'customer',
  'rate',
  'price',
  'help',
  'bana',
  'banao',
  'kitna',
  'bhejo',
  'hisab',
  'tally',
];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-ip';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          status: 'rate_limited',
          message:
            'You’ve reached the hourly demo limit for this IP.\n\nCreate your free WhatsBill workspace to continue using the real product.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, sessionMessageCount = 0 } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Valid message required' }, { status: 400 });
    }

    const trimmed = message.trim();

    if (trimmed.length > 500) {
      return NextResponse.json(
        {
          status: 'rejected',
          message: 'Message exceeds the 500-character limit for the demo playground.',
        },
        { status: 400 }
      );
    }

    if (sessionMessageCount >= 5) {
      return NextResponse.json({
        status: 'limit_reached',
        message:
          'You’ve reached the Playground demo limit (5 messages).\n\nCreate your free WhatsBill workspace to continue using the real product.',
      });
    }

    const lower = trimmed.toLowerCase();

    // 1. Check for banned/general AI prompt patterns
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(lower)) {
        return NextResponse.json({
          status: 'rejected',
          intent: 'UNSUPPORTED',
          message:
            'I’m the WhatsBill Playground. I can demonstrate billing, invoices and receivables.\n\nTry:\n‘20 switches for Sharma Electricals’\nor\n‘Show Sharma Electricals outstanding’.',
        });
      }
    }

    // 2. Check if message contains any business keywords
    const hasBusinessKeyword = BUSINESS_KEYWORDS.some((kw) => lower.includes(kw));
    if (!hasBusinessKeyword) {
      return NextResponse.json({
        status: 'rejected',
        intent: 'UNSUPPORTED',
        message:
          'I’m the WhatsBill Playground. I can demonstrate billing, invoices and receivables.\n\nTry:\n‘20 switches for Sharma Electricals’\nor\n‘Show Sharma Electricals outstanding’.',
      });
    }

    // 3. Deterministic Intent Detection and Response Assembly

    // Intent A: OUTSTANDING LOOKUP / LAST PAYMENT QUERY
    if (
      lower.includes('last time') ||
      lower.includes('last payment') ||
      lower.includes('paid last') ||
      lower.includes('what did') && lower.includes('pay')
    ) {
      const customer =
        DEMO_CUSTOMERS.find((c) => lower.includes(c.name.toLowerCase().split(' ')[0])) || DEMO_CUSTOMERS[0];

      return NextResponse.json({
        status: 'success',
        intent: 'OUTSTANDING',
        data: {
          customerName: customer.name,
          outstandingAmount: customer.outstandingAmount,
          overdueDays: customer.overdueDays,
          avgPaymentDays: customer.avgPaymentDays,
          lastPayment: customer.lastPayment,
          phone: customer.phone,
        },
        message: `${customer.name} paid ₹${customer.lastPayment.amount.toLocaleString('en-IN')} via ${customer.lastPayment.method} (${customer.lastPayment.date}). Current outstanding balance is ₹${customer.outstandingAmount.toLocaleString('en-IN')}.`,
      });
    }

    if (
      lower.includes('outstanding') ||
      lower.includes('due') ||
      lower.includes('udhaar') ||
      lower.includes('balance') ||
      lower.includes('pending')
    ) {
      const customer =
        DEMO_CUSTOMERS.find((c) => lower.includes(c.name.toLowerCase().split(' ')[0])) || DEMO_CUSTOMERS[0];

      return NextResponse.json({
        status: 'success',
        intent: 'OUTSTANDING',
        data: {
          customerName: customer.name,
          outstandingAmount: customer.outstandingAmount,
          overdueDays: customer.overdueDays,
          avgPaymentDays: customer.avgPaymentDays,
          lastPayment: customer.lastPayment,
          phone: customer.phone,
        },
        message: `Here is the current receivables status for ${customer.name}:`,
      });
    }

    // Intent B: PAYMENT REMINDER
    if (lower.includes('reminder') || lower.includes('remind') || lower.includes('taqada') || lower.includes('followup')) {
      const customer =
        DEMO_CUSTOMERS.find((c) => lower.includes(c.name.toLowerCase().split(' ')[0])) || DEMO_CUSTOMERS[0];

      return NextResponse.json({
        status: 'success',
        intent: 'PAYMENT_REMINDER',
        data: {
          customerName: customer.name,
          phone: customer.phone,
          outstandingAmount: customer.outstandingAmount,
          overdueDays: customer.overdueDays,
          sampleReminderText: `Dear ${customer.name}, your invoice for ₹${customer.outstandingAmount.toLocaleString('en-IN')} is ${customer.overdueDays} days overdue. Kindly clear the pending balance to maintain your uninterrupted credit dispatch. Pay instantly: https://pay.whatsbill.in/demo-${customer.id}`,
        },
        message: `Prepared simulated WhatsApp reminder for ${customer.name}:`,
      });
    }

    // Intent C: COLLECTION SUMMARY
    if (lower.includes('collection') || lower.includes('collected') || lower.includes('today') || lower.includes('aaj')) {
      return NextResponse.json({
        status: 'success',
        intent: 'COLLECTION_SUMMARY',
        data: {
          totalCollected: 48500,
          paymentCount: 3,
          breakdown: [
            { customer: 'Ramesh Electricals', amount: 35000, method: 'UPI' },
            { customer: 'Mahavir Hardware', amount: 13500, method: 'NEFT' },
          ],
          pendingDueThisWeek: 73000,
        },
        message: `📊 Today's Collections Summary (Simulated Demo):`,
      });
    }

    // Intent D: ORDER_TO_INVOICE / BILL CREATION
    // Extract quantities and products
    const isOrderOrBill =
      lower.includes('switch') ||
      lower.includes('bulb') ||
      lower.includes('wire') ||
      lower.includes('invoice') ||
      lower.includes('bill') ||
      lower.includes('order');

    if (isOrderOrBill) {
      // Find customer or default to Sharma Electricals
      const customer =
        DEMO_CUSTOMERS.find((c) => lower.includes(c.name.toLowerCase().split(' ')[0])) || DEMO_CUSTOMERS[0];

      // Extract items
      const items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        gstRate: number;
        subtotal: number;
        gstAmount: number;
        total: number;
      }> = [];

      // Check switches
      const switchMatch = lower.match(/(\d+)\s*(?:anchor)?\s*switch/i);
      if (switchMatch || lower.includes('switch')) {
        const qty = switchMatch ? parseInt(switchMatch[1], 10) : 20;
        const prod = DEMO_PRODUCTS[0];
        const sub = qty * prod.unitPrice;
        const gst = (sub * prod.gstRate) / 100;
        items.push({
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.unitPrice,
          gstRate: prod.gstRate,
          subtotal: sub,
          gstAmount: gst,
          total: sub + gst,
        });
      }

      // Check bulbs
      const bulbMatch = lower.match(/(\d+)\s*(?:havells)?\s*bulb/i);
      if (bulbMatch || (lower.includes('bulb') && !switchMatch)) {
        const qty = bulbMatch ? parseInt(bulbMatch[1], 10) : 10;
        const prod = DEMO_PRODUCTS[1];
        const sub = qty * prod.unitPrice;
        const gst = (sub * prod.gstRate) / 100;
        items.push({
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.unitPrice,
          gstRate: prod.gstRate,
          subtotal: sub,
          gstAmount: gst,
          total: sub + gst,
        });
      }

      // Check wire
      const wireMatch = lower.match(/(\d+)\s*(?:polycab)?\s*wire/i);
      if (wireMatch || (lower.includes('wire') && items.length === 0)) {
        const qty = wireMatch ? parseInt(wireMatch[1], 10) : 5;
        const prod = DEMO_PRODUCTS[2];
        const sub = qty * prod.unitPrice;
        const gst = (sub * prod.gstRate) / 100;
        items.push({
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.unitPrice,
          gstRate: prod.gstRate,
          subtotal: sub,
          gstAmount: gst,
          total: sub + gst,
        });
      }

      // Fallback if no specific item was parsed
      if (items.length === 0) {
        const prod = DEMO_PRODUCTS[0];
        const qty = 20;
        const sub = qty * prod.unitPrice;
        const gst = (sub * prod.gstRate) / 100;
        items.push({
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.unitPrice,
          gstRate: prod.gstRate,
          subtotal: sub,
          gstAmount: gst,
          total: sub + gst,
        });
      }

      const totalSubtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
      const totalGst = items.reduce((acc, item) => acc + item.gstAmount, 0);
      const grandTotal = totalSubtotal + totalGst;

      return NextResponse.json({
        status: 'success',
        intent: 'ORDER_TO_INVOICE',
        data: {
          customer,
          items,
          invoiceNumber: `WB-DEMO-0104`,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          subtotal: totalSubtotal,
          cgst: totalGst / 2,
          sgst: totalGst / 2,
          totalGst,
          grandTotal,
        },
        message: `Got it. Here’s what I understood:\n\nCustomer: ${customer.name}\nItems: ${items.map((i) => `${i.quantity} × ${i.productName.split(' ')[0]} ${i.productName.split(' ')[1] || ''}`).join(', ')}\nDemo total: ₹${grandTotal.toLocaleString('en-IN')}\n\nWhat would you like to do?`,
      });
    }

    // Default Help / Guide
    return NextResponse.json({
      status: 'success',
      intent: 'HELP_WITH_PLAYGROUND',
      message:
        'Try typing standard WhatsApp business messages:\n• "20 switches for Sharma Electricals"\n• "Show Sharma Electricals outstanding"\n• "Send a payment reminder to Sharma Electricals"\n• "How much did we collect today?"',
    });
  } catch (err: any) {
    console.error('Playground handler error:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unable to process demo message. Please try again.',
      },
      { status: 500 }
    );
  }
}
