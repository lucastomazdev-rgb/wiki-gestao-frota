import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AgendamentosPagination({
  totalPaginas,
  indexOfFirstItem,
  indexOfLastItem,
  totalRegistros,
  paginaAtual,
  getPaginasExibidas,
  onPrevPage,
  onNextPage,
  onGoToPage
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase font-black tracking-widest gap-4">
      <div className="text-slate-400 order-2 sm:order-1">
        <span className="text-slate-600">{indexOfFirstItem}</span> - <span className="text-slate-600">{indexOfLastItem}</span> de{' '}
        <span className="text-slate-600">{totalRegistros}</span>
      </div>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={onPrevPage}
          disabled={paginaAtual === 1}
          className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 cursor-pointer shadow-sm active:scale-95"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPaginasExibidas().map((pagina, idx) =>
            pagina === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-300">
                ...
              </span>
            ) : (
              <button
                key={`page-${pagina}`}
                onClick={() => onGoToPage(pagina)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all duration-200 border cursor-pointer active:scale-90 ${
                  paginaAtual === pagina
                    ? 'bg-teal-600 border-teal-500 text-white shadow-sm shadow-teal-200/50'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-teal-200 hover:text-teal-600'
                }`}
              >
                {pagina}
              </button>
            )
          )}
        </div>

        <button
          onClick={onNextPage}
          disabled={paginaAtual === totalPaginas}
          className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 cursor-pointer shadow-sm active:scale-95"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
