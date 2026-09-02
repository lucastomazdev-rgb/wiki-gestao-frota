import React from 'react';

/**
 * Skeleton — Componente de loading skeleton reutilizável.
 * Substitui spinners por shimmer effects mais premium.
 * 
 * Props:
 *  variant  — 'text' | 'circle' | 'card' | 'chart' | 'table' | 'page'
 *  lines    — número de linhas para variant='text' (default: 3)
 *  className — classes adicionais
 */
export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded-lg"
          style={{ width: i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '85%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm ${className}`} aria-hidden="true">
      <div className="flex items-center gap-4 mb-6">
        <div className="skeleton w-12 h-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-2/5 rounded-lg" />
          <div className="skeleton h-3 w-1/4 rounded-lg" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm ${className}`} aria-hidden="true">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 rounded-lg" style={{ width: `${15 + (i * 5)}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="px-6 py-4 border-b border-slate-100 flex gap-6 items-center">
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className="skeleton h-4 rounded-lg" style={{ width: `${20 + ((col + row) % 3) * 10}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="skeleton h-5 w-40 rounded-lg" />
          <div className="skeleton h-3 w-24 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>
      {/* Fake bars */}
      <div className="flex items-end gap-3 h-48 pt-4">
        {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65, 50, 88].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-8 rounded" />
        ))}
      </div>
    </div>
  );
}

/**
 * PageSkeleton — Skeleton de página inteira para Suspense fallback.
 * Substitui o spinner genérico por layout skeleton premium.
 */
export default function PageSkeleton() {
  return (
    <div className="w-full animate-fade-in-up space-y-6" role="status" aria-label="Carregando módulo">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton h-3 w-20 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-16 rounded-lg mb-2" />
            <div className="skeleton h-3 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonCard />
      </div>

      {/* Table */}
      <SkeletonTable rows={4} cols={5} />
      
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
