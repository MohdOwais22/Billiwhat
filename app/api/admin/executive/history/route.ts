import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import {
  getHistoricalChanges,
  getAuditIntelligence,
} from '@/lib/services/agentTeam/memoryService';

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
    const periodLabel = searchParams.get('period') || undefined;
    const hours = searchParams.get('hours') ? parseInt(searchParams.get('hours')!, 10) : 720;

    const [historicalChanges, auditIntelligence] = await Promise.all([
      getHistoricalChanges(authResult.adminSupabase, {
        organizationId: orgId,
        currentPeriodLabel: periodLabel,
      }),
      getAuditIntelligence(authResult.adminSupabase, {
        organizationId: orgId,
        hours,
      }),
    ]);

    return NextResponse.json({
      success: true,
      historicalChanges,
      auditIntelligence,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Executive history GET error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate history and audit intelligence' },
      { status: 500 }
    );
  }
}
