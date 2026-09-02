import React from 'react';
import { ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

/**
 * TransferList — Componente de lista dupla reutilizável.
 * Anteriormente duplicado em Agendamentos.jsx e Falhas.jsx.
 *
 * Props:
 *  available       — array de items disponíveis
 *  selected        — array de items selecionados
 *  onMoveRight     — fn(item) move um item para selecionados
 *  onMoveLeft      — fn(item) remove um item dos selecionados
 *  onMoveAllRight  — fn() move todos para selecionados
 *  onMoveAllLeft   — fn() remove todos dos selecionados
 *  renderItem      — fn(item) retorna JSX para renderizar cada item
 *  renderSelected  — fn(item) retorna JSX para renderizar item selecionado (opcional)
 *  leftTitle       — string título da lista esquerda
 *  rightTitle      — string título da lista direita
 *  accentColor     — 'teal' | 'emerald' | 'brand' (default: 'teal')
 */
export default function TransferList({
  available = [],
  selected = [],
  onMoveRight,
  onMoveLeft,
  onMoveAllRight,
  onMoveAllLeft,
  renderItem,
  renderSelected,
  leftTitle = 'Disponíveis',
  rightTitle = 'Selecionados',
  accentColor = 'teal',
}) {
  const colors = {
    teal: {
      border: 'border-teal-200', ring: 'ring-teal-50', header: 'bg-teal-600',
      headerBorder: 'border-teal-700', bg: 'bg-teal-50/30',
      btnHover: 'hover:border-teal-300 hover:bg-teal-50 text-teal-600',
      btnShadow: 'shadow-teal-100', empty: 'text-teal-300',
      badge: 'bg-white text-teal-700',
    },
    emerald: {
      border: 'border-emerald-200', ring: 'ring-emerald-50', header: 'bg-emerald-600',
      headerBorder: 'border-emerald-700', bg: 'bg-emerald-50/30',
      btnHover: 'hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600',
      btnShadow: 'shadow-emerald-100', empty: 'text-emerald-300',
      badge: 'bg-white text-emerald-700',
    },
  };

  const c = colors[accentColor] || colors.teal;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center shrink-0">
      {/* Left List */}
      <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[250px] h-[30vh] lg:h-[400px] shadow-sm flex-1">
        <div className="bg-slate-50 p-4 border-b border-slate-200 font-extrabold text-slate-600 flex justify-between items-center text-sm">
          <span className="uppercase tracking-widest text-[11px]">{leftTitle}</span>
          <span className="bg-slate-200 text-slate-600 py-1 px-3 rounded-md text-xs">{available.length} un</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2" role="listbox" aria-label={leftTitle}>
          {available.map((item, idx) => (
            <div key={item.id || idx} className="bg-white border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-slate-300 hover:shadow-sm transition-all group" role="option">
              <div className="flex-1 min-w-0">{renderItem(item)}</div>
              <button
                onClick={() => onMoveRight(item)}
                className="p-2 opacity-0 group-hover:opacity-100 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-all ml-2"
                aria-label="Mover para selecionados"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
          {available.length === 0 && (
            <div className="text-center font-bold text-slate-300 p-4 mt-14 uppercase tracking-wider text-xs">Sem itens disponíveis.</div>
          )}
        </div>
      </div>

      {/* Center Buttons */}
      <div className="flex flex-row md:flex-col justify-center gap-4 p-2 items-center shrink-0">
        <button
          onClick={onMoveAllRight}
          disabled={available.length === 0}
          className={`p-3 bg-white border border-slate-200 ${c.btnHover} rounded-2xl disabled:opacity-40 disabled:bg-slate-50 transition-all shadow-sm ${c.btnShadow}`}
          aria-label="Mover todos para selecionados"
        >
          <ChevronsRight size={22} />
        </button>
        <button
          onClick={onMoveAllLeft}
          disabled={selected.length === 0}
          className="p-3 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 rounded-2xl disabled:opacity-40 disabled:bg-slate-50 transition-all shadow-sm shadow-rose-100"
          aria-label="Remover todos dos selecionados"
        >
          <ChevronsLeft size={22} />
        </button>
      </div>

      {/* Right List */}
      <div className={`bg-white border text-sm ${c.border} rounded-2xl overflow-hidden flex flex-col min-h-[250px] h-[30vh] lg:h-[400px] shadow-sm ring-4 ${c.ring} flex-1`}>
        <div className={`${c.header} p-4 border-b ${c.headerBorder} font-extrabold text-white flex justify-between items-center text-sm`}>
          <span className="uppercase tracking-widest text-[11px]">{rightTitle}</span>
          <span className={`${c.badge} font-black py-1 px-3 rounded-md text-xs`}>{selected.length} alvo</span>
        </div>
        <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${c.bg}`} role="listbox" aria-label={rightTitle}>
          {selected.map((item, idx) => (
            <div key={item.id || idx} className={`bg-white border ${c.border.replace('border-', 'border-').replace('200', '100')} p-3 rounded-xl flex justify-between items-center shadow-sm group`} role="option">
              <button
                onClick={() => onMoveLeft(item)}
                className="p-2 mr-3 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                aria-label="Remover dos selecionados"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="text-right flex-1 min-w-0">
                {renderSelected ? renderSelected(item) : renderItem(item)}
              </div>
            </div>
          ))}
          {selected.length === 0 && (
            <div className={`text-center font-bold ${c.empty} p-4 mt-14 uppercase tracking-wider text-xs`}>Arraste para concluir a mudança.</div>
          )}
        </div>
      </div>
    </div>
  );
}
