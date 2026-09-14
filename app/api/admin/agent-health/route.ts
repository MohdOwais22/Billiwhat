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

    const healthyCount = snapshot.agents.filter((a) => a.health === 'HEALTHY').length;
    const degradedCount = snapshot.agents.filter((a) => a.health === 'DEGRADED').length;
    const failingCount = snapshot.agents.filter((a) => a.health === 'FAILING').length;
    const unknownCount = snapshot.agents.filter((a) => a.health === 'UNKNOWN').length;

    return NextResponse.json({
      success: true,
      systemStatus: snapshot.systemStatus,
      totalAgents: snapshot.totalAgents,
      activeRunning: snapshot.activeRunningCount,
      pendingApprovals: snapshot.pendingApprovalsCount,
      healthCounts: {
        healthy: healthyCount,
        degraded: degradedCount,
        failing: failingCount,
        unknown: unknownCount,
      },
      lastUpdated: snapshot.lastTelemetryUpdate,
    });
  } catch (err: any) {
    console.error('Error fetching agent health snapshot:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch agent health' },
      { status: 500 }
    );
  }
}
