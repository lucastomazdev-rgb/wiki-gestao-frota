import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';
import { 
  Truck, Bike, Video, Activity, DollarSign, Filter, TrendingUp, BarChart3, 
  PieChart as PieChartIcon, Download, FileSpreadsheet, ChevronDown, Globe, 
  RefreshCw, Building2, Layers
} from 'lucide-react'; 
import toast from 'react-hot-toast';

// Paleta corporativa premium Gestão Solar (Banimento estrito de roxo/violeta)
const COLORS = ['#14b8a6', '#10b981', '#0284c7', '#f59e0b', '#06b6d4', '#f43f5e', '#64748b'];

// Tooltip Personalizado Glassmorphism
const CustomRechartsTooltip = ({ active, payload, label, isCurrency = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.14)] min-w-[180px] z-50">
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-wider mb-2.5 border-b border-slate-100 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" 
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-600 font-bold text-xs truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="text-slate-900 font-extrabold text-xs">
                {isCurrency 
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)
                  : Number(entry.value).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Barra Horizontal Personalizada com Deslocamento Lateral Suave e Rótulo Sincronizado
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
        fill={isHovered ? "#0f172a" : "#64748b"} 
        textAnchor="start" 
        dominantBaseline="middle" 
        className="text-[11px] font-black tracking-tight transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] select-none pointer-events-none"
        style={{ 
          transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
          fontWeight: isHovered ? 900 : 700
        }}
      >
        {payload.Quantidade}
      </text>
    </g>
  );
};

