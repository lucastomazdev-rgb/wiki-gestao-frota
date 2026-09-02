import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Plus, Trash2, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, Users, Filter, CarFront, Pencil, XCircle } from 'lucide-react';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

const GestaoGrupos = () => {
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dados de Veículos
    const [instalacoes, setInstalacoes] = useState([]);
    
    // Form states
    const [nomeGrupo, setNomeGrupo] = useState('');
    const [grupoEmEdicao, setGrupoEmEdicao] = useState(null);

    // Confirmação de delete
    const [confirmDelete, setConfirmDelete] = useState(null); // id do grupo
    
    // Dual List states
    const [disponiveis, setDisponiveis] = useState([]);
    const [selecionados, setSelecionados] = useState([]);

    // Filters for the Left Column
    const [filtroUf, setFiltroUf] = useState('');
    const [filtroUnidade, setFiltroUnidade] = useState('');
    const [filtroPlaca, setFiltroPlaca] = useState('');

    const carregarGrupos = async () => {
        const respGrupos = await api.get('/grupos');
        return respGrupos.data || [];
    };

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            const [dadosGrupos, respInstalacoes] = await Promise.all([
                carregarGrupos(),
                api.get('/instalacoes')
            ]);
            setGrupos(dadosGrupos);
            // O endpoint /instalacoes já retorna apenas veículos operacionais no sistema Coca-Cola
            const ativos = respInstalacoes.data || [];
            setInstalacoes(ativos);
            setDisponiveis(ativos);
            setSelecionados([]);
            
            // clear filters
            setFiltroUf('');
            setFiltroUnidade('');
            setFiltroPlaca('');
        } catch {
            toast.error('Erro ao carregar dados. Verifique a conexão.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // Extrair UFs e Unidades únicas APENAS dos veículos ativos
    const ufsDisponiveis = useMemo(() => {
        const ufs = instalacoes.map(v => v.unidades_clientes?.uf).filter(Boolean);
        return [...new Set(ufs)].sort();
    }, [instalacoes]);

    const unidadesDisponiveis = useMemo(() => {
        let base = instalacoes;
        if (filtroUf) base = base.filter(v => v.unidades_clientes?.uf === filtroUf);
        const un = base.map(v => v.unidades_clientes?.nome_unidade).filter(Boolean);
        return [...new Set(un)].sort();
    }, [instalacoes, filtroUf]);

    // Filtrar veículos na coluna da esquerda
    const veiculosFiltrados = useMemo(() => {
        return disponiveis.filter(v => {
            const ufMatch = filtroUf ? v.unidades_clientes?.uf === filtroUf : true;
            const unMatch = filtroUnidade ? v.unidades_clientes?.nome_unidade === filtroUnidade : true;
            const plMatch = filtroPlaca ? v.placa.toLowerCase().includes(filtroPlaca.toLowerCase()) : true;
            return ufMatch && unMatch && plMatch;
        }).sort((a, b) => a.placa.localeCompare(b.placa));
    }, [disponiveis, filtroUf, filtroUnidade, filtroPlaca]);

    // Otimização Extrema (Evitar DOM Lag ao digitar o nome do grupo)
    const listagemEsquerda = useMemo(() => {
        const displayed = veiculosFiltrados.slice(0, 150); // Mostra só os primeiros 150 pra evitar travamento da aba
        return (
            <>
                {displayed.map(v => (
                    <div key={v.id} onClick={() => moverParaDireita(v)} className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-teal-300 hover:shadow-md cursor-pointer flex justify-between items-center transition-all group">
                        <div>
                            <span className="font-bold text-sm text-slate-700">{v.placa}</span>
                            <span className="text-[10px] text-slate-400 block">{v.unidades_clientes?.uf} - {v.unidades_clientes?.nome_unidade}</span>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                ))}
                {veiculosFiltrados.length > 150 && (
                    <div className="text-center p-3 text-xs font-bold text-teal-600 bg-teal-50/70 rounded-lg border border-teal-100">
                        + {veiculosFiltrados.length - 150} veículos ocultos.<br/>Use os filtros acima para refinar.
                    </div>
                )}
                {veiculosFiltrados.length === 0 && (
                    <div className="text-center p-6 text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                        Nenhum veículo encontrado.
                    </div>
                )}
            </>
        );
    }, [veiculosFiltrados]);

    const listagemDireita = useMemo(() => {
        return (
            <>
                {selecionados.map(v => (
                    <div key={v.id} onClick={() => moverParaEsquerda(v)} className="p-2 bg-white border border-teal-100 rounded-lg shadow-sm hover:border-rose-300 hover:shadow-md cursor-pointer flex justify-between items-center transition-all group">
                        <ArrowLeft size={14} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                        <div className="text-right">
                            <span className="font-bold text-sm text-teal-800">{v.placa}</span>
                            <span className="text-[10px] text-teal-500 block">{v.unidades_clientes?.uf} - {v.unidades_clientes?.nome_unidade}</span>
                        </div>
                    </div>
                ))}
                {selecionados.length === 0 && (
                    <div className="text-center p-10 text-xs text-teal-600/50 h-full flex flex-col items-center justify-center border border-dashed border-teal-200/50 rounded-lg bg-teal-50/20">
                        Nenhum veículo selecionado.
                    </div>
                )}
            </>
        );
    }, [selecionados]);

    // Dual List Actions
    const moverParaDireita = (veiculo) => {
        setDisponiveis(prev => prev.filter(p => p.id !== veiculo.id));
        setSelecionados(prev => [...prev, veiculo]);
    };
    const moverParaEsquerda = (veiculo) => {
        setSelecionados(prev => prev.filter(p => p.id !== veiculo.id));
        setDisponiveis(prev => [...prev, veiculo]);
    };
    const moverTodosDireita = () => {
        setSelecionados(prev => [...prev, ...veiculosFiltrados]);
        const idsFiltrados = veiculosFiltrados.map(v => v.id);
        setDisponiveis(prev => prev.filter(p => !idsFiltrados.includes(p.id)));
    };
    const moverTodosEsquerda = () => {
        setDisponiveis(prev => [...prev, ...selecionados]);
        setSelecionados([]);
    };

    const cancelarEdicao = () => {
        setGrupoEmEdicao(null);
        setNomeGrupo('');
        setDisponiveis(instalacoes);
        setSelecionados([]);
    };

    const handleEditarGrupo = (grupo) => {
        setGrupoEmEdicao(grupo.id);
        setNomeGrupo(grupo.nome);
        
        const placasGrupo = grupo.config?.placas || [];
        const selec = instalacoes.filter(v => placasGrupo.includes(v.placa));
        const disp = instalacoes.filter(v => !placasGrupo.includes(v.placa));
        
        setSelecionados(selec);
        setDisponiveis(disp);
        toast.success(`Editando grupo: ${grupo.nome}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSalvarGrupo = async () => {
        if (!nomeGrupo.trim()) return toast.error('O nome do grupo é obrigatório.');
        if (selecionados.length === 0) return toast.error('Selecione pelo menos um veículo para o grupo.');

        const placas = selecionados.map(v => v.placa);
        
        const payload = {
            nome: nomeGrupo.trim(),
            config: {
                ufs: [...new Set(selecionados.map(v => v.unidades_clientes?.uf).filter(Boolean))], // Mantemos a compatibilidade e permitimos unidades filhas aparecerem  
                unidades: [...new Set(selecionados.map(v => Number(v.unidade_id)).filter(Boolean))],
                placas: placas // Sempre salvo para bater as placas específicas na visão Operacional
            }
        };

        try {
            if (grupoEmEdicao) {
                const { data: grupoAtualizado } = await api.put(`/grupos/${grupoEmEdicao}`, payload);
                setGrupos(prev => prev.map(g => (g.id === grupoEmEdicao ? grupoAtualizado : g)));
                toast.success('Grupo de Veículos atualizado com sucesso!');
            } else {
                const { data: novoGrupo } = await api.post('/grupos', payload);
                setGrupos(prev => [novoGrupo, ...prev]);
                toast.success('Grupo de Veículos criado com sucesso!');
            }
            cancelarEdicao();
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao salvar o grupo.');
        }
    };

    const handleDeleteGrupo = async () => {
        const id = confirmDelete;
        setConfirmDelete(null);
        if (!id) return;

        try {
            await api.delete(`/grupos/${id}`);
            toast.success('Grupo excluído com sucesso.');
            setGrupos(prev => prev.filter(g => g.id !== id));
        } catch {
            toast.error('Erro ao excluir grupo.');
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-12 animate-in fade-in duration-500">
            {/* HERÓI HEADER */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(13,148,136,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl translate-y-10 -translate-x-10"></div>
                
                <div className="flex items-center space-x-4 sm:space-x-6 relative z-10">
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/20 shadow-inner">
                        <CarFront className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <p className="text-teal-100 font-semibold uppercase tracking-widest text-[10px] sm:text-xs mb-1 drop-shadow-sm">Total de Frotas</p>
                        <p className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">{grupos.length} <span className="text-sm sm:text-base font-medium text-teal-200">grupos</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* BLOCO DE CRIAÇÃO (MASSA DUAL LISTBOX) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`w-8 h-8 rounded-full ${grupoEmEdicao ? 'bg-amber-50' : 'bg-teal-50'} flex items-center justify-center`}>
                           {grupoEmEdicao ? <Pencil className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-teal-600" />}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                            {grupoEmEdicao ? 'Editar Grupo Existente' : 'Criar Novo Grupo'}
                        </h2>
                    </div>

                    <div className="mb-6 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nome do Grupo</label>
                            <input
                                type="text"
                                value={nomeGrupo}
                                onChange={e => setNomeGrupo(e.target.value)}
                                className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-teal-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                                placeholder="Ex: Operações Regionais Sul"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-[400px]">
                        {/* COLUNA ESQUERDA: DISPONÍVEIS */}
                        <div className="flex-1 border border-slate-200 rounded-2xl flex flex-col overflow-hidden bg-slate-50/50">
                            <div className="bg-slate-100/50 p-3 border-b border-slate-200">
                                <h3 className="text-xs font-bold text-slate-700 text-center uppercase tracking-widest mb-2">Veículos no Banco ({veiculosFiltrados.length})</h3>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <select
                                            value={filtroUf}
                                            onChange={e => { setFiltroUf(e.target.value); setFiltroUnidade(''); }}
                                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-medium text-slate-600 bg-white shadow-sm"
                                        >
                                            <option value="">Todas as UFs</option>
                                            {ufsDisponiveis.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                    <select
                                        value={filtroUnidade}
                                        onChange={e => setFiltroUnidade(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-medium text-slate-600 bg-white shadow-sm"
                                    >
                                        <option value="">Todas as Unidades</option>
                                        {unidadesDisponiveis.map(un => <option key={un} value={un}>{un}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Buscar Placa..."
                                        value={filtroPlaca}
                                        onChange={e => setFiltroPlaca(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-medium text-slate-700 uppercase placeholder:normal-case shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[300px] sm:max-h-[400px] custom-scrollbar">
                                {listagemEsquerda}
                            </div>
                        </div>

                        {/* COLUNA CENTRAL: BOTÕES */}
                        <div className="flex sm:flex-col justify-center items-center gap-3 py-2">
                            <button onClick={moverTodosDireita} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm" title="Mover todos filtrados">
                                <ChevronsRight size={18} />
                            </button>
                            <button onClick={moverTodosEsquerda} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm" title="Remover todos">
                                <ChevronsLeft size={18} />
                            </button>
                        </div>

                        {/* COLUNA DIREITA: SELECIONADOS */}
                        <div className="flex-1 border border-teal-200/50 rounded-2xl flex flex-col overflow-hidden bg-teal-50/10 shadow-[inset_0_2px_10px_rgba(20,184,166,0.03)]">
                            <div className="bg-teal-50/40 p-3 border-b border-teal-100/50">
                                <h3 className="text-xs font-bold text-teal-800 text-center uppercase tracking-widest mt-2 mb-2">Veículos no Grupo ({selecionados.length})</h3>
                                <div className="h-[96px] flex items-center justify-center">
                                    <p className="text-[10px] text-teal-600/70 text-center px-4 leading-relaxed font-medium">Os veículos listados aqui comporão as permissões limitadas de quem utilizar este grupo.</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[300px] sm:max-h-[400px] custom-scrollbar">
                                {listagemDireita}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100/80 flex flex-col sm:flex-row justify-end gap-3">
                        {grupoEmEdicao && (
                            <button onClick={cancelarEdicao} className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all outline-none flex items-center justify-center gap-2">
                                <XCircle className="w-4 h-4" /> Cancelar Edição
                            </button>
                        )}
                        <button onClick={handleSalvarGrupo} className={`w-full sm:w-auto px-8 py-3.5 ${grupoEmEdicao ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.3)]' : 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-[0_8px_20px_rgba(20,184,166,0.3)]'} text-white rounded-xl font-black hover:-translate-y-0.5 transition-all outline-none flex items-center justify-center gap-2`}>
                            {grupoEmEdicao ? 'Salvar Alterações' : 'Salvar Novo Grupo'}
                        </button>
                    </div>
                </div>

                {/* BLOCO DE LISTAGEM */}
                <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-slate-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Grupos Existentes</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-2">
                        {grupos.length === 0 && !loading && (
                            <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum grupo cadastrado</p>
                            </div>
                        )}
                        
                        {grupos.map(g => {
                            const qPlacas = g.config?.placas?.length || 0;
                            return (
                                <div key={g.id} className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-200 transition-all group relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-100/50 rounded-l-2xl group-hover:bg-teal-500 transition-colors"></div>
                                    <div className="pl-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{g.nome}</h4>
                                                <span className="inline-block mt-2 text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-teal-100/60">
                                                    {qPlacas} Veículos Vinculados
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <button 
                                                    onClick={() => handleEditarGrupo(g)}
                                                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                                    title="Editar Grupo"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmDelete(g.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Apagar Grupo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Excluir Grupo de Veículos"
                message="Tem certeza que deseja excluir este grupo? Usuários vinculados a ele perderão o filtro de frota e passarão a visualizar todos os veículos."
                confirmLabel="Sim, Excluir"
                onConfirm={handleDeleteGrupo}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default GestaoGrupos;
