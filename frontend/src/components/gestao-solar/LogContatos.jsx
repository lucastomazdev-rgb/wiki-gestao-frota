import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Clock, Search, Building2, Phone, MessageCircle,
  Calendar, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './shared/SearchableSelect';
import { useUnidadesLookup } from '../hooks/useLookups';

// =====================================================================
// LOG DE CONTATOS — Histórico auditável de mensagens enviadas
// =====================================================================
export default function LogContatos() {
  const [log, setLog] = useState([]);
  const { data: unidades = [] } = useUnidadesLookup();
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroDe, setFiltroDe] = useState(() => {
    // Padrão: últimos 30 dias
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [filtroAte, setFiltroAte] = useState(() => new Date().toISOString().split('T')[0]);

  const [expandido, setExpandido] = useState(null);

  const { perfil, isAdmin } = useAuth();
  const podeExcluir = perfil === 'supervisor' || isAdmin;

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 20;

  // Busca e Refs para Filtros
  const [buscaUnidade, setBuscaUnidade] = useState('');

  // Modal de Exclusão
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });

  const carregarLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limite: 500 });
      if (filtroUnidade) params.append('unidade_id', filtroUnidade);
      if (filtroDe) params.append('de', filtroDe);
      if (filtroAte) params.append('ate', filtroAte);

      const res = await api.get(`/log-contatos?${params.toString()}`);
      setLog(res.data);
    } catch {
      toast.error('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [filtroAte, filtroDe, filtroUnidade]);

  useEffect(() => {
    carregarLog();
  }, [carregarLog]);

  useEffect(() => { 
    setPaginaAtual(1); 
  }, [filtroUnidade, filtroDe, filtroAte]);

  const handleExcluir = async () => {
    if (!modalExcluir.id) return;
    try {
      await api.delete(`/log-contatos/${modalExcluir.id}`);
      toast.success('Registro de histórico excluído.');
      setLog(prev => prev.filter(item => item.id !== modalExcluir.id));
      setModalExcluir({ aberto: false, id: null });
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao excluir registro.');
    }
  };

  // Lógica de Paginação Local
  const indexOfLastItem = paginaAtual * ITENS_POR_PAGINA;
  const indexOfFirstItem = indexOfLastItem - ITENS_POR_PAGINA;
  const itensAtuais = log.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(log.length / ITENS_POR_PAGINA);

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

  const formatarDataHora = (isoStr) => {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-5 w-full animate-in fade-in duration-500">

      {/* FILTROS — Layout Premium (SearchableSelect) */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-visible">
        <div className="p-4 border-b border-slate-100 bg-slate-50/20 rounded-t-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7 gap-3 items-end">
            
            {/* SELETOR UNIDADE */}
            <div className="lg:col-span-1 xl:col-span-2">
              <SearchableSelect 
                label="Unidade"
                placeholder="Unidade..."
                options={unidades.filter(u => u && u.nome_unidade).map(u => u.nome_unidade)}
                value={buscaUnidade}
                onChange={(nomeFormatado) => {
                  setBuscaUnidade(nomeFormatado);
                  const unidadeCorrespondente = unidades.find(u => u && u.nome_unidade === nomeFormatado);
                  setFiltroUnidade(unidadeCorrespondente ? unidadeCorrespondente.id : '');
                }}
                icon={Building2}
              />
            </div>

            {/* FILTRO DATA: DE */}
            <div className="lg:col-span-1 xl:col-span-2 relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Calendar size={18} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type="date"
                value={filtroDe}
                onChange={e => setFiltroDe(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-400 font-medium group-hover:border-teal-300 text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm cursor-pointer"
              />
            </div>

            {/* FILTRO DATA: ATÉ */}
            <div className="lg:col-span-1 xl:col-span-2 relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Calendar size={18} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type="date"
                value={filtroAte}
                onChange={e => setFiltroAte(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-400 font-medium group-hover:border-teal-300 text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm cursor-pointer"
              />
            </div>

            {/* CONTADOR DE REGISTROS */}
            <div className="lg:col-span-1 xl:col-span-1 h-full pt-2 lg:pt-0">
              <div className="bg-slate-800 text-white w-full h-[46px] flex items-center justify-center gap-2.5 rounded-xl shadow-lg shadow-slate-200 border border-slate-700 animate-in slide-in-from-right-2 duration-500">
                <Search size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {log.length} <span className="text-slate-400">Registros</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Log */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold">Carregando histórico…</div>
        ) : log.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
              <Clock size={24} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-400">Nenhum contato registrado no período selecionado.</p>
            <p className="text-[11px] text-slate-300">Ao copiar uma mensagem no Painel de Contatos, o registro aparecerá aqui.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Data / Hora</th>
                <th className="px-6 py-3">Unidade</th>
                <th className="px-6 py-3">Responsável Contatado</th>
                <th className="px-6 py-3 whitespace-nowrap">Placas</th>
                <th className="px-6 py-3 whitespace-nowrap">Enviado por</th>
                {podeExcluir && <th className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itensAtuais.map(registro => {
                const isExpanded = expandido === registro.id;
                const numPlacas = registro.placas_lista?.length || 0;

                return (
                  <React.Fragment key={registro.id}>
                    <tr
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setExpandido(isExpanded ? null : registro.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg flex-shrink-0">
                            <MessageCircle size={12} />
                          </div>
                          <p className="text-xs font-bold text-slate-700">{formatarDataHora(registro.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
                              {registro.unidades_clientes?.nome_unidade || `Unidade #${registro.unidade_id}`}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{registro.unidades_clientes?.uf}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-black text-teal-700">{(registro.contatos_unidades?.nome || '?').charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{registro.contatos_unidades?.nome || '—'}</p>
                            {registro.contatos_unidades?.telefone && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={9} />{registro.contatos_unidades.telefone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-rose-600 transition-colors"
                          onClick={e => { e.stopPropagation(); setExpandido(isExpanded ? null : registro.id); }}
                        >
                          <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg font-black text-[11px]">
                            {numPlacas} placa{numPlacas !== 1 ? 's' : ''}
                          </span>
                          <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]">{registro.usuario_email || '—'}</p>
                      </td>
                      {podeExcluir && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalExcluir({ aberto: true, id: registro.id });
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                            title="Excluir Registro"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/40">
                        <td colSpan={6} className="px-6 py-4 animate-in slide-in-from-top-1 duration-200">
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Placas contatadas ({numPlacas})</p>
                              <div className="flex flex-wrap gap-1.5">
                                {(registro.placas_lista || []).map(placa => (
                                  <span key={placa} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 shadow-sm">{placa}</span>
                                ))}
                              </div>
                            </div>
                            {registro.mensagem_texto && (
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mensagem enviada</p>
                                <div className="bg-[#E7FFDB] border border-[#d4f5c0] rounded-xl rounded-tl-sm p-3 text-[11px] text-slate-700 whitespace-pre-wrap font-medium leading-relaxed max-h-40 overflow-y-auto">
                                  {registro.mensagem_texto}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-center text-sm gap-6 mt-0">
          <span className="font-medium text-slate-500 order-2 lg:order-1">
            Exibindo <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, log.length)}</span> de <span className="font-bold text-slate-700">{log.length}</span> registros
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 order-1 lg:order-2">
            <button 
              onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))} 
              disabled={paginaAtual === 1} 
              className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 hover:text-slate-700 active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 px-1 sm:px-2">
              {getPaginasExibidas().map((p, idx) => (
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold tracking-widest">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPaginaAtual(p)}
                    className={`min-w-[40px] h-[40px] flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 border shadow-sm active:scale-90 cursor-pointer
                      ${paginaAtual === p 
                        ? 'bg-slate-800 border-slate-700 text-white shadow-lg' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600'
                      }`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>
            <button 
              onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))} 
              disabled={paginaAtual === totalPaginas} 
              className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 hover:text-slate-700 active:scale-95 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalExcluir.aberto}
        title="Excluir Histórico"
        message="Tem certeza que deseja excluir permanentemente este registro de histórico? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleExcluir}
        onCancel={() => setModalExcluir({ aberto: false, id: null })}
        danger={true}
      />
    </div>
  );
}
