'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, LayoutDashboard, Home } from 'lucide-react';
import { APP_NAME } from '@/config/brand';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // We can log the error server-side (using a custom console.error)
    // while carefully redacting any database parameters or credentials before display
    console.error('Captured Application Error:', {
      message: error?.message,
      digest: error?.digest,
    });
  }, [error]);

  // Redact potentially sensitive system-level messages before presenting to the client UI
  const getSafeUserMessage = (err: Error) => {
    if (!err?.message) return 'An unexpected error occurred. Please try again.';
    
    const msg = err.message.toLowerCase();
    
    // Check for sensitive keywords
    if (
      msg.includes('postgres') ||
      msg.includes('supabase') ||
      msg.includes('sql') ||
      msg.includes('query') ||
      msg.includes('select') ||
      msg.includes('insert') ||
      msg.includes('update') ||
      msg.includes('delete') ||
      msg.includes('relation') ||
      msg.includes('row-level') ||
      msg.includes('rls')
    ) {
      return 'A secure database storage transaction failed. Your business records remain protected.';
    }
    
    if (
      msg.includes('apikey') ||
      msg.includes('secret') ||
      msg.includes('token') ||
      msg.includes('bearer') ||
      msg.includes('jwt') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden')
    ) {
      return 'Your security credentials or session has expired. Please sign in again to re-authenticate.';
    }

    if (msg.includes('gemini') || msg.includes('ai_logic') || msg.includes('model')) {
      return 'The AI assistant was unable to parse the conversational format. Please re-enter your input.';
    }

    // Otherwise return a clean, truncated user-friendly message
    return err.message.length > 120 ? 'An unexpected operation failed. Please retry.' : err.message;
  };

  const safeMessage = getSafeUserMessage(error);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-rose-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-6">
        {/* Visual Error Cue */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">
            System Error
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Something Went Wrong
          </h1>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-xs mx-auto text-xs text-slate-600 leading-relaxed font-medium">
            {safeMessage}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition shadow-md flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-500"
            id="error-reset-btn"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-2 px-3 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              id="error-dashboard-btn"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-2 px-3 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              id="error-home-btn"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          Independent B2B invoice assistant operated by {APP_NAME}.
        </p>
      </div>
    </div>
  );
}
