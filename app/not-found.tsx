'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Compass, ArrowRight, Home, LayoutDashboard } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-6">
        {/* Visual Cue */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/50 text-amber-600 flex items-center justify-center mx-auto animate-bounce duration-1000">
          <Compass className="w-8 h-8" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            Error 404
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The page you are looking for doesn't exist, has been moved, or you might not have access to it.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition shadow-md flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            id="notfound-dashboard-btn"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-500"
            id="notfound-home-btn"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          Independent B2B invoice assistant operated by {APP_NAME}.
        </p>
      </div>
    </div>
  );
}
