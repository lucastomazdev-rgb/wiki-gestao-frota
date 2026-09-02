import React from 'react';
import {
  ArrowRightLeft,
  Bike,
  CalendarRange,
  Download,
  Filter,
  Layers,
  Plus,
  Search,
  Truck,
  Upload,
  Video
} from 'lucide-react';
import SearchableSelect from '../shared/SearchableSelect';

export default function TabelaVeiculosHeaderSection({
  totalRegistros,
  unidadesDisponiveis,
  filtroUnidade,
  setFiltroUnidade,
  ufsDisponiveis,
  filtroUF,
  setFiltroUF,
  tiposDisponiveis,
  filtroTipo,
  setFiltroTipo,
  filtroPlaca,
  setFiltroPlaca,
  countCaminhoes,
  countMotos,
  countVideos,
  onAbrirTransfer,
  onNovoVeiculo,
  isSupervisor,
  fileInputRef,
  onFileUpload,
  onAbrirImportacao,
  onExportarExcel,
  onOpenTimeline
}) {
  return (
    <>
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center mb-6 gap-6">
        <div className="min-w-max">
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="text-teal-500" size={20} /> Frota Operacional
            {isSupervisor && (
              <button
                onClick={onOpenTimeline}
                title="Movimentação Mensal"
                className="ml-1 p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg border border-transparent hover:border-teal-200 transition-all duration-300 hover:scale-110 hover:rotate-6 active:scale-95 group cursor-pointer"
                aria-label="Abrir timeline de movimentação mensal"
              >
                <CalendarRange size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
          </h2>
          <p className="text-[11px] lg:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1 opacity-70">
            Total de <span className="text-teal-600">{totalRegistros}</span> veículos <span className="hidden sm:inline">em operação</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50/40 p-2 lg:p-3 rounded-2xl border border-slate-200/50 w-full 2xl:w-auto">
          <SearchableSelect
            label="Unidade"
            placeholder="Unidade..."
            options={unidadesDisponiveis}
            value={filtroUnidade}
            onChange={setFiltroUnidade}
            icon={Layers}
          />
          <SearchableSelect
            label="UF"
            placeholder="UF..."
            options={ufsDisponiveis}
            value={filtroUF}
            onChange={setFiltroUF}
            icon={Filter}
          />
          <SearchableSelect
            label="Tipo"
            placeholder="Tipo..."
            options={tiposDisponiveis}
            value={filtroTipo}
            onChange={setFiltroTipo}
            icon={Truck}
          />
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Placa..."
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 font-bold rounded-xl pl-9 pr-3 py-2.5 lg:py-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
              value={filtroPlaca}
              onChange={(event) => setFiltroPlaca(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex border border-slate-200/80 bg-slate-50/50 rounded-xl mb-6 p-1 py-2 shadow-sm w-full divide-x divide-slate-200 justify-between relative overflow-visible">
        <div className="flex-1 flex items-center justify-center px-4 py-2.5 hover:bg-white rounded-lg transition-all duration-300 cursor-default border border-transparent hover:border-teal-500/40 hover:-translate-y-2 hover:scale-[1.03] group" title="Caminhões">
          <Truck size={16} className="text-teal-500 mr-3 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-xs lg:text-sm leading-none group-hover:text-teal-600 transition-colors">{countCaminhoes}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1 group-hover:text-teal-500/70 transition-colors">Pesados</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-2.5 hover:bg-white rounded-lg transition-all duration-300 cursor-default border border-transparent hover:border-emerald-500/40 hover:-translate-y-2 hover:scale-[1.03] group" title="Motos">
          <Bike size={16} className="text-emerald-500 mr-3 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-xs lg:text-sm leading-none group-hover:text-emerald-600 transition-colors">{countMotos}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1 group-hover:text-emerald-500/70 transition-colors">Motos</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-2.5 hover:bg-white rounded-lg transition-all duration-300 cursor-default border border-transparent hover:border-teal-500/40 hover:-translate-y-2 hover:scale-[1.03] group" title="Vídeo / Câmeras">
          <Video size={16} className="text-teal-500 mr-3 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-xs lg:text-sm leading-none group-hover:text-teal-600 transition-colors">{countVideos}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1 group-hover:text-teal-500/70 transition-colors">Vídeo</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-50/30 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={onAbrirTransfer} className="bg-white border border-amber-200/60 hover:border-amber-400 hover:bg-amber-50 text-amber-700 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-[11px] lg:text-xs font-black uppercase tracking-tight flex items-center justify-center transition-all duration-300 flex-1 md:flex-none shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-[1.03] active:scale-95 group cursor-pointer">
            <ArrowRightLeft size={16} className="mr-2 group-hover:rotate-12 transition-transform" /> Transferir
          </button>
          <button onClick={onNovoVeiculo} className="bg-teal-600 hover:bg-teal-700 text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-[11px] lg:text-xs font-black uppercase tracking-tight flex items-center justify-center transition-all duration-300 flex-1 md:flex-none shadow-md shadow-teal-200/50 hover:shadow-lg hover:shadow-teal-500/20 hover:-translate-y-1 hover:scale-[1.03] active:scale-95 group cursor-pointer">
            <Plus size={16} className="mr-2 group-hover:scale-110 group-hover:rotate-180 transition-transform duration-500" /> Novo Veículo
          </button>
        </div>

        <div className="hidden md:block h-6 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto px-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Ações de Dados</span>
            <div className="h-px w-6 bg-slate-200"></div>
          </div>
          <div className="flex gap-2 ml-2">
            {isSupervisor && (
              <>
                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={onFileUpload} />
                <button
                  onClick={onAbrirImportacao}
                  title="Importar CSV"
                  className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 bg-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-110 active:scale-90 group cursor-pointer"
                >
                  <Upload size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
            <button
              onClick={onExportarExcel}
              title="Exportar Excel"
              className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 bg-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-110 active:scale-90 group cursor-pointer"
            >
              <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
