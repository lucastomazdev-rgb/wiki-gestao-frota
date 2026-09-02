import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Search, 
  Building2, 
  Download, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';
import api from '../services/api';
import { useUnidadesLookup } from '../hooks/useLookups';
import PageSkeleton from './shared/Skeleton';

export default function SaudeCartaoSd() {
  const [subTab, setSubTab] = useState('lista'); // 'lista' | 'historico'
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [isSelectUnidadeOpen, setIsSelectUnidadeOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  const selectUnidadeRef = useRef(null);

  // Modais
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [veiculoParaVerificar, setVeiculoParaVerificar] = useState(null);
  const [observacaoVerificacao, setObservacaoVerificacao] = useState('');
  const [verificando, setVerificando] = useState(false);

  // Lookups
  const { data: unidadesLista = [] } = useUnidadesLookup();

  // Fechar o select de unidade ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectUnidadeRef.current && !selectUnidadeRef.current.contains(event.target)) {
        setIsSelectUnidadeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset de página ao filtrar
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroPlaca, filtroUnidade, filtroStatus, subTab]);

  // Queries
  const { data: kpis, isLoading: isLoadingKpis, refetch: refetchKpis } = useQuery({
    queryKey: ['saude-sd-kpis'],
    queryFn: async () => {
      const response = await api.get('/saude-sd/kpis');
      return response.data;
    }
  });

  const { data: camerasData, isLoading: isLoadingCameras, refetch: refetchCameras } = useQuery({
    queryKey: ['saude-sd', { page: paginaAtual, limit: itensPorPagina, placa: filtroPlaca, unidade_id: filtroUnidade, status: filtroStatus }],
    queryFn: async () => {
      const response = await api.get('/saude-sd', {
        params: {
          paginated: true,
          page: paginaAtual,
          limit: itensPorPagina,
          placa: filtroPlaca || undefined,
          unidade_id: filtroUnidade || undefined,
          status: filtroStatus || undefined
        }
      });
      return response.data;
    },
    enabled: subTab === 'lista'
  });

  const { data: historicoData, isLoading: isLoadingHistorico, refetch: refetchHistorico } = useQuery({
    queryKey: ['saude-sd-historico', { page: paginaAtual, limit: itensPorPagina, placa: filtroPlaca }],
    queryFn: async () => {
      const response = await api.get('/saude-sd/historico', {
        params: {
          paginated: true,
          page: paginaAtual,
          limit: itensPorPagina,
          placa: filtroPlaca || undefined
        }
      });
      return response.data;
    },
    enabled: subTab === 'historico'
  });

  // Ações
  const handleAbrirConfirmacao = (veiculo) => {
    setVeiculoParaVerificar(veiculo);
    setObservacaoVerificacao('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmarVerificacao = async () => {
    if (!veiculoParaVerificar) return;
    setVerificando(true);
    const toastId = toast.loading('Salvando verificação...');
    try {
      await api.post('/saude-sd/verificar', {
        placa: veiculoParaVerificar.placa,
        observacao: observacaoVerificacao.trim() || null
      });
      toast.success(`Cartão SD da placa ${veiculoParaVerificar.placa} marcado como verificado!`, { id: toastId });
      setIsConfirmModalOpen(false);
      setVeiculoParaVerificar(null);
      setObservacaoVerificacao('');
      refetchCameras();
      refetchKpis();
      refetchHistorico();
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao salvar verificação.', { id: toastId });
    } finally {
      setVerificando(false);
    }
  };

  const handleExportarCSV = () => {
    const listToExport = subTab === 'lista' 
      ? camerasData?.data 
      : historicoData?.data;

    if (!listToExport || listToExport.length === 0) {
      toast.error('Nenhum dado disponível para exportação.');
      return;
    }

    let headers = [];
    let rows = [];

    if (subTab === 'lista') {
      headers = ['Placa', 'Descrição Veículo', 'Unidade', 'UF', 'Modelo Câmera', 'Módulo', 'Operação', 'Data Instalação', 'Data Efetiva (Último Reset)', 'Dias Decorridos', 'Status'];
      rows = listToExport.map(item => [
        item.placa,
        item.descricao_veiculo || '-',
        item.unidades_clientes?.nome_unidade || '-',
        item.unidades_clientes?.uf || '-',
        item.modelos_rastreadores?.nome_modelo || '-',
        item.modulo || '-',
        item.operacao || '-',
        item.data_instalacao ? new Date(item.data_instalacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-',
        item.data_efetiva ? new Date(item.data_efetiva).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-',
        item.dias_desde,
        item.status === 'Verificar' ? 'Verificar Integridade' : 'Saudável'
      ]);
    } else {
      headers = ['Placa', 'Data Evento', 'Tipo de Reset', 'Responsável', 'Observação/OS'];
      rows = listToExport.map(item => [
        item.placa,
        item.data ? new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-',
        item.tipo === 'Manual' ? 'Checagem Manual' : 'Troca de Câmera (Agendamento)',
        item.responsavel,
        item.observacao || '-'
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", subTab === 'lista' ? `Saude_Cartoes_SD_${new Date().toISOString().split('T')[0]}.csv` : `Historico_Verificacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  // Paginação
  const totalRegistros = subTab === 'lista' ? camerasData?.pagination?.total || 0 : historicoData?.pagination?.total || 0;
  const totalPaginas = subTab === 'lista' ? camerasData?.pagination?.total_pages || 1 : historicoData?.pagination?.total_pages || 1;

  const getPaginasExibidas = () => {
    const paginas = [];
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i >= totalPaginas - 2 || (i >= paginaAtual - 1 && i <= paginaAtual + 1)) {
            paginas.push(i);
        } else if (paginas[paginas.length - 1] !== '...') {
            paginas.push('...');
        }
    }
    return paginas;
  };

  const indexPrimeiro = totalRegistros > 0 ? (paginaAtual - 1) * itensPorPagina + 1 : 0;
  const indexUltimo = Math.min(paginaAtual * itensPorPagina, totalRegistros);

  const isLoading = subTab === 'lista' ? isLoadingCameras : isLoadingHistorico;

  if (isLoadingKpis && isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Sub-abas de Navegação */}
      <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl w-max animate-in fade-in slide-in-from-top-2">
        <button
          onClick={() => setSubTab('lista')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${subTab === 'lista' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
        >
          Saúde das Câmeras
        </button>
        <button
          onClick={() => setSubTab('historico')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${subTab === 'historico' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
        >
          Histórico de Verificações
        </button>
      </div>

      {subTab === 'lista' && (
        /* KPIs do Cartão SD */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card Total */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-slate-100/60 transition-colors"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl ring-1 ring-slate-100 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300">
                <HardDrive size={22} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Total de Câmeras</p>
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {kpis?.total || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Card Saudável */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-100/50 transition-colors"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Cartões Saudáveis</p>
                <span className="text-2xl font-black text-emerald-600 tracking-tight">
                  {kpis?.saudaveis || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Card Alerta */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-amber-100/50 transition-colors"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl ring-1 ring-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Verificar Integridade</p>
                <span className="text-2xl font-black text-amber-600 tracking-tight animate-pulse">
                  {kpis?.alertas || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container Principal */}
      <div className="bg-white p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        
        {/* Barra de Filtros e Ferramentas */}
        <div className="flex flex-col gap-4 mb-6 border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 w-full min-w-0">
              {/* BUSCA POR PLACA */}
              <div className="relative group w-full max-w-[150px] sm:max-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Placa..." 
                  value={filtroPlaca} 
                  onChange={(e) => setFiltroPlaca(e.target.value)} 
                  className="w-full uppercase bg-white border border-slate-200 text-xs font-black tracking-widest text-slate-700 rounded-lg pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm" 
                />
              </div>

              {subTab === 'lista' && (
                <>
                  {/* SELETOR DE UNIDADE PESQUISÁVEL */}
                  <div className="relative group w-full max-w-[180px] sm:max-w-[250px]" ref={selectUnidadeRef}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 size={14} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Unidade..." 
                      value={filtroUnidade ? (unidadesLista.find(u => String(u.id) === String(filtroUnidade))?.nome_unidade || buscaUnidade) : buscaUnidade} 
                      onChange={(e) => {
                        setBuscaUnidade(e.target.value);
                        setFiltroUnidade('');
                        setIsSelectUnidadeOpen(true);
                      }} 
                      onFocus={() => setIsSelectUnidadeOpen(true)}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm" 
                    />
                    
                    {isSelectUnidadeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[50] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 scrollbar-hide font-bold ring-1 ring-black/5">
                        <div 
                          onClick={() => { setFiltroUnidade(''); setBuscaUnidade(''); setIsSelectUnidadeOpen(false); }}
                          className="p-2.5 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-50 cursor-pointer border-b border-slate-50 sticky top-0 bg-white"
                        >
                          -- Todas Unidades --
                        </div>
                        {unidadesLista
                          .filter(u => u.nome_unidade.toLowerCase().includes(buscaUnidade.toLowerCase()))
                          .map(u => (
                            <div 
                              key={u.id} 
                              onClick={() => { setFiltroUnidade(String(u.id)); setBuscaUnidade(u.nome_unidade); setIsSelectUnidadeOpen(false); }}
                              className="p-2.5 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-600 cursor-pointer transition-colors"
                            >
                              {u.nome_unidade}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* SELETOR DE STATUS */}
                  <div className="relative group w-full max-w-[140px] sm:max-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter size={14} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg pl-9 pr-8 py-2 outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm appearance-none"
                    >
                      <option value="">Todos Status</option>
                      <option value="Saudável">Saudável</option>
                      <option value="Verificar">Verificar Integridade</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button 
                onClick={handleExportarCSV}
                title="Exportar CSV"
                className="p-2 bg-white border border-slate-200 hover:border-teal-300 text-teal-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 group cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3 py-2"
              >
                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Saúde das Câmeras (SubTab = lista) */}
        {subTab === 'lista' && (
          <>
            {/* Visualização Mobile (Card list) */}
            <div className="block md:hidden space-y-3">
              {isLoading ? (
                <div className="text-center py-10 font-bold text-slate-400">Carregando dados...</div>
              ) : !camerasData?.data || camerasData.data.length === 0 ? (
                <div className="text-center py-10 font-bold text-slate-400">Nenhuma câmera encontrada.</div>
              ) : (
                camerasData.data.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Placa</span>
                        <span className="text-base font-black text-slate-800 tracking-widest">{item.placa}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${item.status === 'Saudável' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'}`}>
                        {item.status === 'Verificar' ? 'Verificar Integridade' : 'Saudável'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold">Unidade:</span>
                        <span className="text-slate-700 font-extrabold">{item.unidades_clientes?.nome_unidade || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Modelo:</span>
                        <span className="text-slate-700 font-extrabold">{item.modelos_rastreadores?.nome_modelo || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Instalação:</span>
                        <span className="text-slate-600 font-extrabold">{item.data_instalacao ? new Date(item.data_instalacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Efetiva (Último Reset):</span>
                        <span className="text-slate-600 font-extrabold">{item.data_efetiva ? new Date(item.data_efetiva).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-black text-slate-500">
                        <span>Tempo Instalado:</span>
                        <span>{item.dias_desde} dias</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${item.status === 'Verificar' ? 'bg-amber-500' : 'bg-teal-500'}`} 
                          style={{ width: `${Math.min(100, Math.floor((item.dias_desde / 180) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {item.status === 'Verificar' && (
                      <button
                        onClick={() => handleAbrirConfirmacao(item)}
                        className="w-full py-2 bg-teal-50 border border-teal-100 hover:bg-teal-600 hover:text-white hover:border-teal-600 text-teal-700 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check size={14} /> Marcar como Verificado
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Visualização Desktop (Table) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-4 py-3">Placa</th>
                    <th className="px-4 py-3">Unidade / UF</th>
                    <th className="px-4 py-3">Modelo Câmera</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Data Instalação</th>
                    <th className="px-4 py-3">Data Efetiva</th>
                    <th className="px-4 py-3">Dias sem Verificação</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 font-bold text-slate-400">Carregando dados...</td>
                    </tr>
                  ) : !camerasData?.data || camerasData.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 font-bold text-slate-400">Nenhum veículo com câmera encontrado.</td>
                    </tr>
                  ) : (
                    camerasData.data.map(item => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-4 py-3 font-black text-slate-800 tracking-widest">{item.placa}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col leading-tight">
                              <span className="font-black text-slate-700">{item.unidades_clientes?.nome_unidade || '-'}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.unidades_clientes?.uf || ''}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{item.modelos_rastreadores?.nome_modelo || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${item.status === 'Saudável' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {item.status === 'Verificar' ? 'Verificar Integridade' : 'Saudável'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.data_instalacao ? new Date(item.data_instalacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.data_efetiva ? new Date(item.data_efetiva).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-extrabold ${item.status === 'Verificar' ? 'text-amber-600' : 'text-slate-600'}`}>
                              {item.dias_desde} dias
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.status === 'Verificar' && (
                              <button
                                onClick={() => handleAbrirConfirmacao(item)}
                                className="px-3 py-1.5 bg-white hover:bg-teal-600 border border-slate-200 hover:border-teal-600 hover:text-white text-teal-600 rounded-lg transition-all duration-300 shadow-sm font-black uppercase text-[10px] tracking-wide inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                              >
                                <Check size={12} /> Confirmar Checagem
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tabela de Histórico de Verificações (SubTab = historico) */}
        {subTab === 'historico' && (
          <>
            {/* Visualização Mobile (Card list) */}
            <div className="block md:hidden space-y-3">
              {isLoading ? (
                <div className="text-center py-10 font-bold text-slate-400">Carregando dados...</div>
              ) : !historicoData?.data || historicoData.data.length === 0 ? (
                <div className="text-center py-10 font-bold text-slate-400">Nenhum evento registrado no histórico.</div>
              ) : (
                historicoData.data.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 shadow-sm">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Placa</span>
                        <span className="text-sm font-black text-slate-800 tracking-widest">{item.placa}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${item.tipo === 'Manual' ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                        {item.tipo === 'Manual' ? 'Checagem Manual' : 'Agendamento'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-slate-500 font-semibold">Data da Verificação:</span>
                        <span className="text-slate-700 font-extrabold">{item.data ? new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" />
                        <span className="text-slate-500 font-semibold">Responsável:</span>
                        <span className="text-slate-700 font-extrabold">{item.responsavel}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100/60 mt-1">
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">Observações/OS</span>
                        <p className="text-slate-600 font-bold italic leading-relaxed text-xs">{item.observacao || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Visualização Desktop (Table) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="px-5 py-4">Placa</th>
                    <th className="px-5 py-4">Data Verificação</th>
                    <th className="px-5 py-4">Origem do Reset</th>
                    <th className="px-5 py-4">Responsável</th>
                    <th className="px-5 py-4">Observações / Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 font-bold text-slate-400">Carregando dados...</td>
                    </tr>
                  ) : !historicoData?.data || historicoData.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 font-bold text-slate-400">Nenhum histórico de verificação encontrado.</td>
                    </tr>
                  ) : (
                    historicoData.data.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-black text-slate-800 tracking-widest">{item.placa}</td>
                        <td className="px-5 py-4 text-slate-500">
                          {item.data ? new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${item.tipo === 'Manual' ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                            {item.tipo === 'Manual' ? 'Checagem Manual' : 'Troca de Câmera (Agendamento)'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{item.responsavel}</td>
                        <td className="px-5 py-4 text-slate-500 italic max-w-xs truncate" title={item.observacao}>
                          {item.observacao}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Paginação */}
        {totalRegistros > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 mt-6 pt-5">
            <span className="text-xs text-slate-400 font-bold">
              Mostrando <span className="font-extrabold text-slate-700">{indexPrimeiro}</span> a <span className="font-extrabold text-slate-700">{indexUltimo}</span> de <span className="font-extrabold text-slate-700">{totalRegistros}</span> registros
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-white border border-slate-200 hover:border-teal-300 text-slate-500 hover:text-teal-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 rounded-lg transition-all active:scale-95 cursor-pointer disabled:pointer-events-none"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {getPaginasExibidas().map((pag, idx) => (
                <button
                  key={idx}
                  disabled={pag === '...'}
                  onClick={() => typeof pag === 'number' && setPaginaAtual(pag)}
                  className={`w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all ${pag === paginaAtual ? 'bg-teal-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 cursor-pointer disabled:pointer-events-none'}`}
                >
                  {pag}
                </button>
              ))}

              <button
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                className="p-1.5 bg-white border border-slate-200 hover:border-teal-300 text-slate-500 hover:text-teal-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 rounded-lg transition-all active:scale-95 cursor-pointer disabled:pointer-events-none"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Verificação */}
      {isConfirmModalOpen && veiculoParaVerificar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => !verificando && setIsConfirmModalOpen(false)}></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-md p-6 sm:p-7 relative z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100 flex-shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">Marcar Cartão SD como Saudável</h3>
                <p className="text-slate-500 font-medium text-xs leading-normal">
                  Você está confirmando que verificou a integridade do cartão SD da câmera instalada no veículo com placa <span className="font-extrabold text-slate-700 tracking-widest">{veiculoParaVerificar.placa}</span>.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mt-2">
              <label htmlFor="obs-sd" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Observações (Opcional)</label>
              <textarea
                id="obs-sd"
                rows={3}
                placeholder="Descreva o estado do cartão, testes realizados ou substituições do cartão SD se houver..."
                value={observacaoVerificacao}
                onChange={(e) => setObservacaoVerificacao(e.target.value)}
                disabled={verificando}
                className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl p-3 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-inner resize-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                disabled={verificando}
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-300 font-extrabold text-xs uppercase tracking-wider active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={verificando}
                onClick={handleConfirmarVerificacao}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all duration-300 font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {verificando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
