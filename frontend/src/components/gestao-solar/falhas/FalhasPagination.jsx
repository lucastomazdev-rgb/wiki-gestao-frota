import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FalhasPagination({
  totalPaginas,
  indexOfFirstItem,
  indexOfLastItem,
  totalRegistros,
  paginaAtual,
  getPaginasExibidas,
  onPrev,
  onNext,
  onGoTo
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col lg:flex-row justify-between items-center text-sm gap-6">
      <span className="font-medium text-slate-500 order-2 lg:order-1">
        Exibindo <span className="font-bold text-slate-700">{indexOfFirstItem}</span> a <span className="font-bold text-slate-700">{indexOfLastItem}</span> de{' '}
        <span className="font-bold text-slate-700">{totalRegistros}</span> rastreadores
      </span>

      <div className="flex flex-wrap items-center justify-center gap-2 order-1 lg:order-2">
        <button
          onClick={onPrev}
          disabled={paginaAtual === 1}
          className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 hover:text-slate-700 active:scale-95"
          title="Pagina Anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5 px-1 sm:px-2">
          {getPaginasExibidas().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold tracking-widest">
                ...
              </span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => onGoTo(page)}
                className={`min-w-[42px] h-[42px] flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 border shadow-sm active:scale-90 ${
                  paginaAtual === page
                    ? 'bg-rose-600 border-rose-500 text-white shadow-rose-200 shadow-lg'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={onNext}
          disabled={paginaAtual === totalPaginas}
          className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 hover:text-slate-700 active:scale-95"
          title="Proxima Pagina"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
