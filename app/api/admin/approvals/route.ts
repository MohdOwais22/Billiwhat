import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { getPendingApprovals } from '@/lib/services/agentTeam/controlRoomService';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMasterAdminRequest(req);
    if (!auth.isAuthorized || !auth.adminSupabase) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id') || undefined;

    const approvals = await getPendingApprovals(auth.adminSupabase, {
      organizationId: orgId === 'all' ? undefined : orgId,
    });

    return NextResponse.json({
      success: true,
      approvals,
      count: approvals.length,
    });
  } catch (err: any) {
    console.error('Error fetching pending approvals:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch pending approval action items' },
      { status: 500 }
    );
  }
}
