import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { getAgentById } from '@/lib/services/agentTeam/agentRegistry';
import { getControlRoomSnapshot, getExecutionHistory } from '@/lib/services/agentTeam/controlRoomService';

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
    const agentDef = getAgentById(id);

    if (!agentDef) {
      return NextResponse.json({ error: `Agent "${id}" not found in registry` }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id') || undefined;

    const [snapshot, recentExecs] = await Promise.all([
      getControlRoomSnapshot(auth.adminSupabase, {
        organizationId: orgId === 'all' ? undefined : orgId,
      }),
      getExecutionHistory(auth.adminSupabase, {
        agentId: id,
        organizationId: orgId === 'all' ? undefined : orgId,
        limit: 15,
      }),
    ]);

    const agentTelemetry = snapshot.agents.find((a) => a.id === id);

    // Build safe sanitized detail (never leak system prompts or secret API keys)
    const agentDetail = {
      id: agentDef.id,
      name: agentDef.name,
      category: agentDef.category,
      description: agentDef.description,
      primaryQuestions: agentDef.primaryQuestions,
      allowedTools: agentDef.allowedTools,
      isEngineeringSpecialist: !!agentDef.isEngineeringSpecialist,
      telemetry: agentTelemetry || null,
      recentExecutions: recentExecs.executions,
    };

    return NextResponse.json({
      success: true,
      agent: agentDetail,
    });
  } catch (err: any) {
    console.error('Error fetching agent detail:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch agent details' },
      { status: 500 }
    );
  }
}
