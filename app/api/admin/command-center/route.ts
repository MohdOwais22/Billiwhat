import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';
import {
  getPlatformHealthSnapshot,
  generateProactiveAlerts,
  orchestrateAdminAiQuery,
} from '@/lib/services/adminAiOrchestrator';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);
    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const snapshot = await getPlatformHealthSnapshot(authResult.adminSupabase);
    const proactiveAlerts = generateProactiveAlerts(snapshot);

    return NextResponse.json({
      success: true,
      snapshot,
      proactiveAlerts,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  } catch (err: any) {
    console.error('Command center GET error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve Command Center state' },
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
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return NextResponse.json(
        { error: 'Query prompt is required' },
        { status: 400 }
      );
    }

    const result = await orchestrateAdminAiQuery(
      query,
      authResult.adminSupabase,
      {
        id: authResult.user.id,
        email: authResult.user.email || null,
        phone: authResult.user.phone || null,
      }
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error('Command center POST error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process AI Command query' },
      { status: 500 }
    );
  }
}
