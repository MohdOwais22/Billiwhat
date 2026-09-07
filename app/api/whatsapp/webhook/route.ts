import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processWhatsAppMessage } from '@/lib/services/whatsappAiService';

/**
 * GET Handler for Webhook Verification (Meta WhatsApp Cloud API / Twilio)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsbill_webhook_token';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: 'Webhook verification token mismatch.' },
    { status: 403 }
  );
}

/**
 * POST Handler for Inbound WhatsApp Webhook Messages
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ status: 'ignored', reason: 'empty_payload' });
    }

    // Extract message fields (Supporting standard Meta Cloud API payload)
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored', reason: 'no_message_found' });
    }

    const fromPhone = message.from; // Sender's phone number e.g. 919876543210
    const messageText = message.text?.body || message.caption || '';
    const externalMessageId = message.id; // wamid.HBgL...

    if (!messageText) {
      return NextResponse.json({ status: 'ignored', reason: 'unsupported_message_type' });
    }

    const supabase = await createClient();

    // Look up Organization by matching merchant or customer phone number
    const cleanPhone = fromPhone.replace(/[^0-9]/g, '').slice(-10);

    const { data: orgMember } = await supabase
      .from('organizations')
      .select('id')
      .ilike('phone', `%${cleanPhone}%`)
      .limit(1)
      .single();

    let targetOrgId = orgMember?.id;

    if (!targetOrgId) {
      // Fallback: look up organization from customer with this whatsapp phone
      const { data: custRecord } = await supabase
        .from('customers')
        .select('organization_id')
        .or(`phone.ilike.%${cleanPhone}%,whatsapp_phone.ilike.%${cleanPhone}%`)
        .limit(1)
        .single();

      targetOrgId = custRecord?.organization_id;
    }

    if (!targetOrgId) {
      return NextResponse.json(
        {
          status: 'error',
          reason: 'organization_not_found',
          message: `No active WhatsBill organization registered for phone ending in ${cleanPhone}.`,
        },
        { status: 200 }
      );
    }

    // Process Message through AI interpretation & deterministic execution pipeline
    const result = await processWhatsAppMessage({
      orgId: targetOrgId,
      messageText,
      externalMessageId,
    });

    // Send reply via Meta Cloud API if configured in environment
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (phoneNumberId && accessToken) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: fromPhone,
            type: 'text',
            text: { body: result.message },
          }),
        });
      } catch (sendErr) {
        console.error('Failed to dispatch outbound WhatsApp message via Meta Cloud API:', sendErr);
      }
    }

    return NextResponse.json({
      status: 'success',
      processed: true,
      resultMessage: result.message,
    });
  } catch (err: any) {
    console.error('Error handling WhatsApp inbound webhook:', err);
    return NextResponse.json(
      { status: 'error', error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
