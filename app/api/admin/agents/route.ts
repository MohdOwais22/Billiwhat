import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { getControlRoomSnapshot } from '@/lib/services/agentTeam/controlRoomService';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMasterAdminRequest(req);
    if (!auth.isAuthorized || !auth.adminSupabase) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id') || undefined;

    const snapshot = await getControlRoomSnapshot(auth.adminSupabase, {
      organizationId: orgId === 'all' ? undefined : orgId,
    });

    return NextResponse.json({
      success: true,
      snapshot,
      agents: snapshot.agents,
      totalAgents: snapshot.totalAgents,
      systemStatus: snapshot.systemStatus,
      lastUpdated: snapshot.lastTelemetryUpdate,
    });
  } catch (err: any) {
    console.error('Error fetching admin agents:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch agent registry snapshot' },
      { status: 500 }
    );
  }
}
