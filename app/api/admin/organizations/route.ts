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

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);

    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const supabase = authResult.adminSupabase;

    // Cascade delete related records
    const { data: invData } = await supabase
      .from('invoices')
      .select('id')
      .eq('organization_id', orgId);
    const invoiceIds = invData?.map((i) => i.id) || [];
    if (invoiceIds.length > 0) {
      await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
    }

    await supabase.from('invoices').delete().eq('organization_id', orgId);
    await supabase.from('payments').delete().eq('organization_id', orgId);
    await supabase.from('receivables').delete().eq('organization_id', orgId);
    await supabase.from('reminders').delete().eq('organization_id', orgId);
    await supabase.from('message_logs').delete().eq('organization_id', orgId);
    await supabase.from('gst_profiles').delete().eq('organization_id', orgId);
    await supabase.from('customers').delete().eq('organization_id', orgId);
    await supabase.from('products').delete().eq('organization_id', orgId);
    await supabase.from('organization_members').delete().eq('organization_id', orgId);

    const { error: delErr } = await supabase.from('organizations').delete().eq('id', orgId);
    if (delErr) {
      throw delErr;
    }

    return NextResponse.json({
      success: true,
      message: `Organization ${orgId} deleted successfully`,
    });
  } catch (err: any) {
    console.error('Delete organization error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
