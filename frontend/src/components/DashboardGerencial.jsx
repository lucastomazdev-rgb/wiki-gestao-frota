import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  Building2, Activity, BatteryWarning, Wrench, Download, LineChart, WifiOff
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, Legend, Sector
} from 'recharts';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';


// Tooltip Personalizado Glassmorphism (Sincronizado com Dashboard principal)
const CustomRechartsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[160px]">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">{label || 'Valor'}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></div>
                <span className="text-slate-600 font-medium text-sm">{entry.name}</span>
              </div>
              <span className="text-slate-800 font-bold">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const COLORS_PIE = ['#f43f5e', '#14b8a6', '#3b82f6', '#10b981', '#f59e0b', '#64748b', '#0ea5e9', '#e11d48', '#0891b2'];
const TYPE_COLORS = { 'CAMINHÃO': '#3b82f6', 'MOTO': '#10b981', 'VÍDEO': '#f59e0b', 'NÃO DEFINIDO': '#94a3b8' };

// Barra Premium com Rótulo Sincronizado e Deslocamento Lateral Suave (Copiado do Dashboard)
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
          filter: isHovered ? 'drop-shadow(0 4px 12px rgba(244, 63, 94, 0.2))' : 'none',
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
        {payload.falhas}
      </text>
    </g>
  );
};

// Componente de Fatia de Pizza Premium (Explosão Suave no Hover)
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
  const explosionDist = isHovered ? 12 : 0;
  const dx = cos * explosionDist;
  const dy = sin * explosionDist;

  return (
    <g className="cursor-pointer outline-none group">
      {/* Fatia com Bordas Arredondadas */}
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
        cornerRadius={10} // Bordas suaves e curvadas
        style={{ 
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: isHovered ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))' : 'none',
          opacity: isHovered ? 1 : (activeIndex !== null ? 0.4 : 0.9),
          willChange: 'transform'
        }}
      />
      
      {/* Rótulo de Dados - Acompanha o deslocamento e fica sempre visível */}
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

