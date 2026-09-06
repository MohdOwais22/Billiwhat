'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MarketingPage } from '@/components/marketing/MarketingPage';

export default function Home() {
  const router = useRouter();

  return (
    <MarketingPage
      onOpenDashboard={() => router.push('/dashboard')}
    />
  );
}
