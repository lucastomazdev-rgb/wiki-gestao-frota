import React from 'react';
import { AlertTriangle, CalendarClock, CheckCircle, Clock } from 'lucide-react';

export default function AgendamentosKpiCards({
  totalRealizado,
  totalAgendado,
  totalFrustrado,
  totalRegistros,
  onOpenAnalytics,
  onOpenFrustrados
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        onClick={onOpenAnalytics}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-100/50 transition-colors"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <CheckCircle size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1.5">Total Realizado</p>
            <div className="flex items-baseline gap-1.5 leading-none">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{totalRealizado}</p>
              <div className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 animate-pulse">Analíticos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-teal-100/50 transition-colors"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl ring-1 ring-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1.5">Manutenções Agendadas</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{totalAgendado}</p>
          </div>
        </div>
      </div>

      <div
        onClick={onOpenFrustrados}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-rose-100/50 transition-colors"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl ring-1 ring-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
            <AlertTriangle size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1.5">Frustrados</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{totalFrustrado}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-5 rounded-2xl shadow-[0_8px_25px_rgba(13,148,136,0.15)] text-white relative overflow-hidden group hover:shadow-[0_12px_35px_rgba(13,148,136,0.25)] hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
            <CalendarClock size={22} className="text-white drop-shadow-md" />
          </div>
          <div className="flex flex-col leading-none">
            <p className="text-teal-100 font-black uppercase tracking-widest text-[10px] mb-2 text-wrap line-clamp-1">Total de Atendimentos</p>
            <p className="text-2xl font-black tracking-tight drop-shadow-sm">{totalRegistros}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