export default function DashboardGerencial() {
  const [loading, setLoading] = useState(true);
  const [instalacoes, setInstalacoes] = useState([]);
  const [falhas, setFalhas] = useState([]);
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => { carregarTudo(); }, []);

  const carregarTudo = async () => {
    try {
      const [resInst, resFalhas] = await Promise.all([
        api.get('/instalacoes'),
        api.get('/falhas')
      ]);
      setInstalacoes(resInst.data);
      setFalhas(resFalhas.data);
    } catch {
      toast.error('Erro ao buscar dados gerenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = () => {
    if (falhasFiltradas.length === 0) {
      toast.error('Nenhum dado para exportar.');
      return;
    }

    const dataToExport = falhasFiltradas.map(f => ({
      'ID (Descr.)': f.descricao_veiculo || '',
      'Placa': f.placa || '',
      'Razão Social': f.unidades_clientes?.razao_social || '',
      'UF': f.unidades_clientes?.uf || '',
      'Última Transmissão': f.ultima_transmissao ? new Date(f.ultima_transmissao).toLocaleString('pt-BR', {timeZone: 'UTC'}) : '',
      'Bateria (V)': f.bateria || '',
      'Tipo Veículo': f.tipo_veiculo || '',
      'Tratativa': f.tratativa || 'Pendente de Contato',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio Falhas');
    XLSX.writeFile(workbook, `Frota_Falhas_${new Date().getTime()}.xlsx`);
    toast.success('Relatório Excel exportado com êxito!');
  };

  // Cross-data enrichment: Falhas ganham o tipo_veiculo
  // Otimização de Performance O(1) com Hash Map
  const instalacoesMap = useMemo(() => {
    const map = new Map();
    instalacoes.forEach(i => map.set(i.placa, i));
    return map;
  }, [instalacoes]);

  const falhasEnriquecidas = useMemo(() => {
    return falhas.map(f => {
      const inst = instalacoesMap.get(f.placa);
      return {
        ...f,
        descricao_veiculo: inst?.descricao_veiculo || '',
        tipo_veiculo: inst?.modelos_rastreadores?.tipo_veiculo?.toUpperCase() || 'NÃO DEFINIDO',
        bateria_num: parseFloat(String(f.bateria ?? '').replace(',', '.'))
      };
    });
  }, [falhas, instalacoesMap]);

  // Filters (Memoizados para evitar Recálculos)
  const falhasFiltradas = useMemo(() => filtroUnidade 
    ? falhasEnriquecidas.filter(f => f.unidades_clientes?.nome_unidade === filtroUnidade) 
    : falhasEnriquecidas, [filtroUnidade, falhasEnriquecidas]);

  const instalacoesFiltradas = useMemo(() => filtroUnidade
    ? instalacoes.filter(i => i.unidades_clientes?.nome_unidade === filtroUnidade)
    : instalacoes, [filtroUnidade, instalacoes]);

  // Calculos Macro
  const totalFalhas = falhasFiltradas.length;
  
  const indiceRealFalhas = falhasFiltradas.filter(f => 
    ['Agendado Manutenção', 'Aguardando Técnico'].includes(f.tratativa)
  ).length;

  const totalVeiculos = instalacoesFiltradas.length;
  const saudeFrota = totalVeiculos > 0 ? ((1 - (indiceRealFalhas / totalVeiculos)) * 100).toFixed(1) : 100;
  const porcentagemRealFalhas = totalVeiculos > 0 ? ((indiceRealFalhas / totalVeiculos) * 100).toFixed(1) : 0;

  const falhasBateriaCritica = falhasFiltradas.filter(f => !isNaN(f.bateria_num) && f.bateria_num < 11.0);
  const totalBateriaCritica = falhasBateriaCritica.length;

  const batCaminhao = falhasBateriaCritica.filter(f => f.tipo_veiculo === 'CAMINHÃO').length;
  const batMoto = falhasBateriaCritica.filter(f => f.tipo_veiculo === 'MOTO').length;
  const batVideo = falhasBateriaCritica.filter(f => f.tipo_veiculo === 'VÍDEO').length;

  // Chart 1: Distribuição de Status
  const statusCount = {};
  falhasFiltradas.forEach(f => {
    const st = f.tratativa || 'Sem Status';
    statusCount[st] = (statusCount[st] || 0) + 1;
  });
  const dataStatus = Object.keys(statusCount).map(k => ({ name: k, value: statusCount[k] })).sort((a,b) => b.value - a.value);

  // Chart 2: Falhas por Tipo de Veículo
  const tipoCount = {};
  falhasFiltradas.forEach(f => {
    const t = f.tipo_veiculo;
    tipoCount[t] = (tipoCount[t] || 0) + 1;
  });
  const dataTipos = Object.keys(tipoCount).map(k => ({ name: k, value: tipoCount[k] })).sort((a,b) => b.value - a.value);

  // Chart 3: Concentration of Falhas por Unidade
  const unidadesCount = {};
  falhasEnriquecidas.forEach(f => { 
    const u = f.unidades_clientes?.nome_unidade || 'Desconhecida';
    unidadesCount[u] = (unidadesCount[u] || 0) + 1;
  });
  const dataTopUnidades = Object.keys(unidadesCount).map(k => ({ unidade: k, falhas: unidadesCount[k] })).sort((a,b) => b.falhas - a.falhas).slice(0, 10);

  // Select Options
  const unicasUnidades = useMemo(() => 
    [...new Set(instalacoes.map(i => i.unidades_clientes?.nome_unidade).filter(Boolean))].sort(), 
  [instalacoes]);

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex flex-col justify-center items-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-30 animate-pulse"></div>
          <div className="w-20 h-20 border-4 border-slate-200 border-t-teal-500 border-r-teal-600 rounded-full animate-spin relative z-10 shadow-[0_0_15px_rgba(20,184,166,0.3)]"></div>
        </div>
        <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-sm">Sintetizando Dados de B.I...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 w-full max-w-[1600px] mx-auto">
      

      
      {/* HEADER & FILTROS */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-r from-transparent to-teal-500/5 pointer-events-none"></div>
        <div className="flex items-center gap-5 z-10 w-full md:w-auto">
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-teal-600 shadow-inner"><LineChart size={28} /></div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">Painel Corporativo</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise detalhado de Falhas.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto z-10">
          <div className="relative w-full sm:w-72">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={18} />
            <select 
              value={filtroUnidade} 
              onChange={e => setFiltroUnidade(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white transition-all cursor-pointer appearance-none shadow-inner"
            >
              <option value="">Brasil (Visão Global)</option>
              {unicasUnidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          
          <button onClick={handleExportarExcel} className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.1)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group shrink-0 font-bold text-sm tracking-wide">
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform text-emerald-100" />
            <span className="hidden sm:block">Exportar Falhas</span>
          </button>
        </div>
      </div>

      {/* SUPER KPIs */}
      <div className="flex xl:grid xl:grid-cols-5 gap-5 overflow-x-auto xl:overflow-x-visible snap-x snap-mandatory custom-scrollbar pb-4 xl:pb-0">
        
        <div className="min-w-[280px] sm:min-w-[320px] xl:min-w-0 snap-center shrink-0 xl:shrink-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl xl:hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-slate-100 transition-colors"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl ring-1 ring-slate-200 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300 shadow-sm"><WifiOff size={22} /></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">Montante</span>
            </div>
            <p className="text-4xl 2xl:text-5xl font-black text-slate-800 relative z-10 tracking-tight">{totalFalhas}</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 relative z-10">Total de Falhas</p>
          </div>
        </div>

        <div className="min-w-[280px] sm:min-w-[320px] xl:min-w-0 snap-center shrink-0 xl:shrink-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl xl:hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-amber-100 transition-colors"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl ring-1 ring-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm"><Wrench size={22} /></div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-100 px-2 py-1.5 rounded-lg">Crítico</span>
            </div>
            <p className="text-4xl 2xl:text-5xl font-black text-slate-800 relative z-10 tracking-tight">{indiceRealFalhas}</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 relative z-10">Índice Real</p>
          </div>
        </div>

        <div className="min-w-[280px] sm:min-w-[320px] xl:min-w-0 snap-center shrink-0 xl:shrink-1 bg-orange-500/10 p-6 rounded-3xl border border-orange-500/20 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-xl xl:hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-orange-500/20 transition-colors"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl ring-1 ring-orange-200 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300 shadow-sm"><Activity size={22} /></div>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 border border-orange-200 px-2 py-1.5 rounded-lg">Impacto</span>
            </div>
            <p className="text-4xl 2xl:text-5xl font-black text-slate-800 relative z-10 tracking-tight">{porcentagemRealFalhas}<span className="text-2xl 2xl:text-3xl opacity-60">%</span></p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 relative z-10">Proporção de Falha</p>
          </div>
        </div>

        <div className="min-w-[280px] sm:min-w-[320px] xl:min-w-0 snap-center shrink-0 xl:shrink-1 bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 rounded-3xl border border-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] xl:hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group text-white flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-emerald-500/50 backdrop-blur-md text-white rounded-xl border border-white/30 shadow-inner"><Activity size={22} /></div>
              <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest bg-emerald-300/90 px-2 py-1.5 rounded-lg shadow-sm">Performance</span>
            </div>
            <p className="text-4xl 2xl:text-5xl font-black text-white relative z-10 tracking-tight">{saudeFrota}<span className="text-2xl 2xl:text-3xl opacity-80">%</span></p>
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-50/80 uppercase tracking-widest mt-1 relative z-10">Saúde da Frota</p>
          </div>
        </div>

        <div className="min-w-[280px] sm:min-w-[320px] xl:min-w-0 snap-center shrink-0 xl:shrink-1 bg-gradient-to-bl from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl shadow-xl hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] xl:hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group text-white border border-slate-700 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-rose-500/30 transition-colors pointer-events-none"></div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-slate-800/80 backdrop-blur-md text-rose-400 rounded-xl border border-rose-500/30 group-hover:border-rose-500/60 shadow-inner"><BatteryWarning size={22} /></div>
              <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest bg-rose-500/20 border border-rose-500/30 px-2 py-1.5 rounded-lg shadow-sm">&lt; 11.0V</span>
            </div>
            <p className="text-4xl 2xl:text-5xl font-black text-white relative z-10 tracking-tight">{totalBateriaCritica}</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 relative z-10">Baixa Tensão</p>
          </div>
          <div className="flex items-center justify-between gap-1.5 mt-3 pt-3 border-t border-slate-700/50 relative z-10">
            <span className="text-[10px] font-bold text-slate-300 bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/30 flex-1 text-center" title="Caminhões">CAM {batCaminhao}</span>
            <span className="text-[10px] font-bold text-slate-300 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30 flex-1 text-center" title="Motos">MOT {batMoto}</span>
            <span className="text-[10px] font-bold text-slate-300 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 flex-1 text-center" title="Vídeo">VID {batVideo}</span>
          </div>
        </div>

      </div>

      {/* LAYOUT PRINCIPAL: GRADE FLUIDA RESPONSIVA */}
      <div className="flex flex-col gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-[400px] flex flex-col hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-extrabold text-slate-800 mb-1">Concentração de Status (Falhas)</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Mapeamento do cenário de tratativas ativas</p>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {dataStatus.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-300 font-bold uppercase tracking-widest text-sm">Nenhuma falha computada</div>
                ) : (
                  <div className="space-y-5">
                    {dataStatus.map((item, index) => {
                      const maxVal = dataStatus[0].value;
                      const pctWidth = (item.value / maxVal) * 100;
                      const pctTotal = ((item.value / totalFalhas) * 100).toFixed(1);
                      const cor = COLORS_PIE[index % COLORS_PIE.length];
                      
                      return (
                        <div key={item.name} className="relative group">
                          <div className="flex justify-between items-end mb-1.5 relative z-10">
                            <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-wide">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold text-slate-400">{item.value} unid.</span>
                              <span className="text-xs font-black" style={{ color: cor }}>{pctTotal}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative z-10 shadow-inner">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${pctWidth}%`, backgroundColor: cor }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-[400px] flex flex-col hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-extrabold text-slate-800 mb-1">Distribuição da Frota</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Divisão de Caminhões vs Motos vs Vídeos</p>
              <div className="flex-1 min-h-[200px] sm:min-h-[250px] relative">
                {dataTipos.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-sm">Nenhuma falha computada</div>
                ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie 
                          data={dataTipos} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="50%" 
                          outerRadius="75%" 
                          paddingAngle={5} 
                          dataKey="value"
                          cornerRadius={12}
                          labelLine={false}
                          isAnimationActive={false} // Desabilita para PDF
                          shape={<PremiumDonutSlice activeIndex={activeIndex} />}
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                        >
                        {dataTipos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.name] || '#94a3b8'} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="text-center">
                      <span className="block text-4xl font-black text-slate-800 tracking-tighter">{totalFalhas}</span>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total</span>
                    </div>
                  </div>
                </>
                )}
              </div>
            </div>
        </div>

        <div className="w-full">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-[500px] flex flex-col hover:shadow-lg transition-shadow overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
              <h3 className="text-xl font-extrabold text-slate-800 mb-1">Unidades com maiores números de falhas</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Top 10 filiais com maior índice histórico de falhas</p>
              <div className="flex-1 min-h-[300px] pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataTopUnidades} layout="vertical" margin={{ top: 0, right: 40, left: 40, bottom: 0 }} isAnimationActive={false}>
                    <defs>
                      <linearGradient id="colorF" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={1}/>
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
                      dataKey="falhas" 
                      fill="url(#colorF)" 
                      barSize={20}
                      isAnimationActive={false}
                      shape={<PremiumAnimatedBar />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
      </div>

    </div>
  );
}
