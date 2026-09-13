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

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*, organization_members(*), gst_profiles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      organizations: orgs || [],
    });
  } catch (err: any) {
    console.error('Master admin organizations error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
