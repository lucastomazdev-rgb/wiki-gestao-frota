import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, X, Upload, WifiOff, AlertTriangle, CheckCircle2, Filter, ChevronDown, Download, ListChecks, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, Building2, ServerCrash, BatteryWarning, MapPin, Truck, CheckSquare, MessageCircle, Clock } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import ModalInstrucoesImportacaoFalhas from './ModalInstrucoesImportacaoFalhas';
import ContatosFalhas from './ContatosFalhas';
import LogContatos from './LogContatos';
import FalhasTabs from './falhas/FalhasTabs';
import FalhasKpiCards from './falhas/FalhasKpiCards';
import FalhasFiltersBar from './falhas/FalhasFiltersBar';
import FalhasListView from './falhas/FalhasListView';
import FalhasPagination from './falhas/FalhasPagination';
import { useFalhasDerivedData } from './falhas/useFalhasDerivedData';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useModelosLookup, useUnidadesLookup } from '../hooks/useLookups';
import { useDebounce } from '../hooks/useDebounce';
import { buildSyncPayload, formatSyncReportMessage } from '../utils/syncImport';

const STATUS_AGENDAMENTO_FALLBACK = 'Sem agendamentos';

const normalizarPlaca = (placa) => String(placa || '').trim().toUpperCase();

