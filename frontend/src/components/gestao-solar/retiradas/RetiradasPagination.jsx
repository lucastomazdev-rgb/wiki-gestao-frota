import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RetiradasPagination({
  totalPaginas,
  indexPrimeiro,
  indexUltimo,
  totalRegistros,
  paginaAtual,
  setPaginaAtual,
  getPaginasExibidas
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center mt-6 lg:mt-8 pt-6 border-t border-slate-100 gap-4 lg:gap-6 pb-2">
      <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest order-2 lg:order-1">
        Exibindo <span className="text-slate-700 font-black">{indexPrimeiro}</span> - <span className="text-slate-700 font-black">{indexUltimo}</span> de <span className="text-slate-700 font-black">{totalRegistros}</span>
      </span>

      <div className="flex items-center gap-1.5 order-1 lg:order-2">
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaAtual === 1}
          className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 text-slate-500 cursor-pointer"
          title="Página Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPaginasExibidas().map((pagina, idx) =>
            pagina === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-300 text-[10px] font-black">
                ...
              </span>
            ) : (
              <button
                key={`page-${pagina}`}
                onClick={() => setPaginaAtual(pagina)}
                className={`min-w-[32px] h-[32px] lg:min-w-[36px] lg:h-[36px] flex items-center justify-center rounded-lg text-xs font-black transition-all border cursor-pointer
                  ${paginaAtual === pagina
                    ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600'
                  }`}
              >
                {pagina}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaAtual === totalPaginas}
          className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 text-slate-500 cursor-pointer"
          title="Próxima Página"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