// Fatia de Pizza/Rosca Premium (Explosão Suave no Hover)
const PremiumDonutSlice = React.memo((props) => {
  const RADIAN = Math.PI / 180;
  const { 
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, 
    fill, payload, percent, index, activeIndex 
  } = props;
  
  const isHovered = index === activeIndex;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const explosionDist = isHovered ? 6 : 0;
  const dx = cos * explosionDist;
  const dy = sin * explosionDist;

  return (
    <g className="cursor-pointer outline-none focus:outline-none select-none" style={{ outline: 'none' }} tabIndex="-1">
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={isHovered ? outerRadius + 4 : outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
        tabIndex="-1"
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: isHovered ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' : 'none',
          willChange: 'transform',
          outline: 'none'
        }}
      />
      <text 
        x={cx + (outerRadius + 22) * cos} 
        y={cy + (outerRadius + 22) * sin} 
        fill={isHovered ? "#0f172a" : "#64748b"} 
        textAnchor={cos > 0 ? 'start' : 'end'} 
        dominantBaseline="middle" 
        className="text-[10px] font-black tracking-tight select-none pointer-events-none"
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isHovered ? 1 : 0.7,
          willChange: 'transform'
        }}
      >
        {`${payload.name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
});

// Gráfico de Rosca Isolado (Memoizado para Alta Performance)
const FleetDistributionChart = React.memo(({ data, total }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] sm:h-[320px] flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
        Sem dados de distribuição
      </div>
    );
  }

  return (
    <div className="h-[280px] sm:h-[320px] relative select-none outline-none">
      <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none select-none">
        <PieChart onMouseLeave={() => setActiveIndex(null)} className="outline-none focus:outline-none select-none" style={{ outline: 'none' }}>
          <Pie 
            data={data} 
            cx="50%" cy="50%" 
            innerRadius={68} outerRadius={100} 
            paddingAngle={5} 
            dataKey="value"
            cornerRadius={10}
            stroke="none"
            className="outline-none focus:outline-none select-none"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            shape={<PremiumDonutSlice activeIndex={activeIndex} />}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="outline-none focus:outline-none"
                style={{ outline: 'none' }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
        <div className="text-center">
          <span className="block text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter">
            {total.toLocaleString('pt-BR')}
          </span>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80">
            Total Ativo
          </span>
        </div>
      </div>
    </div>
  );
});

// Gráfico Top 10 Unidades (Memoizado)
const TopUnidadesChart = React.memo(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] sm:h-[360px] flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
        Sem unidades registradas
      </div>
    );
  }

  return (
    <div className="h-[300px] sm:h-[360px] select-none outline-none">
      <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none select-none">
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ top: 10, right: 65, left: 20, bottom: 0 }}
          className="outline-none focus:outline-none select-none"
          style={{ outline: 'none' }}
        >
          <defs>
            <linearGradient id="colorUnidadesSolar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.85}/>
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Bar 
            dataKey="Quantidade" 
            fill="url(#colorUnidadesSolar)" 
            barSize={18}
            className="outline-none focus:outline-none"
            style={{ outline: 'none' }}
            shape={<PremiumAnimatedBar />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// Gráfico de Mensalidade Acumulada - Período de 1 Ano (Memoizado)
const ReceitaMoMChart = React.memo(({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] sm:h-[340px] flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
        Sem histórico temporal no período
      </div>
    );
  }

  return (
    <div className="h-[280px] sm:h-[340px] w-full mt-2 select-none outline-none">
      <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none select-none">
        <AreaChart 
          data={data} 
          margin={{ top: 15, right: 15, left: 5, bottom: 25 }}
          className="outline-none focus:outline-none select-none"
          style={{ outline: 'none' }}
        >
          <defs>
            <linearGradient id="colorMoMSolar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
            dy={12} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
            width={75} 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <RechartsTooltip content={<CustomRechartsTooltip isCurrency={true} />} />
          <Area 
            type="monotone" 
            dataKey="valor" 
            name="Mensalidade Acumulada" 
            stroke="#10b981" 
            strokeWidth={3.5} 
            fillOpacity={1} 
            fill="url(#colorMoMSolar)" 
            activeDot={{ r: 7, strokeWidth: 2, stroke: '#ffffff', fill: '#059669' }} 
            className="outline-none focus:outline-none"
            style={{ outline: 'none' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

// Skeletons de Carregamento
const DashboardSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse w-full max-w-[1440px] mx-auto px-2 sm:px-6">
    <div className="h-20 bg-slate-200/70 rounded-3xl" />
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-28 bg-slate-200/70 rounded-3xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div className="h-32 bg-slate-200/70 rounded-3xl" />
      <div className="h-32 bg-slate-200/70 rounded-3xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-8">
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
      </div>
      <div className="lg:col-span-5 h-[700px] bg-slate-200/70 rounded-3xl" />
    </div>
    <div className="h-96 bg-slate-200/70 rounded-3xl" />
  </div>
);

export default function DashboardSolar() {
  const [filtroUF, setFiltroUF] = useState('');
  const [isUfDropdownOpen, setIsUfDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Consulta React Query para buscar instalações completas com cache de 5 minutos
  const { 
    data: todosVeiculos = [], 
    isLoading, 
    isFetching, 
    refetch, 
    error 
  } = useQuery({
    queryKey: ['gestao-solar', 'dashboard-instalacoes'],
    queryFn: async () => {
      const response = await api.get('/instalacoes');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Lista de UFs disponíveis
  const ufsDisponiveis = useMemo(() => {
    const setUfs = new Set();
    todosVeiculos.forEach(v => {
      const uf = v.unidades_clientes?.uf?.trim()?.toUpperCase();
      if (uf) setUfs.add(uf);
    });
    return Array.from(setUfs).sort();
  }, [todosVeiculos]);

  // Fechar dropdown de UF ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUfDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatação de Moeda BRL
  const formatarMoeda = useCallback((valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }, []);

  // Agregações analíticas e cálculo da linha de 1 ano
  const stats = useMemo(() => {
    const dadosFiltrados = filtroUF 
      ? todosVeiculos.filter(v => v.unidades_clientes?.uf?.trim()?.toUpperCase() === filtroUF)
      : todosVeiculos;

    let totais = { total: dadosFiltrados.length, caminhoes: 0, motos: 0, videos: 0, mensalidade: 0, instalacao: 0 };
    let unidadesCount = {};
    let tipoVeiculoCount = {};
    const ufDistribution = {};

    // Helper para normalizar tipo de veículo
    const normalizarTipo = (rawTipo) => {
      const t = String(rawTipo || '').toUpperCase();
      if (t.includes('CAMINH') || t.includes('PESAD') || t.includes('CARRETA')) return 'CAMINHÃO';
      if (t.includes('MOTO')) return 'MOTO';
      if (t.includes('VÍDEO') || t.includes('VIDEO') || t.includes('CÂMER') || t.includes('CAMER') || t.includes('DASH')) return 'VÍDEO';
      return t || 'OUTROS';
    };

    dadosFiltrados.forEach(item => {
      const tipo = normalizarTipo(item.modelos_rastreadores?.tipo_veiculo);
      const valorMensalidade = Number(item.modelos_rastreadores?.valor_mensalidade) || 0;
      const valorInstalacao = Number(item.modelos_rastreadores?.valor_instalacao) || 0;
      const unidade = item.unidades_clientes?.nome_unidade || 'Sem Unidade';
      const uf = item.unidades_clientes?.uf?.trim()?.toUpperCase() || 'N/A';
      
      if (tipo === 'CAMINHÃO') totais.caminhoes++;
      else if (tipo === 'MOTO') totais.motos++;
      else if (tipo === 'VÍDEO') totais.videos++;

      totais.mensalidade += valorMensalidade;
      totais.instalacao += valorInstalacao;

      unidadesCount[unidade] = (unidadesCount[unidade] || 0) + 1;
      tipoVeiculoCount[tipo] = (tipoVeiculoCount[tipo] || 0) + 1;

      // Matriz por UF
      if (!ufDistribution[uf]) {
        ufDistribution[uf] = { uf, CAMINHÃO: 0, MOTO: 0, VÍDEO: 0, TOTAL: 0 };
      }
      if (tipo === 'CAMINHÃO') ufDistribution[uf].CAMINHÃO++;
      else if (tipo === 'MOTO') ufDistribution[uf].MOTO++;
      else if (tipo === 'VÍDEO') ufDistribution[uf].VÍDEO++;
      ufDistribution[uf].TOTAL++;
    });

    // Top 10 Unidades
    const topUnidades = Object.entries(unidadesCount)
      .map(([name, Quantidade]) => ({ name, Quantidade }))
      .sort((a, b) => b.Quantidade - a.Quantidade)
      .slice(0, 10);

    // Tipos de Veículos para Rosca
    const tipoVeiculoData = Object.entries(tipoVeiculoCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Matriz Ordenada
    const matrizUF = Object.values(ufDistribution).sort((a, b) => {
      if (a.TOTAL !== b.TOTAL) return b.TOTAL - a.TOTAL;
      return a.uf.localeCompare(b.uf);
    });

    // =========================================================================
    // CÁLCULO ESPECÍFICO REQUISITADO: GRÁFICO DE LINHA DE 1 ANO (12 MESES)
    // =========================================================================
    let maxTimestamp = Date.now();
    dadosFiltrados.forEach(item => {
      if (item.data_instalacao) {
        const d = new Date(item.data_instalacao);
        if (!isNaN(d.getTime()) && d.getTime() > maxTimestamp) {
          maxTimestamp = d.getTime();
        }
      }
    });

    const anchorDate = new Date(maxTimestamp);
    const endYear = anchorDate.getFullYear();
    const endMonth = anchorDate.getMonth();

    // Construção dos 12 meses cronológicos retroativos
    const ultimos12Meses = [];
    const mapAnoMesIndex = new Map();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(endYear, endMonth - i, 1);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anoMes = `${ano}-${mes}`;
      const label = `${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()} ${ano}`;
      mapAnoMesIndex.set(anoMes, ultimos12Meses.length);
      ultimos12Meses.push({ anoMes, label, valorAdicionado: 0, novos: 0 });
    }

    const primeiroAnoMes = ultimos12Meses[0].anoMes;
    let baseAcumulada = 0;

    dadosFiltrados.forEach(item => {
      const valor = Number(item.modelos_rastreadores?.valor_mensalidade) || 0;
      if (!item.data_instalacao) {
        baseAcumulada += valor;
        return;
      }
      const d = new Date(item.data_instalacao);
      if (isNaN(d.getTime())) {
        baseAcumulada += valor;
        return;
      }
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anoMes = `${ano}-${mes}`;

      if (anoMes < primeiroAnoMes) {
        baseAcumulada += valor;
      } else if (mapAnoMesIndex.has(anoMes)) {
        const idx = mapAnoMesIndex.get(anoMes);
        ultimos12Meses[idx].valorAdicionado += valor;
        ultimos12Meses[idx].novos += 1;
      } else {
        // Se exceder a janela mais recente, contabiliza no último mês
        ultimos12Meses[ultimos12Meses.length - 1].valorAdicionado += valor;
      }
    });

    let acumulador = baseAcumulada;
    const receitaMoM = ultimos12Meses.map(m => {
      acumulador += m.valorAdicionado;
      return {
        month: m.label,
        valor: acumulador,
        novos: m.novos
      };
    });

    return { totais, topUnidades, receitaMoM, tipoVeiculoData, matrizUF };
  }, [todosVeiculos, filtroUF]);

  // Exportação para Excel (.xlsx)
  const handleExportarRelatorio = () => {
    const dadosFiltrados = filtroUF 
      ? todosVeiculos.filter(v => v.unidades_clientes?.uf?.trim()?.toUpperCase() === filtroUF)
      : todosVeiculos;

    if (dadosFiltrados.length === 0) {
      toast.error('Nenhum registro para exportar.');
      return;
    }

    const dataToExport = dadosFiltrados.map(v => ({
      'Placa': v.placa || '',
      'Unidade': v.unidades_clientes?.nome_unidade || '',
      'UF': v.unidades_clientes?.uf || '',
      'Modelo': v.modelos_rastreadores?.nome_modelo || '',
      'Tipo de Veículo': v.modelos_rastreadores?.tipo_veiculo || '',
      'Mensalidade (R$)': Number(v.modelos_rastreadores?.valor_mensalidade) || 0,
      'Instalação (R$)': Number(v.modelos_rastreadores?.valor_instalacao) || 0,
      'Data de Instalação': v.data_instalacao ? new Date(v.data_instalacao).toLocaleDateString('pt-BR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Frota Solar');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_solar_${filtroUF ? filtroUF.toLowerCase() : 'nacional'}_${dataAtual}.xlsx`);
    toast.success('Relatório Excel exportado com sucesso!');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-rose-100 text-center max-w-lg mx-auto shadow-xl">
        <Activity size={40} className="mx-auto text-rose-500 mb-3" />
        <h3 className="text-lg font-black text-slate-800">Falha ao carregar indicadores</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Não foi possível carregar os dados consolidados da frota.</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md"
        >
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-[1440px] mx-auto px-2 sm:px-6">
      
      {/* BARRA DE FILTRO E EXPORTAÇÃO - Glassmorphism */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white/85 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white shadow-xl shadow-slate-200/50 gap-4 relative z-30">
        
        {/* Seletor Regional (Filtro UF) */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl shrink-0">
            <Filter size={20} />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Filtro Regional
            </p>
            <button 
              onClick={() => setIsUfDropdownOpen(!isUfDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-xl hover:bg-slate-100/80 transition-all group"
            >
              <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors">
                {filtroUF ? `Estado: ${filtroUF}` : 'Brasil (Todas as UFs)'}
              </span>
              <ChevronDown 
                size={14} 
                className={`text-slate-400 transition-transform duration-300 ${isUfDropdownOpen ? 'rotate-180 text-teal-600' : ''}`} 
              />
            </button>
          </div>

          {/* Dropdown Menu */}
          {isUfDropdownOpen && (
            <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => { setFiltroUF(''); setIsUfDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    !filtroUF 
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25' 
                      : 'bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe size={15} /> Brasil Completo
                  </span>
                  <span className="text-[10px] opacity-80">{todosVeiculos.length} veículos</span>
                </button>

                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 pt-1">
                  Selecione um Estado:
                </div>

                <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {ufsDisponiveis.map(uf => (
                    <button
                      key={uf}
                      onClick={() => { setFiltroUF(uf); setIsUfDropdownOpen(false); }}
                      className={`py-2 rounded-xl font-black text-xs transition-all border ${
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

        {/* Ações: Atualizar & Exportar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-2xl transition-all disabled:opacity-50"
            title="Atualizar Indicadores"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin text-teal-600' : ''} />
          </button>

          <button 
            onClick={handleExportarRelatorio}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-teal-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-teal-600/25 active:scale-95 group"
          >
            <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <FileSpreadsheet size={15} className="text-teal-400 group-hover:text-white" />
            </div>
            Exportar Relatório Excel
            <Download size={13} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* LINHA 1: CARDS DE QUANTIDADES OPERACIONAIS */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-teal-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-teal-100/60 transition-colors" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-inner">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Frota Ativa</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.total.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-blue-100/60 transition-colors" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-inner">
              <Truck size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Caminhões</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.caminhoes.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-100/60 transition-colors" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-inner">
              <Bike size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Motos</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.motos.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-amber-100/60 transition-colors" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-inner">
              <Video size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Câmeras / Vídeo</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.videos.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA 2: CARDS DESTACADOS DE KPIs FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Valor Total Mensal */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 p-6 sm:p-7 rounded-3xl shadow-[0_16px_36px_rgba(16,185,129,0.22)] text-white relative overflow-hidden group hover:shadow-[0_20px_44px_rgba(16,185,129,0.30)] hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/25 shadow-inner group-hover:scale-105 transition-transform">
              <DollarSign size={32} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-emerald-100 font-black uppercase tracking-[0.25em] text-[10px] mb-1 opacity-90">
                Valor Total Mensal (MRR)
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
                {formatarMoeda(stats.totais.mensalidade)}
              </p>
            </div>
          </div>
        </div>

        {/* Valor Total Instalação */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-6 sm:p-7 rounded-3xl shadow-[0_16px_36px_rgba(15,23,42,0.22)] text-white relative overflow-hidden group hover:shadow-[0_20px_44px_rgba(15,23,42,0.30)] hover:-translate-y-1 transition-all duration-500 border border-slate-800">
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner group-hover:scale-105 group-hover:bg-teal-500/20 transition-all">
              <TrendingUp size={32} className="text-teal-400 drop-shadow-md" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] mb-1 opacity-90">
                Valor Total Instalação
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
                {formatarMoeda(stats.totais.instalacao)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA 3: GRÁFICOS ANALÍTICOS & MATRIZ POR UF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Coluna Esquerda (7/12): Rosca por Veículo e Top 10 Unidades */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Gráfico de Rosca: Percentual por Veículo */}
          <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/60 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <PieChartIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Distribuição da Frota</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Percentual por tipo de veículo</p>
              </div>
            </div>
            <FleetDistributionChart data={stats.tipoVeiculoData} total={stats.totais.total} />
          </div>

          {/* Top 10 Unidades Clientes */}
          <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/60 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Top 10 Unidades Clientes</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Concentração por base operacional</p>
              </div>
            </div>
            <TopUnidadesChart data={stats.topUnidades} />
          </div>

        </div>

        {/* Coluna Direita (5/12): Matriz de Tabela por UF e Tipo de Veículo */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col group min-h-[730px]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-teal-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-md">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Matriz por UF</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cobertura por Estado & Tipo</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100/80 rounded-full text-[10px] font-black uppercase tracking-wider">
                {stats.matrizUF.length} UFs
              </span>
            </div>

            {/* Tabela Matriz */}
            <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/40 flex flex-col shadow-inner">
              <div className="overflow-y-auto flex-1 max-h-[640px]">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white/90 sticky top-0 z-20 backdrop-blur-md border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">UF</th>
                      <th className="px-2.5 py-3.5 text-center">Cam</th>
                      <th className="px-2.5 py-3.5 text-center">Moto</th>
                      <th className="px-2.5 py-3.5 text-center">Vídeo</th>
                      <th className="px-4 py-3.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {stats.matrizUF.map((item) => {
                      const isSelected = filtroUF === item.uf;
                      return (
                        <tr 
                          key={item.uf} 
                          onClick={() => setFiltroUF(prev => prev === item.uf ? '' : item.uf)}
                          className={`cursor-pointer transition-colors group/row ${
                            isSelected ? 'bg-teal-50/80 font-bold' : 'hover:bg-slate-50/90'
                          }`}
                          title={`Clique para ${isSelected ? 'remover filtro' : `filtrar por ${item.uf}`}`}
                        >
                          <td className="px-4 py-3 font-black text-slate-700 text-xs border-r border-slate-100">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                              isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.uf}
                            </span>
                          </td>
                          <td className="px-2.5 py-3 text-center text-xs font-bold text-slate-500">
                            {item.CAMINHÃO || '-'}
                          </td>
                          <td className="px-2.5 py-3 text-center text-xs font-bold text-slate-500">
                            {item.MOTO || '-'}
                          </td>
                          <td className="px-2.5 py-3 text-center text-xs font-bold text-slate-500">
                            {item.VÍDEO || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-900 group-hover/row:text-teal-600 transition-colors">
                            {item.TOTAL}
                          </td>
                        </tr>
                      );
                    })}
                    {stats.matrizUF.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                          Nenhum registro para esta UF
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* LINHA 4: GRÁFICO DE LINHA/ÁREA COM MENSALIDADE ACUMULADA (PERÍODO DE 1 ANO) */}
      <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-7 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Mensalidade Acumulada (Último 1 Ano)
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Evolução contínua do faturamento recorrente mensal (Janela de 12 Meses)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Janela de 12 Meses Corridos
          </div>
        </div>

        <ReceitaMoMChart data={stats.receitaMoM} />
      </div>

    </div>
  );
}
