import React from 'react';
import { Building2, Download, Filter, ListChecks, MapPin, Search, Truck, Upload } from 'lucide-react';
import SearchableSelect from '../shared/SearchableSelect';

const STATUS_OPTIONS = [
  'Pendente de Contato',
  'Aguardando Retorno',
  'Agendado Manutenção',
  'Aguardando Técnico',
  'Oficina',
  'Parado',
  'Retirada em Aberto',
  'Voltou a comunicar'
];

export default function FalhasFiltersBar({
  filtroPlaca,
  setFiltroPlaca,
  ufsUnicas,
  filtroUF,
  setFiltroUF,
  unidadesUnicas,
  filtroUnidade,
  setFiltroUnidade,
  tiposUnicos,
  filtroTipo,
  setFiltroTipo,
  filtroStatus,
  setFiltroStatus,
  ordenacaoFalhas,
  setOrdenacaoFalhas,
  handleAbrirModalMassa,
  handleExportarExcel,
  isSupervisor,
  fileInputRef,
  handleFileUpload,
  setIsImportModalOpen,
  ultimaImportacao
}) {
  return (
    <div className="p-4 pb-5 border-b border-slate-100 bg-slate-50/20 relative z-[10] rounded-t-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-9 gap-3 items-center">
        <div className="lg:col-span-1">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search size={18} className={`transition-colors ${filtroPlaca ? 'text-teal-500' : 'text-slate-400'}`} />
            </div>
            <input
              type="text"
              placeholder="Placa..."
              value={filtroPlaca}
              onChange={(event) => setFiltroPlaca(event.target.value.toUpperCase())}
              className={`w-full bg-white border text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-all shadow-sm ${
                filtroPlaca
                  ? 'border-teal-500 ring-4 ring-teal-500/10 font-bold text-slate-800'
                  : 'border-slate-200 group-hover:border-teal-300 text-slate-400 font-medium'
              }`}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <SearchableSelect label="UF" placeholder="Estado..." options={ufsUnicas} value={filtroUF} onChange={setFiltroUF} icon={MapPin} />
        </div>

        <div className="lg:col-span-1 xl:col-span-2">
          <SearchableSelect
            label="Unidade"
            placeholder="Selecionar..."
            options={unidadesUnicas}
            value={filtroUnidade}
            onChange={setFiltroUnidade}
            icon={Building2}
          />
        </div>

        <div className="lg:col-span-1">
          <SearchableSelect label="Tipo" placeholder="Veículo..." options={tiposUnicos} value={filtroTipo} onChange={setFiltroTipo} icon={Truck} />
        </div>

        <div className="lg:col-span-1 xl:col-span-2">
          <SearchableSelect
            label="Status da Falha"
            placeholder="Qualquer..."
            options={STATUS_OPTIONS}
            value={filtroStatus}
            onChange={setFiltroStatus}
            icon={Filter}
          />
        </div>

        <div className="flex flex-col gap-1 lg:col-span-2 items-end justify-center">
          <div className="w-full flex justify-between lg:justify-end mb-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setOrdenacaoFalhas('unidade_asc')}
                className={`h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  ordenacaoFalhas === 'unidade_asc'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Ordenar por Unidade A-Z"
              >
                Unidade A-Z
              </button>
              <button
                type="button"
                onClick={() => setOrdenacaoFalhas('ultima_desc')}
                className={`h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  ordenacaoFalhas === 'ultima_desc'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Ordenar por última transmissão mais recente"
              >
                Mais recente
              </button>
            </div>
          </div>

          <div className="flex gap-2 w-full justify-between lg:justify-end">
            <button
              onClick={handleAbrirModalMassa}
              className="w-28 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-emerald-200/50 hover:scale-105 hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
            >
              <ListChecks size={16} className="group-hover:rotate-12 transition-transform" /> Massa
            </button>

            <div className="flex gap-1">
              <button
                onClick={handleExportarExcel}
                title="Exportar Excel"
                className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 hover:border-rose-300 text-rose-500 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
              >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </button>

              {isSupervisor && (
                <>
                  <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    title="Sincronizar"
                    className="w-11 h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
                  >
                    <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {ultimaImportacao && (
        <div className="absolute bottom-1.5 right-5 text-[9px] text-slate-400 font-medium whitespace-nowrap opacity-80">
          Importação: {new Date(ultimaImportacao).toLocaleDateString('pt-BR')} às{' '}
          {new Date(ultimaImportacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
