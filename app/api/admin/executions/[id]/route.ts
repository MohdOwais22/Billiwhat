import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { getExecutionDetails } from '@/lib/services/agentTeam/controlRoomService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMasterAdminRequest(req);
    if (!auth.isAuthorized || !auth.adminSupabase) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id') || undefined;

    const details = await getExecutionDetails(auth.adminSupabase, id, {
      organizationId: orgId === 'all' ? undefined : orgId,
    });

    if (!details.execution) {
      return NextResponse.json({ error: `Execution trace "${id}" not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      execution: details.execution,
      events: details.events,
    });
  } catch (err: any) {
    console.error('Error fetching execution trace:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch execution trace details' },
      { status: 500 }
    );
  }
}
