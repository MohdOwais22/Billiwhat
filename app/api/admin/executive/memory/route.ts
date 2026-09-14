import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import {
  retrieveRelevantMemory,
  saveMemory,
  updateMemoryStatus,
} from '@/lib/services/agentTeam/memoryService';
import { StructuredMemoryType, MemoryTrustLevel, MemoryStatus } from '@/lib/services/agentTeam/types';

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
    const query = searchParams.get('query') || undefined;
    const orgId = searchParams.get('orgId') || searchParams.get('organizationId') || undefined;
    const type = (searchParams.get('type') as StructuredMemoryType) || undefined;
    const verificationStatus = (searchParams.get('verificationStatus') as MemoryTrustLevel) || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    const memories = await retrieveRelevantMemory(authResult.adminSupabase, {
      query,
      organizationId: orgId,
      type,
      verificationStatus,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (err: any) {
    console.error('Executive memory GET error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve structured memories' },
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
    const action = body.action || 'save'; // 'save' | 'update_status'

    const adminActor = {
      id: authResult.user.id,
      email: authResult.user.email || null,
      phone: authResult.user.phone || null,
    };

    if (action === 'update_status') {
      const { memoryId, status, reason } = body;
      if (!memoryId || !status) {
        return NextResponse.json(
          { error: 'Missing memoryId or status parameter' },
          { status: 400 }
        );
      }

      const updated = await updateMemoryStatus(
        authResult.adminSupabase,
        memoryId,
        status as MemoryStatus,
        adminActor,
        reason
      );

      return NextResponse.json({
        success: updated,
        memoryId,
        newStatus: status,
      });
    }

    // Default: Save new memory
    if (!body.title || !body.summary || !body.type || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: title, summary, type, source' },
        { status: 400 }
      );
    }

    const memory = await saveMemory(
      authResult.adminSupabase,
      {
        organizationId: body.organizationId || null,
        type: body.type,
        title: body.title,
        summary: body.summary,
        details: body.details,
        source: body.source,
        sourceReference: body.sourceReference,
        externalSourceInfo: body.externalSourceInfo,
        confidence: body.confidence,
        verificationStatus: body.verificationStatus,
        relatedAgents: body.relatedAgents,
        relatedExperimentId: body.relatedExperimentId,
        tags: body.tags,
      },
      adminActor
    );

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (err: any) {
    console.error('Executive memory POST error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process structured memory' },
      { status: 500 }
    );
  }
}
