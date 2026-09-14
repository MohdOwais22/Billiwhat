import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import {
  getTrackedActions,
  saveTrackedAction,
  recordDecision,
  updateActionStatus,
} from '@/lib/services/agentTeam/memoryService';
import { ActionItemStatus } from '@/lib/services/agentTeam/types';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);
    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || searchParams.get('organizationId') || undefined;
    const statusParam = searchParams.get('status');
    const statuses = statusParam ? (statusParam.split(',') as ActionItemStatus[]) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 30;

    const actions = await getTrackedActions(authResult.adminSupabase, {
      organizationId: orgId,
      statuses,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: actions.length,
      actions,
    });
  } catch (err: any) {
    console.error('Executive actions GET error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve tracked actions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);
    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const body = await req.json();
    const action = body.action || 'record_decision'; // 'record_decision' | 'create_action' | 'update_status'

    const adminActor = {
      id: authResult.user.id,
      email: authResult.user.email || null,
      phone: authResult.user.phone || null,
    };

    if (action === 'record_decision') {
      const { title, decision, rationale, actionId, evidence, relatedExperimentId } = body;
      if (!title || !decision || !rationale) {
        return NextResponse.json(
          { error: 'Missing required fields: title, decision, rationale' },
          { status: 400 }
        );
      }

      const result = await recordDecision(
        authResult.adminSupabase,
        {
          title,
          decision,
          rationale,
          actionId,
          evidence: evidence || [],
          relatedExperimentId,
          organizationId: body.organizationId || null,
        },
        adminActor
      );

      return NextResponse.json({
        success: true,
        memory: result.memory,
        updatedAction: result.updatedAction,
      });
    }

    if (action === 'update_status') {
      const { actionId, status, rationale, failedReason } = body;
      if (!actionId || !status) {
        return NextResponse.json(
          { error: 'Missing actionId or status parameter' },
          { status: 400 }
        );
      }

      const updated = await updateActionStatus(
        authResult.adminSupabase,
        actionId,
        status as ActionItemStatus,
        adminActor,
        { rationale, failedReason }
      );

      return NextResponse.json({
        success: !!updated,
        action: updated,
      });
    }

    // Default: create action
    if (!body.title || !body.actionType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, actionType' },
        { status: 400 }
      );
    }

    const savedAction = await saveTrackedAction(
      authResult.adminSupabase,
      {
        id: body.id,
        organizationId: body.organizationId || null,
        title: body.title,
        description: body.description,
        priority: body.priority,
        owner: body.owner,
        status: body.status,
        actionType: body.actionType,
        evidence: body.evidence,
        approvalRequired: body.approvalRequired,
        dueAt: body.dueAt,
      },
      adminActor
    );

    return NextResponse.json({
      success: true,
      action: savedAction,
    });
  } catch (err: any) {
    console.error('Executive actions POST error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process tracked action' },
      { status: 500 }
    );
  }
}
