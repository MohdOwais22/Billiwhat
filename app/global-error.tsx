'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const getSafeUserMessage = (err: Error) => {
    if (!err?.message) return 'An unexpected critical error occurred.';
    const msg = err.message.toLowerCase();
    
    if (
      msg.includes('postgres') ||
      msg.includes('supabase') ||
      msg.includes('sql') ||
      msg.includes('query') ||
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
      return 'Your security credentials or session has expired. Please try refreshing or logging back in.';
    }

    return err.message.length > 120 ? 'An unexpected operation failed. Please retry.' : err.message;
  };

  const safeMessage = getSafeUserMessage(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 antialiased">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 block">Critical Failure</span>
            <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-xs mx-auto text-xs text-slate-600 leading-relaxed font-medium">
              {safeMessage}
            </div>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:bg-slate-950 transition flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-500"
            id="global-error-retry-btn"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </body>
    </html>
  );
}
