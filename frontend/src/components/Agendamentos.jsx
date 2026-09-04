import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { Search, Plus, X, CalendarDays, Building2, ListChecks, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, AlertTriangle, UserCog, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Sector } from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import ModalInstrucoesImportacaoAgendamentos from './ModalInstrucoesImportacaoAgendamentos';
import AgendamentosKpiCards from './agendamentos/AgendamentosKpiCards';
import AgendamentosFiltersBar from './agendamentos/AgendamentosFiltersBar';
import AgendamentosListView from './agendamentos/AgendamentosListView';
import AgendamentosPagination from './agendamentos/AgendamentosPagination';
import { useAgendamentosDerivedData } from './agendamentos/useAgendamentosDerivedData';
import { useTecnicosLookup, useUnidadesLookup } from '../hooks/useLookups';
import { useDebounce } from '../hooks/useDebounce';
import { buildSyncPayload, formatSyncReportMessage } from '../utils/syncImport';

// Tooltip Personalizado Glassmorphism para os gráficos
const CustomRechartsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[140px]">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-slate-600 font-medium text-sm">{entry.name}</span>
              <span className="text-slate-800 font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Barra Premium Animada com Rótulo Sincronizado e Deslocamento Lateral
const PremiumAnimatedBar = (props) => {
  const { x, y, width, height, fill, payload } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer group"
    >
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={fill} 
        rx={height / 2} 
        ry={height / 2}
        className="transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ 
          transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
          filter: isHovered ? 'drop-shadow(0 4px 12px rgba(20, 184, 166, 0.3))' : 'none',
          opacity: isHovered ? 1 : 0.9
        }}
      />
      
      <text 
        x={x + width + 10} 
        y={y + height / 2} 
        fill={isHovered ? "#0f172a" : "#64748b"} 
        textAnchor="start" 
        dominantBaseline="middle" 
        className="text-[10px] font-black tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ 
          transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
          fontWeight: isHovered ? 900 : 700
        }}
      >
        {payload.quantidade}
      </text>
    </g>
  );
};

