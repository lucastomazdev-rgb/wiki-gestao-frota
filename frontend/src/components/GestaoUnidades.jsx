import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Building2, MapPin, Truck, Bike, Video, Layers,
  Search, Plus, Edit2, Trash2, XCircle, Save, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { z } from 'zod';
import { useUnidadesLookup } from '../hooks/useLookups';

const unidadeSchema = z.object({
  nome_unidade: z.string().min(3, 'Mínimo de 3 caracteres'),
  cod_cliente: z.string().optional(),
  uf: z.string().length(2, 'UF deve ter 2 letras').toUpperCase(),
  razao_social: z.string().optional()
});

export default function GestaoUnidades({ veiculos }) {
  const queryClient = useQueryClient();
  const { data: unidades = [], isLoading: isUnidadesLoading, isError: isUnidadesError } = useUnidadesLookup();
  const [busca, setBusca] = useState('');

  // Form (Criação e Edição)
  const [modoEdicao, setModoEdicao] = useState(null); // null | 'novo' | { ...unidade }
  const [formData, setFormData] = useState({
    nome_unidade: '',
    cod_cliente: '',
    uf: '',
    razao_social: ''
  });
  const [errosForm, setErrosForm] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 12;

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  useEffect(() => {
    if (isUnidadesError) {
      toast.error('Erro ao carregar unidades.');
    }
  }, [isUnidadesError]);

  const unidadesComKpi = useMemo(() => {
    return unidades.map(u => {
      // Se a unidade já possui os dados de frota agregados pelo backend
      if (u.kpi) {
        return {
          ...u,
          totalVeiculos: u.totalVeiculos !== undefined ? u.totalVeiculos : (u.kpi.cams + u.kpi.motos + u.kpi.vids),
          kpi: u.kpi
        };
      }

      // Fallback para cálculo local se veiculos for passado
      const frotaUnidade = (veiculos || []).filter(v => 
        String(v.unidades_clientes?.id || v.unidade_id) === String(u.id)
      );
      
      const cams = frotaUnidade.filter(v => v.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'CAMINHÃO').length;
      const motos = frotaUnidade.filter(v => v.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'MOTO').length;
      const vids = frotaUnidade.filter(v => {
        const tipo = v.modelos_rastreadores?.tipo_veiculo?.toUpperCase();
        return tipo === 'VÍDEO' || tipo === 'CÂMERA' || tipo === 'DASHCAM';
      }).length;

      return {
        ...u,
        totalVeiculos: frotaUnidade.length,
        kpi: { cams, motos, vids }
      };
    }).filter(u => {
      const search = busca.toLowerCase();
      return String(u.nome_unidade || '').toLowerCase().includes(search) ||
             String(u.cod_cliente || '').toLowerCase().includes(search) ||
             String(u.razao_social || '').toLowerCase().includes(search);
    });
  }, [unidades, veiculos, busca]);

  const totalPaginas = Math.ceil(unidadesComKpi.length / ITENS_POR_PAGINA);
  const indexUltimo = paginaAtual * ITENS_POR_PAGINA;
  const indexPrimeiro = indexUltimo - ITENS_POR_PAGINA;
  const unidadesPaginadas = unidadesComKpi.slice(indexPrimeiro, indexUltimo);

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

  // Funções CRUD
  const abrirNovaUnidade = () => {
    setFormData({ nome_unidade: '', cod_cliente: '', uf: '', razao_social: '' });
    setModoEdicao('novo');
    setErrosForm({});
  };

  const abrirEdicao = (u) => {
    setFormData({
      nome_unidade: String(u.nome_unidade || ''),
      cod_cliente: String(u.cod_cliente || ''),
      uf: String(u.uf || ''),
      razao_social: String(u.razao_social || '')
    });
    setModoEdicao(u);
    setErrosForm({});
  };

  const cancelarEdicao = () => {
    setModoEdicao(null);
    setFormData({ nome_unidade: '', cod_cliente: '', uf: '', razao_social: '' });
    setErrosForm({});
  };

  const salvarUnidade = async () => {
    try {
      const dadosValidados = unidadeSchema.parse(formData);
      setErrosForm({});
      setSalvando(true);
      
      if (modoEdicao === 'novo') {
        await api.post('/unidades', dadosValidados);
        toast.success('Unidade criada com sucesso!');
      } else {
        await api.put(`/unidades/${modoEdicao.id}`, dadosValidados);
        toast.success('Unidade atualizada!');
      }
      await queryClient.invalidateQueries({ queryKey: ['lookup', 'unidades'] });
      cancelarEdicao();
    } catch (err) {
      if (err instanceof z.ZodError || err.name === 'ZodError') {
        const novosErros = {};
        const issues = err.issues || err.errors || [];
        issues.forEach(e => {
          if (e.path && e.path[0]) {
            novosErros[e.path[0]] = e.message;
          }
        });
        setErrosForm(novosErros);
        toast.error('Verifique os campos em vermelho.');
      } else {
        toast.error('Erro ao salvar unidade. Verifique sua conexão.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const excluirUnidade = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/unidades/${id}`);
      toast.success('Unidade removida.');
      await queryClient.invalidateQueries({ queryKey: ['lookup', 'unidades'] });
    } catch {
      toast.error('Erro ao excluir. Verifique se há veículos vinculados a ela.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou razão social..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        
        <button
          onClick={abrirNovaUnidade}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center justify-center transition-all duration-300 shadow-md shadow-teal-200/50 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] active:scale-95 group"
        >
          <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" /> Nova Unidade
        </button>
      </div>

      {/* Modal Formulário */}
      {modoEdicao !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !salvando && cancelarEdicao()}></div>
          
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative z-10 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl border border-teal-200">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    {modoEdicao === 'novo' ? 'Nova Unidade' : 'Editar Unidade'}
                  </h3>
                  <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest mt-1">
                    {modoEdicao === 'novo' ? 'Cadastrar ponto operacional' : 'Atualizar informações'}
                  </p>
                </div>
              </div>
              <button onClick={() => !salvando && cancelarEdicao()} className="text-slate-400 hover:text-red-500 transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Unidade*</label>
                <input 
                  type="text"
                  placeholder="Ex: CDD Fortaleza"
                  value={formData.nome_unidade}
                  onChange={(e) => setFormData({...formData, nome_unidade: e.target.value})}
                  className={`w-full p-3 bg-slate-50 border rounded-xl text-xs font-black text-slate-700 outline-none transition-all focus:ring-2 focus:ring-teal-400/20 ${errosForm.nome_unidade ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-teal-400'}`}
                />
                {errosForm.nome_unidade && <p className="text-red-500 text-[10px] font-bold">{errosForm.nome_unidade}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Cód. Cliente</label>
                  <input 
                    type="text"
                    placeholder="Ex: 998877"
                    value={formData.cod_cliente}
                    onChange={(e) => setFormData({...formData, cod_cliente: e.target.value})}
                    className={`w-full p-3 bg-slate-50 border rounded-xl text-xs font-black text-slate-700 outline-none transition-all focus:ring-2 focus:ring-teal-400/20 ${errosForm.cod_cliente ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-teal-400'}`}
                  />
                  {errosForm.cod_cliente && <p className="text-red-500 text-[10px] font-bold">{errosForm.cod_cliente}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">UF*</label>
                  <input 
                    type="text"
                    maxLength={2}
                    placeholder="Ex: CE"
                    value={formData.uf}
                    onChange={(e) => setFormData({...formData, uf: e.target.value.toUpperCase()})}
                    className={`w-full p-3 bg-slate-50 border rounded-xl text-xs font-black text-slate-700 outline-none transition-all focus:ring-2 focus:ring-teal-400/20 uppercase ${errosForm.uf ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-teal-400'}`}
                  />
                  {errosForm.uf && <p className="text-red-500 text-[10px] font-bold">{errosForm.uf}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Razão Social</label>
                <input 
                  type="text"
                  placeholder="Nome completo da empresa"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                  className={`w-full p-3 bg-slate-50 border rounded-xl text-xs font-black text-slate-700 outline-none transition-all focus:ring-2 focus:ring-teal-400/20 ${errosForm.razao_social ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-teal-400'}`}
                />
                {errosForm.razao_social && <p className="text-red-500 text-[10px] font-bold">{errosForm.razao_social}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => cancelarEdicao()}
                  disabled={salvando}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors text-sm"
                >Cancelar</button>
                <button 
                  onClick={salvarUnidade}
                  disabled={salvando}
                  className="flex-[2] py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-teal-200/50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {salvando ? 'Salvando...' : 'Salvar Unidade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Unidades */}
      {isUnidadesLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-teal-500" />
          <span className="text-xs font-black uppercase tracking-widest">Carregando Unidades...</span>
        </div>
      ) : unidadesComKpi.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
          <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Nenhuma unidade encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {unidadesPaginadas.map((u, idx) => (
            <div 
              key={u.id}
              className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-teal-200/50 group animate-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 shadow-inner">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">{u.nome_unidade}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={10} /> {u.uf || 'N/A'}
                      </span>
                      {u.cod_cliente && (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          CÓD: {u.cod_cliente}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirEdicao(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(u.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {u.razao_social && (
                <div className="mb-4">
                  <p className="text-[10px] text-slate-500 font-medium truncate" title={u.razao_social}>
                    <strong className="font-black text-slate-400 uppercase tracking-wider">Razão Social:</strong> {u.razao_social}
                  </p>
                </div>
              )}

              {/* KPIs de Frota */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frota Vinculada</span>
                  <span className="text-xs font-black text-teal-700 bg-teal-100/50 px-2 py-0.5 rounded-lg">
                    {u.totalVeiculos} totais
                  </span>
                </div>
                
                <div className="flex justify-between gap-2">
                  <div className="flex-1 text-center bg-white rounded-xl py-1.5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                      <Truck size={10} /> <span className="text-[9px] font-black uppercase tracking-widest">CAM</span>
                    </div>
                    <span className="text-xs font-black text-slate-700">{u.kpi.cams}</span>
                  </div>
                  <div className="flex-1 text-center bg-white rounded-xl py-1.5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                      <Bike size={10} /> <span className="text-[9px] font-black uppercase tracking-widest">MOT</span>
                    </div>
                    <span className="text-xs font-black text-slate-700">{u.kpi.motos}</span>
                  </div>
                  <div className="flex-1 text-center bg-white rounded-xl py-1.5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                      <Video size={10} /> <span className="text-[9px] font-black uppercase tracking-widest">VID</span>
                    </div>
                    <span className="text-xs font-black text-slate-700">{u.kpi.vids}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex flex-col lg:flex-row justify-between items-center mt-6 lg:mt-8 pt-6 border-t border-slate-100 gap-4 lg:gap-6 pb-2">
          <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest order-2 lg:order-1">
            Exibindo <span className="text-slate-700 font-black">{indexPrimeiro + 1}</span> - <span className="text-slate-700 font-black">{Math.min(indexUltimo, unidadesComKpi.length)}</span> de <span className="text-slate-700 font-black">{unidadesComKpi.length}</span>
          </span>
          
          <div className="flex items-center gap-1.5 order-1 lg:order-2">
            <button 
              onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
              disabled={paginaAtual === 1}
              className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 text-slate-500"
              title="Página Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              {getPaginasExibidas().map((p, idx) => (
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-300 text-[10px] font-black">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPaginaAtual(p)}
                    className={`min-w-[32px] h-[32px] lg:min-w-[36px] lg:h-[36px] flex items-center justify-center rounded-lg text-xs font-black transition-all border
                      ${paginaAtual === p 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'
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
              className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 text-slate-500"
              title="Próxima Página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir Unidade"
        message="Deseja realmente excluir esta unidade? Se houver veículos vinculados a ela, você precisará transferi-los primeiro."
        confirmLabel="Sim, Excluir"
        onConfirm={excluirUnidade}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
