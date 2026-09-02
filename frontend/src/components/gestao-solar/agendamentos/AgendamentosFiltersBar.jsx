import React from 'react';
import {
  Building2,
  CalendarDays,
  Download,
  ListChecks,
  Plus,
  Search,
  Upload
} from 'lucide-react';

const PERIODOS = [
  { id: 'todos', label: 'Tudo' },
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: 'mes', label: 'Mês' },
  { id: 'personalizado', label: 'Período' }
];

export default function AgendamentosFiltersBar({
  periodoSelecionado,
  onPeriodSelect,
  dataInicio,
  dataFim,
  setDataInicio,
  setDataFim,
  isSupervisor,
  fileInputRef,
  onFileUpload,
  onOpenAgenda,
  onOpenImportacao,
  onExportarRelatorio,
  onOpenMassa,
  onOpenNovo,
  selectUnidadeRef,
  filtroUnidade,
  buscaUnidade,
  setBuscaUnidade,
  setFiltroUnidade,
  isSelectUnidadeOpen,
  setIsSelectUnidadeOpen,
  unidadesUnicas,
  filtroPlaca,
  setFiltroPlaca,
  filtroStatus,
  setFiltroStatus
}) {
  return (
    <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-200/60 bg-slate-50/50 flex flex-col gap-5 w-full relative z-[10] rounded-t-3xl transition-all">
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex flex-col gap-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center bg-slate-200/40 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner overflow-x-auto no-scrollbar max-w-full">
            {PERIODOS.map((periodo) => (
              <button
                key={periodo.id}
                onClick={() => onPeriodSelect(periodo.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0 ${
                  periodoSelecionado === periodo.id
                    ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/20'
                }`}
              >
                {periodo.label}
              </button>
            ))}
          </div>

          {periodoSelecionado === 'personalizado' && (
            <div className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
              <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-black mr-2 uppercase tracking-wide">De:</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-400 font-black mr-2 uppercase tracking-wide">Até:</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {isSupervisor && <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={onFileUpload} />}

            <div className="flex gap-2 flex-1 lg:flex-none">
              <button
                onClick={onOpenAgenda}
                title="Quadro Semanal Operativo"
                className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
              >
                <CalendarDays size={18} className="group-hover:scale-110 transition-transform" />
              </button>

              {isSupervisor && (
                <button
                  onClick={onOpenImportacao}
                  title="Importar O.S. via CSV"
                  className="p-3 bg-white border border-slate-200 hover:border-teal-300 text-teal-600 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
                >
                  <Upload size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              )}

              <button
                onClick={onExportarRelatorio}
                title="Exportar Relatório Filtrado (.xlsx)"
                className="p-3 bg-white border border-slate-200 hover:border-emerald-300 text-emerald-600 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
              >
                <Download size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="hidden lg:block w-px h-8 bg-slate-200 mx-1"></div>

            <div className="flex gap-2 flex-1 lg:flex-none">
              <button
                onClick={onOpenMassa}
                title="Mudança em Massa de Status"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow shadow-emerald-200/50 hover:-translate-y-0.5 active:scale-95 flex-1 lg:flex-none cursor-pointer"
              >
                <ListChecks size={16} />
                <span className="hidden sm:inline">Lote</span>
              </button>

              <button
                onClick={onOpenNovo}
                title="Criar nova Ordem de Serviço"
                className="bg-teal-600 hover:bg-teal-700 text-white h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow shadow-teal-200/50 hover:-translate-y-0.5 active:scale-95 flex-1 lg:flex-none cursor-pointer"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">O.S.</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full items-end">
          <div className="relative group col-span-1 md:col-span-1 lg:col-span-2" ref={selectUnidadeRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Building2 size={16} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Unidade..."
              value={filtroUnidade || buscaUnidade}
              onChange={(event) => {
                setBuscaUnidade(event.target.value);
                setFiltroUnidade('');
                setIsSelectUnidadeOpen(true);
              }}
              onFocus={() => setIsSelectUnidadeOpen(true)}
              className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl pl-10 pr-4 h-11 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm group-hover:border-teal-200"
            />

            {isSelectUnidadeOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-[50] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                <div
                  onClick={() => {
                    setFiltroUnidade('');
                    setBuscaUnidade('');
                    setIsSelectUnidadeOpen(false);
                  }}
                  className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 cursor-pointer border-b border-slate-50"
                >
                  -- Limpar Seleção --
                </div>
                {unidadesUnicas
                  .filter((unidade) => unidade.toLowerCase().includes(buscaUnidade.toLowerCase()))
                  .map((unidade) => (
                    <div
                      key={unidade}
                      onClick={() => {
                        setFiltroUnidade(unidade);
                        setBuscaUnidade(unidade);
                        setIsSelectUnidadeOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-600 cursor-pointer transition-colors"
                    >
                      {unidade}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Placa..."
              value={filtroPlaca}
              onChange={(event) => setFiltroPlaca(event.target.value)}
              className="w-full uppercase bg-white border border-slate-200 text-xs font-black tracking-widest text-slate-700 rounded-xl pl-10 pr-4 h-11 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm group-hover:border-teal-200"
            />
          </div>

          <div className="relative group">
            <select
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
              className="w-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl pl-4 pr-10 h-11 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 cursor-pointer shadow-sm transition-all hover:border-teal-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="">Status (Todos)</option>
              <option value="Aguardando Data">Aguardando Data</option>
              <option value="Agendado">Agendado</option>
              <option value="Realizado">Realizado</option>
              <option value="Frustrado">Frustrado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
