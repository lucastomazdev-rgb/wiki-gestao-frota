import React from 'react';
import {
  Search,
  MapPin,
  Building2,
  Truck,
  Filter,
  Sparkles,
  BatteryWarning,
  X,
  RotateCcw
} from 'lucide-react';
import SearchableSelect from '../../shared/SearchableSelect';

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

const CLASSIFICACAO_MAP = {
  'NOVA FALHA': 'Novas Falhas',
  'FALHA RECORRENTE': 'Falhas Recorrentes'
};

const CLASSIFICACAO_REVERSE_MAP = {
  'Novas Falhas': 'NOVA FALHA',
  'Falhas Recorrentes': 'FALHA RECORRENTE'
};

export default function FalhasFiltersBar({
  filtroPlaca = '',
  setFiltroPlaca,
  ufsDisponiveis = [],
  filtroUF = 'TODOS',
  setFiltroUF,
  unidadesDisponiveis = [],
  filtroUnidade = 'TODAS',
  setFiltroUnidade,
  tiposDisponiveis = [],
  filtroTipo = 'TODOS',
  setFiltroTipo,
  filtroTipoFalha = 'TODOS',
  setFiltroTipoFalha,
  filtroStatus = [],
  setFiltroStatus,
  filtroBateriaBaixa = false,
  setFiltroBateriaBaixa,
  ordenacao = 'unidade_asc',
  setOrdenacao
}) {
  const temStatusAtivo = Array.isArray(filtroStatus)
    ? filtroStatus.length > 0
    : Boolean(filtroStatus && filtroStatus !== 'TODOS');

  const temFiltroAtivo = Boolean(
    filtroPlaca ||
    (filtroUF && filtroUF !== 'TODOS') ||
    (filtroUnidade && filtroUnidade !== 'TODAS') ||
    (filtroTipo && filtroTipo !== 'TODOS') ||
    (filtroTipoFalha && filtroTipoFalha !== 'TODOS') ||
    temStatusAtivo ||
    filtroBateriaBaixa
  );

  const handleLimparTodos = () => {
    setFiltroPlaca('');
    setFiltroUF('TODOS');
    setFiltroUnidade('TODAS');
    setFiltroTipo('TODOS');
    setFiltroTipoFalha('TODOS');
    setFiltroStatus([]);
    if (setFiltroBateriaBaixa) setFiltroBateriaBaixa(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 space-y-4">
      
      {/* Banner de Bateria Crítica (< 11V) quando ativo */}
      {filtroBateriaBaixa && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200/90 px-4 py-2.5 rounded-2xl text-xs text-amber-900 font-bold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <BatteryWarning size={18} className="text-amber-600 shrink-0" />
            <span>
              Filtro ativo: Exibindo apenas veículos com <strong>Bateria Crítica (&lt; 11V)</strong>
            </span>
          </div>
          {setFiltroBateriaBaixa && (
            <button
              type="button"
              onClick={() => setFiltroBateriaBaixa(false)}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <X size={12} />
              Remover Filtro
            </button>
          )}
        </div>
      )}

      {/* Grid Colunar de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
        
        {/* 1. Busca por Placa */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Placa
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search size={18} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Ex: ABC1D23"
              value={filtroPlaca}
              onChange={(e) => setFiltroPlaca(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-200 group-hover:border-teal-300 text-sm font-mono font-bold rounded-xl pl-10 pr-3.5 h-12 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm text-slate-800 placeholder-slate-400 uppercase"
            />
          </div>
        </div>

        {/* 2. Classificação (Novas vs Recorrentes) */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Classificação
          </label>
          <SearchableSelect
            placeholder="Todas as Falhas"
            options={['Novas Falhas', 'Falhas Recorrentes']}
            value={CLASSIFICACAO_MAP[filtroTipoFalha] || ''}
            onChange={(val) => setFiltroTipoFalha(CLASSIFICACAO_REVERSE_MAP[val] || 'TODOS')}
            icon={Sparkles}
          />
        </div>

        {/* 3. Estado (UF) */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            UF
          </label>
          <SearchableSelect
            placeholder="Todos os Estados"
            options={ufsDisponiveis}
            value={filtroUF === 'TODOS' ? '' : filtroUF}
            onChange={(val) => setFiltroUF(val || 'TODOS')}
            icon={MapPin}
          />
        </div>

        {/* 4. Unidade */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Unidade
          </label>
          <SearchableSelect
            placeholder="Todas as Unidades"
            options={unidadesDisponiveis}
            value={filtroUnidade === 'TODAS' ? '' : filtroUnidade}
            onChange={(val) => setFiltroUnidade(val || 'TODAS')}
            icon={Building2}
          />
        </div>

        {/* 5. Tipo de Veículo */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Tipo Veículo
          </label>
          <SearchableSelect
            placeholder="Todos os Tipos"
            options={tiposDisponiveis}
            value={filtroTipo === 'TODOS' ? '' : filtroTipo}
            onChange={(val) => setFiltroTipo(val || 'TODOS')}
            icon={Truck}
          />
        </div>

        {/* 6. Status Tratativa */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Status Tratativa
          </label>
          <SearchableSelect
            placeholder="Todos os Status"
            options={STATUS_OPTIONS}
            value={Array.isArray(filtroStatus) ? filtroStatus : (filtroStatus && filtroStatus !== 'TODOS' ? [filtroStatus] : [])}
            onChange={(val) => setFiltroStatus(Array.isArray(val) ? val : (val ? [val] : []))}
            icon={Filter}
            multiple={true}
          />
        </div>

      </div>

      {/* Linha Inferior: Ordenação e Limpeza de Filtros */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        
        {/* Seletor de Ordenação */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Ordenar:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {[
              { key: 'unidade_asc', label: 'Unidade (A-Z)' },
              { key: 'placa_asc', label: 'Placa (A-Z)' },
              { key: 'ultima_desc', label: 'Última Transmissão' }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setOrdenacao(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  ordenacao === opt.key
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Limpar Todos os Filtros */}
        {temFiltroAtivo && (
          <button
            type="button"
            onClick={handleLimparTodos}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={12} /> Limpar Filtros
          </button>
        )}

      </div>

    </div>
  );
}
