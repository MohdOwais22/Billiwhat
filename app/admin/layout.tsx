import React from 'react';
import { redirect } from 'next/navigation';
import { verifyMasterAdminServerComponent } from '@/lib/auth/masterAdmin';

export const metadata = {
  title: 'Master Admin Panel | WhatsBill',
  description: 'Enterprise Master Administration & Platform Oversight for WhatsBill',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Strict server-side verification before rendering any admin content
  const authResult = await verifyMasterAdminServerComponent();

  if (!authResult.isAuthenticated) {
    redirect('/login?next=/admin');
  }

  if (!authResult.isAuthorized) {
    // Normal user attempted to access /admin -> securely redirect to dashboard
    redirect('/dashboard?denied=admin');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {children}
    </div>
  );
}
