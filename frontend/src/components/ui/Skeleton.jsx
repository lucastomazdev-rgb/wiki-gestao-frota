import React from 'react';

// Base Skeleton element with shimmering glass animation
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`bg-slate-800/60 relative overflow-hidden rounded-xl border border-white/5 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent ${className}`}
      {...props}
    />
  );
}

// Card Skeleton for Categories & Articles Grid
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card rounded-2xl p-5 space-y-4 border border-white/5 bg-slate-900/40"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>

          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />

          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table Skeleton for Admin Dashboard
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full border border-white/10 rounded-2xl overflow-hidden bg-slate-900/40 glass-card">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/60">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
            <Skeleton className="h-4 w-24 rounded-md hidden md:block" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Article Detail View Skeleton
export function ArticleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-10 w-4/5 rounded-xl" />
      
      <div className="flex items-center gap-4 py-2 border-y border-white/5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>

      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-11/12 rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
      </div>

      <Skeleton className="h-64 w-full rounded-2xl" />

      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-9/12 rounded-md" />
      </div>
    </div>
  );
}

// Sidebar/Category List Skeleton
export function ListSkeleton({ items = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/30">
          <Skeleton className="h-4 w-4 rounded-md" />
          <Skeleton className="h-4 flex-1 rounded-md" />
        </div>
      ))}
    </div>
  );
}
