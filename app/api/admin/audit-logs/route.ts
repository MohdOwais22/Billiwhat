import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);
    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const supabase = authResult.adminSupabase;
    const limit = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('limit')) || 30));

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Audit logs fetch notice:', error.message);
      return NextResponse.json({
        success: true,
        auditLogs: [],
      });
    }

    return NextResponse.json({
      success: true,
      auditLogs: logs || [],
    });
  } catch (err: any) {
    console.error('Audit logs route error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}
