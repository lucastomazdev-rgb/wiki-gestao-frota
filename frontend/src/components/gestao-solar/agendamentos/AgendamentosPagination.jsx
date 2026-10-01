import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AgendamentosPagination({
  totalPaginas,
  indexPrimeiro,
  indexOfFirstItem,
  indexUltimo,
  indexOfLastItem,
  totalRegistros,
  paginaAtual,
  setPaginaAtual,
  getPaginasExibidas,
  onPrevPage,
  onNextPage,
  onGoToPage
}) {
  if (totalPaginas <= 1) return null;

  const first = indexPrimeiro ?? indexOfFirstItem ?? 0;
  const last = indexUltimo ?? indexOfLastItem ?? 0;
  const handlePrev = onPrevPage || (() => setPaginaAtual?.(prev => Math.max(prev - 1, 1)));
  const handleNext = onNextPage || (() => setPaginaAtual?.(prev => Math.min(prev + 1, totalPaginas)));
  const handleGoTo = onGoToPage || ((p) => setPaginaAtual?.(p));

  return (
    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-center text-xs gap-4">
      <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest order-2 sm:order-1">
        Exibindo <span className="text-slate-800 font-black">{first}</span> - <span className="text-slate-800 font-black">{last}</span> de <span className="text-slate-800 font-black">{totalRegistros}</span>
      </span>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={paginaAtual === 1}
          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 cursor-pointer shadow-xs active:scale-95"
          title="Página Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPaginasExibidas().map((pagina, idx) =>
            pagina === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-300 text-xs font-black select-none">
                ...
              </span>
            ) : (
              <button
                key={`page-${pagina}`}
                type="button"
                onClick={() => handleGoTo(pagina)}
                className={`min-w-[34px] h-[34px] px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                  paginaAtual === pagina
                    ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                {pagina}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={paginaAtual === totalPaginas}
          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 cursor-pointer shadow-xs active:scale-95"
          title="Próxima Página"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
