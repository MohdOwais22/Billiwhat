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

    const orgId = req.nextUrl.searchParams.get('id');
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const supabase = authResult.adminSupabase;

    const [
      orgRes,
      membersRes,
      customersRes,
      productsRes,
      invoicesRes,
      paymentsRes,
      gstProfileRes,
      messageLogsRes,
    ] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('organization_members').select('id, user_id, role, created_at').eq('organization_id', orgId),
      supabase.from('customers').select('*').eq('organization_id', orgId).limit(20),
      supabase.from('products').select('*').eq('organization_id', orgId).limit(20),
      supabase.from('invoices').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(20),
      supabase.from('payments').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(20),
      supabase.from('gst_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
      supabase.from('message_logs').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(20),
    ]);

    if (orgRes.error || !orgRes.data) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: orgRes.data,
      members: membersRes.data || [],
      customers: customersRes.data || [],
      products: productsRes.data || [],
      invoices: invoicesRes.data || [],
      payments: paymentsRes.data || [],
      gstProfile: gstProfileRes.data || null,
      messageLogs: messageLogsRes.data || [],
    });
  } catch (err: any) {
    console.error('Organization detail error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve organization details' },
      { status: 500 }
    );
  }
}