// Fatia de Donut Premium com Explosão Suave (Spring Physics)
const PremiumDonutSlice = React.memo((props) => {
  const RADIAN = Math.PI / 180;
  const { 
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, 
    fill, payload, percent, index, activeIndex 
  } = props;
  
  const isHovered = index === activeIndex;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const explosionDist = isHovered ? 12 : 0;
  const dx = cos * explosionDist;
  const dy = sin * explosionDist;

  return (
    <g className="cursor-pointer outline-none group">
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={isHovered ? outerRadius + 8 : outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        cornerRadius={10}
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: isHovered ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))' : 'none',
          opacity: isHovered ? 1 : (activeIndex !== null ? 0.4 : 0.9),
          willChange: 'transform'
        }}
      />
      
      <text 
        x={cx + (outerRadius + 32) * cos} 
        y={cy + (outerRadius + 32) * sin} 
        fill={isHovered ? "#0f172a" : "#64748b"} 
        textAnchor={cos > 0 ? 'start' : 'end'} 
        dominantBaseline="middle"
        className="text-[10px] font-black tracking-tighter transition-all duration-500"
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isHovered ? 1 : 0.7,
          fontWeight: isHovered ? 900 : 700,
          willChange: 'transform'
        }}
      >
        {`${payload.name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
});

export default function Agendamentos() {
  const { getNomePerfil } = useAuth();
  const isSupervisor = getNomePerfil() === 'Supervisor';
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentosCompletos, setAgendamentosCompletos] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // id para apagar
  const [instalacoes, setInstalacoes] = useState([]);
  const [isCarregandoCompletos, setIsCarregandoCompletos] = useState(false);
  
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState(''); 
  const [filtroStatus, setFiltroStatus] = useState('');   
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const filtroPlacaDebounced = useDebounce(filtroPlaca, 300);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('todos'); // padrão: Tudo

  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 20;
  const applyFilterWithPageReset = useCallback((setter, value) => {
    setPaginaAtual(1);
    setter(value);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isModalMassaOpen, setIsModalMassaOpen] = useState(false);
  const [isModalFrustradoOpen, setIsModalFrustradoOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [unidadesLista, setUnidadesLista] = useState([]);
  const [syncConfig, setSyncConfig] = useState({ tipoSync: 'full', unidadeId: null, modoSync: 'incremental', confirmarDelecaoAusentes: false });

  // States Técnicos
  const [tecnicos, setTecnicos] = useState([]);
  const [isModalTecnicoOpen, setIsModalTecnicoOpen] = useState(false);
  const [novoTecnicoNome, setNovoTecnicoNome] = useState('');
  const [isTecnicoDropdownOpen, setIsTecnicoDropdownOpen] = useState(false);
  const [tecnicoSearchText, setTecnicoSearchText] = useState('');
  const [filtroTecnicoAnalytics, setFiltroTecnicoAnalytics] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginasBackend, setTotalPaginasBackend] = useState(1);
  const [kpisAgendamentos, setKpisAgendamentos] = useState(null);
  const [unidadesFiltroDisponiveis, setUnidadesFiltroDisponiveis] = useState([]);

  const { data: unidadesLookup = [] } = useUnidadesLookup();
  const { data: tecnicosLookup = [] } = useTecnicosLookup();

  // States Mudança em Massa
  const [massaUnidadeSelecionada, setMassaUnidadeSelecionada] = useState('');
  const [massaPlacasDisponiveis, setMassaPlacasDisponiveis] = useState([]);
  const [massaPlacasSelecionadas, setMassaPlacasSelecionadas] = useState([]);
  const [isSavingMassa, setIsSavingMassa] = useState(false);
  const [massaFormData, setMassaFormData] = useState({
    status: '',
    data_agendamento: '',
    tecnico_id: null
  });

  const [formData, setFormData] = useState({
    id: null, data_agendamento: '', tipo_servico: '', ordem_servico: '', placa: '', status: '', problema: '', novo_modulo: '', unidade_id: null, modelo_id: null,
    displayUnidade: '', displayUf: '', displayTipo: '', tecnico_id: null
  });

  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [isSelectUnidadeOpen, setIsSelectUnidadeOpen] = useState(false);

  const fileInputRef = useRef(null);
  const selectUnidadeRef = useRef(null);
  const tecnicoDropdownRef = useRef(null);
  const requestListaRef = useRef({ id: 0, controller: null });
  const requestCompletosRef = useRef({ id: 0, controller: null });

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestListaRef.current.id + 1;
    requestListaRef.current.id = requestId;
    requestListaRef.current.controller?.abort();
    requestListaRef.current.controller = controller;

    carregarDados({ requestId, signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [paginaAtual, dataInicio, dataFim, filtroUnidade, filtroStatus, filtroPlacaDebounced]);

  useEffect(() => {
    let mounted = true;

    const carregarInstalacoes = async () => {
      try {
        const resInstalacoes = await api.get('/instalacoes');
        if (!mounted) return;
        setInstalacoes(Array.isArray(resInstalacoes.data) ? resInstalacoes.data : []);
      } catch {
        if (mounted) {
          toast.error("Erro ao carregar instalações.");
        }
      }
    };

    carregarInstalacoes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const precisaDatasetCompleto = isAgendaOpen || isModalFrustradoOpen || isModalMassaOpen;
    if (!precisaDatasetCompleto) return;

    const controller = new AbortController();
    const requestId = requestCompletosRef.current.id + 1;
    requestCompletosRef.current.id = requestId;
    requestCompletosRef.current.controller?.abort();
    requestCompletosRef.current.controller = controller;

    const carregarAgendamentosCompletos = async () => {
      setIsCarregandoCompletos(true);
      try {
        const params = {
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          unidade: filtroUnidade || undefined,
          status: filtroStatus || undefined,
          placa: filtroPlacaDebounced || undefined
        };
        const { data } = await api.get('/agendamentos', { params, signal: controller.signal });
        if (requestCompletosRef.current.id !== requestId) return;
        setAgendamentosCompletos(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') return;
        toast.error("Erro ao carregar a lista completa de agendamentos.");
      } finally {
        if (requestCompletosRef.current.id === requestId) {
          setIsCarregandoCompletos(false);
        }
      }
    };

    carregarAgendamentosCompletos();

    return () => {
      controller.abort();
    };
  }, [isAgendaOpen, isModalFrustradoOpen, isModalMassaOpen, dataInicio, dataFim, filtroUnidade, filtroStatus, filtroPlacaDebounced]);

  const carregarFiltrosDisponiveis = useCallback(async () => {
    try {
      const { data } = await api.get('/agendamentos/filtros');
      setUnidadesFiltroDisponiveis(Array.isArray(data?.unidades) ? data.unidades : []);
    } catch {
      setUnidadesFiltroDisponiveis([]);
      toast.error("Erro ao carregar as opções de unidade.");
    }
  }, []);

  useEffect(() => {
    carregarFiltrosDisponiveis();
  }, [carregarFiltrosDisponiveis]);

  const handleAbrirImportacao = async () => {
    setUnidadesLista(unidadesLookup);
    setIsImportModalOpen(true);
  };

  useEffect(() => {
    setTecnicos(tecnicosLookup || []);
  }, [tecnicosLookup]);

  // Fechar o select de unidade ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectUnidadeRef.current && !selectUnidadeRef.current.contains(event.target)) {
        setIsSelectUnidadeOpen(false);
      }
      if (tecnicoDropdownRef.current && !tecnicoDropdownRef.current.contains(event.target)) {
        setIsTecnicoDropdownOpen(false);
        setTecnicoSearchText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    boardDados,
    colorsServicos,
    dadosProblemas,
    dadosServicos,
    dadosTecnicos,
    dadosUnidades,
    frustradosCompletos,
    getPaginasExibidas,
    indexOfFirstItem,
    indexOfLastItem,
    itensAtuais,
    totalAgendado,
    totalFrustrado,
    totalPaginas,
    totalRealizado,
    unidadesUnicas,
    unidadesUnicasMassa
  } = useAgendamentosDerivedData({
    agendamentos,
    agendamentosCompletos,
    kpisAgendamentos,
    paginaAtual,
    itensPorPagina: ITENS_POR_PAGINA,
    totalRegistros,
    totalPaginasBackend,
    unidadesFiltroDisponiveis
  });

  useEffect(() => {
    if (!filtroUnidade) return;
    if (unidadesUnicas.includes(filtroUnidade)) return;
    applyFilterWithPageReset(setFiltroUnidade, '');
    setBuscaUnidade('');
  }, [applyFilterWithPageReset, filtroUnidade, unidadesUnicas]);

  // Lógica de Mudança em Massa
  const [massaModulos, setMassaModulos] = useState({});

  useEffect(() => {
    if (!isModalMassaOpen) {
      setMassaUnidadeSelecionada('');
      setMassaPlacasSelecionadas([]);
      setMassaFormData({ status: '', data_agendamento: '', tecnico_id: null });
      setMassaPlacasDisponiveis([]);
      setMassaModulos({});
    }
  }, [isModalMassaOpen]);

  useEffect(() => {
    if (!isModalMassaOpen || !massaUnidadeSelecionada) return;
    const placasDaUnidade = agendamentosCompletos.filter(
      (a) => a.unidades_clientes?.nome_unidade === massaUnidadeSelecionada
        && (a.status === 'Agendado' || a.status === 'Aguardando Data')
    );
    setMassaPlacasDisponiveis(placasDaUnidade);
  }, [agendamentosCompletos, isModalMassaOpen, massaUnidadeSelecionada]);

  const handleUnidadeChange = (e) => {
    const val = e.target.value;
    setMassaUnidadeSelecionada(val);
    setMassaPlacasSelecionadas([]);
    setMassaModulos({});
    if (val) {
      setMassaPlacasDisponiveis(agendamentosCompletos.filter(a => a.unidades_clientes?.nome_unidade === val && (a.status === 'Agendado' || a.status === 'Aguardando Data')));
    } else {
      setMassaPlacasDisponiveis([]);
    }
  };

  const moverParaDireita = (idx) => {
    const item = massaPlacasDisponiveis[idx];
    setMassaPlacasDisponiveis(massaPlacasDisponiveis.filter((_, i) => i !== idx));
    setMassaPlacasSelecionadas([...massaPlacasSelecionadas, item]);
  };

  const moverParaEsquerda = (idx) => {
    const item = massaPlacasSelecionadas[idx];
    setMassaPlacasSelecionadas(massaPlacasSelecionadas.filter((_, i) => i !== idx));
    setMassaPlacasDisponiveis([...massaPlacasDisponiveis, item].sort((a,b) => (a.placa||'').localeCompare(b.placa||'')));
  };

  const moverTodasDireita = () => {
    setMassaPlacasSelecionadas([...massaPlacasSelecionadas, ...massaPlacasDisponiveis]);
    setMassaPlacasDisponiveis([]);
  };

  const moverTodasEsquerda = () => {
    setMassaPlacasDisponiveis([...massaPlacasDisponiveis, ...massaPlacasSelecionadas].sort((a,b) => (a.placa||'').localeCompare(b.placa||'')));
    setMassaPlacasSelecionadas([]);
  };

  const handleSalvarMassa = async () => {
    if (massaPlacasSelecionadas.length === 0 || !massaFormData.status) {
      toast.error("Preencha status e selecione placas.");
      return;
    }

    if (massaFormData.status === 'Realizado' && !massaFormData.tecnico_id) {
      toast.error("O campo Técnico é obrigatório quando o status é 'Realizado'!");
      return;
    }

    if (massaFormData.status === 'Realizado') {
      const missingModules = massaPlacasSelecionadas.some(a => 
        (a.problema === 'Troca do Módulo' || a.problema === 'Troca da Dashcam') && !a.modulo_atualizado && !massaModulos[a.id]?.trim()
      );
      if (missingModules) {
        toast.error("O número do novo equipamento é OBRIGATÓRIO para trocas de módulo/dashcam.");
        return;
      }
    }

    setIsSavingMassa(true);
    try {
      const updates = massaPlacasSelecionadas.map(a => {
        const payload = { status: massaFormData.status };
        if (massaFormData.data_agendamento) payload.data_agendamento = massaFormData.data_agendamento;
        
        if (massaFormData.status === 'Realizado') {
          payload.tecnico_id = massaFormData.tecnico_id;
          if ((a.problema === 'Troca do Módulo' || a.problema === 'Troca da Dashcam') && !a.modulo_atualizado && massaModulos[a.id]) {
            payload.novo_modulo = massaModulos[a.id].trim().toUpperCase();
          }
        }
        
        return api.put(`/agendamentos/${a.id}`, payload);
      });
      await Promise.all(updates);
      toast.success(`${massaPlacasSelecionadas.length} agendamentos alterados com sucesso!`);
      setIsModalMassaOpen(false);
      carregarDados();
    } catch {
      toast.error("Ocorreu um erro ao atualizar em lote.");
    } finally {
      setIsSavingMassa(false);
    }
  };

  const carregarDados = useCallback(async ({ requestId, signal } = {}) => {
    const currentRequestId = requestId ?? (requestListaRef.current.id + 1);
    if (requestId == null) {
      requestListaRef.current.id = currentRequestId;
      requestListaRef.current.controller?.abort();
      const controller = new AbortController();
      requestListaRef.current.controller = controller;
      signal = controller.signal;
    }

    try {
      const params = {
        paginated: true,
        page: paginaAtual,
        limit: ITENS_POR_PAGINA,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        unidade: filtroUnidade || undefined,
        status: filtroStatus || undefined,
        placa: filtroPlacaDebounced || undefined
      };

      const [resAgendamentos, resKpis] = await Promise.all([
        api.get('/agendamentos', { params, signal }),
        api.get('/agendamentos/kpis', { params, signal })
      ]);

      if (requestListaRef.current.id !== currentRequestId) return;

      setAgendamentos(resAgendamentos.data?.data || []);
      setTotalRegistros(resAgendamentos.data?.pagination?.total || 0);
      setTotalPaginasBackend(resAgendamentos.data?.pagination?.total_pages || 1);
      setTecnicos(tecnicosLookup);
      setKpisAgendamentos(resKpis.data || null);
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') return;
      toast.error("Erro ao carregar dados do servidor.");
    }
  }, [paginaAtual, dataInicio, dataFim, filtroUnidade, filtroStatus, filtroPlacaDebounced, tecnicosLookup]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Sincronizando agendamentos. Aguarde...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const payload = buildSyncPayload(results.data, syncConfig);
          const response = await api.post('/agendamentos/sync', payload);
          toast.success(formatSyncReportMessage('Lista de O.S. atualizada', response.data?.relatorio), { id: toastId });
          carregarDados();
        } catch (error) {
          toast.error(error.response?.data?.erro || "Erro ao importar planilha.", { id: toastId });
        }
      }
    });
    event.target.value = null;
  };

  const handlePlacaChange = (e) => {
    const placaDigitada = e.target.value.toUpperCase();
    const veiculo = instalacoes.find(v => v.placa === placaDigitada);
    
    if (veiculo) {
      setFormData({
        ...formData, 
        placa: placaDigitada,
        unidade_id: veiculo.unidade_id,
        modelo_id: veiculo.modelo_id,
        displayUnidade: veiculo.unidades_clientes?.nome_unidade || '',
        displayUf: veiculo.unidades_clientes?.uf || '',
        displayTipo: veiculo.modelos_rastreadores?.tipo_veiculo || ''
      });
    } else {
      setFormData({
        ...formData, placa: placaDigitada, unidade_id: null, modelo_id: null, displayUnidade: '', displayUf: '', displayTipo: ''
      });
    }
  };

  const handleSalvar = async () => {
    if (!formData.tipo_servico || !formData.placa || !formData.status) {
      toast.error("Preencha o Tipo de Serviço, a Placa e o Status!");
      return;
    }

    // Validação: Técnico obrigatório quando status = Realizado
    if (formData.status === 'Realizado' && !formData.tecnico_id) {
      toast.error("O campo Técnico é obrigatório quando o status é 'Realizado'!");
      return;
    }

    const isTrocaRealizada = (formData.problema === 'Troca do Módulo' || formData.problema === 'Troca da Dashcam') && formData.status === 'Realizado';
    if (isTrocaRealizada && !formData.modulo_atualizado && !formData.novo_modulo?.trim()) {
      toast.error(`O número do novo equipamento é OBRIGATÓRIO para a ${formData.problema}!`);
      return;
    }

    const isInstalacao = formData.tipo_servico === 'Instalação';
    const isRealizado = formData.status === 'Realizado';

    // Serviços que não são Instalação exigem placa cadastrada no BD
    if (!isInstalacao && (!formData.unidade_id || !formData.modelo_id)) {
      toast.error("Placa não encontrada na base. Digite uma placa já instalada.");
      return;
    }

    // Instalação marcada como Realizado: a placa JÁ deve estar cadastrada (instalação concluída)
    if (isInstalacao && isRealizado && (!formData.unidade_id || !formData.modelo_id)) {
      toast.error("Para marcar como 'Realizado', a placa já deve estar cadastrada no sistema. Cadastre o veículo primeiro.");
      return;
    }

    try {
      const payload = {
        data_agendamento: formData.data_agendamento || null,
        tipo_servico: formData.tipo_servico,
        ordem_servico: formData.ordem_servico || null,
        placa: formData.placa,
        unidade_id: formData.unidade_id,
        modelo_id: formData.modelo_id,
        status: formData.status,
        problema: formData.problema,
        novo_modulo: (isTrocaRealizada && !formData.modulo_atualizado) ? formData.novo_modulo.trim().toUpperCase() : undefined,
        tecnico_id: formData.tecnico_id || null
      };

      if (formData.id) {
        await api.put(`/agendamentos/${formData.id}`, payload);
        toast.success("O.S. atualizada com sucesso!");
      } else {
        await api.post('/agendamentos', payload);
        toast.success("Nova O.S. criada com sucesso!");
      }

      if (isTrocaRealizada && !formData.modulo_atualizado) {
        toast.success(`Veículo atualizado. Novo módulo: ${formData.novo_modulo.trim().toUpperCase()}`);
      }
      
      setIsModalOpen(false);
      carregarDados();
    } catch {
      toast.error("Erro ao salvar O.S.");
    }
  };

  const handlePeriodSelect = useCallback((periodo) => {
    setPeriodoSelecionado(periodo);
    // Ajustar para o início do dia no timezone local
    const format = (d) => d.toISOString().split('T')[0];

    if (periodo === 'hoje') {
      const d = new Date();
      applyFilterWithPageReset(setDataInicio, format(d));
      applyFilterWithPageReset(setDataFim, format(d));
    } else if (periodo === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      applyFilterWithPageReset(setDataInicio, format(d));
      applyFilterWithPageReset(setDataFim, format(new Date()));
    } else if (periodo === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      applyFilterWithPageReset(setDataInicio, format(d));
      applyFilterWithPageReset(setDataFim, format(new Date()));
    } else if (periodo === 'mes') {
      const d = new Date();
      const primeiroDia = new Date(d.getFullYear(), d.getMonth(), 1);
      applyFilterWithPageReset(setDataInicio, format(primeiroDia));
      applyFilterWithPageReset(setDataFim, format(new Date()));
    } else if (periodo === 'todos') {
      applyFilterWithPageReset(setDataInicio, '');
      applyFilterWithPageReset(setDataFim, '');
    }
  }, [applyFilterWithPageReset]);

  // Inicializar com o período padrão (Tudo)
  useEffect(() => {
    handlePeriodSelect('todos');
  }, [handlePeriodSelect]);

  const handleExportarRelatorio = async () => {
    if (totalRegistros === 0) {
      toast.error("Nenhum dado para exportar com os filtros atuais.");
      return;
    }

    const params = {
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
      unidade: filtroUnidade || undefined,
      status: filtroStatus || undefined,
      placa: filtroPlaca || undefined
    };
    const { data } = await api.get('/agendamentos', { params });
    const baseExport = Array.isArray(data) ? data : [];

    const dataToExport = baseExport.map(os => ({
      'O.S.': os.ordem_servico || '',
      'Placa': os.placa || '',
      'Unidade': os.unidades_clientes?.nome_unidade || '',
      'UF': os.unidades_clientes?.uf || '',
      'Serviço': os.tipo_servico || '',
      'Status': os.status || '',
      'Problema': os.problema || '',
      'Técnico': os.tecnicos?.nome || '',
      'Data Agendamento': os.data_agendamento ? new Date(os.data_agendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `agendamentos_${dataAtual}.xlsx`);
    toast.success(`${baseExport.length} registros exportados!`);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/agendamentos/${id}`);
      toast.success('O.S. excluída com sucesso.');
      carregarDados();
    } catch {
      toast.error('Erro ao excluir O.S.');
    }
  };

  const abrirModalNovo = () => {
    setFormData({ id: null, data_agendamento: '', tipo_servico: '', ordem_servico: '', placa: '', status: '', problema: '', novo_modulo: '', unidade_id: null, modelo_id: null, displayUnidade: '', displayUf: '', displayTipo: '', tecnico_id: null });
    setIsTecnicoDropdownOpen(false);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (os) => {
    setFormData({
      id: os.id,
      data_agendamento: os.data_agendamento ? os.data_agendamento.split('T')[0] : '',
      tipo_servico: os.tipo_servico,
      ordem_servico: os.ordem_servico || '',
      placa: os.placa,
      status: os.status,
      problema: os.problema || '',
      novo_modulo: '',
      unidade_id: os.unidade_id,
      modelo_id: os.modelo_id,
      displayUnidade: os.unidades_clientes?.nome_unidade,
      displayUf: os.unidades_clientes?.uf,
      displayTipo: os.modelos_rastreadores?.tipo_veiculo,
      tecnico_id: os.tecnico_id || null,
      modulo_atualizado: os.modulo_atualizado || false
    });
    setIsTecnicoDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleCriarTecnico = async () => {
    if (!novoTecnicoNome.trim()) {
      toast.error("Digite o nome do técnico.");
      return;
    }
    try {
      const res = await api.post('/tecnicos', { nome: novoTecnicoNome.trim() });
      const novoTecnico = res.data;
      setTecnicos(prev => [...prev, novoTecnico].sort((a, b) => a.nome.localeCompare(b.nome)));
      setFormData(prev => ({ ...prev, tecnico_id: novoTecnico.id }));
      setNovoTecnicoNome('');
      setIsModalTecnicoOpen(false);
      toast.success(`Técnico "${novoTecnico.nome}" cadastrado!`);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao cadastrar técnico.");
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <AgendamentosKpiCards
        totalRealizado={totalRealizado}
        totalAgendado={totalAgendado}
        totalFrustrado={totalFrustrado}
        totalRegistros={totalRegistros}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenFrustrados={() => setIsModalFrustradoOpen(true)}
      />

      <div className="bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col w-full relative z-20">
        <AgendamentosFiltersBar
          periodoSelecionado={periodoSelecionado}
          onPeriodSelect={handlePeriodSelect}
          dataInicio={dataInicio}
          dataFim={dataFim}
          setDataInicio={(value) => applyFilterWithPageReset(setDataInicio, value)}
          setDataFim={(value) => applyFilterWithPageReset(setDataFim, value)}
          isSupervisor={isSupervisor}
          fileInputRef={fileInputRef}
          onFileUpload={handleFileUpload}
          onOpenAgenda={() => setIsAgendaOpen(true)}
          onOpenImportacao={handleAbrirImportacao}
          onExportarRelatorio={handleExportarRelatorio}
          onOpenMassa={() => setIsModalMassaOpen(true)}
          onOpenNovo={abrirModalNovo}
          selectUnidadeRef={selectUnidadeRef}
          filtroUnidade={filtroUnidade}
          buscaUnidade={buscaUnidade}
          setBuscaUnidade={setBuscaUnidade}
          setFiltroUnidade={(value) => applyFilterWithPageReset(setFiltroUnidade, value)}
          isSelectUnidadeOpen={isSelectUnidadeOpen}
          setIsSelectUnidadeOpen={setIsSelectUnidadeOpen}
          unidadesUnicas={unidadesUnicas}
          filtroPlaca={filtroPlaca}
          setFiltroPlaca={(value) => applyFilterWithPageReset(setFiltroPlaca, value)}
          filtroStatus={filtroStatus}
          setFiltroStatus={(value) => applyFilterWithPageReset(setFiltroStatus, value)}
        />

        <AgendamentosListView
          itensAtuais={itensAtuais}
          onEdit={abrirModalEditar}
          onDelete={handleDelete}
        />

        <AgendamentosPagination
          totalPaginas={totalPaginas}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          totalRegistros={totalRegistros}
          paginaAtual={paginaAtual}
          getPaginasExibidas={getPaginasExibidas}
          onPrevPage={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
          onNextPage={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
          onGoToPage={(page) => setPaginaAtual(page)}
        />
      </div>

      {/* --- MODAL: QUADRO TRELLO (AGENDA) --- */}
      {isAgendaOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] p-2 sm:p-4 md:p-8 backdrop-blur-sm transition-all flex items-center justify-center">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-[1600px] h-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200/80 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">Quadro Semanal Operativo</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Visão da agenda por dia</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAgendaOpen(false)} 
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto p-4 sm:p-6 bg-slate-100/30">
              <div className="flex gap-4 h-full w-max">
                
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => (
                  <div key={dia} className="w-[280px] flex flex-col bg-slate-50/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-200/50 shadow-sm flex-shrink-0">
                    
                    <div className="flex justify-between items-center mb-3 px-1 border-b border-slate-200/30 pb-2">
                      <h3 className="font-black text-slate-700 uppercase tracking-widest text-[11px] leading-none">{dia}</h3>
                      <span className="bg-slate-200/50 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full shadow-inner tracking-tighter">{boardDados[dia].length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                      {isCarregandoCompletos ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-60 py-10">
                          <span className="font-bold text-xs tracking-widest uppercase text-slate-500">Carregando...</span>
                        </div>
                      ) : boardDados[dia].length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                          <div className="w-16 h-16 border-2 border-dashed border-slate-400 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                             <CheckCircle size={24} />
                          </div>
                          <span className="font-bold text-sm tracking-widest uppercase text-slate-500">Livre</span>
                        </div>
                      ) : (
                        boardDados[dia].map(os => (
                          <div key={os.id} onClick={() => { abrirModalEditar(os); }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative overflow-hidden">
                            
                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-3 gap-2">
                              <div className="text-left flex-1 min-w-0">
                                <p className="font-black text-slate-800 text-lg uppercase tracking-wider leading-none truncate">{os.placa}</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide truncate">{os.unidades_clientes?.nome_unidade}</p>
                              </div>
                              <span className="shrink-0 bg-teal-50 text-teal-600 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-teal-100 max-w-[50%] truncate">
                                {os.tipo_servico}
                              </span>
                            </div>

                            <div className="mt-auto border-t border-slate-100 pt-3 flex justify-between items-center">
                              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/50 shadow-sm truncate max-w-[120px]">
                                {os.problema || 'Pdr.'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {new Date(os.data_agendamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* --- MODAL: FORMULÁRIO DE O.S. --- */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[11000] p-2 sm:p-4 backdrop-blur-sm transition-all flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-h-[95vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{formData.id ? 'Editar Agendamento' : 'Registrar Agendamento'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer active:scale-90"><X size={20} /></button>
            </div>
            
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white overflow-y-auto custom-scrollbar flex-1">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Placa do Veículo *</label>
                <input type="text" value={formData.placa} onChange={handlePlacaChange} placeholder="DIGITE: ABC-1234" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none uppercase font-black tracking-[0.2em] text-lg text-slate-700 transition-all shadow-inner placeholder-slate-300" />
              </div>

              <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-xl shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unidade / UF</span>
                {formData.displayUnidade ? (
                  <span className="text-xs font-black text-slate-600 truncate block">{formData.displayUnidade} - {formData.displayUf}</span>
                ) : formData.tipo_servico === 'Instalação' ? (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse"></span>
                    Preenchido após cadastro do veículo
                  </span>
                ) : (
                  <span className="text-xs font-black text-slate-400">Pendente..</span>
                )}
              </div>
              
              <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-xl shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo de Veículo</span>
                {formData.displayTipo ? (
                  <span className="text-xs font-black text-slate-600 truncate block">{formData.displayTipo}</span>
                ) : formData.tipo_servico === 'Instalação' ? (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse"></span>
                    Preenchido após cadastro do veículo
                  </span>
                ) : (
                  <span className="text-xs font-black text-slate-400">Pendente..</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Serviço *</label>
                <select value={formData.tipo_servico} onChange={e => setFormData({...formData, tipo_servico: e.target.value})} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%20%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-10">
                  <option value="">-- Selecione --</option>
                  <option value="Instalação">Instalação</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Retirada">Retirada</option>
                  <option value="Vistoria">Vistoria</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status *</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%20%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-10">
                  <option value="">-- Defina Status --</option>
                  <option value="Realizado">Realizado</option>
                  <option value="Frustrado">Frustrado</option>
                  <option value="Aguardando Data">Aguardando Data</option>
                  <option value="Agendado">Agendado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Agendado Para</label>
                <input type="date" value={formData.data_agendamento} onChange={e => setFormData({...formData, data_agendamento: e.target.value})} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all cursor-pointer" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ordem de Serviço (O.S.)</label>
                <input type="number" value={formData.ordem_servico} onChange={e => setFormData({...formData, ordem_servico: e.target.value})} placeholder="Ex: 5812" className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all placeholder-slate-300" />
              </div>


              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Relato do Problema</label>
                <select value={formData.problema} onChange={e => setFormData({...formData, problema: e.target.value})} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%20%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-10">
                  <option value="">Nenhum / Selecione</option>
                  <option value="Bloqueio">Bloqueio</option>
                  <option value="Bateria">Bateria</option>
                  <option value="Troca do Módulo">Troca do Módulo</option>
                  <option value="Troca da Dashcam">Troca da Dashcam</option>
                  <option value="Troca do Identificador">Troca do Identificador</option>
                  <option value="Vistoria na Instalação">Vistoria na Instalação</option>
                  <option value="Retirada">Retirada</option>
                </select>
              </div>

              {/* Campo Técnico com dropdown + botão "+" */}
              <div className="relative" ref={tecnicoDropdownRef}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Técnico {formData.status === 'Realizado' && <span className="text-red-500">*</span>}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCog size={14} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={isTecnicoDropdownOpen ? tecnicoSearchText : (tecnicos.find(t => t.id === formData.tecnico_id)?.nome || '')}
                      onChange={(e) => {
                        setTecnicoSearchText(e.target.value);
                        if (!isTecnicoDropdownOpen) setIsTecnicoDropdownOpen(true);
                      }}
                      onClick={() => setIsTecnicoDropdownOpen(true)}
                      placeholder="Selecione ou digite..."
                      className="w-full h-11 pl-9 pr-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all cursor-text placeholder-slate-300"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNovoTecnicoNome(''); setIsModalTecnicoOpen(true); }}
                    className="h-11 w-11 flex items-center justify-center bg-teal-50 border border-teal-200 text-teal-600 rounded-xl hover:bg-teal-100 hover:border-teal-300 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    title="Cadastrar novo técnico"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Dropdown de técnicos */}
                {isTecnicoDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-[50] max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div
                      onClick={() => { setFormData({...formData, tecnico_id: null}); setIsTecnicoDropdownOpen(false); setTecnicoSearchText(''); }}
                      className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 cursor-pointer border-b border-slate-50"
                    >
                      -- Limpar Seleção --
                    </div>
                    {(() => {
                      const filtrados = tecnicos.filter(t => t.nome.toLowerCase().includes(tecnicoSearchText.toLowerCase()));
                      if (filtrados.length === 0) {
                        return (
                          <div className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Nenhum técnico encontrado
                          </div>
                        );
                      }
                      return filtrados.map(t => (
                        <div
                          key={t.id}
                          onClick={() => { setFormData({...formData, tecnico_id: t.id}); setIsTecnicoDropdownOpen(false); setTecnicoSearchText(''); }}
                          className={`p-3 text-xs font-bold cursor-pointer transition-colors ${formData.tecnico_id === t.id ? 'bg-teal-50 text-teal-600 font-black' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-600'}`}
                        >
                          {t.nome}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {(formData.problema === 'Troca do Módulo' || formData.problema === 'Troca da Dashcam') && formData.status === 'Realizado' && (
                formData.modulo_atualizado ? (
                  <div className="col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        Equipamento já substituído — Número registrado anteriormente
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                      Nº do Novo Equip. (Para {formData.problema}) <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={formData.novo_modulo || ''} onChange={(e) => setFormData({...formData, novo_modulo: e.target.value})} placeholder="Digite o número / ID do novo equipamento" className="w-full h-11 px-4 bg-slate-50 border-l-4 border-l-teal-500 border-y border-r border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-y-teal-500 focus:border-r-teal-500 outline-none uppercase font-black text-xs text-slate-800 transition-all shadow-inner placeholder-slate-400" />
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end items-center p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors cursor-pointer">Descartar</button>
              <button onClick={handleSalvar} className="px-8 py-3 bg-teal-600 font-black uppercase text-[10px] tracking-widest text-white rounded-xl hover:bg-teal-700 transition-all shadow-md active:scale-95 cursor-pointer">Confirmar</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* --- MINI-MODAL: CADASTRAR TÉCNICO --- */}
      {isModalTecnicoOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[12000] backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsModalTecnicoOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <UserCog size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Novo Técnico</h3>
              </div>
              <button onClick={() => setIsModalTecnicoOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer active:scale-90"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome do Técnico *</label>
                <input
                  type="text"
                  value={novoTecnicoNome}
                  onChange={(e) => setNovoTecnicoNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCriarTecnico()}
                  placeholder="Ex: João Silva"
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all placeholder-slate-300"
                  autoFocus
                />
              </div>
              <button
                onClick={handleCriarTecnico}
                className="w-full py-3 bg-teal-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-teal-700 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* --- MODAL: MUDANÇA EM MASSA --- */}
      {isModalMassaOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] p-2 sm:p-4 md:p-8 transition-all flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-full max-h-[90vh] border border-slate-200 animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700"><ListChecks size={24} /></div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">Alteração em Massa</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 leading-none">Gestão de múltiplos registros</p>
                </div>
              </div>
              <button onClick={() => setIsModalMassaOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer active:scale-90"><X size={20} /></button>
            </div>
            
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar space-y-5 bg-slate-50/30">
              
              <div className={`grid grid-cols-1 ${massaFormData.status === 'Realizado' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0 transition-all`}>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade Origem</label>
                  <select value={massaUnidadeSelecionada} onChange={handleUnidadeChange} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-black text-slate-600 transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat">
                    <option value="">-- Selecione --</option>
                    {unidadesUnicasMassa.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Novo Status *</label>
                  <select value={massaFormData.status} onChange={e => setMassaFormData({...massaFormData, status: e.target.value})} className="w-full h-11 px-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-black text-slate-600 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat">
                    <option value="">-- Defina Status --</option>
                    <option value="Realizado">Realizado</option>
                    <option value="Frustrado">Frustrado</option>
                    <option value="Aguardando Data">Aguardando Data</option>
                    <option value="Agendado">Agendado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nova Data (Opcional)</label>
                  <input type="date" value={massaFormData.data_agendamento} onChange={e => setMassaFormData({...massaFormData, data_agendamento: e.target.value})} className="w-full h-11 px-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-black text-slate-600 transition-all shadow-sm" />
                </div>
                {massaFormData.status === 'Realizado' && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">Técnico <span className="text-red-500">*</span></label>
                    <select value={massaFormData.tecnico_id || ''} onChange={e => setMassaFormData({...massaFormData, tecnico_id: e.target.value})} className="w-full h-11 px-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-black text-slate-600 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat">
                      <option value="">-- Selecione --</option>
                      {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {massaUnidadeSelecionada ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch shrink-0 min-h-0 flex-1">
                  
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm flex-1 min-h-[300px]">
                    <div className="bg-slate-50 p-3 border-b border-slate-200 font-black text-slate-500 flex justify-between items-center text-[10px] uppercase tracking-widest">
                      <span>Placas disponíveis</span>
                      <span className="bg-white text-slate-600 py-1 px-3 rounded-lg border border-slate-200">{massaPlacasDisponiveis.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {isCarregandoCompletos ? (
                        <div className="text-center font-black text-slate-400 p-8 mt-10 uppercase tracking-widest text-[10px]">Carregando registros...</div>
                      ) : massaPlacasDisponiveis.map((a, idx) => (
                        <div key={a.id} className="bg-white border border-slate-100 p-2 rounded-xl flex justify-between items-center hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group">
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 tracking-tight text-sm uppercase">{a.placa}</p>
                            <div className="flex gap-2 text-[9px] mt-0.5 font-black uppercase text-slate-400 tracking-tighter">
                              <span className="text-teal-600">{a.tipo_servico}</span>
                              <span className="truncate max-w-[100px]">· {a.status}</span>
                            </div>
                          </div>
                          <button onClick={() => moverParaDireita(idx)} className="p-2 opacity-0 group-hover:opacity-100 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))}
                      {!isCarregandoCompletos && massaPlacasDisponiveis.length === 0 && <div className="text-center font-black text-slate-300 p-8 mt-10 uppercase tracking-widest text-[10px]">Sem registros</div>}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col justify-center gap-3 p-1 items-center shrink-0">
                    <button onClick={moverTodasDireita} disabled={massaPlacasDisponiveis.length === 0} className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 rounded-xl disabled:opacity-40 disabled:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-90"><ChevronsRight size={20} /></button>
                    <button onClick={moverTodasEsquerda} disabled={massaPlacasSelecionadas.length === 0} className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 rounded-xl disabled:opacity-40 disabled:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-90"><ChevronsLeft size={20} /></button>
                  </div>

                  <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl overflow-hidden flex flex-col shadow-sm flex-1 min-h-[300px] ring-4 ring-emerald-50/30">
                    <div className="bg-emerald-600 p-3 border-b border-emerald-700 font-black text-white flex justify-between items-center text-[10px] uppercase tracking-widest">
                      <span>Alvo de Alteração</span>
                      <span className="bg-white text-emerald-700 font-black py-1 px-3 rounded-lg">{massaPlacasSelecionadas.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {massaPlacasSelecionadas.map((a, idx) => (
                        <div key={a.id} className="bg-white border border-emerald-100 p-2 rounded-xl flex justify-between items-center shadow-sm animate-in slide-in-from-right-2 duration-300">
                          <button onClick={() => moverParaEsquerda(idx)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                            <ArrowLeft size={16} />
                          </button>
                          <div className="text-right min-w-0">
                            <p className="font-black text-emerald-800 tracking-tight text-sm uppercase">{a.placa}</p>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter block mt-0.5 truncate">Para: {massaFormData.status || '...'}</span>
                          </div>
                        </div>
                      ))}
                      {massaPlacasSelecionadas.length === 0 && <div className="text-center font-black text-emerald-200 p-8 mt-10 uppercase tracking-widest text-[10px]">Arraste para mover</div>}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 opacity-60 flex-1">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                    <Building2 size={32} />
                  </div>
                  <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Selecione uma unidade</p>
                  <p className="text-[10px] font-black text-slate-400 mt-2 text-center max-w-xs uppercase tracking-tight">Inicie escolhendo a unidade de origem para listar e mover os agendamentos</p>
                </div>
              )}

              {/* INPUTS DE EQUIPAMENTO PARA PLACAS COM TROCA DE MÓDULO/DASHCAM */}
              {massaFormData.status === 'Realizado' && massaPlacasSelecionadas.some(a => (a.problema === 'Troca do Módulo' || a.problema === 'Troca da Dashcam') && !a.modulo_atualizado) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">Números de Série / Novos Equipamentos</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {massaPlacasSelecionadas.filter(a => (a.problema === 'Troca do Módulo' || a.problema === 'Troca da Dashcam') && !a.modulo_atualizado).map(a => (
                      <div key={a.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 shadow-inner">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                          <span className="text-slate-700">{a.placa}</span>
                          <span className="text-emerald-600 truncate max-w-[120px]" title={a.problema}>{a.problema}</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="Nº Equipamento *" 
                          value={massaModulos[a.id] || ''} 
                          onChange={(e) => setMassaModulos({...massaModulos, [a.id]: e.target.value})} 
                          className="w-full h-10 px-3 bg-white border-l-4 border-l-emerald-500 border-y border-r border-slate-200 rounded-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none uppercase font-black text-xs text-slate-800 transition-all placeholder-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="flex justify-end items-center p-4 sm:p-6 border-t border-slate-100 bg-white gap-3 shrink-0">
              <button onClick={() => setIsModalMassaOpen(false)} className="px-5 py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors cursor-pointer">Cancelar</button>
              <button 
                onClick={handleSalvarMassa} 
                disabled={massaPlacasSelecionadas.length === 0 || isSavingMassa || !massaFormData.status}
                className="px-8 py-3 bg-emerald-600 font-black uppercase text-[10px] tracking-widest text-white rounded-xl hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                {isSavingMassa ? 'Processando..' : <><ListChecks size={16} /> Confirmar Lote</>}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

       {/* MODAL: DETALHES DE FRUSTRADOS */}
       {isModalFrustradoOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-2 sm:p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Registros Frustrados</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 leading-none">Listagem técnica detalhada</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalFrustradoOpen(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 sm:p-6 bg-slate-50/50 flex-1 custom-scrollbar">
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[9px] uppercase tracking-widest border-b border-slate-200 font-black">
                      <th className="px-4 py-3">Placa</th>
                      <th className="px-4 py-3">Unidade</th>
                      <th className="px-4 py-3">Serviço</th>
                      <th className="px-4 py-3">Motivo / Problema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                    {isCarregandoCompletos && (
                      <tr>
                        <td colSpan="4" className="px-4 py-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          Carregando registros...
                        </td>
                      </tr>
                    )}
                    {!isCarregandoCompletos && frustradosCompletos.map((os, idx) => (
                      <tr key={os.id || idx} className="hover:bg-rose-50/20 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-900 tracking-wider uppercase">{os.placa}</td>
                        <td className="px-4 py-3 font-black text-slate-500 truncate max-w-[120px]">{os.unidades_clientes?.nome_unidade || '-'}</td>
                        <td className="px-4 py-3 font-black text-slate-400">{os.tipo_servico}</td>
                        <td className="px-4 py-3">
                          <span className="text-[9px] text-rose-600 bg-rose-50 px-2 py-1 rounded-md font-black border border-rose-100 uppercase tracking-tight">
                            {os.problema || 'Não detalhado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!isCarregandoCompletos && frustradosCompletos.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-end">
              <button 
                onClick={() => setIsModalFrustradoOpen(false)}
                className="px-8 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Fechar Listagem
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* --- MODAL: ANALÍTICOS DE PERFORMANCE --- */}
      {isAnalyticsModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] p-2 sm:p-4 md:p-8 backdrop-blur-sm transition-all flex items-center justify-center">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-h-[95vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200/80 bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
                  <ListChecks size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">Painel de Analíticos</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Performance da Unidade
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsAnalyticsModalOpen(false); setFiltroTecnicoAnalytics(''); }} 
                className="text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 p-2 rounded-xl transition-all active:scale-90 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo Modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50 custom-scrollbar">
              
              {/* Grid Principal de Gráficos */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                
                {/* 1. Ranking de Unidades */}
                <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-4 bg-teal-500 rounded-full"></div>
                      Ranking de Unidades
                    </h3>
                  </div>
                  <div className="flex-1 min-h-[250px] pt-2 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosUnidades} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} isAnimationActive={false}>
                        <defs>
                          <linearGradient id="colorTeal" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#0d9488" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="unidade" 
                          type="category" 
                          width={110} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="url(#colorTeal)" 
                          barSize={20}
                          isAnimationActive={false}
                          shape={<PremiumAnimatedBar />}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Mix de Serviços (Donut) */}
                <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
                   <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-4 bg-slate-700 rounded-full"></div>
                      Mix de Serviços
                    </h3>
                  </div>
                  <div className="flex-1 min-h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie 
                            data={dadosServicos} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="50%" 
                            outerRadius="75%" 
                            paddingAngle={5} 
                            dataKey="value"
                            cornerRadius={12}
                            labelLine={false}
                            isAnimationActive={false}
                            shape={<PremiumDonutSlice activeIndex={activeIndex} />}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                          >
                          {dadosServicos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colorsServicos[index % colorsServicos.length]} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="text-center">
                        <span className="block text-4xl font-black text-slate-800 tracking-tighter">{dadosServicos.reduce((acc, curr) => acc + curr.value, 0)}</span>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Problemas Recorrentes */}
                <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500 rounded-full shadow-sm"></div>
                      Problemas Recorrentes
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {dadosProblemas.map((item, index) => {
                      const maxVal = dadosProblemas[0]?.quantidade || 1;
                      const percentageOfMax = (item.quantidade / maxVal) * 100;
                      
                      return (
                        <div key={index} className="group flex flex-col py-2 px-3 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border 
                                ${index < 3 ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {index + 1}
                              </span>
                              <span className="text-[11px] font-black text-slate-700 truncate tracking-tight uppercase leading-none">
                                {item.problema}
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-slate-900 pl-2">{item.quantidade}</span>
                          </div>
                          
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 transition-all duration-1000"
                              style={{ width: `${percentageOfMax}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Performance por Técnico */}
                {dadosTecnicos.length > 0 && (
                  <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-teal-500 rounded-full shadow-sm"></div>
                        <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">
                          Performance por Técnico
                        </h3>
                        <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 uppercase tracking-widest ml-2 hidden sm:inline-block">
                          {dadosTecnicos.length} {dadosTecnicos.length === 1 ? 'técnico' : 'técnicos'}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={14} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={filtroTecnicoAnalytics}
                          onChange={(e) => setFiltroTecnicoAnalytics(e.target.value)}
                          placeholder="Buscar técnico..."
                          className="w-full sm:w-64 h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-black text-slate-600 shadow-sm transition-all placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                      {dadosTecnicos.filter(tec => tec.nome.toLowerCase().includes(filtroTecnicoAnalytics.toLowerCase())).map((tec, index) => {
                        const maxVal = dadosTecnicos[0]?.total || 1;
                        const percentageOfMax = (tec.total / maxVal) * 100;
                        return (
                          <div key={index} className="group p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shadow-sm ${
                                  index === 0 ? 'bg-teal-600 text-white' : index === 1 ? 'bg-teal-100 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="text-xs font-black text-slate-800 tracking-tight uppercase">{tec.nome}</span>
                              </div>
                              <span className="text-sm font-black text-slate-900">{tec.total}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-1000"
                                style={{ width: `${percentageOfMax}%` }}
                              ></div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(tec.servicos).map(([servico, qtd]) => (
                                <span key={servico} className="text-[8px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">
                                  {servico}: {qtd}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Insight Bar */}
              <div className="bg-slate-800 p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl border border-slate-700/50">
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1.5">Resumo Operacional</p>
                  <p className="text-sm font-black text-slate-200">
                    O volume total é de <span className="text-teal-400">{totalRegistros} agendamentos</span>. 
                    Destaque para <span className="text-amber-400">{dadosUnidades[0]?.unidade || '---'}</span> com a maior demanda.
                  </p>
                </div>
                <button 
                  onClick={() => { setIsAnalyticsModalOpen(false); setFiltroTecnicoAnalytics(''); }}
                  className="w-full md:w-auto px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-400 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        </div>
      , document.body)}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir Ordem de Serviço"
        message="Tem certeza que deseja excluir permanentemente esta O.S.? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Modal de Importação de Agendamentos */}
      <ModalInstrucoesImportacaoAgendamentos 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        unidades={unidadesLista}
        onConfirm={(config) => {
          setSyncConfig(config);
          setIsImportModalOpen(false);
          setTimeout(() => fileInputRef.current.click(), 100);
        }}
      />
    </div>
  );
}




