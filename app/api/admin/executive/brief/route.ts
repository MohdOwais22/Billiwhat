import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import { generateCEOBrief } from '@/lib/services/agentTeam/ceoBriefGenerator';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);
    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const { brief, realityCheck } = await generateCEOBrief(
      authResult.adminSupabase,
      {
        id: authResult.user.id,
        email: authResult.user.email || null,
        phone: authResult.user.phone || null,
      }
    );

    return NextResponse.json({
      success: true,
      brief,
      realityCheck,
      generatedAt: brief.generatedAt,
    });
  } catch (err: any) {
    console.error('Executive CEO Brief GET error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Daily CEO Brief' },
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

    let period = 'Last 30 Days (Trailing)';
    try {
      const body = await req.json();
      if (typeof body?.period === 'string' && body.period.trim()) {
        period = body.period.trim();
      }
    } catch {
      // Body may be empty on standard triggers
    }

    const { brief, realityCheck } = await generateCEOBrief(
      authResult.adminSupabase,
      {
        id: authResult.user.id,
        email: authResult.user.email || null,
        phone: authResult.user.phone || null,
      },
      { period }
    );

    return NextResponse.json({
      success: true,
      brief,
      realityCheck,
      generatedAt: brief.generatedAt,
    });
  } catch (err: any) {
    console.error('Executive CEO Brief POST error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Daily CEO Brief' },
      { status: 500 }
    );
  }
}
