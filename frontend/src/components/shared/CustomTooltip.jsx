import React from 'react';

/**
 * CustomTooltip — Recharts tooltip reutilizável com design premium.
 * Anteriormente duplicado em Dashboard.jsx, Agendamentos.jsx, DashboardGerencial.jsx.
 */
export default function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[140px]">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2.5 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-slate-600 font-semibold text-sm">{entry.name}</span>
              <span className="text-slate-800 font-extrabold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
