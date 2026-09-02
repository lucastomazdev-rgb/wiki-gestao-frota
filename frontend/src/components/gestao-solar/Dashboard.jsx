import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LabelList, Rectangle, Sector
} from 'recharts';
import { 
  Truck, Bike, Video, Activity, DollarSign, Wrench, Filter, TrendingUp, BarChart3, 
  PieChart as PieChartIcon, Download, FileSpreadsheet, ChevronDown, Globe 
} from 'lucide-react'; 
import toast from 'react-hot-toast';

const COLORS = ['#14b8a6', '#10b981', '#f59e0b', '#f43f5e', '#0891b2', '#0ea5e9'];

// Tooltip Personalizado Glassmorphism
const CustomRechartsTooltip = ({ active, payload, label, isCurrency = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[160px]">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></div>
                <span className="text-slate-600 font-medium text-sm">{entry.name}</span>
              </div>
              <span className="text-slate-800 font-bold">
                {isCurrency 
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Barra Premium com Rótulo Sincronizado e Deslocamento Lateral Suave
const PremiumAnimatedBar = (props) => {
  const { x, y, width, height, fill, payload } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer group"
    >
      {/* Barra */}
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
          filter: isHovered ? 'drop-shadow(0 4px 12px rgba(20, 184, 166, 0.2))' : 'none',
          opacity: isHovered ? 1 : 0.9
        }}
      />
      
      {/* Rótulo - Posicionamento fixo em relação à barra + mesma translação */}
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
        {payload.Quantidade}
      </text>
    </g>
  );
};

