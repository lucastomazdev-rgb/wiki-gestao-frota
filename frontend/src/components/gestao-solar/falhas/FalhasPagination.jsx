import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function FalhasPagination({
  paginaAtual = 1,
  totalPaginas = 1,
  totalRegistros = 0,
  itensPorPagina = 20,
  onPageChange
}) {
  if (totalRegistros === 0) return null;

  const inicio = Math.min((paginaAtual - 1) * itensPorPagina + 1, totalRegistros);
  const fim = Math.min(paginaAtual * itensPorPagina, totalRegistros);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm text-xs">
      {/* Indicador de registros */}
      <span className="font-bold text-slate-600">
        Exibindo <span className="font-extrabold text-slate-900">{inicio}</span> a{' '}
        <span className="font-extrabold text-slate-900">{fim}</span> de{' '}
        <span className="font-extrabold text-slate-900">{totalRegistros}</span> falhas
      </span>

      {/* Controles de navegação */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={paginaAtual <= 1}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Primeira página"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(paginaAtual - 1)}
          disabled={paginaAtual <= 1}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded-lg text-xs">
          {paginaAtual} / {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(paginaAtual + 1)}
          disabled={paginaAtual >= totalPaginas}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Próxima página"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPaginas)}
          disabled={paginaAtual >= totalPaginas}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Última página"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
