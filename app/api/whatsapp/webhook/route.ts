import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  processWhatsAppMessage,
  resolveOrganizationFromWhatsAppEvent,
  sendOutboundWhatsAppMessage,
} from '@/lib/services/whatsappAiService';

/**
 * Verify Meta Webhook HMAC SHA256 Signature
 */
function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expectedSignature = signatureHeader.replace('sha256=', '');
  const hmac = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const hmacBuf = Buffer.from(hmac, 'utf8');
  if (expectedBuf.length !== hmacBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, hmacBuf);
}

/**
 * GET Handler for Webhook Verification (Meta WhatsApp Cloud API)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsbill_webhook_token';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
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
    const rawBody = await req.text();
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // 1. Signature Verification if WHATSAPP_APP_SECRET is configured
    if (appSecret) {
      const signature = req.headers.get('x-hub-signature-256');
      if (!verifyMetaSignature(rawBody, signature, appSecret)) {
        console.warn('[WhatsApp Webhook] Invalid signature received.');
        return NextResponse.json({ error: 'Invalid HMAC signature.' }, { status: 401 });
      }
    }

    let payload: any = null;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ status: 'ignored', reason: 'malformed_json' }, { status: 400 });
    }

    if (!payload || payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored', reason: 'unsupported_object' });
    }

    // Extract Meta Cloud API message structure
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const metadata = value?.metadata;

    if (!message) {
      // Could be status updates (sent, delivered, read)
      return NextResponse.json({ status: 'received', type: 'event_notification' });
    }

    const fromPhone = message.from; // Sender phone e.g. 919876543210
    const externalMessageId = message.id; // e.g. wamid.HBgL...
    const metaPhoneNumberId = metadata?.phone_number_id || null;

    // 2. Reject Voice/Audio Messages explicitly without fake processing
    if (message.type === 'audio' || message.type === 'voice') {
      const voiceReplyText = "⚠️ Voice messages are not supported yet. Please send your billing command as a text message.";
      
      const targetOrgId = await resolveOrganizationFromWhatsAppEvent({
        metaPhoneNumberId,
        senderPhone: fromPhone,
      });

      if (targetOrgId) {
        await sendOutboundWhatsAppMessage({
          toPhone: fromPhone,
          messageText: voiceReplyText,
          orgId: targetOrgId,
          externalMessageId,
        });
      }

      return NextResponse.json({
        status: 'processed',
        type: 'unsupported_voice_message',
        reply: voiceReplyText,
      });
    }

    // 3. Extract Message Text
    const messageText = message.text?.body || message.caption || '';
    if (!messageText) {
      return NextResponse.json({ status: 'ignored', reason: 'non_text_message' });
    }

    // 4. Resolve Organization from Verified Database Identity (Never trust payload org_id)
    const targetOrgId = await resolveOrganizationFromWhatsAppEvent({
      metaPhoneNumberId,
      senderPhone: fromPhone,
    });

    if (!targetOrgId) {
      return NextResponse.json(
        {
          status: 'error',
          reason: 'organization_not_found',
          message: `No active WhatsBill organization registered for phone ending in ${fromPhone.slice(-4)}.`,
        },
        { status: 200 }
      );
    }

    // 5. Process Inbound Message through AI & Deterministic Accounting Pipeline
    const result = await processWhatsAppMessage({
      orgId: targetOrgId,
      messageText,
      externalMessageId,
    });

    // 6. Dispatch Outbound Reply via Meta Cloud API if configured
    const dispatchStatus = await sendOutboundWhatsAppMessage({
      toPhone: fromPhone,
      messageText: result.message,
      orgId: targetOrgId,
      externalMessageId,
    });

    return NextResponse.json({
      status: 'success',
      processed: true,
      isDuplicate: Boolean(result.isDuplicate),
      resultMessage: result.message,
      outboundStatus: dispatchStatus.status,
    });
  } catch (err: any) {
    console.error('Error handling WhatsApp inbound webhook:', err);
    return NextResponse.json(
      { status: 'error', error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
