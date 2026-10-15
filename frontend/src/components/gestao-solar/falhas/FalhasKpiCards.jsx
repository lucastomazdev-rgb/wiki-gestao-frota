import React from 'react';
import { AlertTriangle, BatteryWarning, Clock, Sparkles, WifiOff } from 'lucide-react';

/**
 * FalhasKpiCards
 *
 * Layout padronizado com os KPIs da aba de Contato:
 * - Cards em 2 linhas responsivas (Linha 1: 3 cards de visão geral; Linha 2: 2 cards de operação e baterias)
 * - Cores e tipografia elegantes, bordas suaves border-slate-200/80 e sombras discretas
 * - Sem tons de roxo/violeta, preservando o design system moderno
 */
export default function FalhasKpiCards({
  totalFalhas = 0,
  novasFalhas = 0,
  recorrentes = 0,
  pendentesContato = 0,
  totalBateriaBaixa = 0,
  filtroBateriaBaixa = false,
  onToggleBateriaBaixa = null
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      
      {/* ============================================================== */}
      {/* LINHA 1: Visão Geral de Falhas (3 cards - 2 cols cada)         */}
      {/* ============================================================== */}

      {/* 1. Total de Falhas */}
      <div className="lg:col-span-2 bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
        <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300 shrink-0">
          <WifiOff size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">
            Total de Falhas
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalFalhas}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">veículos</span>
          </div>
        </div>
      </div>

      {/* 2. Novas Falhas (1ª vez - Destaque Teal/Emerald) */}
      <div className="lg:col-span-2 bg-gradient-to-br from-teal-500 to-emerald-600 p-4.5 rounded-3xl shadow-sm text-white flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700" />
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm relative z-10 shrink-0">
          <Sparkles size={22} className="text-white" />
        </div>
        <div className="min-w-0 relative z-10">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-teal-100 font-black uppercase tracking-widest truncate">
              Novas Falhas
            </p>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-md font-black uppercase">
              1ª vez
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black tracking-tight">{novasFalhas}</span>
            <span className="text-[10px] font-bold text-teal-100/80 uppercase">veículos</span>
          </div>
        </div>
      </div>

      {/* 3. Falhas Recorrentes (Reincidente - Destaque Âmbar) */}
      <div className="lg:col-span-2 bg-gradient-to-br from-amber-500 to-amber-600 p-4.5 rounded-3xl shadow-sm text-white flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700" />
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm relative z-10 shrink-0">
          <AlertTriangle size={22} className="text-white" />
        </div>
        <div className="min-w-0 relative z-10">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-amber-100 font-black uppercase tracking-widest truncate">
              Recorrentes
            </p>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-md font-black uppercase">
              Reincidente
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black tracking-tight">{recorrentes}</span>
            <span className="text-[10px] font-bold text-amber-100/80 uppercase">veículos</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LINHA 2: Operação & Ações Críticas (2 cards - 3 cols cada)     */}
      {/* ============================================================== */}

      {/* 4. Pendentes de Contato (Rose/Red) */}
      <div className="lg:col-span-3 bg-gradient-to-br from-rose-500 to-red-600 p-4.5 rounded-3xl shadow-sm text-white flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700" />
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm relative z-10 shrink-0">
          <Clock size={22} className="text-white" />
        </div>
        <div className="min-w-0 relative z-10">
          <p className="text-[10px] text-rose-100 font-black uppercase tracking-widest">
            Pendentes de Contato
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black tracking-tight">{pendentesContato}</span>
            <span className="text-[10px] font-bold text-rose-100/80 uppercase">a contatar</span>
          </div>
        </div>
      </div>

      {/* 5. Baterias Críticas (< 11V) com Toggle de Filtro */}
      <div
        role={onToggleBateriaBaixa ? 'button' : undefined}
        onClick={onToggleBateriaBaixa || undefined}
        title={onToggleBateriaBaixa ? (filtroBateriaBaixa ? 'Clique para remover o filtro' : 'Clique para filtrar apenas baterias < 11V') : undefined}
        className={`lg:col-span-3 p-4.5 rounded-3xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between gap-4 relative overflow-hidden select-none ${
          onToggleBateriaBaixa ? 'cursor-pointer' : ''
        } ${
          filtroBateriaBaixa
            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
            : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3 rounded-2xl transition-all duration-300 shrink-0 ${
              filtroBateriaBaixa
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/60'
            }`}
          >
            <BatteryWarning size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">
                Bat. Crítica (&lt; 11V)
              </p>
              {filtroBateriaBaixa && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 animate-pulse">
                  Filtro Ativo
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {totalBateriaBaixa}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {filtroBateriaBaixa ? 'filtrando veículos' : 'necessitam atenção'}
              </span>
            </div>
          </div>
        </div>

        {onToggleBateriaBaixa && (
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl transition-all shrink-0 hidden sm:inline-block ${
              filtroBateriaBaixa
                ? 'bg-amber-200/80 text-amber-900 hover:bg-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filtroBateriaBaixa ? 'Limpar Filtro' : 'Filtrar'}
          </span>
        )}
      </div>

    </div>
  );
}
