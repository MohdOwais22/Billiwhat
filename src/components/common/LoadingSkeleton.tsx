import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" id="dashboard-loading-skeleton">
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-7 w-64 bg-slate-300 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl border border-slate-200 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-20 bg-slate-300 rounded"></div>
              <div className="h-2.5 w-14 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded"></div>
              <div className="w-7 h-7 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="h-8 w-36 bg-slate-300 rounded"></div>
            <div className="h-3 w-28 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-lg border border-slate-100 p-3"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 animate-pulse ${height}`}>
      <div className="h-4 w-36 bg-slate-200 rounded mb-4"></div>
      <div className="h-full bg-slate-50 rounded-lg"></div>
    </div>
  );
}
