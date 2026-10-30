import React from 'react';
import { Calendar, Download, FileSpreadsheet, Loader2, Upload, ListChecks } from 'lucide-react';

export default function FalhasHeaderActions({
  lotes = [],
  loteAtivo = null,
  onSelectLote,
  onOpenImportModal,
  onOpenBaixarModal,
  onOpenMassaModal,
  onExportExcel,
  exportando = false,
  totalRegistros = 0,
  carregando = false
}) {
  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    return isNaN(d.getTime()) ? String(dataStr) : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-sm">
      {/* Seletor de Data de Extração (Lotes Salvos) */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl shrink-0">
          <Calendar size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label htmlFor="lote-select" className="text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer">
              Data da Extração
            </label>
            {lotes.length > 0 && loteAtivo && lotes[0]?.id === loteAtivo?.id && (
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                Mais Recente
              </span>
            )}
          </div>

          {lotes.length > 0 ? (
            <div className="relative mt-0.5">
              <select
                id="lote-select"
                aria-label="Selecionar data da extração"
                value={loteAtivo?.id || ''}
                onChange={(e) => onSelectLote(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-900 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors pr-8"
              >
                {lotes.map((lote, idx) => (
                  <option key={lote.id} value={lote.id}>
                    {formatarData(lote.data_extracao)} {idx === 0 ? '— (Atual)' : ''} ({lote.total_veiculos || 0} veículos)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium block">
              Nenhuma extração importada ainda.
            </span>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Botão Exportar Planilha Excel (respeita filtros ativos) */}
        <button
          type="button"
          onClick={onExportExcel}
          disabled={carregando || exportando || !loteAtivo || totalRegistros === 0}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          title={`Exportar planilha Excel (.xlsx) com as ${totalRegistros} placas exibidas no filtro atual`}
        >
          {exportando ? (
            <Loader2 size={15} className="text-teal-600 animate-spin" />
          ) : (
            <FileSpreadsheet size={15} className="text-teal-600" />
          )}
          <span>{exportando ? 'Exportando...' : 'Exportar Excel'}</span>
        </button>

        {/* Botão Baixar Falhas */}
        <button
          type="button"
          onClick={onOpenBaixarModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          title="Instruções para baixar o relatório de falhas atualizado no sistema"
        >
          <Download size={15} className="text-slate-600" />
          <span>Baixar Falhas</span>
        </button>

        {/* Botão Tratativa em Massa */}
        <button
          type="button"
          onClick={onOpenMassaModal}
          disabled={carregando || !loteAtivo}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition-all shadow-xs hover:shadow cursor-pointer active:scale-95 disabled:opacity-50"
          title="Tratativa de status e data em massa por unidade"
        >
          <ListChecks size={16} className="text-emerald-700" />
          <span>Tratativa em Massa</span>
        </button>

        {/* Botão Importar Planilha (Upload Manual) */}
        <button
          type="button"
          onClick={onOpenImportModal}
          disabled={carregando}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Upload size={15} />
          <span>Importar Planilha</span>
        </button>
      </div>
    </div>
  );
}
