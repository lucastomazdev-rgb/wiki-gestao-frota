import React from 'react';
import { AlertTriangle, BatteryWarning, CheckCircle2, WifiOff } from 'lucide-react';

export default function FalhasKpiCards({
  totalFalhas,
  pendentesContato,
  emTratativa,
  totalBateriaBaixa,
  batCam,
  batMoto,
  batVid
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-slate-100 transition-colors"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl ring-1 ring-slate-100 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300">
            <WifiOff size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 leading-none">Total de Falhas</p>
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-2xl font-black text-slate-800 tracking-tight">{totalFalhas}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">veiculos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-500 to-red-600 p-4 rounded-3xl shadow-[0_8px_25px_rgba(225,29,72,0.15)] text-white relative overflow-hidden group hover:shadow-[0_12px_35px_rgba(225,29,72,0.25)] hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
            <AlertTriangle size={20} className="text-white drop-shadow-md" />
          </div>
          <div>
            <p className="text-rose-100 font-black uppercase tracking-widest text-[10px] mb-1.5 leading-none">Pendentes</p>
            <p className="text-2xl font-black tracking-tight drop-shadow-sm leading-none">{pendentesContato}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-100/60 transition-colors"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 leading-none">Em Acompanhamento</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{emTratativa}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-amber-100/60 transition-colors"></div>
        <div className="flex items-center justify-between relative z-10 w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl ring-1 ring-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <BatteryWarning size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">Bat. Critica</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{totalBateriaBaixa}</p>
            </div>
          </div>

          <div className="flex gap-2 text-center border-l pl-3 border-slate-100 ml-1">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Cam</span>
              <span className="text-[11px] font-black text-slate-700 leading-none mt-0.5">{batCam}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Moto</span>
              <span className="text-[11px] font-black text-slate-700 leading-none mt-0.5">{batMoto}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Vid</span>
              <span className="text-[11px] font-black text-slate-700 leading-none mt-0.5">{batVid}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
