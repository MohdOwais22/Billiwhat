import React from 'react';

export function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl"></div>
    </div>
  );
}

export const DashboardSkeleton = LoadingSkeleton;
