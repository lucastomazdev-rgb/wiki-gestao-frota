import React from 'react';
import {
  ArrowDownRight,
  Bike,
  DollarSign,
  Download,
  Filter,
  Layers,
  LogOut,
  Plus,
  Search,
  Truck,
  Upload,
  Video
} from 'lucide-react';
import SearchableSelect from '../shared/SearchableSelect';

export default function RetiradasHeaderSection({
  totalRegistros,
  volumeBaixas,
  receitaTaxas,
  unidadesDisponiveis,
  filtroUnidade,
  setFiltroUnidade,
  ufsDisponiveis,
  filtroUF,
  setFiltroUF,
  tiposDisponiveis,
  filtroTipo,
  setFiltroTipo,
  statusDisponiveis,
  filtroStatus,
  setFiltroStatus,
  filtroPlaca,
  setFiltroPlaca,
  countCaminhoes,
  countMotos,
  countVideos,
  onNovoRegistro,
  isSupervisor,
  fileInputRef,
  onFileUpload,
  onAbrirImportacao,
  onExportarExcel
}) {
  return (
    <>
      {/* Topo com Título e Filtros Principais */}
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center mb-6 gap-6">
        <div className="min-w-max">
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-200/80">
              <LogOut size={20} className="rotate-180" />
            </div>
            <span>Histórico de Retiradas</span>
          </h2>
          <p className="text-[11px] lg:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5 opacity-75">
            Total de <span className="text-orange-600 font-black">{volumeBaixas}</span> baixas registradas
          </p>
        </div>

        {/* Grade de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 bg-slate-50/50 p-2 lg:p-3 rounded-2xl border border-slate-200/60 w-full 2xl:w-auto">
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
          <SearchableSelect
            label="Status"
            placeholder="Status..."
            options={statusDisponiveis}
            value={filtroStatus}
            onChange={setFiltroStatus}
            icon={ArrowDownRight}
          />
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Placa..."
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 font-bold uppercase rounded-xl pl-9 pr-3 py-2.5 lg:py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              value={filtroPlaca}
              onChange={(event) => setFiltroPlaca(event.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cards de Métricas e KPIs com Alta Densidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Volume de Baixas */}
        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/70 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-orange-100/70 transition-colors" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-200/60 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
              <ArrowDownRight size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Volume Filtrado</p>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {totalRegistros}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  veículos baixados
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Receita de Taxas */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 lg:p-5 rounded-2xl text-white shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
              <DollarSign size={22} className="text-white drop-shadow-xs" />
            </div>
            <div>
              <p className="text-orange-100 font-black uppercase tracking-widest text-[10px] mb-1.5 leading-none">Taxas de Desinstalação</p>
              <div className="flex items-baseline gap-2 leading-none">
                <span className="text-2xl font-black tracking-tight drop-shadow-xs">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTaxas)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Categorias de Veículos */}
        <div className="flex border border-slate-200/80 bg-slate-50/60 rounded-2xl p-1.5 shadow-xs divide-x divide-slate-200 justify-between items-center">
          <div className="flex-1 flex items-center justify-center px-3 py-2 hover:bg-white rounded-xl transition-all duration-300 group" title="Caminhões / Pesados">
            <Truck size={16} className="text-orange-500 mr-2.5 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-slate-800 text-sm leading-none group-hover:text-orange-600 transition-colors">{countCaminhoes}</span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1">Pesados</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-3 py-2 hover:bg-white rounded-xl transition-all duration-300 group" title="Motos">
            <Bike size={16} className="text-emerald-500 mr-2.5 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-slate-800 text-sm leading-none group-hover:text-emerald-600 transition-colors">{countMotos}</span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1">Motos</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-3 py-2 hover:bg-white rounded-xl transition-all duration-300 group" title="Vídeo / Câmeras">
            <Video size={16} className="text-teal-500 mr-2.5 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-slate-800 text-sm leading-none group-hover:text-teal-600 transition-colors">{countVideos}</span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1">Vídeo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Ações Rápidas */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-slate-50/40 p-4 rounded-2xl border border-slate-100 shadow-xs transition-all duration-300">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={onNovoRegistro}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3.5 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-black uppercase tracking-tight flex items-center justify-center transition-all duration-300 flex-1 md:flex-none shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
          >
            <Plus size={16} className="mr-2 group-hover:scale-110 group-hover:rotate-180 transition-transform duration-500" />
            Registrar Baixa
          </button>
        </div>

        <div className="hidden md:block h-6 w-px bg-slate-200 mx-2" />

        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto px-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Ações de Dados</span>
            <div className="h-px w-6 bg-slate-200" />
          </div>
          <div className="flex gap-2 ml-2">
            {isSupervisor && (
              <>
                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={onFileUpload} />
                <button
                  onClick={onAbrirImportacao}
                  title="Importar CSV de Retiradas"
                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 bg-white rounded-xl transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-90 group cursor-pointer"
                >
                  <Upload size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
            <button
              onClick={onExportarExcel}
              title="Exportar Relatório Excel"
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 bg-white rounded-xl transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-90 group cursor-pointer"
            >
              <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
