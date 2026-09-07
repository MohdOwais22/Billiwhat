import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processWhatsAppMessage } from '@/lib/services/whatsappAiService';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to your account.' },
        { status: 401 }
      );
    }

    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', authData.user.id)
      .single();

    if (!memberData?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found for current user session.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = body?.message?.trim() || '';
    const externalMessageId = body?.externalMessageId || `msg_${Date.now()}`;

    if (!message) {
      return NextResponse.json(
        { error: 'Message text is required.' },
        { status: 400 }
      );
    }

    const result = await processWhatsAppMessage({
      orgId: memberData.organization_id,
      messageText: message,
      externalMessageId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in WhatsApp Assistant API route:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to process command. Please check your message and try again.',
        error: err?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}
