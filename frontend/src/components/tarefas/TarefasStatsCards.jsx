import React from 'react';
import { CheckCircle2, Layers, Plus, UserCircle } from 'lucide-react';

export default function TarefasStatsCards({ totalDemandas, concluidas, minhasDemandas, onOpenNewTask }) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4 mb-8 z-[10] shrink-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative group hover:z-50 border-b-2 border-b-slate-50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-slate-100 transition-colors"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl ring-1 ring-slate-100 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">Total Demandas</p>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{totalDemandas}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">tarefas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative group hover:z-50 border-b-2 border-b-emerald-100/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-100/60 transition-colors"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">Concluídas</p>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{concluidas}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-3xl shadow-[0_8px_25px_rgba(20,184,166,0.15)] text-white relative group hover:shadow-[0_12px_35px_rgba(20,184,166,0.25)] hover:-translate-y-1 transition-all duration-300 lg:col-span-1 hover:z-50 rounded-3xl sm:col-span-2 lg:col-span-1 border-b-2 border-b-white/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                <UserCircle size={22} className="text-white drop-shadow-md" />
              </div>
              <div>
                <p className="text-teal-100 font-black uppercase tracking-widest text-[10px] mb-1.5 leading-none">Pendências</p>
                <p className="text-3xl font-black tracking-tight drop-shadow-sm leading-none">{minhasDemandas}</p>
              </div>
            </div>

            <button
              onClick={onOpenNewTask}
              className="h-11 px-5 bg-white text-teal-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-lg active:scale-95 group/btn hover:scale-105 hover:-translate-y-0.5"
            >
              <Plus size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
              <span>Nova</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
