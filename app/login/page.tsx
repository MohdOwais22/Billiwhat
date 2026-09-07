'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/modals/AuthModal';

function LoginContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Centered Single Canonical Auth Modal wrapper */}
      <div className="relative z-10 w-full max-w-md">
        <AuthModal
          isOpen={true}
          onClose={() => router.push('/')}
          onSuccess={() => {
            router.push('/dashboard');
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
