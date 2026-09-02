import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Plus, Trash2, X, KeySquare, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const PERFIS_OPTIONS = [
  { id: 'supervisor', nome: 'Supervisor', descricao: 'Acesso total ao sistema', color: 'bg-gradient-to-r from-rose-500 to-red-600' },
  { id: 'faturamento', nome: 'Faturamento', descricao: 'Visão Geral, Retiradas, Visão Analítica', color: 'bg-gradient-to-r from-amber-500 to-orange-600' },
  { id: 'operacional', nome: 'Operacional', descricao: 'Veículos, Retiradas, Agendamentos, Falhas, Tarefas', color: 'bg-gradient-to-r from-teal-500 to-emerald-600' },
  { id: 'bancada', nome: 'Bancada', descricao: 'Base de Conhecimento (Leitura e Escrita)', color: 'bg-gradient-to-r from-cyan-500 to-blue-600' }
];

export default function Registro() {
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', email: '', password: '', perfil: '', grupo_id: '' });
  const [carregando, setCarregando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const carregarDados = async () => {
    try {
      const [resUsers, resGrupos, resVinc] = await Promise.allSettled([
        api.get('/usuarios'),
        api.get('/grupos'),
        api.get('/usuario_grupos')
      ]);

      if (resUsers.status !== 'fulfilled') {
        throw resUsers.reason;
      }
      setUsuarios(resUsers.value?.data || []);

      if (resGrupos.status === 'fulfilled') {
        setGrupos(resGrupos.value?.data || []);
      } else {
        setGrupos([]);
        toast.error('Nao foi possivel carregar os grupos de veiculos.');
      }

      if (resVinc.status === 'fulfilled') {
        setVinculos(resVinc.value?.data || []);
      } else {
        setVinculos([]);
        toast.error('Nao foi possivel carregar os vinculos de grupo dos usuarios.');
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar dados operacionais.");
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!formData.email && !isEditMode) return toast.error("O E-mail é obrigatório.");
    if (!formData.perfil) return toast.error("O Perfil é obrigatório.");
    if (!isEditMode && !formData.password) return toast.error("A Senha é obrigatória.");
    
    setCarregando(true);
    try {
      const perfilSemFiltroGrupo = formData.perfil === 'supervisor' || formData.perfil === 'Admin';
      const grupoIdPayload = !perfilSemFiltroGrupo && formData.grupo_id ? parseInt(formData.grupo_id, 10) : null;
      if (isEditMode) {
        const payloadAtualizacao = { perfil: formData.perfil };
        if (formData.password?.trim()) {
          payloadAtualizacao.password = formData.password.trim();
        }
        await api.put(`/usuarios/${formData.id}`, payloadAtualizacao);
        await api.post('/vincular_grupo', { user_id: formData.id, grupo_id: grupoIdPayload }).catch(() => {});
        toast.success("Acesso atualizado com sucesso!");
      } else {
        const resNovo = await api.post('/usuarios', { email: formData.email, password: formData.password, perfil: formData.perfil });
        if (grupoIdPayload && resNovo.data && resNovo.data.id) {
          await api.post('/vincular_grupo', { user_id: resNovo.data.id, grupo_id: grupoIdPayload }).catch(() => {});
        }
        toast.success("Novo usuário criado com sucesso!");
      }
      setIsModalOpen(false);
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar usuário.");
    }
    setCarregando(false);
  };

  const handleDelete = (id, email) => {
    setConfirmDelete({ id, email });
  };

  const executeDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/usuarios/${id}`);
      toast.success('Usuário excluído permanentemente.');
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao apagar usuário.');
    }
  };

  const abrirModalNovo = () => {
    setIsEditMode(false);
    setFormData({ id: '', email: '', password: '', perfil: '', grupo_id: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (u) => {
    setIsEditMode(true);
    const vinculo = vinculos.find(v => v.user_id === u.id);
    setFormData({ id: u.id, email: u.email, password: '', perfil: u.perfil || '', grupo_id: vinculo ? vinculo.grupo_id : '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-2 sm:px-6">
      
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(13,148,136,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl translate-y-10 -translate-x-10"></div>
        
        <div className="flex items-center space-x-4 sm:space-x-6 relative z-10 mb-6 md:mb-0">
            <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/20 shadow-inner">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-teal-100 font-semibold uppercase tracking-widest text-[10px] sm:text-xs mb-1 drop-shadow-sm">Total de Credenciais</p>
              <p className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">{usuarios.length} <span className="text-sm sm:text-base font-medium text-teal-200">ativos</span></p>
            </div>
        </div>

        <button onClick={abrirModalNovo} className="relative z-10 bg-white hover:bg-slate-50 text-teal-700 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto">
            <Plus size={20} className="mr-2" /> Novo Acesso
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-200/60 overflow-hidden text-sm">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-widest font-bold border-b border-slate-100">
              <tr>
                <th className="p-5">E-mail Corporativo</th>
                <th className="p-5">Perfil</th>
                <th className="p-5">Registro Criado Em</th>
                <th className="p-5">Última Autenticação</th>
                <th className="p-5 text-center">Segurança & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {usuarios.map(u => {
                const perfilInfo = PERFIS_OPTIONS.find(p => p.id === u.perfil);
                return (
                <tr key={u.id} className="hover:bg-teal-50/40 transition-colors group">
                  <td className="p-5">
                    <span className="font-extrabold text-slate-800 tracking-wide text-base">{u.email}</span>
                  </td>
                  <td className="p-5">
                    {perfilInfo ? (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${perfilInfo.color}`}>
                        <UserCog size={14} />
                        {perfilInfo.nome}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">Sem perfil</span>
                    )}
                  </td>
                  <td className="p-5 font-semibold text-slate-500">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="p-5">
                    {u.last_sign_in_at ? (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50">
                        {new Date(u.last_sign_in_at).toLocaleString('pt-BR')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Nunca autenticou</span>
                    )}
                  </td>
                  <td className="p-5 flex justify-center gap-3">
                    <button onClick={() => abrirModalEditar(u)} className="p-2.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100 shadow-sm" title="Editar Acesso">
                      <UserCog size={18} />
                    </button>
                    <button onClick={() => handleDelete(u.id, u.email)} className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm" title="Excluir Credencial">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium text-base">Iniciando Centro de Comando...</div>
          )}
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/30">
          {usuarios.map(u => {
            const perfilInfo = PERFIS_OPTIONS.find(p => p.id === u.perfil);
            return (
              <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-teal-300 transition-colors">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-slate-400">E-mail Corporativo</span>
                        <span className="font-extrabold text-slate-800 break-all text-sm">{u.email}</span>
                    </div>
                    {perfilInfo && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black text-white shrink-0 ${perfilInfo.color}`}>
                        {perfilInfo.nome}
                      </span>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-slate-400">Criado em</span>
                        <span className="text-xs font-bold text-slate-600">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-slate-400">Última Auten.</span>
                        <span className="text-xs font-bold text-emerald-600">
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-slate-50 pt-4">
                  <button onClick={() => abrirModalEditar(u)} className="flex-1 flex items-center justify-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs border border-amber-100 active:scale-95 transition-all">
                    <UserCog size={16} /> Editar
                  </button>
                  <button onClick={() => handleDelete(u.id, u.email)} className="flex-1 flex items-center justify-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs border border-rose-100 active:scale-95 transition-all">
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
            )
          })}
          {usuarios.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-white rounded-2xl border border-dashed border-slate-200">
               Nenhuma credencial ativa
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gestão de Acesso */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[99] p-4 sm:p-6 backdrop-blur-md transition-all" role="dialog" aria-modal="true" aria-labelledby="modal-registro-title">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl"><KeySquare size={20} /></div>
                <h2 id="modal-registro-title" className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
                  {isEditMode ? 'Editar Acesso' : 'Criar novo acesso'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} aria-label="Fechar modal" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSalvar} className="p-6 sm:p-8 space-y-6 bg-white overflow-y-auto">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Login Institucional</label>
                <input 
                  id="reg-email"
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  disabled={isEditMode}
                  className={`w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-teal-500 ${isEditMode ? 'bg-slate-100/70 cursor-not-allowed text-slate-400 opacity-80' : 'bg-white placeholder-slate-300'}`} 
                  placeholder="analista@empresa.com.br"
                />
                {isEditMode && <p className="text-[11px] font-semibold text-rose-500 mt-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">Não é possível alterar a hash do e-mail. Caso necessário, exclua e emita novamente.</p>}
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {isEditMode ? 'Nova Senha (opcional)' : 'Inserir a senha'}
                </label>
                <input 
                  id="reg-password"
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-teal-500 placeholder-slate-300" 
                  placeholder={isEditMode ? "Deixe em branco para manter a atual..." : "Mínimo de 6 caracteres recomendados..."}
                />
              </div>

              <div>
                <label htmlFor="reg-perfil" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {isEditMode ? 'Alterar Perfil' : 'Atribuir Perfil'}
                </label>
                <select 
                  id="reg-perfil"
                  value={formData.perfil}
                  onChange={e => setFormData({...formData, perfil: e.target.value})}
                  className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-teal-500 bg-white"
                >
                  <option value="">Selecione um perfil...</option>
                  {PERFIS_OPTIONS.map(perfil => (
                    <option key={perfil.id} value={perfil.id}>{perfil.nome} - {perfil.descricao}</option>
                  ))}
                </select>
              </div>

              {formData.perfil && formData.perfil !== 'supervisor' && formData.perfil !== 'Admin' && (
                <div>
                  <label htmlFor="reg-grupo" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Vincular Grupo de Veículos
                  </label>
                  <select 
                    id="reg-grupo"
                    value={formData.grupo_id}
                    onChange={e => setFormData({...formData, grupo_id: e.target.value})}
                    className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-teal-500 bg-white"
                  >
                    <option value="">Nenhum Grupo Vinculado</option>
                    {grupos.map(g => (
                      <option key={g.id} value={g.id}>{g.nome}</option>
                    ))}
                  </select>
                  <p className="text-[11px] font-medium text-slate-400 mt-2">Isto restringe a visão deste usuário aos veículos deste grupo.</p>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancelar</button>
                <button type="submit" disabled={carregando} className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 font-bold text-sm text-white rounded-xl hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 hover:-translate-y-0.5">
                  {carregando ? 'Processando DB...' : (isEditMode ? 'Salvar Alterações' : 'Autorizar Acesso')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Revogar Acesso"
        message={`Tem certeza que deseja APAGAR permanentemente o acesso de "${confirmDelete?.email}"? O usuário perderá acesso imediatamente.`}
        confirmLabel="Sim, Revogar"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
