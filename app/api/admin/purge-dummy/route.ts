import { NextRequest, NextResponse } from 'next/server';
import { verifyMasterAdminRequest } from '@/lib/auth/masterAdmin';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyMasterAdminRequest(req);

    if (!authResult.isAuthorized || !authResult.adminSupabase) {
      return NextResponse.json(
        { error: authResult.error || 'Forbidden: Master Admin privileges required' },
        { status: authResult.status || 403 }
      );
    }

    const supabase = authResult.adminSupabase;
    const body = await req.json().catch(() => ({}));
    const targetOrgId = body?.organizationId;

    // Fetch all organizations to identify dummy/test data
    const { data: orgs, error: fetchErr } = await supabase
      .from('organizations')
      .select('id, name, created_at');

    if (fetchErr) {
      throw fetchErr;
    }

    let dummyOrgs = [];
    if (targetOrgId) {
      dummyOrgs = (orgs || []).filter((o) => o.id === targetOrgId);
    } else {
      dummyOrgs = (orgs || []).filter((o) => {
        const name = (o.name || '').toLowerCase().trim();
        return (
          name.startsWith('security test org') ||
          name.startsWith('duplicate org') ||
          name.startsWith('test business org') ||
          name.startsWith('test org') ||
          name.includes('security test') ||
          name.includes('test idem')
        );
      });
    }

    const dummyIds = dummyOrgs.map((o) => o.id);
    let deletedCount = 0;

    if (dummyIds.length > 0) {
      // 1. Delete invoice items
      const { data: invData } = await supabase
        .from('invoices')
        .select('id')
        .in('organization_id', dummyIds);
      const invoiceIds = invData?.map((i) => i.id) || [];
      if (invoiceIds.length > 0) {
        await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
      }

      // 2. Cascade delete records tied to dummy organizations
      await supabase.from('invoices').delete().in('organization_id', dummyIds);
      await supabase.from('payments').delete().in('organization_id', dummyIds);
      await supabase.from('receivables').delete().in('organization_id', dummyIds);
      await supabase.from('reminders').delete().in('organization_id', dummyIds);
      await supabase.from('message_logs').delete().in('organization_id', dummyIds);
      await supabase.from('gst_profiles').delete().in('organization_id', dummyIds);
      await supabase.from('customers').delete().in('organization_id', dummyIds);
      await supabase.from('products').delete().in('organization_id', dummyIds);
      await supabase.from('organization_members').delete().in('organization_id', dummyIds);

      // 3. Delete the organizations themselves
      const { error: delErr } = await supabase
        .from('organizations')
        .delete()
        .in('id', dummyIds);

      if (delErr) {
        throw delErr;
      }
      deletedCount = dummyIds.length;
    }

    // 4. Purge test auth users if not targeting a specific single org
    let purgedUserCount = 0;
    if (!targetOrgId) {
      const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 100 });
      const testUsers = (userList?.users || []).filter((u) => {
        const email = (u.email || '').toLowerCase();
        return (
          email.endsWith('@whatsbill.test') ||
          email.startsWith('sec_') ||
          email.startsWith('test-')
        );
      });

      for (const u of testUsers) {
        await supabase.from('user_profiles').delete().eq('id', u.id);
        await supabase.auth.admin.deleteUser(u.id);
        purgedUserCount++;
      }
    }

    return NextResponse.json({
      success: true,
      purgedOrganizations: deletedCount,
      purgedUsers: purgedUserCount,
      removedOrgNames: dummyOrgs.map((o) => o.name),
      message: `Successfully purged ${deletedCount} dummy organization(s) and ${purgedUserCount} test user(s).`,
    });
  } catch (err: any) {
    console.error('Purge dummy error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to purge dummy data' },
      { status: 500 }
    );
  }
}
