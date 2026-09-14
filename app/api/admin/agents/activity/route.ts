import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { getLiveActivity } from '@/lib/services/agentTeam/controlRoomService';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMasterAdminRequest(req);
    if (!auth.isAuthorized || !auth.adminSupabase) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '40', 10);

    const events = await getLiveActivity(auth.adminSupabase, {
      organizationId: orgId === 'all' ? undefined : orgId,
      limit,
    });

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (err: any) {
    console.error('Error fetching live agent activity:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch live activity' },
      { status: 500 }
    );
  }
}
