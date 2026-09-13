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

    // Fetch system-wide counts and statistics
    const [
      orgsRes,
      usersRes,
      invoicesRes,
      paymentsRes,
      customersRes,
      gstProfilesRes,
      messagesRes,
      recentOrgsRes,
    ] = await Promise.all([
      supabase.from('organizations').select('id, name, created_at', { count: 'exact' }),
      supabase.from('user_profiles').select('id, display_name, created_at', { count: 'exact' }),
      supabase.from('invoices').select('id, total, status, created_at', { count: 'exact' }),
      supabase.from('payments').select('id, amount, method, created_at', { count: 'exact' }),
      supabase.from('customers').select('id', { count: 'exact' }),
      supabase.from('gst_profiles').select('id, gstin, e_invoice_enabled', { count: 'exact' }),
      supabase.from('message_logs').select('id, channel, status', { count: 'exact' }),
      supabase
        .from('organizations')
        .select('id, name, phone, email, gstin, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const totalOrgs = orgsRes.count ?? (orgsRes.data?.length || 0);
    const totalUsers = usersRes.count ?? (usersRes.data?.length || 0);
    const totalInvoices = invoicesRes.count ?? (invoicesRes.data?.length || 0);
    const totalCustomers = customersRes.count ?? (customersRes.data?.length || 0);
    const totalGstProfiles = gstProfilesRes.count ?? (gstProfilesRes.data?.length || 0);
    const totalMessages = messagesRes.count ?? (messagesRes.data?.length || 0);

    const invoices = invoicesRes.data || [];
    const totalInvoiceVolume = invoices.reduce((sum, inv: any) => sum + (Number(inv.total ?? inv.total_amount) || 0), 0);

    const payments = paymentsRes.data || [];
    const totalCollectedVolume = payments.reduce((sum, pay: any) => sum + (Number(pay.amount) || 0), 0);

    const systemDiagnostics = {
      supabaseConfigured: true,
      serviceRoleActive: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      masterPhoneConfigured: !!process.env.MASTER_PHONE_NUMBER,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'production',
    };

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrgs,
        totalUsers,
        totalInvoices,
        totalCustomers,
        totalGstProfiles,
        totalMessages,
        totalInvoiceVolume,
        totalCollectedVolume,
      },
      recentOrganizations: recentOrgsRes.data || [],
      systemDiagnostics,
      adminUser: {
        id: authResult.user.id,
        email: authResult.user.email || null,
        phone: authResult.user.phone || null,
      },
    });
  } catch (err: any) {
    console.error('Master admin overview error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve master admin overview' },
      { status: 500 }
    );
  }
}
