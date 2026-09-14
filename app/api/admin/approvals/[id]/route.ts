import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { processApprovalDecision } from '@/lib/services/agentTeam/controlRoomService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMasterAdminRequest(req);
    if (!auth.isAuthorized || !auth.adminSupabase || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const decision = body.decision; // 'APPROVE' | 'REJECT' | 'DEFER'
    const note = body.note;
    const orgId = body.organizationId || undefined;

    if (!decision || !['APPROVE', 'REJECT', 'DEFER'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be APPROVE, REJECT, or DEFER.' },
        { status: 400 }
      );
    }

    const result = await processApprovalDecision(
      auth.adminSupabase,
      id,
      decision,
      {
        id: auth.user.id,
        email: auth.user.email,
        phone: (auth.user as any).phone,
      },
      {
        note,
        organizationId: orgId,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to process decision' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      actionId: id,
      decision,
      status: result.newStatus,
    });
  } catch (err: any) {
    console.error('Error processing approval decision:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process approval decision' },
      { status: 500 }
    );
  }
}
