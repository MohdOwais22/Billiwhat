import React from 'react';
import { redirect } from 'next/navigation';
import { verifyMasterAdminServerComponent } from '@/lib/auth/masterAdmin';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Server-side verification
  const authResult = await verifyMasterAdminServerComponent();

  if (!authResult.isAuthenticated) {
    redirect('/login?next=/admin');
  }

  if (!authResult.isAuthorized) {
    redirect('/dashboard?denied=admin');
  }

  return <AdminDashboardView />;
}
