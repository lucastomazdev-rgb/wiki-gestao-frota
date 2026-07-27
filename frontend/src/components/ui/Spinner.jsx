import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-amber-400 shrink-0 ${className}`} />;
}

export function ButtonSpinner({ children, loading = false, icon: Icon = null, className = '', ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`relative flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={16} />
          <span>Processando...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
