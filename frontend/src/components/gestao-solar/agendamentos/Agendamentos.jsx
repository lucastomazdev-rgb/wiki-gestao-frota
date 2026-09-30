import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw,
  Building2,
  Users,
  Wrench,
  CheckCircle,
  X,
  Layers,
  CalendarRange
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import SearchableSelect from '../../shared/SearchableSelect';
import ModalNovoAgendamento from './ModalNovoAgendamento';
import ModalConcluirAgendamento from './ModalConcluirAgendamento';

const ITENS_POR_PAGINA = 15;

const STATUS_CORES = {
  'Realizado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Agendado': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Aguardando Data': 'bg-amber-50 text-amber-700 border-amber-200',
  'Aguardando Técnico': 'bg-purple-50 text-purple-700 border-purple-200',
  'Frustrado': 'bg-red-50 text-red-700 border-red-200'
};

const SERVICO_CORES = {
  'Manutenção': 'bg-amber-50 text-amber-800 border-amber-200',
  'Instalação': 'bg-teal-50 text-teal-800 border-teal-200',
  'Retirada': 'bg-slate-100 text-slate-700 border-slate-300',
  'Vistoria': 'bg-blue-50 text-blue-700 border-blue-200'
};

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Unidades existentes exclusivamente na tabela de agendamentos
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);

  // KPIs
  const [kpis, setKpis] = useState({
    total: 0,
    realizados: 0,
    pendentes: 0,
    frustrados: 0
  });

  // Filtros padronizados com a tela de Veículos
  const [busca, setBusca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroServico, setFiltroServico] = useState('');
  const [filtroTipoTecnico, setFiltroTipoTecnico] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Modais
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [agendamentoEmEdicao, setAgendamentoEmEdicao] = useState(null);

  const [modalConcluirOpen, setModalConcluirOpen] = useState(false);
  const [agendamentoParaConcluir, setAgendamentoParaConcluir] = useState(null);

  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Contagem de filtros ativos para badge de limpeza
  const activeFiltersCount = [
    busca,
    filtroUnidade,
    filtroStatus,
    filtroServico,
    filtroTipoTecnico,
    filtroDataInicio,
    filtroDataFim
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setBusca('');
    setFiltroUnidade('');
    setFiltroStatus('');
    setFiltroServico('');
    setFiltroTipoTecnico('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPaginaAtual(1);
  };

  // Buscar Unidades que existem na tabela de agendamentos
  const carregarUnidadesDisponiveis = async () => {
    try {
      const res = await api.get('/gestao-solar/agendamentos/unidades');
      setUnidadesDisponiveis(res.data?.data?.unidades || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Buscar KPIs
  const carregarKpis = async () => {
    try {
      const res = await api.get('/gestao-solar/agendamentos/kpis');
      setKpis(res.data?.data || { total: 0, realizados: 0, pendentes: 0, frustrados: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  // Buscar Agendamentos
  const carregarAgendamentos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: paginaAtual,
        limit: ITENS_POR_PAGINA,
        busca: busca.trim() || undefined,
        unidade: filtroUnidade || undefined,
        status: filtroStatus || undefined,
        servico: filtroServico || undefined,
        tipo_tecnico: filtroTipoTecnico || undefined,
        data_inicio: filtroDataInicio || undefined,
        data_fim: filtroDataFim || undefined
      };

      const res = await api.get('/gestao-solar/agendamentos', { params });
      setAgendamentos(res.data?.data?.agendamentos || []);
      setTotalRegistros(res.data?.data?.pagination?.total || 0);
      setTotalPaginas(res.data?.data?.pagination?.total_pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }, [paginaAtual, busca, filtroUnidade, filtroStatus, filtroServico, filtroTipoTecnico, filtroDataInicio, filtroDataFim]);

  useEffect(() => {
    carregarAgendamentos();
    carregarKpis();
  }, [carregarAgendamentos]);

  useEffect(() => {
    carregarUnidadesDisponiveis();
  }, []);

  // Excluir Agendamento
  const handleConfirmarExclusao = async () => {
    if (!agendamentoParaExcluir) return;
    try {
      setExcluindo(true);
      await api.delete(`/gestao-solar/agendamentos/${agendamentoParaExcluir.id}`);
      toast.success('Agendamento excluído com sucesso.');
      setAgendamentoParaExcluir(null);
      carregarAgendamentos();
      carregarKpis();
      carregarUnidadesDisponiveis();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao excluir agendamento.');
    } finally {
      setExcluindo(false);
    }
  };

  // Exportar para Excel (XLSX)
  const handleExportarExcel = () => {
    if (agendamentos.length === 0) {
      toast.error('Nenhum dado para exportar.');
      return;
    }

    const dadosExportacao = agendamentos.map((item) => ({
      'Data': item.data_agendamento ? new Date(item.data_agendamento).toLocaleDateString('pt-BR') : 'Aguardando Data',
      'Placa': item.placa,
      'Unidade': item.unidade || '',
      'UF': item.uf || '',
      'Tipo Veículo': item.tipo_veiculo || '',
      'Responsável': item.nome_responsavel,
      'Contato': item.contato_responsavel,
      'O.S.': item.numero_os || '',
      'Serviço': item.servico,
      'Tipo Técnico': item.tipo_tecnico,
      'Nome Técnico': item.nome_tecnico,
      'Status': item.status,
      'Motivo Frustrado': item.motivo_frustrado || '',
      'Observações': item.observacoes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, `agendamentos_frota_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Planilha exportada com sucesso!');
  };

  // Helper para abrir WhatsApp
  const handleAbrirWhatsApp = (contato, responsavel, placa, servico) => {
    const limpo = String(contato || '').replace(/\D/g, '');
    if (!limpo) {
      toast.error('Número de telefone não informado.');
      return;
    }
    const numeroFormatado = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const texto = encodeURIComponent(`Olá ${responsavel}, sou da Gestão de Frota. Referente ao agendamento de ${servico} para o veículo de placa ${placa}...`);
    window.open(`https://wa.me/${numeroFormatado}?text=${texto}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Principal (Título, Subtítulo e Botões de Ação) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="text-teal-500" size={24} /> Agendamentos & Manutenções
          </h2>
          <p className="text-[11px] lg:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1 opacity-70">
            Total de <span className="text-teal-600 font-black">{loading ? <span className="inline-block w-8 h-3 bg-slate-200 animate-pulse rounded align-middle" /> : totalRegistros}</span> agendamentos registrados
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportarExcel}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download size={15} />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAgendamentoEmEdicao(null);
              setModalNovoOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-700/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMEIRO: Os KPIs (Indicadores) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Total Registrado */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="p-3 bg-teal-50 text-teal-800 rounded-2xl border border-teal-100 group-hover:scale-105 transition-transform">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Registrado
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block group-hover:text-teal-600 transition-colors">
              {kpis.total}
            </span>
          </div>
        </div>

        {/* KPI: Pendentes */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 group-hover:scale-105 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Manutenções Pendentes
            </span>
            <span className="text-2xl font-black text-amber-600 tracking-tight mt-0.5 block group-hover:text-amber-700 transition-colors">
              {kpis.pendentes}
            </span>
          </div>
        </div>

        {/* KPI: Realizadas */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 group-hover:scale-105 transition-transform">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Manutenções Realizadas
            </span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5 block group-hover:text-emerald-700 transition-colors">
              {kpis.realizados}
            </span>
          </div>
        </div>

        {/* KPI: Frustradas */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-100 group-hover:scale-105 transition-transform">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Insucessos / Frustradas
            </span>
            <span className="text-2xl font-black text-red-600 tracking-tight mt-0.5 block group-hover:text-red-700 transition-colors">
              {kpis.frustrados}
            </span>
          </div>
        </div>
      </div>

      {/* 3. DEPOIS: Os Filtros (Padronizados com a Estética Exata da Tela de Veículos) */}
      <div className="flex flex-col gap-2 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-50/40 p-2 lg:p-3 rounded-2xl border border-slate-200/50 w-full">
          
          {/* Filtro por UNIDADE (Apenas opções que existem na tabela de agendamentos) */}
          <SearchableSelect
            label="Unidade"
            placeholder="Unidade..."
            options={unidadesDisponiveis}
            value={filtroUnidade}
            onChange={(val) => {
              setFiltroUnidade(val);
              setPaginaAtual(1);
            }}
            icon={Building2}
          />

          {/* Filtro por STATUS */}
          <SearchableSelect
            label="Status"
            placeholder="Status..."
            options={['Agendado', 'Aguardando Data', 'Aguardando Técnico', 'Realizado', 'Frustrado']}
            value={filtroStatus}
            onChange={(val) => {
              setFiltroStatus(val);
              setPaginaAtual(1);
            }}
            icon={Filter}
          />

          {/* Filtro por SERVIÇO */}
          <SearchableSelect
            label="Serviço"
            placeholder="Serviço..."
            options={['Retirada', 'Manutenção', 'Instalação', 'Vistoria']}
            value={filtroServico}
            onChange={(val) => {
              setFiltroServico(val);
              setPaginaAtual(1);
            }}
            icon={Wrench}
          />

          {/* Filtro por TÉCNICO */}
          <SearchableSelect
            label="Técnico"
            placeholder="Técnico..."
            options={['CORPVS', 'TERCEIRIZADO']}
            value={filtroTipoTecnico}
            onChange={(val) => {
              setFiltroTipoTecnico(val);
              setPaginaAtual(1);
            }}
            icon={Users}
          />

          {/* Input de Busca Textual (Placa, Responsável, O.S.) com a Mesma Estética de Veículos */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Placa, responsável, O.S..."
              className={`w-full bg-white border border-slate-200 text-xs text-slate-800 font-bold rounded-xl pl-9 ${busca ? 'pr-8' : 'pr-3'} py-2.5 lg:py-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm`}
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPaginaAtual(1);
              }}
            />
            {busca && (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setPaginaAtual(1);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Linha de Apoio: Filtro de Período, Totalizador e Botão de Limpar Filtros Ativos */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <CalendarRange size={13} className="text-teal-600 shrink-0" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Período:</span>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => {
                setFiltroDataInicio(e.target.value);
                setPaginaAtual(1);
              }}
              className="text-xs font-bold text-slate-700 outline-none bg-transparent"
            />
            <span className="text-slate-300 text-xs font-bold">até</span>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => {
                setFiltroDataFim(e.target.value);
                setPaginaAtual(1);
              }}
              className="text-xs font-bold text-slate-700 outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-bold">
              Exibindo <span className="text-teal-600 font-black">{agendamentos.length}</span> de <span className="text-slate-700 font-black">{totalRegistros}</span> registros
              {filtroUnidade && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                  Unidade: {filtroUnidade}
                </span>
              )}
            </span>

            {activeFiltersCount > 0 && (
              <div className="flex items-center animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer group"
                  title="Limpar todos os filtros ativos"
                >
                  <X size={13} className="group-hover:rotate-90 transition-transform duration-200" />
                  <span>Limpar filtros</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded-full text-[10px] font-black">
                    {activeFiltersCount}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabela de Agendamentos (Linha a Linha) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Placa & Veículo</th>
                <th className="py-3.5 px-4">Unidade / UF</th>
                <th className="py-3.5 px-4">Serviço</th>
                <th className="py-3.5 px-4">Técnico</th>
                <th className="py-3.5 px-4">Responsável & Contato</th>
                <th className="py-3.5 px-4">O.S.</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-teal-600" />
                    <p className="font-semibold">Carregando agendamentos...</p>
                  </td>
                </tr>
              ) : agendamentos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Nenhum agendamento encontrado.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste os filtros ou clique em "Novo Agendamento" para cadastrar.
                    </p>
                  </td>
                </tr>
              ) : (
                agendamentos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    
                    {/* Data */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {item.data_agendamento ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(item.data_agendamento).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Sem Data
                        </span>
                      )}
                    </td>

                    {/* Placa & Tipo Veículo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                          {item.placa}
                        </span>
                        {item.tipo_veiculo && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {item.tipo_veiculo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Unidade & UF */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span className="font-medium">{item.unidade || '-'}</span>
                        {item.uf && (
                          <span className="text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.uf}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Serviço */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        SERVICO_CORES[item.servico] || 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {item.servico}
                      </span>
                    </td>

                    {/* Técnico */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            item.tipo_tecnico === 'CORPVS' 
                              ? 'bg-teal-100 text-teal-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.tipo_tecnico === 'CORPVS' ? 'CORPVS' : 'TERCEIRIZADO'}
                          </span>
                          <span className="font-bold text-slate-800">{item.nome_tecnico}</span>
                        </div>
                      </div>
                    </td>

                    {/* Responsável & WhatsApp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{item.nome_responsavel}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.contato_responsavel}</div>
                        </div>

                        {item.contato_responsavel && (
                          <button
                            type="button"
                            onClick={() => handleAbrirWhatsApp(item.contato_responsavel, item.nome_responsavel, item.placa, item.servico)}
                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* O.S. */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      {item.numero_os || '-'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        STATUS_CORES[item.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                      {item.status === 'Frustrado' && item.motivo_frustrado && (
                        <div className="text-[10px] text-red-500 truncate max-w-[140px] mt-0.5" title={item.motivo_frustrado}>
                          {item.motivo_frustrado}
                        </div>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Botão Marcar como Realizado */}
                        {item.status !== 'Realizado' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAgendamentoParaConcluir(item);
                              setModalConcluirOpen(true);
                            }}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Marcar como Realizado"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}

                        {/* Botão Editar */}
                        <button
                          type="button"
                          onClick={() => {
                            setAgendamentoEmEdicao(item);
                            setModalNovoOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Editar Agendamento"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Botão Excluir */}
                        <button
                          type="button"
                          onClick={() => setAgendamentoParaExcluir(item)}
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Agendamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Paginação */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={paginaAtual <= 1}
              onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
              {paginaAtual}
            </span>
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas}
              onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <ModalNovoAgendamento
        isOpen={modalNovoOpen}
        onClose={() => {
          setModalNovoOpen(false);
          setAgendamentoEmEdicao(null);
        }}
        agendamentoParaEditar={agendamentoEmEdicao}
        onSuccess={() => {
          carregarAgendamentos();
          carregarKpis();
          carregarUnidadesDisponiveis();
        }}
      />

      {/* Modal de Conclusão (KM, Materiais, NF) */}
      <ModalConcluirAgendamento
        isOpen={modalConcluirOpen}
        onClose={() => {
          setModalConcluirOpen(false);
          setAgendamentoParaConcluir(null);
        }}
        agendamento={agendamentoParaConcluir}
        onSuccess={() => {
          carregarAgendamentos();
          carregarKpis();
          carregarUnidadesDisponiveis();
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      {agendamentoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-base">Excluir Agendamento</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir o agendamento da placa{' '}
              <strong className="text-slate-900 font-mono">{agendamentoParaExcluir.placa}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAgendamentoParaExcluir(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