// Componente de Fatia de Pizza Premium (Otimizado para Performance)
const PremiumDonutSlice = React.memo((props) => {
  const RADIAN = Math.PI / 180;
  const { 
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, 
    fill, payload, percent, index, activeIndex 
  } = props;
  
  const isHovered = index === activeIndex;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // Explosão Sutil com Spring Physics
  const explosionDist = isHovered ? 8 : 0;
  const dx = cos * explosionDist;
  const dy = sin * explosionDist;

  return (
    <g className="cursor-pointer outline-none">
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={isHovered ? outerRadius + 5 : outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: isHovered ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' : 'none',
          willChange: 'transform'
        }}
      />
      
      <text 
        x={cx + (outerRadius + 26) * cos} 
        y={cy + (outerRadius + 26) * sin} 
        fill={isHovered ? "#0f172a" : "#64748b"} 
        textAnchor={cos > 0 ? 'start' : 'end'} 
        dominantBaseline="middle"
        className="text-[9px] font-black tracking-tighter"
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isHovered ? 1 : 0.6,
          willChange: 'transform'
        }}
      >
        {`${payload.name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
});

// Componente de Gráfico de Distribuição Isolado (Evita Re-renders Globais)
const FleetDistributionChart = React.memo(({ data, total }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="h-[280px] sm:h-[320px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart onMouseLeave={() => setActiveIndex(null)}>
          <Pie 
            data={data} 
            cx="50%" cy="50%" 
            innerRadius={70} outerRadius={105} 
            paddingAngle={6} 
            dataKey="value"
            cornerRadius={12}
            stroke="none"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            shape={<PremiumDonutSlice activeIndex={activeIndex} />}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="text-center">
           <span className="block text-4xl font-black text-slate-800 tracking-tighter">{total}</span>
           <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total</span>
         </div>
      </div>
    </div>
  );
});

export default function Dashboard({ sinalizador }) {
  const [todosVeiculos, setTodosVeiculos] = useState([]);
  const [filtroUF, setFiltroUF] = useState('');
  const [ufsDisponiveis, setUfsDisponiveis] = useState([]);
  const [isUfDropdownOpen, setIsUfDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/instalacoes').then(response => {
      const data = response.data;
      setTodosVeiculos(data);
      const ufs = [...new Set(data.map(v => v.unidades_clientes?.uf).filter(Boolean))].sort();
      setUfsDisponiveis(ufs);
    }).catch(() => toast.error('Erro ao carregar dashboard.'));
  }, [sinalizador]);

  const stats = useMemo(() => {
    const dadosFiltrados = filtroUF 
      ? todosVeiculos.filter(v => v.unidades_clientes?.uf === filtroUF)
      : todosVeiculos;

    let totais = { total: dadosFiltrados.length, caminhoes: 0, motos: 0, videos: 0, mensalidade: 0, instalacao: 0 };
    let unidadesCount = {};
    let tipoVeiculoCount = {};
    let faturamentoMensalBruto = {};

    dadosFiltrados.forEach(item => {
      const tipo = item.modelos_rastreadores?.tipo_veiculo || 'Desconhecido';
      const valorMensalidade = Number(item.modelos_rastreadores?.valor_mensalidade) || 0;
      const valorInstalacao = Number(item.modelos_rastreadores?.valor_instalacao) || 0;
      const unidade = item.unidades_clientes?.nome_unidade || 'Sem Unidade';
      
      if(tipo === 'CAMINHÃO') totais.caminhoes++;
      if(tipo === 'MOTO') totais.motos++;
      if(tipo === 'VÍDEO' || tipo === 'CÂMERA') totais.videos++;
      totais.mensalidade += valorMensalidade;
      totais.instalacao += valorInstalacao;
      unidadesCount[unidade] = (unidadesCount[unidade] || 0) + 1;
      tipoVeiculoCount[tipo] = (tipoVeiculoCount[tipo] || 0) + 1;

      if (item.data_instalacao) {
          const dataInst = new Date(item.data_instalacao);
          dataInst.setMinutes(dataInst.getMinutes() + dataInst.getTimezoneOffset()); 
          const ano = dataInst.getFullYear();
          const mes = String(dataInst.getMonth() + 1).padStart(2, '0');
          const anoMes = `${ano}-${mes}`;
          faturamentoMensalBruto[anoMes] = (faturamentoMensalBruto[anoMes] || 0) + valorMensalidade;
      }
    });

    const mesesOrdenados = Object.keys(faturamentoMensalBruto).sort();
    const receitaMoM = mesesOrdenados.reduce((acc, anoMes) => {
      const acumuladoAnterior = acc.length > 0 ? acc[acc.length - 1].valor : 0;
      const valorAcumulado = acumuladoAnterior + faturamentoMensalBruto[anoMes];
      const [ano, mes] = anoMes.split('-');
      const dataFormatada = new Date(ano, mes - 1);
      const monthLabel = `${dataFormatada.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()} ${ano}`;
      acc.push({ month: monthLabel, valor: valorAcumulado });
      return acc;
    }, []);

    const topUnidades = Object.entries(unidadesCount)
      .map(([name, Quantidade]) => ({ name, Quantidade }))
      .sort((a, b) => b.Quantidade - a.Quantidade)
      .slice(0, 10);

    const tipoVeiculoData = Object.entries(tipoVeiculoCount)
      .map(([name, value]) => ({ name, value }));

    // Matriz de Distribuição por UF
    const ufDistribution = {};
    dadosFiltrados.forEach(item => {
      const uf = item.unidades_clientes?.uf || 'N/A';
      const tipo = item.modelos_rastreadores?.tipo_veiculo?.toUpperCase() || 'NÃO DEFINIDO';
      
      if (!ufDistribution[uf]) {
        ufDistribution[uf] = { uf, CAMINHÃO: 0, MOTO: 0, VÍDEO: 0, TOTAL: 0 };
      }
      
      if (tipo === 'CAMINHÃO') ufDistribution[uf].CAMINHÃO++;
      else if (tipo === 'MOTO') ufDistribution[uf].MOTO++;
      else if (tipo === 'VÍDEO' || tipo === 'CÂMERA') ufDistribution[uf].VÍDEO++;
      
      ufDistribution[uf].TOTAL++;
    });
    
    const matrizUF = Object.values(ufDistribution).sort((a,b) => a.uf.localeCompare(b.uf));
    return { totais, topUnidades, receitaMoM, tipoVeiculoData, matrizUF };
  }, [todosVeiculos, filtroUF]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUfDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const handleExportarRelatorio = () => {
    const dadosFiltrados = filtroUF 
      ? todosVeiculos.filter(v => v.unidades_clientes?.uf === filtroUF)
      : todosVeiculos;

    if (dadosFiltrados.length === 0) {
      toast.error('Nenhum dado para exportar.');
      return;
    }

    // Prepara os dados formatados para o Excel
    const dataToExport = dadosFiltrados.map(v => ({
      Placa: v.placa || '',
      Unidade: v.unidades_clientes?.nome_unidade || '',
      UF: v.unidades_clientes?.uf || '',
      Modelo: v.modelos_rastreadores?.nome_modelo || '',
      Tipo: v.modelos_rastreadores?.tipo_veiculo || '',
      'Mensalidade (R$)': v.modelos_rastreadores?.valor_mensalidade || 0,
      'Instalação (R$)': v.modelos_rastreadores?.valor_instalacao || 0,
      'Data Instalação': v.data_instalacao ? new Date(v.data_instalacao).toLocaleDateString('pt-BR') : ''
    }));

    // Cria a planilha (Worksheet)
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Cria o livro (Workbook)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Placas');

    // Gera o arquivo e inicia o download
    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_placas_${filtroUF || 'nacional'}_${dataAtual}.xlsx`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-[1440px] mx-auto px-2 sm:px-6">
      
      {/* BARRA DE FILTRO E EXPORTAÇÃO - Glassmorphism */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white shadow-xl shadow-slate-200/40 gap-5 mb-8 animate-fade-in-up relative z-[30]">
        
        {/* Filtro UF Customizado */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <Filter size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 px-0.5">Regional</p>
              <button 
                onClick={() => setIsUfDropdownOpen(!isUfDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors">
                  {filtroUF || 'Brasil (Geral)'}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isUfDropdownOpen ? 'rotate-180 text-teal-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Menu Dropdown - Grade de 3 Colunas */}
          {isUfDropdownOpen && (
            <div className="absolute top-full left-0 mt-4 w-72 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[50] p-4 scale-in-center overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />
               <div className="relative z-10 flex flex-col gap-3">
                  <button 
                    onClick={() => { setFiltroUF(''); setIsUfDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${!filtroUF ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-slate-50 text-slate-400 hover:bg-teal-50 hover:text-teal-600'}`}
                  >
                    <Globe size={14} /> Brasil
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    {ufsDisponiveis.map(uf => (
                      <button
                        key={uf}
                        onClick={() => { setFiltroUF(uf); setIsUfDropdownOpen(false); }}
                        className={`py-2.5 rounded-xl font-black text-xs transition-all border ${
                          filtroUF === uf 
                            ? 'bg-teal-600 text-white border-teal-500 shadow-md scale-[1.05]' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600'
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

        <button 
          onClick={handleExportarRelatorio}
          className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-slate-900 hover:bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-500 shadow-xl hover:shadow-teal-500/30 group active:scale-95"
        >
          <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
            <FileSpreadsheet size={16} className="text-teal-400 group-hover:text-white" />
          </div>
          Exportar Relatório Geral
          <Download size={12} className="ml-1 opacity-40 group-hover:opacity-100" />
        </button>
      </div>

      {/* LINHA 1: CARDS DE QUANTIDADES */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group animate-fade-in-up [animation-delay:100ms]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-teal-200/40 transition-colors duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl ring-1 ring-teal-100/50 group-hover:bg-teal-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Total Ativo</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group animate-fade-in-up [animation-delay:200ms]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-blue-200/40 transition-colors duration-700"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl ring-1 ring-blue-100/50 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
              <Truck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Caminhões</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.caminhoes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group animate-fade-in-up [animation-delay:300ms]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-emerald-200/40 transition-colors duration-700"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl ring-1 ring-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
              <Bike size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Motos</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.motos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-lg p-5 rounded-3xl border border-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group animate-fade-in-up [animation-delay:400ms]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-slate-200/40 transition-colors duration-700"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl ring-1 ring-slate-800 group-hover:bg-teal-600 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-inner">
              <Video size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Câmeras</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totais.videos}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up [animation-delay:500ms]">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 sm:p-8 rounded-3xl shadow-[0_20px_40px_rgba(16,185,129,0.25)] text-white relative overflow-hidden group hover:shadow-[0_25px_50px_rgba(16,185,129,0.35)] hover:-translate-y-1.5 transition-all duration-500 cursor-default">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-left">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <DollarSign size={32} className="text-white drop-shadow-md" strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <p className="text-emerald-100 font-black uppercase tracking-[0.3em] text-[9px] mb-1 opacity-80">Valor Total Mensal</p>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter drop-shadow-sm leading-none">{formatarMoeda(stats.totais.mensalidade)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 sm:p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] text-white relative overflow-hidden group hover:shadow-[0_25px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-500 cursor-default">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-left">
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-500">
              <TrendingUp size={32} className="text-teal-400 drop-shadow-md" strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] mb-1 opacity-80">Valor Total Instalação</p>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter drop-shadow-sm leading-none">{formatarMoeda(stats.totais.instalacao)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA 3: GRÁFICOS E MATRIZ - NOVO LAYOUT REQUISITADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda (2/3): Stack de Distribuição e Unidades */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Distribuição da Frota */}
          <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden relative animate-fade-in-up [animation-delay:600ms]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-inner">
                <PieChartIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Distribuição da Frota</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Percentual por veículo</p>
              </div>
            </div>
            <FleetDistributionChart data={stats.tipoVeiculoData} total={stats.totais.total} />
          </div>

          {/* Top 10 Unidades Clientes */}
          <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative animate-fade-in-up [animation-delay:700ms]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Top 10 Unidades Clientes</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Concentração de base</p>
              </div>
            </div>
            <div className="h-[300px] sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topUnidades} layout="vertical" margin={{ top: 0, right: 60, left: 40, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUnidades" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <Bar 
                    dataKey="Quantidade" 
                    fill="url(#colorUnidades)" 
                    barSize={18}
                    shape={<PremiumAnimatedBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Coluna Direita (1/3): Matriz por UF */}
        <div className="lg:col-span-5 flex">
          <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden w-full flex flex-col animate-fade-in-up [animation-delay:800ms]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50/40 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg ring-4 ring-slate-50 transition-transform duration-700 group-hover:rotate-12">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Matriz por UF</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Cobertura Geográfica</p>
              </div>
              <div className="ml-auto px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100 hidden xs:block">
                {stats.matrizUF.length} UFs
              </div>
            </div>

            <div className="flex-1 min-h-[500px] border border-slate-100 rounded-3xl overflow-hidden shadow-inner bg-slate-50/30 flex flex-col">
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white/80 sticky top-0 z-20 backdrop-blur-md border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">UF</th>
                      <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Cam</th>
                      <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Moto</th>
                      <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Vid</th>
                      <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/40">
                    {stats.matrizUF.map((item) => (
                      <tr key={item.uf} className="hover:bg-white transition-colors group/row">
                        <td className="px-5 py-4 font-black text-slate-700 text-xs border-r border-slate-100/50">{item.uf}</td>
                        <td className="px-3 py-4 text-center text-xs font-bold text-slate-500">{item.CAMINHÃO || '-'}</td>
                        <td className="px-3 py-4 text-center text-xs font-bold text-slate-500">{item.MOTO || '-'}</td>
                        <td className="px-3 py-4 text-center text-xs font-bold text-slate-500">{item.VÍDEO || '-'}</td>
                        <td className="px-5 py-4 text-right font-black text-slate-900 group-hover/row:text-teal-600 transition-colors">{item.TOTAL}</td>
                      </tr>
                    ))}
                    {stats.matrizUF.length === 0 && (
                      <tr><td colSpan="5" className="p-12 text-center text-slate-300 font-extrabold text-[10px] uppercase tracking-[0.2em]">Sem dados regionais</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* LINHA 4: GRÁFICO MoM */}
      <div className="bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in-up [animation-delay:900ms]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl shadow-inner"><TrendingUp size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Crescimento Acumulado</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Evolução do faturamento MRR</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-xl text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
            <TrendingUp size={12} /> Consolidado MoM
          </div>
        </div>

        <div className="h-[280px] sm:h-[350px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.receitaMoM} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <defs>
                <linearGradient id="colorMoM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={15} axisLine={false} tickLine={false} />
              <YAxis 
                tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                width={80} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <RechartsTooltip content={<CustomRechartsTooltip isCurrency={true} />} />
              <Area type="monotone" dataKey="valor" name="Evolução" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMoM)" activeDot={{ r: 8, strokeWidth: 0, fill: '#059669' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
