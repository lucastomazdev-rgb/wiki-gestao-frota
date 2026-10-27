import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import FalhasHeaderActions from './FalhasHeaderActions';
import FalhasKpiCards from './FalhasKpiCards';
import FalhasFiltersBar from './FalhasFiltersBar';
import FalhasTable from './FalhasTable';
import FalhasPagination from './FalhasPagination';
import ModalEditarTratativa from './ModalEditarTratativa';
import ModalBaixarFalhasInfo from './ModalBaixarFalhasInfo';
import ModalTratativaMassa from './ModalTratativaMassa';
import FalhasTabs from './FalhasTabs';
import FalhasContatoTab from './FalhasContatoTab';

const ModalImportarFalhas = lazy(() => import('./ModalImportarFalhas'));
const ModalNovoAgendamento = lazy(() => import('../agendamentos/ModalNovoAgendamento'));

export default function FalhasView() {
  // Lotes e histórico
  const [lotes, setLotes] = useState([]);
  const [loteAtivo, setLoteAtivo] = useState(null);

  // Sub-aba ativa ('lista' | 'contato')
  const [abaAtiva, setAbaAtiva] = useState('lista');

  // Dados da listagem
  const [registros, setRegistros] = useState([]);
  const [kpis, setKpis] = useState({
    total: 0,
    novas_falhas: 0,
    recorrentes: 0,
    pendentes: 0,
    bateria_baixa: 0
  });
  const [filtrosDisponiveis, setFiltrosDisponiveis] = useState({
    ufs: [],
    unidades: [],
    tipos_veiculo: []
  });

  // Filtros ativos
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const filtroPlacaDebounced = useDebounce(filtroPlaca, 300);
  const [filtroUF, setFiltroUF] = useState('TODOS');
  const [filtroUnidade, setFiltroUnidade] = useState('TODAS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroTipoFalha, setFiltroTipoFalha] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroBateriaBaixa, setFiltroBateriaBaixa] = useState(false);
  const [ordenacao, setOrdenacao] = useState('unidade_asc');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const ITENS_POR_PAGINA = 20;

  // Estados de loading
  const [carregando, setCarregando] = useState(true);

  // Modais
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBaixarModalOpen, setIsBaixarModalOpen] = useState(false);
  const [isMassaModalOpen, setIsMassaModalOpen] = useState(false);
  const [registroParaEditar, setRegistroParaEditar] = useState(null);

  // Modal de criação de agendamento por placa da falha
  const [agendamentoModalData, setAgendamentoModalData] = useState(null);
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);

  const handleAbrirAgendamento = (registro) => {
    setAgendamentoModalData({
      falha_id: registro.id,
      placa: registro.placa,
      unidade: registro.unidade,
      uf: registro.uf,
      tipo_veiculo: registro.tipo_veiculo,
      numero_os: registro.ordem_servico,
      servico: 'Manutenção'
    });
    setIsAgendamentoModalOpen(true);
  };

  const handleAgendamentoSucesso = (novoAgendamento) => {
    if (novoAgendamento?.placa) {
      const pNorm = String(novoAgendamento.placa).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      setRegistros((prev) =>
        prev.map((r) => {
          const rNorm = String(r.placa).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          if (rNorm === pNorm) {
            return {
              ...r,
              status_tratativa: 'Agendado Manutenção',
              ordem_servico: novoAgendamento.numero_os || r.ordem_servico,
              agendamento: {
                id: novoAgendamento.id,
                status: novoAgendamento.status || 'Agendado',
                data_agendamento: novoAgendamento.data_agendamento || null,
                servico: novoAgendamento.servico || 'Manutenção',
                tipo_tecnico: novoAgendamento.tipo_tecnico,
                nome_tecnico: novoAgendamento.nome_tecnico,
                numero_os: novoAgendamento.numero_os,
                criado_em: new Date().toISOString()
              }
            };
          }
          return r;
        })
      );
    }
    carregarFalhas(null, false);
  };

  const abortControllerRef = useRef(null);

  // Carregar dados das falhas do backend
  const carregarFalhas = useCallback(async (loteIdEspecifico = null, resetPage = false) => {
    try {
      setCarregando(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const pageToUse = resetPage ? 1 : paginaAtual;
      if (resetPage) setPaginaAtual(1);

      const targetLoteId = loteIdEspecifico || loteAtivo?.id || 'latest';

      let sortBy = 'unidade';
      let sortDir = 'asc';
      if (ordenacao === 'placa_asc') {
        sortBy = 'placa';
        sortDir = 'asc';
      } else if (ordenacao === 'ultima_desc') {
        sortBy = 'ultima_transmissao';
        sortDir = 'desc';
      }

      const params = {
        lote_id: targetLoteId,
        page: pageToUse,
        limit: ITENS_POR_PAGINA,
        sort_by: sortBy,
        sort_dir: sortDir
      };

      if (filtroPlacaDebounced) params.busca = filtroPlacaDebounced;
      if (filtroUF !== 'TODOS') params.uf = filtroUF;
      if (filtroUnidade !== 'TODAS') params.unidade = filtroUnidade;
      if (filtroTipo !== 'TODOS') params.tipo_veiculo = filtroTipo;
      if (filtroTipoFalha !== 'TODOS') params.tipo_falha = filtroTipoFalha;
      if (filtroStatus !== 'TODOS') params.status = filtroStatus;
      if (filtroBateriaBaixa) params.bateria_baixa = 'true';

      const res = await api.get('/gestao-solar/falhas', {
        params,
        signal: controller.signal
      });

      const { data } = res.data;
      setRegistros(data?.registros || []);
      setLotes(data?.lotes || []);
      setLoteAtivo(data?.lote || null);
      setKpis(data?.kpis || {
        total: 0,
        novas_falhas: 0,
        recorrentes: 0,
        pendentes: 0,
        bateria_baixa: 0
      });
      setTotalRegistros(data?.pagination?.total || 0);
      setTotalPaginas(data?.pagination?.totalPages || 1);
      if (data?.filtros_disponiveis) {
        setFiltrosDisponiveis(data.filtros_disponiveis);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        toast.error('Erro ao carregar dados das falhas.');
      }
    } finally {
      setCarregando(false);
    }
  }, [
    loteAtivo?.id,
    paginaAtual,
    ordenacao,
    filtroPlacaDebounced,
    filtroUF,
    filtroUnidade,
    filtroTipo,
    filtroTipoFalha,
    filtroStatus,
    filtroBateriaBaixa
  ]);

  // Disparar busca ao alterar filtros
  useEffect(() => {
    carregarFalhas();
  }, [carregarFalhas]);

  // Handler de troca de lote (data histórica)
  const handleSelectLote = (novoLoteId) => {
    const loteEncontrado = lotes.find((l) => l.id === novoLoteId);
    if (loteEncontrado) {
      setLoteAtivo(loteEncontrado);
      carregarFalhas(novoLoteId, true);
    }
  };

  // Handler de sucesso ao importar nova planilha
  const handleImportSuccess = (novoLote) => {
    if (novoLote) {
      setLoteAtivo(novoLote);
    }
    setFiltroPlaca('');
    setFiltroUF('TODOS');
    setFiltroUnidade('TODAS');
    setFiltroTipo('TODOS');
    setFiltroTipoFalha('TODOS');
    setFiltroStatus('TODOS');
    carregarFalhas(novoLote?.id || 'latest', true);
  };

  // Handler de sucesso ao atualizar tratativa
  const handleUpdateRegistroSuccess = (regAtualizado) => {
    if (!regAtualizado) return;
    setRegistros((prev) =>
      prev.map((r) => (r.id === regAtualizado.id ? { ...r, ...regAtualizado } : r))
    );
  };

  // Resetar página ao mudar filtros locais
  const handleFilterChange = (setter, value) => {
    setPaginaAtual(1);
    setter(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Sub-Abas de Navegação (Lista de Falhas vs Contato) */}
      <FalhasTabs abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} />

      {/* Conteúdo da Sub-Aba Contato */}
      {abaAtiva === 'contato' && (
        <FalhasContatoTab
          loteAtivo={loteAtivo}
          onAtualizarFalhas={() => carregarFalhas(null, false)}
        />
      )}

      {/* Conteúdo da Sub-Aba Lista de Falhas */}
      {abaAtiva === 'lista' && (
        <>
          {/* 2. Cards de KPIs */}
          <FalhasKpiCards
            totalFalhas={kpis.total}
            novasFalhas={kpis.novas_falhas}
            recorrentes={kpis.recorrentes}
            pendentesContato={kpis.pendentes}
            totalBateriaBaixa={kpis.bateria_baixa}
            filtroBateriaBaixa={filtroBateriaBaixa}
            onToggleBateriaBaixa={() => {
              setFiltroBateriaBaixa(prev => !prev);
              setPaginaAtual(1);
            }}
          />

          {/* 3. Barra de Filtros */}
          <FalhasFiltersBar
            filtroPlaca={filtroPlaca}
            setFiltroPlaca={(v) => handleFilterChange(setFiltroPlaca, v)}
            ufsDisponiveis={filtrosDisponiveis.ufs}
            filtroUF={filtroUF}
            setFiltroUF={(v) => handleFilterChange(setFiltroUF, v)}
            unidadesDisponiveis={filtrosDisponiveis.unidades}
            filtroUnidade={filtroUnidade}
            setFiltroUnidade={(v) => handleFilterChange(setFiltroUnidade, v)}
            tiposDisponiveis={filtrosDisponiveis.tipos_veiculo}
            filtroTipo={filtroTipo}
            setFiltroTipo={(v) => handleFilterChange(setFiltroTipo, v)}
            filtroTipoFalha={filtroTipoFalha}
            setFiltroTipoFalha={(v) => handleFilterChange(setFiltroTipoFalha, v)}
            filtroStatus={filtroStatus}
            setFiltroStatus={(v) => handleFilterChange(setFiltroStatus, v)}
            filtroBateriaBaixa={filtroBateriaBaixa}
            setFiltroBateriaBaixa={(v) => {
              setFiltroBateriaBaixa(v);
              setPaginaAtual(1);
            }}
            ordenacao={ordenacao}
            setOrdenacao={setOrdenacao}
          />

          {/* 4. Ações da Extração & Data (entre Filtros e Tabela de Placas) */}
          <FalhasHeaderActions
            lotes={lotes}
            loteAtivo={loteAtivo}
            onSelectLote={handleSelectLote}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenBaixarModal={() => setIsBaixarModalOpen(true)}
            onOpenMassaModal={() => setIsMassaModalOpen(true)}
            carregando={carregando}
          />

          {/* 5. Tabela de Registros com Badges de Nova vs Recorrente e Coluna de Agendamento */}
          <FalhasTable
            registros={registros}
            onEditRegistro={(reg) => setRegistroParaEditar(reg)}
            onAbrirAgendamento={handleAbrirAgendamento}
            carregando={carregando}
          />

          {/* 6. Paginação */}
          <FalhasPagination
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            itensPorPagina={ITENS_POR_PAGINA}
            onPageChange={setPaginaAtual}
          />
        </>
      )}

      {/* Modais */}
      {isImportModalOpen && (
        <Suspense fallback={null}>
          <ModalImportarFalhas
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSuccess}
            lotesExistentes={lotes}
          />
        </Suspense>
      )}

      <ModalEditarTratativa
        isOpen={Boolean(registroParaEditar)}
        onClose={() => setRegistroParaEditar(null)}
        registro={registroParaEditar}
        onUpdateSuccess={handleUpdateRegistroSuccess}
      />

      <ModalBaixarFalhasInfo
        isOpen={isBaixarModalOpen}
        onClose={() => setIsBaixarModalOpen(false)}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Modal Tratativa em Massa */}
      <ModalTratativaMassa
        isOpen={isMassaModalOpen}
        onClose={() => setIsMassaModalOpen(false)}
        loteAtivo={loteAtivo}
        unidadesDisponiveis={filtrosDisponiveis.unidades}
        onSucesso={() => carregarFalhas()}
      />

      {/* Modal Novo Agendamento acionado por placa de Falha */}
      {isAgendamentoModalOpen && (
        <Suspense fallback={null}>
          <ModalNovoAgendamento
            isOpen={isAgendamentoModalOpen}
            onClose={() => {
              setIsAgendamentoModalOpen(false);
              setAgendamentoModalData(null);
            }}
            dadosIniciais={agendamentoModalData}
            onSuccess={handleAgendamentoSucesso}
          />
        </Suspense>
      )}
    </div>
  );
}
