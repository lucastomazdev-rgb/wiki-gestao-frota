import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Wrench, 
  Box, 
  RotateCcw, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  PackagePlus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../ConfirmModal';
import CardTecnico from './CardTecnico';
import ModalNovoTecnico from './ModalNovoTecnico';
import ModalCargaEquipamentos from './ModalCargaEquipamentos';
import ModalLancamentoOS from './ModalLancamentoOS';
import TabelaOrdensServico from './TabelaOrdensServico';

export default function GestaoTecnicosTerceirizados() {
  // Tabs internas da tela: 'tecnicos' | 'ordens'
  const [activeSubTab, setActiveSubTab] = useState('tecnicos');

  // Dados
  const [tecnicos, setTecnicos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [loadingOrdens, setLoadingOrdens] = useState(true);
  const [kpis, setKpis] = useState({
    totalTecnicos: 0,
    totalHomologados: 0,
    totalEquipamentos: 0,
    pendentesDevolucao: 0
  });

  // Filtros de Técnicos
  const [buscaTecnico, setBuscaTecnico] = useState('');
  const [filtroHomologado, setFiltroHomologado] = useState('');

  // Filtros de Ordens de Serviço
  const [buscaOS, setBuscaOS] = useState('');
  const [filtroStatusOS, setFiltroStatusOS] = useState('');
  const [filtroPendenteDevolucao, setFiltroPendenteDevolucao] = useState(false);

  // Modais
  const [modalTecnicoOpen, setModalTecnicoOpen] = useState(false);
  const [tecnicoEmEdicao, setTecnicoEmEdicao] = useState(null);

  const [modalCargaOpen, setModalCargaOpen] = useState(false);
  const [tecnicoParaCarga, setTecnicoParaCarga] = useState(null);

  const [modalOSOpen, setModalOSOpen] = useState(false);
  const [tecnicoParaOS, setTecnicoParaOS] = useState(null);

  // Modal de Confirmação de Exclusão de Técnico
  const [tecnicoParaExcluir, setTecnicoParaExcluir] = useState(null);
  const [excluindoTecnico, setExcluindoTecnico] = useState(false);

  // Carregar Técnicos
  const fetchTecnicos = async () => {
    try {
      setLoadingTecnicos(true);
      const res = await api.get('/gestao-solar/tecnicos');
      setTecnicos(res.data?.data?.tecnicos || []);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar a lista de técnicos.');
    } finally {
      setLoadingTecnicos(false);
    }
  };

  // Carregar Ordens de Serviço
  const fetchOrdens = async () => {
    try {
      setLoadingOrdens(true);
      const params = {};
      if (filtroStatusOS) params.status = filtroStatusOS;
      if (filtroPendenteDevolucao) params.pendente_devolucao = 'true';
      if (buscaOS) params.busca = buscaOS;

      const res = await api.get('/gestao-solar/ordens-servicos', { params });
      setOrdens(res.data?.data?.ordens || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar Ordens de Serviço.');
    } finally {
      setLoadingOrdens(false);
    }
  };

  const fetchKpis = async () => {
    try {
      const response = await api.get('/gestao-solar/ordens-servicos/kpis');
      setKpis(response.data?.data || {});
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTecnicos();
    fetchKpis();
  }, []);

  useEffect(() => {
    fetchOrdens();
  }, [filtroStatusOS, filtroPendenteDevolucao]);

  // Filtragem dos técnicos na visualização
  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter(t => {
      const matchBusca = !buscaTecnico.trim() || 
        t.nome.toLowerCase().includes(buscaTecnico.toLowerCase()) ||
        t.regiao.toLowerCase().includes(buscaTecnico.toLowerCase());

      const matchHomologado = filtroHomologado === '' || 
        (filtroHomologado === 'sim' && t.homologado) ||
        (filtroHomologado === 'nao' && !t.homologado);

      return matchBusca && matchHomologado;
    });
  }, [tecnicos, buscaTecnico, filtroHomologado]);

  // Ações de gerenciamento de técnicos
  const handleNovoTecnico = () => {
    setTecnicoEmEdicao(null);
    setModalTecnicoOpen(true);
  };

  const handleEditarTecnico = (tecnico) => {
    setTecnicoEmEdicao(tecnico);
    setModalTecnicoOpen(true);
  };

  const handleExcluirTecnico = (tecnico) => {
    setTecnicoParaExcluir(tecnico);
  };

  const handleConfirmarExcluirTecnico = async () => {
    if (!tecnicoParaExcluir) return;
    try {
      setExcluindoTecnico(true);
      const res = await api.delete(`/gestao-solar/tecnicos/${tecnicoParaExcluir.id}`);
      toast.success(res.data?.message || 'Técnico removido com sucesso.');
      setTecnicoParaExcluir(null);
      fetchTecnicos();
      fetchKpis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao excluir técnico.');
    } finally {
      setExcluindoTecnico(false);
    }
  };

  // Ações de Carga de Equipamentos
  const handleAbrirCarga = (tecnico) => {
    setTecnicoParaCarga(tecnico);
    setModalCargaOpen(true);
  };

  // Ações de Lançamento de O.S
  const handleAbrirLancamentoOS = (tecnico = null) => {
    setTecnicoParaOS(tecnico);
    setModalOSOpen(true);
  };

  // Atualizar Status da O.S
  const handleAtualizarStatusOS = async (osId, novoStatus) => {
    try {
      await api.patch(`/gestao-solar/ordens-servicos/${osId}/status`, { status: novoStatus });
      toast.success(`Status da O.S. atualizado para "${novoStatus}".`);
      fetchOrdens();
      fetchTecnicos(); // Recarrega técnicos pois pode ter havido baixa de estoque
      fetchKpis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar status da O.S.');
    }
  };

  // Confirmar Devolução de Equipamento (Logística Reversa)
  const handleConfirmarDevolucao = async (osId) => {
    try {
      await api.patch(`/gestao-solar/ordens-servicos/${osId}/confirmar-devolucao`);
      toast.success('Devolução de peça confirmada com sucesso!');
      fetchOrdens();
      fetchKpis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao confirmar devolução.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Principal da Tela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 rounded-2xl shadow-sm">
              <Users size={22} strokeWidth={2.4} />
            </span>
            <span>Técnicos Terceirizados & Serviços</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Gestão de prestadores externos, tabelas de valores individuais, equipamentos em campo e logística reversa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchTecnicos();
              fetchOrdens();
              fetchKpis();
            }}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl shadow-2xs transition-all cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={handleNovoTecnico}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Novo Técnico Terceirizado</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Técnicos Ativos */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl border border-teal-100">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Técnicos Ativos
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              {kpis.totalTecnicos}
            </span>
          </div>
        </div>

        {/* KPI 2: Homologados */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Técnicos Homologados
            </span>
            <span className="text-2xl font-black text-emerald-700 tracking-tight mt-0.5 block">
              {kpis.totalHomologados} / {kpis.totalTecnicos}
            </span>
          </div>
        </div>

        {/* KPI 3: Equipamentos em Campo */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-800 rounded-2xl border border-teal-100">
            <Box size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Equipamentos em Campo
            </span>
            <span className="text-2xl font-black text-teal-800 tracking-tight mt-0.5 block">
              {kpis.totalEquipamentos} un
            </span>
          </div>
        </div>

        {/* KPI 4: Devoluções Pendentes */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('ordens');
            setFiltroPendenteDevolucao(true);
          }}
          className={`p-4 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
            kpis.pendentesDevolucao > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400 hover:shadow-md'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className={`p-3 rounded-2xl ${
            kpis.pendentesDevolucao > 0 
              ? 'bg-amber-500 text-slate-950 animate-pulse' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <RotateCcw size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Devoluções Pendentes
            </span>
            <span className={`text-2xl font-black tracking-tight mt-0.5 block ${
              kpis.pendentesDevolucao > 0 ? 'text-amber-800' : 'text-slate-800'
            }`}>
              {kpis.pendentesDevolucao} {kpis.pendentesDevolucao === 1 ? 'peça' : 'peças'}
            </span>
          </div>
        </button>
      </div>

      {/* Navegação por Sub-Abas */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('tecnicos')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'tecnicos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users size={16} />
            <span>Técnicos & Estoque ({tecnicos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ordens')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSubTab === 'ordens'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench size={16} />
            <span>Ordens de Serviço ({ordens.length})</span>
            {kpis.pendentesDevolucao > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>
      </div>

      {/* CONTEÚDO SUB-ABA 1: CARDS DE TÉCNICOS & ESTOQUE */}
      {activeSubTab === 'tecnicos' && (
        <div className="space-y-4">
          {/* Barra de Busca de Técnicos */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={buscaTecnico}
                onChange={(e) => setBuscaTecnico(e.target.value)}
                placeholder="Buscar técnico por nome ou região..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filtroHomologado}
                onChange={(e) => setFiltroHomologado(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="">Todas as Situações</option>
                <option value="sim">Apenas Homologados ✅</option>
                <option value="nao">Em Homologação ⏳</option>
              </select>
            </div>
          </div>

          {/* Grid de Cards de Técnicos */}
          {loadingTecnicos ? (
            <div className="py-16 text-center text-slate-400 font-semibold">
              <span className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p className="text-xs">Carregando técnicos terceirizados...</p>
            </div>
          ) : tecnicosFiltrados.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="font-black text-slate-800 text-base">Nenhum técnico localizado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {buscaTecnico ? 'Tente ajustar os termos da sua pesquisa ou os filtros aplicados.' : 'Cadastre o primeiro técnico terceirizado da frota Solar para iniciar o controle.'}
              </p>
              {!buscaTecnico && (
                <button
                  type="button"
                  onClick={handleNovoTecnico}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Cadastrar Técnico
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tecnicosFiltrados.map(tecnico => (
                <CardTecnico
                  key={tecnico.id}
                  tecnico={tecnico}
                  onLancarOS={() => handleAbrirLancamentoOS(tecnico)}
                  onAdicionarCarga={() => handleAbrirCarga(tecnico)}
                  onEditar={() => handleEditarTecnico(tecnico)}
                  onExcluir={() => handleExcluirTecnico(tecnico)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO SUB-ABA 2: TABELA DE ORDENS DE SERVIÇO & DEVOLUÇÕES */}
      {activeSubTab === 'ordens' && (
        <TabelaOrdensServico
          ordens={ordens}
          loading={loadingOrdens}
          onAtualizarStatus={handleAtualizarStatusOS}
          onConfirmarDevolucao={handleConfirmarDevolucao}
          filtroPendenteDevolucao={filtroPendenteDevolucao}
          setFiltroPendenteDevolucao={setFiltroPendenteDevolucao}
          filtroStatus={filtroStatusOS}
          setFiltroStatus={setFiltroStatusOS}
          busca={buscaOS}
          setBusca={setBuscaOS}
          onNovaOS={() => handleAbrirLancamentoOS(null)}
        />
      )}

      {/* MODAIS DA TELA */}

      {/* Modal 1: Novo Técnico / Editar Técnico */}
      <ModalNovoTecnico
        isOpen={modalTecnicoOpen}
        onClose={() => setModalTecnicoOpen(false)}
        tecnicoParaEditar={tecnicoEmEdicao}
        onSuccess={() => {
          fetchTecnicos();
          fetchOrdens();
          fetchKpis();
        }}
      />

      {/* Modal 2: Carga de Equipamentos */}
      <ModalCargaEquipamentos
        isOpen={modalCargaOpen}
        onClose={() => setModalCargaOpen(false)}
        tecnico={tecnicoParaCarga}
        onSuccess={() => {
          fetchTecnicos();
          fetchKpis();
        }}
      />

      {/* Modal 3: Lançamento de Ordem de Serviço */}
      <ModalLancamentoOS
        isOpen={modalOSOpen}
        onClose={() => setModalOSOpen(false)}
        tecnicos={tecnicos}
        tecnicoPreSelecionado={tecnicoParaOS}
        onSuccess={() => {
          fetchOrdens();
          fetchTecnicos();
          fetchKpis();
        }}
      />

      {/* Modal 4: Confirmação de Exclusão de Técnico */}
      <ConfirmModal
        isOpen={Boolean(tecnicoParaExcluir)}
        title="Excluir Técnico Terceirizado"
        message={
          tecnicoParaExcluir
            ? `Deseja realmente remover o cadastro de "${tecnicoParaExcluir.nome}"? O histórico de ordens de serviço e movimentações será preservado.`
            : ''
        }
        confirmLabel={excluindoTecnico ? 'Excluindo...' : 'Excluir Técnico'}
        cancelLabel="Cancelar"
        onConfirm={handleConfirmarExcluirTecnico}
        onCancel={() => !excluindoTecnico && setTecnicoParaExcluir(null)}
        danger={true}
      />
    </div>
  );
}
