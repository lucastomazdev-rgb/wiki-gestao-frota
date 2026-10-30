import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';
import {
  WifiOff,
  Wrench,
  Activity,
  BatteryWarning,
  CalendarCheck,
  CalendarClock,
  AlertTriangle,
  Filter,
  ChevronDown,
  Globe,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Building2,
  BarChart3,
  Layers,
  XCircle,
  PlusCircle,
  Edit3,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const ModalNovoAgendamento = lazy(() => import('./agendamentos/ModalNovoAgendamento'));

// Configuracao visual das 4 faixas de cores de agendamento requisitadas
const FAIXAS_SEMAFORO = {
  critico: {
    id: 'critico',
    faixaLabel: '0% a 20%',
    titulo: 'Crítico — Agendar Imediatamente',
    corHex: '#dc2626', // Vermelho Forte (red-600/700)
    bgCard: 'bg-gradient-to-br from-red-600 via-red-700 to-rose-800 text-white border-red-500 shadow-[0_16px_36px_rgba(220,38,38,0.28)]',
    badgeClass: 'bg-red-950/50 text-red-100 border border-red-400/40',
    pillClass: 'bg-red-600 text-white border-red-700 shadow-sm shadow-red-600/30',
    pulseDot: 'bg-red-200'
  },
  alerta: {
    id: 'alerta',
    faixaLabel: '21% a 50%',
    titulo: 'Alerta — Baixa Cobertura de Agendamento',
    corHex: '#f87171', // Vermelho Mais Claro (red-400 / coral)
    bgCard: 'bg-gradient-to-br from-rose-400 via-red-400 to-rose-500 text-white border-rose-300 shadow-[0_16px_36px_rgba(248,113,113,0.25)]',
    badgeClass: 'bg-white/20 text-white border border-white/30',
    pillClass: 'bg-rose-400 text-white border-rose-500 shadow-sm shadow-rose-400/30',
    pulseDot: 'bg-white'
  },
  atencao: {
    id: 'atencao',
    faixaLabel: '51% a 70%',
    titulo: 'Atenção — Avançar nos Agendamentos',
    corHex: '#f59e0b', // Amarelo / Âmbar (amber-500)
    bgCard: 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-[0_16px_36px_rgba(245,158,11,0.24)]',
    badgeClass: 'bg-slate-950/15 text-slate-950 border border-slate-950/20',
    pillClass: 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm shadow-amber-500/30',
    pulseDot: 'bg-slate-900'
  },
  saudavel: {
    id: 'saudavel',
    faixaLabel: '71% a 100%',
    titulo: 'Saudável — Agendamentos em Dia',
    corHex: '#10b981', // Verde (emerald-500)
    bgCard: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-400 shadow-[0_16px_36px_rgba(16,185,129,0.24)]',
    badgeClass: 'bg-emerald-950/30 text-emerald-50 border border-white/25',
    pillClass: 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/30',
    pulseDot: 'bg-emerald-200'
  }
};

const getSemaforoConfig = (pct) => {
  const valor = Number(pct) || 0;
  if (valor <= 20) return FAIXAS_SEMAFORO.critico;
  if (valor <= 50) return FAIXAS_SEMAFORO.alerta;
  if (valor <= 70) return FAIXAS_SEMAFORO.atencao;
  return FAIXAS_SEMAFORO.saudavel;
};

const formatarDataCurta = (val) => {
  if (!val) return '--/--/----';
  const str = String(val).split('T')[0];
  const partes = str.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? '--/--/----' : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// Fatia de Rosca Interativa com a mesma física do Dashboard Solar (sem tooltip flutuante sobrepondo elementos)
const PremiumDonutSlice = React.memo((props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, index, activeIndex
  } = props;

  const isHovered = index === activeIndex;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const explosionDist = isHovered ? 6 : 0;
  const dx = cos * explosionDist;
  const dy = sin * explosionDist;

  return (
    <g className="cursor-pointer outline-none select-none" tabIndex="-1">
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={isHovered ? outerRadius + 5 : outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
        cornerRadius={10}
        style={{
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: isHovered ? 'drop-shadow(0 8px 16px rgba(15,23,42,0.16))' : 'none',
          willChange: 'transform',
          outline: 'none'
        }}
      />
    </g>
  );
});

// Barra Horizontal Personalizada com Deslocamento Lateral Suave e Rótulo Sincronizado (Idêntica ao Dashboard Solar)
const PremiumAnimatedBar = (props) => {
  const { x, y, width, height, fill, payload } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer group outline-none focus:outline-none select-none"
      style={{ outline: 'none' }}
      tabIndex="-1"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={height / 2}
        ry={height / 2}
        className="transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none focus:outline-none"
        style={{
          transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
          filter: isHovered ? 'drop-shadow(0 4px 10px rgba(20, 184, 166, 0.25))' : 'none',
          opacity: isHovered ? 1 : 0.92,
          outline: 'none'
        }}
      />
      <text
        x={x + width + 10}
        y={y + height / 2}
        fill={isHovered ? '#0f172a' : '#64748b'}
        textAnchor="start"
        dominantBaseline="middle"
        className="text-[11px] font-black tracking-tight transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] select-none pointer-events-none"
        style={{
          transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
          fontWeight: isHovered ? 900 : 700
        }}
      >
        {payload.total_falhas}
      </text>
    </g>
  );
};

// Gráfico de Barras Top 5 Unidades (Apenas Nome da Unidade e Quantidade de Placas em Falha)
const Top5UnidadesBarChart = React.memo(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
        Sem unidades registradas
      </div>
    );
  }

  return (
    <div className="h-[320px] sm:h-[360px] w-full select-none outline-none">
      <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none select-none">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 65, left: 20, bottom: 0 }}
          className="outline-none focus:outline-none select-none"
          style={{ outline: 'none' }}
        >
          <defs>
            <linearGradient id="colorTop5FalhasBarSolar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="unidade"
            type="category"
            width={130}
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="total_falhas"
            fill="url(#colorTop5FalhasBarSolar)"
            barSize={22}
            className="outline-none focus:outline-none"
            style={{ outline: 'none' }}
            shape={<PremiumAnimatedBar />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// Skeleton de Carregamento
const AnalyticsSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse w-full max-w-[1440px] mx-auto px-2 sm:px-6">
    <div className="h-20 bg-slate-200/70 rounded-3xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-40 bg-slate-200/70 rounded-3xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-6 h-[440px] bg-slate-200/70 rounded-3xl" />
      <div className="lg:col-span-6 h-[440px] bg-slate-200/70 rounded-3xl" />
    </div>
    <div className="h-80 bg-slate-200/70 rounded-3xl" />
  </div>
);

export default function DashboardAnaliticoFalhas() {
  const [filtroUF, setFiltroUF] = useState('TODOS');
  const [filtroUnidade, setFiltroUnidade] = useState('TODAS');
  const [isUfDropdownOpen, setIsUfDropdownOpen] = useState(false);
  const [activeDonutIndex, setActiveDonutIndex] = useState(null);
  const [mostrarPlacasPendentes, setMostrarPlacasPendentes] = useState(false);
  const [agendamentoModalData, setAgendamentoModalData] = useState(null);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);

  const ufDropdownRef = useRef(null);

  // Fechar dropdown UF ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (ufDropdownRef.current && !ufDropdownRef.current.contains(e.target)) {
        setIsUfDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    data: analyticsData,
    isLoading,
    isFetching,
    refetch,
    error
  } = useQuery({
    queryKey: ['gestao-solar', 'falhas-analytics', filtroUF, filtroUnidade],
    queryFn: async () => {
      const params = {};
      if (filtroUF && filtroUF !== 'TODOS') params.uf = filtroUF;
      if (filtroUnidade && filtroUnidade !== 'TODAS') params.unidade = filtroUnidade;
      const res = await api.get('/gestao-solar/falhas/analytics', { params });
      return res.data?.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  const lote = analyticsData?.lote || null;
  const kpis = analyticsData?.kpis || {
    total_falhas: 0,
    falhas_reais: 0,
    total_frota: 0,
    saude_frota_pct: 100,
    proporcao_falha_real_pct: 0,
    bateria_critica: { total: 0, CAM: 0, MOT: 0, VID: 0, OUTROS: 0 }
  };
  const cobertura = analyticsData?.cobertura_agendamentos || {
    total_falhas_reais: 0,
    presentes_em_agendamentos: 0,
    confirmados_agendado: 0,
    presentes_outro_status: 0,
    ausentes_em_agendamentos: 0,
    pendentes_agendar: 0,
    pct_agendado: 100,
    pct_pendente: 0,
    faixa_cor: 'saudavel',
    placas_detalhe: []
  };
  const top5Unidades = analyticsData?.top_5_unidades || [];
  const distribuicaoTratativas = analyticsData?.distribuicao_tratativas || [];
  const ufsDisponiveis = analyticsData?.filtros_disponiveis?.ufs || [];
  const unidadesDisponiveis = analyticsData?.filtros_disponiveis?.unidades || [];

  const semaforo = useMemo(
    () => getSemaforoConfig(cobertura.pct_agendado),
    [cobertura.pct_agendado]
  );

  // Dados para a Rosca Comparativa de Agendamentos
  const dadosRoscaAgendamento = useMemo(() => {
    if (cobertura.total_falhas_reais === 0) {
      return [{ name: 'Sem Pendências', shortLabel: 'Em Dia', value: 1, color: '#10b981' }];
    }
    const items = [
      {
        name: 'Agendado',
        shortLabel: 'Agendado',
        value: cobertura.confirmados_agendado,
        color: semaforo.corHex
      }
    ];
    if (cobertura.presentes_outro_status > 0) {
      items.push({
        name: 'Outro Status',
        shortLabel: 'Outro Status',
        value: cobertura.presentes_outro_status,
        color: '#f59e0b'
      });
    }
    if (cobertura.ausentes_em_agendamentos > 0) {
      items.push({
        name: 'Sem Registro',
        shortLabel: 'Sem Agenda',
        value: cobertura.ausentes_em_agendamentos,
        color: '#334155'
      });
    }
    return items.filter((i) => i.value > 0);
  }, [cobertura, semaforo]);

  const fatiaAtivaDonut =
    activeDonutIndex !== null && dadosRoscaAgendamento[activeDonutIndex]
      ? dadosRoscaAgendamento[activeDonutIndex]
      : null;

  // Placas pendentes de estar com status "Agendado" (Ordenadas por Unidade de A-Z)
  const placasPendentesLista = useMemo(
    () =>
      (cobertura.placas_detalhe || [])
        .filter((p) => p.situacao_agendamento !== 'AGENDADO')
        .sort((a, b) => {
          const cmpUnidade = String(a.unidade || '').localeCompare(String(b.unidade || ''), 'pt-BR', {
            sensitivity: 'base'
          });
          if (cmpUnidade !== 0) return cmpUnidade;
          return String(a.placa || '').localeCompare(String(b.placa || ''), 'pt-BR', {
            sensitivity: 'base'
          });
        }),
    [cobertura.placas_detalhe]
  );

  const handleAbrirNovoAgendamento = (item) => {
    setAgendamentoParaEditar(null);
    setAgendamentoModalData({
      falha_id: item.id,
      placa: item.placa,
      unidade: item.unidade,
      uf: item.uf,
      tipo_veiculo: item.tipo_veiculo,
      numero_os: item.ordem_servico || '',
      servico: 'Manutenção'
    });
    setIsAgendamentoModalOpen(true);
  };

  const handleAbrirEditarAgendamento = (item) => {
    if (!item?.ultimo_agendamento) return;
    setAgendamentoModalData(null);
    setAgendamentoParaEditar({
      ...item.ultimo_agendamento,
      placa: item.ultimo_agendamento.placa || item.placa,
      unidade: item.ultimo_agendamento.unidade || item.unidade,
      uf: item.ultimo_agendamento.uf || item.uf,
      tipo_veiculo: item.ultimo_agendamento.tipo_veiculo || item.tipo_veiculo
    });
    setIsAgendamentoModalOpen(true);
  };

  const handleExportarRelatorio = async () => {
    if (!lote) {
      toast.error('Nenhum lote de falhas disponível para exportar.');
      return;
    }

    const toastId = toast.loading('Gerando planilha analítica...');
    try {
      const XLSX = await import('xlsx');

      const resumoSheet = [
        {
          'Data da Última Extração': formatarDataCurta(lote.data_extracao),
          'Filtro UF': filtroUF === 'TODOS' ? 'Brasil (Todas)' : filtroUF,
          'Filtro Unidade': filtroUnidade === 'TODAS' ? 'Todas' : filtroUnidade,
          'Total Frota (Instalações)': kpis.total_frota,
          'Total de Falhas (Última Data)': kpis.total_falhas,
          'Falhas Reais (Aguard. Técnico / Agend. Manutenção)': kpis.falhas_reais,
          'Saúde da Frota (%)': `${kpis.saude_frota_pct}%`,
          'Em Falha Real (%)': `${kpis.proporcao_falha_real_pct}%`,
          'Bateria Crítica Total (<11V)': kpis.bateria_critica.total,
          'Bateria Crítica CAM': kpis.bateria_critica.CAM,
          'Bateria Crítica MOT': kpis.bateria_critica.MOT,
          'Bateria Crítica VID': kpis.bateria_critica.VID,
          'Falhas Reais Agendadas (Status Agendado)': cobertura.confirmados_agendado,
          'Falhas Reais Pendentes de Agendar': cobertura.pendentes_agendar,
          '% Cobertura de Agendamento': `${cobertura.pct_agendado}%`
        }
      ];

      const placasReaisSheet = (cobertura.placas_detalhe || []).map((p) => ({
        'Placa': p.placa,
        'Unidade': p.unidade,
        'UF': p.uf,
        'Categoria': p.categoria_veiculo,
        'Status Tratativa (Falhas)': p.status_tratativa,
        'Bateria': p.nivel_bateria || 'S/ Bat',
        'Situação em Agendamentos':
          p.situacao_agendamento === 'AGENDADO'
            ? 'Confirmado (Agendado)'
            : p.situacao_agendamento === 'OUTRO_STATUS'
              ? `Em Agendamentos (${p.ultimo_agendamento?.status || 'Outro Status'})`
              : 'Ausente na tela de Agendamentos',
        'Último Status na Agenda': p.ultimo_agendamento?.status || 'Não cadastrado',
        'Data do Agendamento': p.ultimo_agendamento?.data_agendamento
          ? formatarDataCurta(p.ultimo_agendamento.data_agendamento)
          : '',
        'Técnico': p.ultimo_agendamento?.nome_tecnico || '',
        'Ordem de Serviço': p.ordem_servico || ''
      }));

      const wb = XLSX.utils.book_new();
      const wsResumo = XLSX.utils.json_to_sheet(resumoSheet);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo KPIs');

      if (placasReaisSheet.length > 0) {
        const wsPlacas = XLSX.utils.json_to_sheet(placasReaisSheet);
        XLSX.utils.book_append_sheet(wb, wsPlacas, 'Falhas Reais x Agenda');
      }

      const dataArquivo = lote.data_extracao
        ? new Date(lote.data_extracao).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      XLSX.writeFile(wb, `analitico_falhas_solar_${dataArquivo}.xlsx`);
      toast.success('Relatório analítico exportado com sucesso!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar planilha Excel.', { id: toastId });
    }
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-rose-100 text-center max-w-lg mx-auto shadow-xl">
        <Activity size={40} className="mx-auto text-rose-500 mb-3" />
        <h3 className="text-lg font-black text-slate-800">Falha ao carregar o Painel Analítico</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Não foi possível sincronizar os indicadores de falhas e agendamentos.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
        >
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-[1440px] mx-auto px-2 sm:px-6 animate-in fade-in duration-300">
      {/* BARRA DE CABEÇALHO, DATA DA ÚLTIMA EXTRAÇÃO E FILTROS (Identidade Dashboard Solar) */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-white/85 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white shadow-xl shadow-slate-200/50 gap-4 relative z-30">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {/* Seletor UF */}
          <div className="flex items-center gap-3 relative" ref={ufDropdownRef}>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl shrink-0 border border-teal-100">
              <Filter size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Filtro Regional (UF)
              </p>
              <button
                type="button"
                onClick={() => setIsUfDropdownOpen(!isUfDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-xl hover:bg-slate-100/80 transition-all group cursor-pointer"
              >
                <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors">
                  {filtroUF !== 'TODOS' ? `Estado: ${filtroUF}` : 'Brasil (Todas as UFs)'}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ${
                    isUfDropdownOpen ? 'rotate-180 text-teal-600' : ''
                  }`}
                />
              </button>
            </div>

            {isUfDropdownOpen && (
              <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroUF('TODOS');
                      setFiltroUnidade('TODAS');
                      setIsUfDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      filtroUF === 'TODOS'
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                        : 'bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={15} /> Brasil Completo
                    </span>
                  </button>

                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 pt-1">
                    Selecione um Estado:
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {ufsDisponiveis.map((uf) => (
                      <button
                        type="button"
                        key={uf}
                        onClick={() => {
                          setFiltroUF(uf);
                          setFiltroUnidade('TODAS');
                          setIsUfDropdownOpen(false);
                        }}
                        className={`py-2 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                          filtroUF === uf
                            ? 'bg-teal-600 text-white border-teal-500 shadow-md scale-[1.02]'
                            : 'bg-white text-slate-600 border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/70 hover:text-teal-700'
                        }`}
                      >
                        {uf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-200/80" />

          {/* Seletor de Unidade */}
          <div className="flex items-center gap-2.5 min-w-[220px]">
            <Building2 size={18} className="text-teal-600 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Unidade Operacional
              </span>
              <select
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
              >
                <option value="TODAS">Todas as Unidades</option>
                {unidadesDisponiveis.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Badge Data Mais Recente + Ações */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 sm:gap-3 shrink-0">
          {lote && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-teal-50/90 border border-teal-200/80 rounded-2xl text-xs font-black text-teal-800">
              <Clock size={14} className="text-teal-600 shrink-0" />
              <span>Última Data de Falhas: {formatarDataCurta(lote.data_extracao)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-2xl transition-all disabled:opacity-50 cursor-pointer"
            title="Atualizar Indicadores"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin text-teal-600' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportarRelatorio}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-teal-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-teal-600/25 active:scale-95 group cursor-pointer"
          >
            <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <FileSpreadsheet size={15} className="text-teal-400 group-hover:text-white" />
            </div>
            Exportar Relatório Excel
            <Download size={13} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* TOPO DA PÁGINA: 4 SUPER KPIs REQUISITADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Número Total de Falhas (Última Data) */}
        <div className="bg-white/95 backdrop-blur-lg p-6 rounded-3xl border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-slate-200/70 transition-colors pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3.5 bg-slate-100 text-slate-700 rounded-2xl ring-1 ring-slate-200/80 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-inner">
                <WifiOff size={22} strokeWidth={2.4} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
                {lote ? `Ref: ${formatarDataCurta(lote.data_extracao)}` : 'Sem Lote'}
              </span>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight relative z-10">
              {kpis.total_falhas.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">
              Total de Falhas (Última Data)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 relative z-10">
            <span>Base total da extração</span>
            <span className="text-slate-700 font-black">100% do lote</span>
          </div>
        </div>

        {/* KPI 2: Número Real de Falhas (Aguardando Técnico / Agendado Manutenção) */}
        <div className="bg-white/95 backdrop-blur-lg p-6 rounded-3xl border border-amber-200/70 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-amber-100/80 transition-colors pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl ring-1 ring-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-inner">
                <Wrench size={22} strokeWidth={2.4} />
              </div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                Falhas Reais
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 relative z-10">
              <p className="text-4xl font-black text-slate-800 tracking-tight">
                {kpis.falhas_reais.toLocaleString('pt-BR')}
              </p>
              <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                {kpis.total_falhas > 0
                  ? `${((kpis.falhas_reais / kpis.total_falhas) * 100).toFixed(1)}% das falhas`
                  : '0%'}
              </span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">
              Número Real de Falhas
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-amber-700 uppercase tracking-wider relative z-10">
            <span>Aguardando Técnico + Agendado Manut.</span>
          </div>
        </div>

        {/* KPI 3: Saúde da Frota (% de Funcionamento da Frota sobre tabela instalacoes) */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 p-6 rounded-3xl border border-emerald-400/50 shadow-[0_14px_34px_rgba(16,185,129,0.22)] hover:shadow-[0_18px_42px_rgba(16,185,129,0.3)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group text-white flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/15 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3.5 bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/30 shadow-inner">
                <Activity size={22} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest bg-emerald-200/95 px-2.5 py-1 rounded-lg shadow-xs">
                Frota: {kpis.total_frota.toLocaleString('pt-BR')} veíc.
              </span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight relative z-10">
              {String(kpis.saude_frota_pct).replace('.', ',')}
              <span className="text-2xl opacity-85">%</span>
            </p>
            <p className="text-[11px] font-black text-emerald-50/90 uppercase tracking-widest mt-1 relative z-10">
              Saúde da Frota (Em Funcionamento)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] font-bold text-emerald-50 relative z-10">
            <span>Em Falha Real de Comunicação:</span>
            <span className="font-black bg-black/20 px-2 py-0.5 rounded-md">
              {String(kpis.proporcao_falha_real_pct).replace('.', ',')}% ({kpis.falhas_reais}/{kpis.total_frota})
            </span>
          </div>
        </div>

        {/* KPI 4: Bateria Crítica (< 11.0V) separado por CAM, MOT, VID */}
        <div className="bg-gradient-to-bl from-slate-900 via-slate-800 to-slate-950 p-6 rounded-3xl shadow-xl hover:shadow-[0_16px_40px_rgba(15,23,42,0.3)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group text-white border border-slate-700 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-rose-500/30 transition-colors pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3.5 bg-slate-800/90 backdrop-blur-md text-rose-400 rounded-2xl border border-rose-500/30 group-hover:border-rose-500/60 shadow-inner">
                <BatteryWarning size={22} strokeWidth={2.4} />
              </div>
              <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-lg shadow-xs">
                &lt; 11.0V Crítica
              </span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight relative z-10">
              {kpis.bateria_critica.total.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">
              Falhas com Bateria Crítica
            </p>
          </div>
          <div className="flex items-center justify-between gap-1.5 mt-4 pt-3 border-t border-slate-700/60 relative z-10">
            <span
              className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30 flex-1 text-center"
              title="Caminhões com bateria < 11V"
            >
              CAM {kpis.bateria_critica.CAM}
            </span>
            <span
              className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex-1 text-center"
              title="Motos com bateria < 11V"
            >
              MOT {kpis.bateria_critica.MOT}
            </span>
            <span
              className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 flex-1 text-center"
              title="Vídeo com bateria < 11V"
            >
              VID {kpis.bateria_critica.VID}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: COBERTURA DE AGENDAMENTOS + GRÁFICO DE BARRAS TOP 5 UNIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* COLUNA ESQUERDA (6/12): COBERTURA DE AGENDAMENTOS (FALHAS REAIS) */}
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Cabeçalho Limpo do Card Comparativo */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                <div
                  className="p-3 rounded-2xl text-white shadow-md transition-colors shrink-0"
                  style={{ backgroundColor: semaforo.corHex }}
                >
                  <CalendarCheck size={22} strokeWidth={2.4} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Cobertura de Agendamentos (Falhas Reais)
                </h3>
              </div>

              {/* Pílula Semafórica Dinâmica */}
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${semaforo.pillClass}`}
              >
                <span className={`w-2 h-2 rounded-full animate-ping ${semaforo.pulseDot}`} />
                Faixa {semaforo.faixaLabel}
              </span>
            </div>

            {/* Banner Colorido Dinâmico (Sem o quadrado lateral de legenda das faixas) */}
            <div className={`p-5 rounded-3xl border transition-all duration-500 mb-6 ${semaforo.bgCard}`}>
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md mb-2 ${semaforo.badgeClass}`}>
                {semaforo.titulo}
              </span>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                  {String(cobertura.pct_agendado).replace('.', ',')}%
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider opacity-95">
                  Agendadas ({cobertura.confirmados_agendado} de {cobertura.total_falhas_reais})
                </span>
              </div>
              <p className="text-xs font-bold opacity-95 mt-1.5">
                {cobertura.total_falhas_reais > 0 ? (
                  <>
                    Restam{' '}
                    <strong className="underline decoration-2">
                      {String(cobertura.pct_pendente).replace('.', ',')}% ({cobertura.pendentes_agendar} placas)
                    </strong>{' '}
                    que precisamos agendar o quanto antes.
                  </>
                ) : (
                  'Nenhuma placa em Falha Real pendente no filtro atual.'
                )}
              </p>
            </div>

            {/* Rosca Comparativa (Sem Tooltip sobrepondo elementos) + Barras de Progresso */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Gráfico Donut */}
              <div className="sm:col-span-5 h-[200px] relative select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart onMouseLeave={() => setActiveDonutIndex(null)}>
                    <Pie
                      data={dadosRoscaAgendamento}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      cornerRadius={8}
                      stroke="none"
                      onMouseEnter={(_, idx) => setActiveDonutIndex(idx)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                      shape={<PremiumDonutSlice activeIndex={activeDonutIndex} />}
                    >
                      {dadosRoscaAgendamento.map((entry, idx) => (
                        <Cell key={`cell-ag-${idx}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-center px-2">
                    {fatiaAtivaDonut ? (
                      <>
                        <span
                          className="block text-2xl font-black tracking-tighter"
                          style={{ color: fatiaAtivaDonut.color }}
                        >
                          {fatiaAtivaDonut.value}
                        </span>
                        <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                          {fatiaAtivaDonut.shortLabel}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className="block text-2xl font-black tracking-tighter"
                          style={{ color: semaforo.corHex }}
                        >
                          {String(cobertura.pct_agendado).replace('.', ',')}%
                        </span>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Agendado
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Etapas Diretas */}
              <div className="sm:col-span-7 space-y-3">
                {/* Etapa 1: Total Falhas Reais */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1.5">
                    <span>1. Total de Falhas Reais</span>
                    <span>{cobertura.total_falhas_reais} placas (100%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-700 rounded-full w-full" />
                  </div>
                </div>

                {/* Etapa 2: Presentes na tabela de Agendamentos */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs font-black text-slate-700 mb-1.5">
                    <span>2. Presentes em Agendamentos</span>
                    <span>
                      {cobertura.presentes_em_agendamentos} de {cobertura.total_falhas_reais} placas
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${
                          cobertura.total_falhas_reais > 0
                            ? (cobertura.presentes_em_agendamentos / cobertura.total_falhas_reais) * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>

                {/* Etapa 3: Com último status === "Agendado" */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs font-black text-slate-800 mb-1.5">
                    <span>3. Status &quot;Agendado&quot;</span>
                    <span style={{ color: semaforo.corHex }}>
                      {cobertura.confirmados_agendado} placas ({String(cobertura.pct_agendado).replace('.', ',')}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cobertura.pct_agendado}%`,
                        backgroundColor: semaforo.corHex
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé do Card: Botão para inspecionar e agendar as placas que faltam */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-500">
              Precisamos agendar:{' '}
              <span className="font-black text-slate-800">
                {cobertura.pendentes_agendar} placa(s) ({String(cobertura.pct_pendente).replace('.', ',')}%)
              </span>
            </div>
            {placasPendentesLista.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarPlacasPendentes((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                {mostrarPlacasPendentes ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>
                  {mostrarPlacasPendentes
                    ? 'Ocultar Pendentes'
                    : `Ver ${placasPendentesLista.length} Placa(s) Pendentes`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (6/12): GRÁFICO DE BARRAS TOP 5 UNIDADES COM MAIOR NÚMERO DE FALHAS */}
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/60 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Top 5 Unidades com Maior Número de Falhas
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Concentração de placas em falha por unidade operacional
                </p>
              </div>
            </div>

            <Top5UnidadesBarChart data={top5Unidades} />
          </div>
        </div>
      </div>

      {/* GAVETA EXPANSÍVEL: LISTA ACIONÁVEL DAS PLACAS EM FALHA REAL QUE AINDA NÃO ESTÃO COMO "AGENDADO" */}
      {mostrarPlacasPendentes && placasPendentesLista.length > 0 && (
        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-rose-200 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <CalendarClock size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800">
                  Placas em Falha Real Pendentes de Status &quot;Agendado&quot; ({placasPendentesLista.length})
                </h4>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-3">Placa</th>
                  <th className="py-3 px-3">Unidade / UF</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Tratativa em Falhas</th>
                  <th className="py-3 px-3">Situação em Agendamentos</th>
                  <th className="py-3 px-3 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {placasPendentesLista.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-slate-900">{item.placa}</td>
                    <td className="py-3 px-3 font-bold text-slate-700">
                      {item.unidade} {item.uf ? <span className="text-slate-400">({item.uf})</span> : ''}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700">
                        {item.categoria_veiculo}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.status_tratativa}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {item.situacao_agendamento === 'SEM_REGISTRO' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={13} /> Não aparece em Agendamentos
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle size={13} /> Status: {item.ultimo_agendamento?.status}
                          {item.ultimo_agendamento?.data_agendamento
                            ? ` (${formatarDataCurta(item.ultimo_agendamento.data_agendamento)})`
                            : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.situacao_agendamento === 'SEM_REGISTRO' || !item.ultimo_agendamento ? (
                        <button
                          type="button"
                          onClick={() => handleAbrirNovoAgendamento(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          <PlusCircle size={13} /> Agendar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarAgendamento(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          <Edit3 size={13} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO COMPLEMENTAR: DISTRIBUIÇÃO DE TRATATIVAS DO LOTE MAIS RECENTE */}
      <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl shadow-inner">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Concentração por Status de Tratativa (Última Data)
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Destaque para as tratativas contabilizadas no KPI de Falhas Reais
              </p>
            </div>
          </div>
        </div>

        {distribuicaoTratativas.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
            Nenhuma tratativa computada para os filtros atuais
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {distribuicaoTratativas.map((item) => {
              const maxQtd = distribuicaoTratativas[0]?.quantidade || 1;
              const widthPct = Math.max(4, (item.quantidade / maxQtd) * 100);
              return (
                <div
                  key={item.status}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.is_falha_real
                      ? 'bg-amber-50/50 border-amber-200/80'
                      : 'bg-slate-50/60 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                        {item.status}
                      </span>
                      {item.is_falha_real && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">
                          Falha Real
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-500">{item.quantidade} veíc.</span>
                      <span
                        className={`text-xs font-black ${
                          item.is_falha_real ? 'text-amber-600' : 'text-teal-600'
                        }`}
                      >
                        {String(item.percentual).replace('.', ',')}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: item.is_falha_real ? '#f59e0b' : '#14b8a6'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Novo / Edição de Agendamento acionado direto pela lista de Falhas Reais pendentes */}
      {isAgendamentoModalOpen && (
        <Suspense fallback={null}>
          <ModalNovoAgendamento
            key={agendamentoParaEditar?.id || agendamentoModalData?.placa || 'novo'}
            isOpen={isAgendamentoModalOpen}
            onClose={() => {
              setIsAgendamentoModalOpen(false);
              setAgendamentoModalData(null);
              setAgendamentoParaEditar(null);
            }}
            agendamentoParaEditar={agendamentoParaEditar}
            dadosIniciais={agendamentoModalData}
            onSuccess={() => {
              setIsAgendamentoModalOpen(false);
              setAgendamentoModalData(null);
              setAgendamentoParaEditar(null);
              refetch();
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
