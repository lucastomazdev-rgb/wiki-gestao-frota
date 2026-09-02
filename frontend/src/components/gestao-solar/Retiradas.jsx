import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import api from '../services/api';
import { ArrowDownRight, DollarSign, Search, Upload, ChevronLeft, ChevronRight, LogOut, Download, Building2 } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ModalInstrucoesImportacaoRetiradas from './ModalInstrucoesImportacaoRetiradas';
import { useUnidadesLookup } from '../hooks/useLookups';
import { buildSyncPayload, formatSyncReportMessage } from '../utils/syncImport';

export default function Retiradas() {
  const { getNomePerfil } = useAuth();
  const isSupervisor = getNomePerfil() === 'Supervisor';
  const [retiradas, setRetiradas] = useState([]);
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [isSelectUnidadeOpen, setIsSelectUnidadeOpen] = useState(false);
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  const fileInputRef = useRef(null);
  const selectUnidadeRef = useRef(null);

  const { data: unidadesLista = [] } = useUnidadesLookup();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncConfig, setSyncConfig] = useState({ tipoSync: 'full', unidadeId: null, modoSync: 'incremental', confirmarDelecaoAusentes: false });

  const handleAbrirImportacao = () => {
    setIsImportModalOpen(true);
  };

  useEffect(() => {
    api.get('/retiradas')
      .then((res) => setRetiradas(res.data))
      .catch(() => toast.error('Erro ao carregar retiradas.'));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPaginaAtual(1), 0);
    return () => clearTimeout(timer);
  }, [filtroPlaca, filtroUnidade]);

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

  const unidadesUnicas = useMemo(() => {
    const unis = retiradas.map(r => r.unidades_clientes?.nome_unidade).filter(Boolean);
    return [...new Set(unis)].sort();
  }, [retiradas]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Sincronizando histórico. Aguarde...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const payload = buildSyncPayload(results.data, syncConfig);
          const response = await api.post('/retiradas/lote', payload);
          toast.success(formatSyncReportMessage('Histórico sincronizado com sucesso', response.data?.relatorio), { id: toastId });
          api.get('/retiradas')
            .then((res) => setRetiradas(res.data))
            .catch(() => toast.error('Erro ao atualizar histórico após importação.'));
        } catch (error) {
          toast.error(error.response?.data?.erro || "Erro ao importar. Verifique o arquivo.", { id: toastId });
        }
      }
    });
    event.target.value = null;
  };

  const retiradasFiltradas = useMemo(() => {
    return retiradas.filter((r) => {
      const matchPlaca = r.placa.toLowerCase().includes(filtroPlaca.toLowerCase());
      const matchUnidade = !filtroUnidade || r.unidades_clientes?.nome_unidade === filtroUnidade;
      return matchPlaca && matchUnidade;
    });
  }, [retiradas, filtroPlaca, filtroUnidade]);

  const handleExport = () => {
    if (retiradasFiltradas.length === 0) {
      toast.error('Nenhum dado para exportar com os filtros atuais.');
      return;
    }

    const dataToExport = retiradasFiltradas.map(r => ({
      'Cod. Cliente': r.unidades_clientes?.cod_cliente || '-',
      'Placa': r.placa,
      'Unidade': r.unidades_clientes?.nome_unidade || '-',
      'UF': r.unidades_clientes?.uf || '-',
      'Tipo': r.modelos_rastreadores?.tipo_veiculo || '-',
      'Status': r.status,
      'Data da Baixa': new Date(r.data_retirada).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
      'Taxa Cobrada': r.status === 'Retirado' ? `R$ ${Number(r.modelos_rastreadores?.valor_instalacao || 0).toFixed(2)}` : 'R$ 0,00'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico de Retiradas");
    
    // Gerar nome do arquivo com data
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Relatorio_Retiradas_${dateStr}.xlsx`);
    toast.success('Relatório gerado com sucesso!');
  };
  
  const indexOfLastItem = paginaAtual * itensPorPagina;
  const indexOfFirstItem = indexOfLastItem - itensPorPagina;
  const itensAtuais = retiradasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(retiradasFiltradas.length / itensPorPagina);
  
  // Lógica de Paginação Avançada
  const getPaginasExibidas = () => {
    const total = totalPaginas;
    const atual = paginaAtual;
    const paginas = [];
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i >= total - 2 || (i >= atual - 1 && i <= atual + 1)) {
            paginas.push(i);
        } else if (paginas[paginas.length - 1] !== '...') {
            paginas.push('...');
        }
    }
    return paginas;
  };
  
  const totalGeralRetiradas = retiradas.length;
  const totalFiltradoRetiradas = retiradasFiltradas.length;

  const valorTotalGeral = useMemo(() => {
    return retiradas.reduce((acc, curr) => {
      if (curr.status === 'Retirado') {
        return acc + Number(curr.modelos_rastreadores?.valor_instalacao || 0);
      }
      return acc;
    }, 0);
  }, [retiradas]);

  const valorTotalFiltrado = useMemo(() => {
    return retiradasFiltradas.reduce((acc, curr) => {
      if (curr.status === 'Retirado') {
        return acc + Number(curr.modelos_rastreadores?.valor_instalacao || 0);
      }
      return acc;
    }, 0);
  }, [retiradasFiltradas]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      
      {/* Cards de Resumo - Alta Densidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-red-100/50 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl ring-1 ring-red-100 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
              <ArrowDownRight size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Volume de Baixas</p>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span 
                  key={totalFiltradoRetiradas} 
                  className="text-2xl font-black text-slate-800 tracking-tight animate-value-update"
                >
                  {totalFiltradoRetiradas}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  de {totalGeralRetiradas} veículos
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-3xl shadow-[0_8px_25px_rgba(249,115,22,0.15)] text-white relative overflow-hidden group hover:shadow-[0_12px_35px_rgba(249,115,22,0.25)] hover:-translate-y-1 transition-all duration-300 sm:col-span-1 lg:col-span-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
              <DollarSign size={22} className="text-white drop-shadow-md" />
            </div>
            <div className="flex flex-col leading-none">
              <p className="text-orange-100 font-black uppercase tracking-widest text-[10px] mb-2">Receita Gerada (Taxas)</p>
              <div className="flex items-baseline gap-2">
                <p 
                  key={valorTotalFiltrado} 
                  className="text-2xl font-black tracking-tight drop-shadow-sm animate-value-update"
                >
                  R$ {valorTotalFiltrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] font-bold text-orange-200 opacity-80 uppercase tracking-tighter">
                  / R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col w-full relative z-20">
        
        {/* BARRA DE FERRAMENTAS ULTRA-COMPACTA - Tudo em uma linha */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/30 relative z-[10]">
          <div className="flex flex-row items-center justify-between gap-3 py-2 sm:py-2.5 pl-4">
            
            {/* Grupo de Filtros Flexíveis */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* BUSCA POR PLACA */}
              <div className="relative group flex-1 max-w-[140px] sm:max-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Placa..." 
                  value={filtroPlaca} 
                  onChange={(e) => setFiltroPlaca(e.target.value)} 
                  className="w-full uppercase bg-white border border-slate-200 text-xs font-black tracking-widest text-slate-700 rounded-lg pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" 
                />
              </div>

              {/* SELETOR DE UNIDADE PESQUISÁVEL */}
              <div className="relative group flex-[2] max-w-[200px] sm:max-w-[300px]" ref={selectUnidadeRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 size={14} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Unidade..." 
                  value={filtroUnidade || buscaUnidade} 
                  onChange={(e) => {
                    setBuscaUnidade(e.target.value);
                    setFiltroUnidade('');
                    setIsSelectUnidadeOpen(true);
                  }} 
                  onFocus={() => setIsSelectUnidadeOpen(true)}
                  className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" 
                />
                
                {isSelectUnidadeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[50] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 scrollbar-hide font-bold border-t-0 rounded-t-none ring-1 ring-black/5">
                    <div 
                      onClick={() => { setFiltroUnidade(''); setBuscaUnidade(''); setIsSelectUnidadeOpen(false); }}
                      className="p-2.5 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-50 cursor-pointer border-b border-slate-50 sticky top-0 bg-white"
                    >
                      -- Limpar --
                    </div>
                    {unidadesUnicas
                      .filter(u => u.toLowerCase().includes(buscaUnidade.toLowerCase()))
                      .map(u => (
                        <div 
                          key={u} 
                          onClick={() => { setFiltroUnidade(u); setBuscaUnidade(u); setIsSelectUnidadeOpen(false); }}
                          className="p-2.5 text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition-colors"
                        >
                          {u}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pl-3 pr-2 border-l border-slate-100">
              {isSupervisor && (
                <>
                  <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  
                  <button 
                    onClick={handleAbrirImportacao} 
                    title="Importar Histórico (CSV)"
                    className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-110 active:scale-95 group cursor-pointer"
                  >
                    <Upload size={14} className="group-hover:scale-110 transition-transform" />
                  </button>
                </>
              )}

               <button 
                onClick={handleExport} 
                title="Exportar Relatório (Excel)"
                className="p-2 bg-white border border-slate-200 hover:border-orange-300 text-orange-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-110 active:scale-95 group cursor-pointer"
              >
                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Visualização de Tabela (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-6 py-4">Cod. Cliente</th>
                <th className="px-3 py-4">Placa</th>
                <th className="px-6 py-4">Unidade / UF</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-6 py-4">Data da Baixa</th>
                <th className="px-6 py-4 text-right">Taxa Cobrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
              {itensAtuais.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 text-[10px] font-black text-slate-400">{r.unidades_clientes?.cod_cliente || '-'}</td>
                  <td className="px-3 py-4 font-black text-slate-800 tracking-widest">{r.placa}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col leading-tight">
                      <span className="font-black text-slate-700">{r.unidades_clientes?.nome_unidade}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{r.unidades_clientes?.uf}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">
                      {r.modelos_rastreadores?.tipo_veiculo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${r.status === 'Retirado' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(r.data_retirada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'Retirado' 
                      ? <span className="text-orange-600 font-black">R$ {Number(r.modelos_rastreadores?.valor_instalacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      : <span className="text-slate-300 font-bold italic">R$ 0,00</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visualização de Cards (Mobile) */}
        <div className="md:hidden divide-y divide-slate-100 bg-slate-50/30">
          {itensAtuais.map(r => (
            <div key={r.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{r.unidades_clientes?.cod_cliente || 'SEM COD'}</span>
                  <span className="text-sm font-black text-slate-800 tracking-widest leading-none">{r.placa}</span>
                </div>
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${r.status === 'Retirado' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {r.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidade</span>
                  <span className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-1">{r.unidades_clientes?.nome_unidade}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Baixa</span>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{new Date(r.data_retirada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">
                  {r.modelos_rastreadores?.tipo_veiculo}
                </span>
                <span className="text-[11px] font-black text-orange-600">
                  {r.status === 'Retirado' ? `R$ ${Number(r.modelos_rastreadores?.valor_instalacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {itensAtuais.length === 0 && (
          <div className="p-12 text-center">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nenhuma retirada encontrada</span>
          </div>
        )}

        {/* PAGINAÇÃO OTIMIZADA */}
        {totalPaginas > 1 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest order-2 md:order-1">
              Página <span className="text-slate-600">{paginaAtual}</span> de <span className="text-slate-600">{totalPaginas}</span>
            </div>
            
            <div className="flex items-center gap-1.5 order-1 md:order-2">
              <button 
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="p-2 border border-slate-200 rounded-lg bg-white hover:border-orange-300 hover:text-orange-600 disabled:opacity-20 transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {getPaginasExibidas().map((p, idx) => (
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-300 font-black">.</span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      onClick={() => setPaginaAtual(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all border
                        ${paginaAtual === p 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-600'
                        }`}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button 
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="p-2 border border-slate-200 rounded-lg bg-white hover:border-orange-300 hover:text-orange-600 disabled:opacity-20 transition-all shadow-sm active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Importação de Retiradas */}
      <ModalInstrucoesImportacaoRetiradas 
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