const formatarDataCurta = (valor) => {
  if (!valor) return '';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const classeStatusAgendamento = (status) => {
  if (status === 'Realizado') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'Agendado') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (status === 'Aguardando Data') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const subtextoAgendamento = (falha) => {
  const partes = [];
  const dataFormatada = formatarDataCurta(falha?.dataAgendamento);
  if (dataFormatada) partes.push(dataFormatada);
  if (falha?.osAgendamento) partes.push(`O.S. #${falha.osAgendamento}`);
  return partes.join(' | ');
};

export default function Falhas() {
  const { getNomePerfil } = useAuth();
  const isSupervisor = getNomePerfil() === 'Supervisor';
  const [falhas, setFalhas] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('lista'); // 'lista' | 'contatos' | 'historico'
  
  // --- FILTROS ---
  const [filtroUF, setFiltroUF] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [ordenacaoFalhas, setOrdenacaoFalhas] = useState('unidade_asc');
  const filtroPlacaDebounced = useDebounce(filtroPlaca, 300);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 20;
  const applyFilterWithPageReset = useCallback((setter, value) => {
    setPaginaAtual(1);
    setter(value);
  }, []);

  const sortParamsFalhas = useMemo(() => (
    ordenacaoFalhas === 'ultima_desc'
      ? { sort_by: 'ultima_transmissao', sort_dir: 'desc' }
      : { sort_by: 'unidade', sort_dir: 'asc' }
  ), [ordenacaoFalhas]);

  // Modal de Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null, placa: '', displayUnidade: '', displayUf: '', displayTipo: '',
    bateria: '', tratativa: '', ordem_servico: '', data_contato: ''
  });

  // Modal Tratativa em Massa
  const [isModalMassaOpen, setIsModalMassaOpen] = useState(false);
  const [massaUnidadeSelecionada, setMassaUnidadeSelecionada] = useState('');
  const [massaPlacasDisponiveis, setMassaPlacasDisponiveis] = useState([]);
  const [massaPlacasSelecionadas, setMassaPlacasSelecionadas] = useState([]);
  const [massaFormData, setMassaFormData] = useState({ tratativa: 'Pendente de Contato', data_contato: '' });
  const [isSavingMassa, setIsSavingMassa] = useState(false);
  const [isLoadingMassaPlacas, setIsLoadingMassaPlacas] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Modal de Importação com Instruções
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncConfig, setSyncConfig] = useState({ tipoSync: 'full', unidadeId: '', modoSync: 'incremental', confirmarDelecaoAusentes: false, resetContatos: true });

  const [ultimaImportacao, setUltimaImportacao] = useState(null);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginasBackend, setTotalPaginasBackend] = useState(1);
  const [kpisFalhas, setKpisFalhas] = useState(null);
  const [ufsFiltroDisponiveis, setUfsFiltroDisponiveis] = useState([]);
  const [unidadesFiltroDisponiveis, setUnidadesFiltroDisponiveis] = useState([]);

  const { data: unidadesLookup = [] } = useUnidadesLookup();
  const { data: modelosLookup = [] } = useModelosLookup();

  const fileInputRef = useRef(null);
  const cacheResumoAgendamentoRef = useRef(new Map());
  const requestFalhasRef = useRef({ id: 0, controller: null });
  const requestResumoRef = useRef({ id: 0, controller: null });
  const [resumoAgendamentoPorPlaca, setResumoAgendamentoPorPlaca] = useState({});

  const carregarUltimaImportacao = useCallback(async () => {
    try {
      const res = await api.get('/configuracoes/ultima_importacao_falhas');
      const valor = res.data?.valor;
      if (valor && valor !== 'null') {
        setUltimaImportacao(valor);
        // Mantém o localStorage sincronizado para o ContatosFalhas que ainda o lê
        localStorage.setItem('ultimaImportacaoFalhas', valor);
      }
    } catch {
      // Silencioso — fallback para o localStorage se houver erro de rede
      const fallback = localStorage.getItem('ultimaImportacaoFalhas');
      if (fallback) setUltimaImportacao(fallback);
    }
  }, []);

  useEffect(() => {
    carregarUltimaImportacao();
  }, [carregarUltimaImportacao]);

  const carregarFiltrosDisponiveis = useCallback(async () => {
    try {
      const { data } = await api.get('/falhas/filtros');
      setUfsFiltroDisponiveis(Array.isArray(data?.ufs) ? data.ufs : []);
      setUnidadesFiltroDisponiveis(Array.isArray(data?.unidades) ? data.unidades : []);
    } catch {
      setUfsFiltroDisponiveis([]);
      setUnidadesFiltroDisponiveis([]);
      toast.error("Erro ao carregar filtros de unidade/UF.");
    }
  }, []);

  useEffect(() => {
    carregarFiltrosDisponiveis();
  }, [carregarFiltrosDisponiveis]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestFalhasRef.current.id + 1;
    requestFalhasRef.current.id = requestId;
    requestFalhasRef.current.controller?.abort();
    requestFalhasRef.current.controller = controller;

    carregarDados({ requestId, signal: controller.signal });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual, filtroUF, filtroUnidade, filtroTipo, filtroStatus, filtroPlacaDebounced, ordenacaoFalhas]);

  const {
    batCam,
    batMoto,
    batVid,
    chaveCacheResumo,
    emTratativa,
    getPaginasExibidas,
    indexOfFirstItem,
    indexOfLastItem,
    itensAtuais,
    pendentesContato,
    placasDaPagina,
    tiposUnicos,
    totalBateriaBaixa,
    totalFalhas,
    totalPaginas,
    ufsUnicas,
    unidadesUnicas,
    unidadesUnicasMassa,
    unidadesUnicasObjs
  } = useFalhasDerivedData({
    falhas,
    kpisFalhas,
    totalRegistros,
    totalPaginasBackend,
    paginaAtual,
    itensPorPagina: ITENS_POR_PAGINA,
    ufsFiltroDisponiveis,
    unidadesFiltroDisponiveis,
    filtroUF,
    modelosLookup,
    unidadesLookup,
    normalizarPlaca
  });

  useEffect(() => {
    if (filtroUF && !ufsUnicas.includes(filtroUF)) {
      applyFilterWithPageReset(setFiltroUF, '');
    }
  }, [applyFilterWithPageReset, filtroUF, ufsUnicas]);

  useEffect(() => {
    if (!filtroUnidade) return;
    if (unidadesUnicas.includes(filtroUnidade)) return;
    applyFilterWithPageReset(setFiltroUnidade, '');
  }, [applyFilterWithPageReset, filtroUnidade, unidadesUnicas]);

  const carregarDados = async ({ requestId, signal } = {}) => {
    const currentRequestId = requestId ?? (requestFalhasRef.current.id + 1);
    if (requestId == null) {
      requestFalhasRef.current.id = currentRequestId;
      requestFalhasRef.current.controller?.abort();
      const controller = new AbortController();
      requestFalhasRef.current.controller = controller;
      signal = controller.signal;
    }

    try {
      const params = {
        paginated: true,
        page: paginaAtual,
        limit: ITENS_POR_PAGINA,
        ...sortParamsFalhas,
        uf: filtroUF || undefined,
        unidade: filtroUnidade || undefined,
        tipo: filtroTipo || undefined,
        tratativa: filtroStatus || undefined,
        placa: filtroPlacaDebounced || undefined
      };

      const [response, kpisResponse] = await Promise.all([
        api.get('/falhas', { params, signal }),
        api.get('/falhas/kpis', { params, signal })
      ]);

      if (requestFalhasRef.current.id !== currentRequestId) return;

      setFalhas(response.data?.data || []);
      setTotalRegistros(response.data?.pagination?.total || 0);
      setTotalPaginasBackend(response.data?.pagination?.total_pages || 1);
      setKpisFalhas(kpisResponse.data || null);
      cacheResumoAgendamentoRef.current.clear();
      setResumoAgendamentoPorPlaca({});
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') return;
      toast.error("Erro ao carregar falhas do servidor.");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Sincronizando falhas com o banco de dados. Aguarde...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const payload = {
            ...buildSyncPayload(results.data, syncConfig),
            reset_contatos: !!syncConfig.resetContatos
          };
          const response = await api.post('/falhas/sync', payload);
          // ✅ Recarrega o timestamp do banco (o backend já salvou durante o sync)
          await carregarUltimaImportacao();
          toast.success(formatSyncReportMessage('Lista de falhas atualizada', response.data?.relatorio), { id: toastId });
          carregarDados();
        } catch (error) {
          toast.error(error.response?.data?.erro || "Erro ao importar planilha.", { id: toastId });
        }
      }
    });
    event.target.value = null;
    setIsImportModalOpen(false);
  };

  const handleSalvarEdicao = async () => {
    try {
      await api.put(`/falhas/${formData.id}`, {
        tratativa: formData.tratativa,
        ordem_servico: formData.ordem_servico || null,
        data_contato: formData.data_contato || null,
        bateria: formData.bateria || null
      });
      
      toast.success("Tratativa atualizada com sucesso!");
      setIsModalOpen(false);
      carregarDados();
    } catch {
      toast.error("Erro ao atualizar a falha.");
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/falhas/${id}`);
      toast.success('Falha removida com sucesso!');
      carregarDados();
    } catch {
      toast.error('Erro ao excluir falha.');
    }
  };

  // Prepara as unidades em formato objeto para o Modal de Importação ler corretamente (id e nome_unidade)
  // No Falhas o filtro de array simples não tem ID, mas pelo nome conseguimos passar para o backend buscar
  // Porém o backend sync falhas/sync espera um unidade_id. O certo é usar falhas.map(f => f.unidades_clientes)
  useEffect(() => {
    let cancelled = false;

    const carregarPlacasMassa = async () => {
      if (!isModalMassaOpen || !massaUnidadeSelecionada) {
        setMassaPlacasDisponiveis([]);
        setMassaPlacasSelecionadas([]);
        return;
      }

      setIsLoadingMassaPlacas(true);
      setMassaPlacasSelecionadas([]);
      try {
        const { data } = await api.get('/falhas', {
          params: {
            unidade: massaUnidadeSelecionada
          }
        });
        const lista = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        if (!cancelled) {
          setMassaPlacasDisponiveis(lista);
        }
      } catch {
        if (!cancelled) {
          setMassaPlacasDisponiveis([]);
          toast.error('Erro ao carregar placas da unidade para tratativa em massa.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMassaPlacas(false);
        }
      }
    };

    carregarPlacasMassa();

    return () => {
      cancelled = true;
    };
  }, [isModalMassaOpen, massaUnidadeSelecionada]);

  const fecharModalMassa = () => {
    setIsModalMassaOpen(false);
    setMassaUnidadeSelecionada('');
    setMassaPlacasDisponiveis([]);
    setMassaPlacasSelecionadas([]);
  };

  const handleAbrirModalMassa = () => {
    setMassaUnidadeSelecionada('');
    setMassaPlacasDisponiveis([]);
    setMassaPlacasSelecionadas([]);
    setIsModalMassaOpen(true);
  };

  const handleExportarExcel = async () => {
    if (totalRegistros === 0) {
      toast.error('Nenhum dado para exportar.');
      return;
    }

    const params = {
      ...sortParamsFalhas,
      uf: filtroUF || undefined,
      unidade: filtroUnidade || undefined,
      tipo: filtroTipo || undefined,
      tratativa: filtroStatus || undefined,
      placa: filtroPlaca || undefined
    };
    const { data } = await api.get('/falhas', { params });
    const baseExport = Array.isArray(data) ? data : [];

    const dataToExport = baseExport.map(f => ({
      'Placa': f.placa || '',
      'Tipo Veículo': f.modelos_rastreadores?.tipo_veiculo || '',
      'Unidade': f.unidades_clientes?.nome_unidade || '',
      'UF': f.unidades_clientes?.uf || '',
      'Última Transmissão': f.ultima_transmissao ? new Date(f.ultima_transmissao).toLocaleString('pt-BR', {timeZone: 'UTC'}) : '',
      'Bateria (V)': f.bateria || '',
      'Tratativa': f.tratativa || 'Pendente de Contato',
      'Data Contato': f.data_contato ? new Date(f.data_contato).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '',
      'O.S.': f.ordem_servico || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio Falhas');
    XLSX.writeFile(workbook, `Frota_Falhas_${new Date().getTime()}.xlsx`);
    toast.success(`${baseExport.length} registros exportados.`);
  };

  const handleSalvarMassa = async () => {
    if (massaPlacasSelecionadas.length === 0) return toast.error('Nenhum veículo selecionado no grid da direita!');
    setIsSavingMassa(true);
    const toastId = toast.loading(`Atualizando ${massaPlacasSelecionadas.length} veículo(s)...`);
    try {
      await Promise.all(massaPlacasSelecionadas.map(placa => 
        api.put(`/falhas/${placa.id}`, {
          tratativa: massaFormData.tratativa,
          data_contato: massaFormData.data_contato || null
        })
      ));
      toast.success("Múltiplas tratativas atualizadas e registradas!", { id: toastId });
      fecharModalMassa();
      carregarDados();
    } catch {
      toast.error("Erro ao atualizar lote.", { id: toastId });
    } finally {
      setIsSavingMassa(false);
    }
  };

  const moverParaDireita = (placa) => {
    setMassaPlacasDisponiveis(prev => prev.filter(p => p.id !== placa.id));
    setMassaPlacasSelecionadas(prev => [...prev, placa]);
  };
  const moverParaEsquerda = (placa) => {
    setMassaPlacasSelecionadas(prev => prev.filter(p => p.id !== placa.id));
    setMassaPlacasDisponiveis(prev => [...prev, placa]);
  };
  const moverTodasDireita = () => {
    setMassaPlacasSelecionadas(prev => [...prev, ...massaPlacasDisponiveis]);
    setMassaPlacasDisponiveis([]);
  };
  const moverTodasEsquerda = () => {
    setMassaPlacasDisponiveis(prev => [...prev, ...massaPlacasSelecionadas]);
    setMassaPlacasSelecionadas([]);
  };

  const abrirModalEditar = (falha) => {
    setFormData({
      id: falha.id,
      placa: falha.placa,
      displayUnidade: falha.unidades_clientes?.nome_unidade,
      displayUf: falha.unidades_clientes?.uf,
      displayTipo: falha.modelos_rastreadores?.tipo_veiculo,
      bateria: falha.bateria || '',
      tratativa: falha.tratativa || 'Pendente de Contato',
      ordem_servico: falha.ordem_servico || '',
      data_contato: falha.data_contato ? falha.data_contato.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (abaAtiva !== 'lista') return;

    if (placasDaPagina.length === 0) {
      setResumoAgendamentoPorPlaca({});
      return;
    }

    const cache = cacheResumoAgendamentoRef.current.get(chaveCacheResumo);
    if (cache) {
      setResumoAgendamentoPorPlaca(cache);
      return;
    }

    const controller = new AbortController();
    const requestId = requestResumoRef.current.id + 1;
    requestResumoRef.current.id = requestId;
    requestResumoRef.current.controller?.abort();
    requestResumoRef.current.controller = controller;

    const carregarResumoAgendamentos = async () => {
      try {
        const response = await api.get('/agendamentos/resumo-por-placas', {
          params: { placas: placasDaPagina.join(',') },
          signal: controller.signal
        });
        const payload = response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
          ? response.data
          : {};

        if (requestResumoRef.current.id !== requestId) return;
        cacheResumoAgendamentoRef.current.set(chaveCacheResumo, payload);
        setResumoAgendamentoPorPlaca(payload);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') return;
        if (requestResumoRef.current.id !== requestId) return;

        const fallbackResumo = placasDaPagina.reduce((acc, placa) => {
          acc[placa] = {
            placa,
            status: STATUS_AGENDAMENTO_FALLBACK,
            data_agendamento: null,
            ordem_servico: null
          };
          return acc;
        }, {});

        cacheResumoAgendamentoRef.current.set(chaveCacheResumo, fallbackResumo);
        setResumoAgendamentoPorPlaca(fallbackResumo);
      }
    };

    carregarResumoAgendamentos();

    return () => {
      controller.abort();
    };
  }, [abaAtiva, chaveCacheResumo, placasDaPagina]);

  const itensAtuaisComResumo = useMemo(() => itensAtuais.map((falha) => {
    const placaNormalizada = normalizarPlaca(falha?.placa);
    const resumo = resumoAgendamentoPorPlaca?.[placaNormalizada] || null;

    return {
      ...falha,
      statusAgendamento: resumo?.status || STATUS_AGENDAMENTO_FALLBACK,
      dataAgendamento: resumo?.data_agendamento || null,
      osAgendamento: resumo?.ordem_servico || null
    };
  }), [itensAtuais, resumoAgendamentoPorPlaca]);

  // Lógica de Paginação Avançada

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">

      {/* ================================================================ */}
      {/* NAVEGAÇÃO DE ABAS */}
      {/* ================================================================ */}
            <FalhasTabs abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} />

      {abaAtiva === 'contatos' && <ContatosFalhas />}

      {abaAtiva === 'historico' && <LogContatos />}

      {abaAtiva === 'lista' && (
        <div className="space-y-6">
          <FalhasKpiCards
            totalFalhas={totalFalhas}
            pendentesContato={pendentesContato}
            emTratativa={emTratativa}
            totalBateriaBaixa={totalBateriaBaixa}
            batCam={batCam}
            batMoto={batMoto}
            batVid={batVid}
          />

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 flex flex-col w-full relative z-20">
            <FalhasFiltersBar
              filtroPlaca={filtroPlaca}
              setFiltroPlaca={(value) => applyFilterWithPageReset(setFiltroPlaca, value)}
              ufsUnicas={ufsUnicas}
              filtroUF={filtroUF}
              setFiltroUF={(value) => applyFilterWithPageReset(setFiltroUF, value)}
              unidadesUnicas={unidadesUnicas}
              filtroUnidade={filtroUnidade}
              setFiltroUnidade={(value) => applyFilterWithPageReset(setFiltroUnidade, value)}
              tiposUnicos={tiposUnicos}
              filtroTipo={filtroTipo}
              setFiltroTipo={(value) => applyFilterWithPageReset(setFiltroTipo, value)}
              filtroStatus={filtroStatus}
              setFiltroStatus={(value) => applyFilterWithPageReset(setFiltroStatus, value)}
              ordenacaoFalhas={ordenacaoFalhas}
              setOrdenacaoFalhas={(value) => applyFilterWithPageReset(setOrdenacaoFalhas, value)}
              handleAbrirModalMassa={handleAbrirModalMassa}
              handleExportarExcel={handleExportarExcel}
              isSupervisor={isSupervisor}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              setIsImportModalOpen={setIsImportModalOpen}
              ultimaImportacao={ultimaImportacao}
            />

            <FalhasListView
              itensAtuaisComResumo={itensAtuaisComResumo}
              abrirModalEditar={abrirModalEditar}
              handleDelete={handleDelete}
              classeStatusAgendamento={classeStatusAgendamento}
              subtextoAgendamento={subtextoAgendamento}
            />

            <FalhasPagination
              totalPaginas={totalPaginas}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              totalRegistros={totalRegistros}
              paginaAtual={paginaAtual}
              getPaginasExibidas={getPaginasExibidas}
              onPrev={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
              onNext={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
              onGoTo={(p) => setPaginaAtual(p)}
            />
          </div>
        </div>
      )}


      <ModalInstrucoesImportacaoFalhas 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        unidades={unidadesUnicasObjs}
        onConfirm={({ tipoSync, unidadeId, modoSync, confirmarDelecaoAusentes, resetContatos }) => {
          setSyncConfig({ tipoSync, unidadeId, modoSync, confirmarDelecaoAusentes, resetContatos });
          setTimeout(() => {
            fileInputRef.current?.click();
          }, 100);
        }}
      />

      {/* Modal de Edição Unitária Modernizado */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Edit size={18} /></div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">Registro de Falha</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex justify-between items-center shadow-inner">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Veículo Selecionado</span>
                  <span className="text-lg font-black text-slate-800 tracking-wide block leading-none">{formData.placa}</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1.5 block uppercase tracking-wider">{formData.displayUnidade} • {formData.displayUf}</span>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-rose-500">
                  <WifiOff size={28} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status de Tratativa</label>
                <select value={formData.tratativa} onChange={e => setFormData({...formData, tratativa: e.target.value})} className="w-full h-11 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.8rem_center] bg-no-repeat pl-4 pr-10">
                  <option value="Pendente de Contato">Pendente de Contato</option>
                  <option value="Aguardando Retorno">Aguardando Retorno</option>
                  <option value="Agendado Manutenção">Agendado Manutenção</option>
                  <option value="Aguardando Técnico">Aguardando Técnico</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Parado">Parado</option>
                  <option value="Retirada em Aberto">Retirada em Aberto</option>
                  <option value="Voltou a comunicar">Voltou a comunicar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Data do Último Contato</label>
                  <input type="date" value={formData.data_contato} onChange={e => setFormData({...formData, data_contato: e.target.value})} className="w-full h-11 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700 transition-all cursor-pointer px-4" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ordem de Serviço (O.S.)</label>
                  <input type="number" value={formData.ordem_servico} onChange={e => setFormData({...formData, ordem_servico: e.target.value})} placeholder="Número da O.S." className="w-full h-11 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700 transition-all px-4 placeholder:text-slate-300 placeholder:font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nível de Bateria (Voltagem)</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-xs uppercase">v</div>
                   <input type="number" step="0.01" value={formData.bateria} onChange={e => setFormData({...formData, bateria: e.target.value})} placeholder="Ex: 12.80" className="w-full h-11 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700 transition-all pl-8 pr-4 placeholder:text-slate-300 placeholder:font-medium" />
                </div>
                {formData.bateria && (
                   <p className={`mt-2 text-[10px] font-black uppercase tracking-wider ml-1 ${parseFloat(formData.bateria) < 11.5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                     Status da Bateria: {parseFloat(formData.bateria) < 11.5 ? 'Nível Crítico ⚠️' : 'Nível Saudável ✅'}
                   </p>
                )}
              </div>

            </div>
            <div className="flex justify-end p-5 border-t border-slate-100 bg-slate-50/50 gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all text-[10px] cursor-pointer">Descartar</button>
              <button onClick={handleSalvarEdicao} className="px-6 py-2.5 bg-rose-600 font-black uppercase tracking-widest text-[10px] text-white rounded-xl hover:bg-rose-700 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer">Salvar Alterações</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal Tratativa em Massa Modernizado */}
      {isModalMassaOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl border border-slate-200 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl"><ListChecks size={22} /></div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">Alteração em Massa</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1.5">Gerenciador de Múltiplos Veículos</p>
                </div>
              </div>
              <button onClick={fecharModalMassa} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/30">
              
              {/* Painel de Configuração Rápida */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm shrink-0">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">1. Selecionar Unidade</label>
                  <select value={massaUnidadeSelecionada} onChange={e => setMassaUnidadeSelecionada(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-xs text-slate-700 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_0.8rem_center] bg-no-repeat pl-4 pr-10">
                    <option value="">-- Escolher Unidade --</option>
                    {unidadesUnicasMassa.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">2. Novo Status do Lote</label>
                  <select value={massaFormData.tratativa} onChange={e => setMassaFormData({...massaFormData, tratativa: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-xs text-slate-700 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_0.8rem_center] bg-no-repeat pl-4 pr-10">
                    <option value="Pendente de Contato">Pendente de Contato</option>
                    <option value="Aguardando Retorno">Aguardando Retorno</option>
                    <option value="Agendado Manutenção">Agendado Manutenção</option>
                    <option value="Aguardando Técnico">Aguardando Técnico</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Parado">Parado</option>
                    <option value="Retirada em Aberto">Retirada em Aberto</option>
                    <option value="Voltou a comunicar">Voltou a comunicar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">3. Data de Efetivação</label>
                  <input type="date" value={massaFormData.data_contato} onChange={e => setMassaFormData({...massaFormData, data_contato: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-xs text-slate-700 transition-all px-4" />
                </div>
              </div>

              {/* Engine Transfer List Operativo */}
              {massaUnidadeSelecionada ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center shrink-0">
                  
                  <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[300px] lg:h-[450px] shadow-sm flex-1">
                    <div className="bg-slate-50/80 p-3.5 border-b border-slate-200 font-black text-slate-600 flex justify-between items-center">
                      <span className="uppercase tracking-widest text-[10px]">Placas Disponíveis</span>
                      <span className="bg-slate-200 text-slate-600 py-0.5 px-2.5 rounded-md text-[10px] font-black">{massaPlacasDisponiveis.length} UN</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-slate-50/20">
                      {isLoadingMassaPlacas && (
                        <div className="text-center font-black text-slate-300 py-12 uppercase tracking-widest text-[10px]">Carregando placas...</div>
                      )}
                      {!isLoadingMassaPlacas && massaPlacasDisponiveis.map(placa => (
                        <div key={placa.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all group">
                          <div>
                            <span className="font-black text-slate-700 tracking-wide text-xs inline-block">{placa.placa}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">{placa.modelos_rastreadores?.tipo_veiculo}</span>
                          </div>
                          <button onClick={() => moverParaDireita(placa)} className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-emerald-100" title="Adicionar">
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))}
                      {!isLoadingMassaPlacas && massaPlacasDisponiveis.length === 0 && <div className="text-center font-black text-slate-300 py-12 uppercase tracking-widest text-[10px]">Nenhuma placa disponível</div>}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col justify-center gap-3 py-2">
                    <button onClick={moverTodasDireita} disabled={massaPlacasDisponiveis.length === 0} className="flex-1 lg:flex-none p-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 rounded-xl disabled:opacity-30 transition-all shadow-sm cursor-pointer active:scale-95" title="Mover Todos"><ChevronsRight size={20} /></button>
                    <button onClick={moverTodasEsquerda} disabled={massaPlacasSelecionadas.length === 0} className="flex-1 lg:flex-none p-3 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 rounded-xl disabled:opacity-30 transition-all shadow-sm cursor-pointer active:scale-95" title="Remover Todos"><ChevronsLeft size={20} /></button>
                  </div>

                  <div className="bg-white border text-sm border-emerald-200 rounded-2xl overflow-hidden flex flex-col min-h-[300px] lg:h-[450px] shadow-sm flex-1 ring-1 ring-emerald-50">
                    <div className="bg-emerald-600 p-3.5 border-b border-emerald-700 font-black text-white flex justify-between items-center">
                      <span className="uppercase tracking-widest text-[10px]">Lote em Tratativa</span>
                      <span className="bg-white text-emerald-700 font-black py-0.5 px-2.5 rounded-md text-[10px]">{massaPlacasSelecionadas.length} ALVO</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-emerald-50/10">
                      {massaPlacasSelecionadas.map(placa => (
                        <div key={placa.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-100/50 shadow-sm group hover:border-emerald-300 transition-all">
                          <button onClick={() => moverParaEsquerda(placa)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="Remover">
                            <ArrowLeft size={16} />
                          </button>
                          <div className="text-right flex-1">
                            <span className="font-black text-slate-700 tracking-wide block leading-none text-xs">{placa.placa}</span>
                            <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black tracking-widest border border-emerald-100 inline-block mt-2 uppercase">{massaFormData.tratativa}</span>
                          </div>
                        </div>
                      ))}
                      {massaPlacasSelecionadas.length === 0 && <div className="text-center font-black text-emerald-300 py-12 uppercase tracking-widest text-[10px]">Arraste aqui para tratar</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 animate-pulse">
                  <div className="p-5 bg-slate-50 rounded-full mb-6 border border-slate-100 shadow-inner">
                    <Building2 size={48} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-black text-slate-700 tracking-tight">Selecione uma Unidade de Operação</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 text-center max-w-sm uppercase tracking-widest leading-loose">Para iniciar a tratativa em lote, você precisa primeiro filtrar qual unidade deseja auditar.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end items-center p-5 border-t border-slate-100 bg-white gap-4 shrink-0">
              <span className="flex-1 text-[10px] text-slate-500 font-black uppercase tracking-widest pl-2">
                {massaPlacasSelecionadas.length > 0 && <span className="text-emerald-600 font-black">[{massaPlacasSelecionadas.length}] Veículo(s) pronto(s) para execução..</span>}
              </span>
              <button onClick={fecharModalMassa} className="px-5 py-2.5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all text-[10px] cursor-pointer">Cancelar</button>
              <button 
                onClick={handleSalvarMassa} 
                disabled={massaPlacasSelecionadas.length === 0 || isSavingMassa}
                className="px-8 py-2.5 bg-emerald-600 font-black uppercase tracking-widest text-[10px] text-white rounded-xl hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                {isSavingMassa ? (
                   <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Gravando Dados...
                   </>
                ) : (
                  <>
                    <CheckSquare size={16} />
                    Executar Atualização
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir Falha de Comunicação"
        message="Tem certeza que deseja remover este registro permanentemente? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}







