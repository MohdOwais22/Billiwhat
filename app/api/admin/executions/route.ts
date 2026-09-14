import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { getExecutionHistory } from '@/lib/services/agentTeam/controlRoomService';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMasterAdminRequest(req);
    if (!auth.isAuthorized || !auth.adminSupabase) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id') || undefined;
    const agentId = searchParams.get('agent_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const query = searchParams.get('q') || undefined;
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const history = await getExecutionHistory(auth.adminSupabase, {
      organizationId: orgId === 'all' ? undefined : orgId,
      agentId,
      status,
      querySearch: query,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      executions: history.executions,
      total: history.total,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('Error fetching execution history:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch execution history' },
      { status: 500 }
    );
  }
}
