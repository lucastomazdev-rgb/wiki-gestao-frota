import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, Building2, MapPin, Plus, Search, Edit2, Trash2,
  XCircle, Save, Loader2, Star, Phone, Mail, MessageCircle,
  Copy, Check, UserCheck, AlertCircle
} from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { mascaraTelefone, gerarLinkWhatsApp, limparTelefone } from '../../utils/telefone';

export default function ModalResponsaveisUnidade({
  isOpen,
  onClose,
  unidade,
  onResponsavelAlterado
}) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [modoForm, setModoForm] = useState(null); // null | 'novo' | { ...responsavel }
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    principal: false
  });
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);

  // Lista de responsáveis sincronizada a partir da unidade
  const responsaveis = useMemo(() => {
    if (!unidade || !Array.isArray(unidade.responsaveis)) return [];
    return unidade.responsaveis;
  }, [unidade]);

  // Reseta estados ao fechar ou trocar de unidade
  useEffect(() => {
    if (!isOpen) {
      setModoForm(null);
      setBusca('');
      setFormData({ nome: '', telefone: '', email: '', principal: false });
    }
  }, [isOpen, unidade?.id]);

  if (!isOpen || !unidade) return null;

  const responsaveisFiltrados = responsaveis.filter((r) => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return true;
    return (
      (r.nome || '').toLowerCase().includes(termo) ||
      (r.email || '').toLowerCase().includes(termo) ||
      (r.telefone || '').toLowerCase().includes(termo)
    );
  });

  const abrirNovo = () => {
    // Se a unidade ainda não tem responsáveis, sugere como principal por padrão
    const sugerirPrincipal = responsaveis.length === 0;
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      principal: sugerirPrincipal
    });
    setModoForm('novo');
  };

  const abrirEdicao = (r) => {
    setFormData({
      nome: r.nome || '',
      telefone: mascaraTelefone(r.telefone || ''),
      email: r.email || '',
      principal: Boolean(r.principal)
    });
    setModoForm(r);
  };

  const cancelarForm = () => {
    setModoForm(null);
    setFormData({ nome: '', telefone: '', email: '', principal: false });
  };

  const copiarTexto = (texto, id, tipo) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiadoId(`${id}-${tipo}`);
    toast.success(`${tipo === 'tel' ? 'Telefone' : 'E-mail'} copiado!`);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const salvarResponsavel = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nome || formData.nome.trim().length < 3) {
      return toast.error('O nome do responsável deve ter pelo menos 3 letras.');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return toast.error('Por favor, informe um e-mail válido.');
    }

    const payload = {
      nome: formData.nome.trim(),
      telefone: formData.telefone ? mascaraTelefone(formData.telefone) : null,
      email: formData.email ? formData.email.trim().toLowerCase() : null,
      principal: Boolean(formData.principal)
    };

    setSalvando(true);
    try {
      if (modoForm === 'novo') {
        await api.post(`/unidades/${unidade.id}/responsaveis`, payload);
        toast.success('Responsável cadastrado com sucesso!');
      } else {
        await api.put(`/unidades/responsaveis/${modoForm.id}`, payload);
        toast.success('Responsável atualizado com sucesso!');
      }

      await queryClient.invalidateQueries({ queryKey: ['lookup', 'unidades'] });
      onResponsavelAlterado?.();
      cancelarForm();
    } catch (err) {
      const msg = err.response?.data?.erro || err.response?.data?.message || 'Erro ao salvar responsável.';
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const excluirResponsavel = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/unidades/responsaveis/${id}`);
      toast.success('Responsável removido com sucesso!');
      await queryClient.invalidateQueries({ queryKey: ['lookup', 'unidades'] });
      onResponsavelAlterado?.();
    } catch {
      toast.error('Erro ao excluir responsável.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !salvando && onClose()}
      />

      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative z-10 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/40 px-6 py-5 border-b border-teal-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-md shadow-teal-500/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  {unidade.nome_unidade}
                </h3>
                {unidade.uf && (
                  <span className="text-[10px] font-black text-teal-700 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-0.5 uppercase tracking-wider">
                    <MapPin size={9} /> {unidade.uf}
                  </span>
                )}
                {unidade.cod_cliente && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                    CÓD: {unidade.cod_cliente}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-teal-700/80 font-black uppercase tracking-widest mt-1">
                Gestão de Responsáveis da Unidade ({responsaveis.length})
              </p>
            </div>
          </div>
          <button
            onClick={() => !salvando && onClose()}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-xl transition-all"
            title="Fechar"
          >
            <XCircle size={22} />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={abrirNovo}
            disabled={modoForm !== null}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Novo Responsável
          </button>
        </div>

        {/* Form Expandível (Novo / Edição) */}
        {modoForm !== null && (
          <div className="p-4 sm:p-6 bg-gradient-to-b from-teal-50/40 to-white border-b border-teal-100/80 animate-in slide-in-from-top-4 duration-200 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} className="text-teal-600" />
                {modoForm === 'novo' ? 'Cadastrar Novo Responsável' : 'Editar Dados do Responsável'}
              </span>
              <button
                type="button"
                onClick={cancelarForm}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={salvarResponsavel} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Número (Telefone / WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="(85) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: mascaraTelefone(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="responsavel@solar.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox Responsável Principal */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Star size={14} className={formData.principal ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                    <span>Definir como Responsável Principal da Unidade</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelarForm}
                  disabled={salvando}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {salvando ? 'Salvando...' : 'Salvar Responsável'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Responsáveis com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {responsaveisFiltrados.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Users size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-black text-slate-600 uppercase tracking-wider">
                {busca ? 'Nenhum responsável encontrado com o termo filtrado.' : 'Nenhum responsável cadastrado nesta unidade.'}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {busca ? 'Tente buscar por outro nome, telefone ou e-mail.' : 'Clique no botão acima para adicionar o primeiro contato.'}
              </p>
              {!busca && modoForm === null && (
                <button
                  onClick={abrirNovo}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-teal-700 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Adicionar Responsável
                </button>
              )}
            </div>
          ) : (
            responsaveisFiltrados.map((r) => {
              const linkWhats = gerarLinkWhatsApp(r.telefone);
              const iniciais = (r.nome || 'R')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join('');

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border p-4 transition-all duration-200 shadow-sm hover:shadow-md ${
                    r.principal
                      ? 'border-emerald-300/80 bg-gradient-to-r from-emerald-50/20 via-white to-white'
                      : 'border-slate-200/70 hover:border-teal-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Dados Principais */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-inner ${
                          r.principal
                            ? 'bg-emerald-600 text-white shadow-emerald-200'
                            : 'bg-teal-50 border border-teal-200 text-teal-700'
                        }`}
                      >
                        {iniciais}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-800 tracking-tight">
                            {r.nome}
                          </h4>
                          {r.principal && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300/80 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                              <Star size={10} className="fill-emerald-600 text-emerald-600" />
                              Principal
                            </span>
                          )}
                        </div>

                        {/* Linhas de Contato */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-0.5">
                          {r.telefone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700">{r.telefone}</span>
                              <button
                                onClick={() => copiarTexto(r.telefone, r.id, 'tel')}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                title="Copiar telefone"
                              >
                                {copiadoId === `${r.id}-tel` ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sem telefone</span>
                          )}

                          {r.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700 truncate max-w-[200px]" title={r.email}>
                                {r.email}
                              </span>
                              <button
                                onClick={() => copiarTexto(r.email, r.id, 'email')}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                title="Copiar e-mail"
                              >
                                {copiadoId === `${r.id}-email` ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sem e-mail</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas (WhatsApp, Call, Mailto, Editar, Excluir) */}
                    <div className="flex items-center gap-1.5 sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {linkWhats && (
                        <a
                          href={linkWhats}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-black transition-all hover:scale-105 active:scale-95 shadow-2xs"
                          title="Abrir conversa no WhatsApp"
                        >
                          <MessageCircle size={13} className="text-emerald-600 fill-emerald-100" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {r.telefone && (
                        <a
                          href={`tel:${limparTelefone(r.telefone)}`}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200/80 rounded-xl transition-colors"
                          title="Discar telefone"
                        >
                          <Phone size={14} />
                        </a>
                      )}

                      {r.email && (
                        <a
                          href={`mailto:${r.email}`}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200/80 rounded-xl transition-colors"
                          title="Enviar e-mail"
                        >
                          <Mail size={14} />
                        </a>
                      )}

                      <div className="h-4 w-px bg-slate-200 mx-1" />

                      <button
                        onClick={() => abrirEdicao(r)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        title="Editar responsável"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir responsável"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0 text-xs text-slate-500 font-medium">
          <span>Total cadastrado: <strong className="text-slate-800 font-black">{responsaveis.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir Responsável"
        message="Deseja realmente remover este responsável da unidade? Esta ação não poderá ser desfeita."
        confirmLabel="Sim, Excluir"
        onConfirm={excluirResponsavel}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
