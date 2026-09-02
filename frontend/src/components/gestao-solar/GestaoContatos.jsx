import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import {
  X, Plus, Edit2, Trash2, Upload, Search, User, Phone,
  Building2, Save, XCircle, Check, AlertTriangle
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import ModalInstrucoesImportacaoContatos from './ModalInstrucoesImportacaoContatos';
import { formatarTelefone, mascaraTelefone } from '../utils/telefone';
import { useUnidadesLookup } from '../hooks/useLookups';

// =====================================================================
// MODAL DE GESTÃO DE RESPONSÁVEIS (CRUD + IMPORTAÇÃO)
// =====================================================================
export default function GestaoContatos({ isOpen, onClose, onContatosAtualizados }) {
  const [contatos, setContatos] = useState([]);
  const { data: unidades = [] } = useUnidadesLookup();
  const [busca, setBusca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [loading, setLoading] = useState(false);

  // Form de criação/edição
  const [modoEdicao, setModoEdicao] = useState(null); // null | 'novo' | { id, nome, telefone, unidade_id }
  const [formData, setFormData] = useState({ unidade_id: '', nome: '', telefone: '' });
  const [salvando, setSalvando] = useState(false);

  // Confirmação de delete
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Importação CSV
  const [isInstrucoesOpen, setIsInstrucoesOpen] = useState(false);
  const fileInputRef = useRef(null);
  const pendingSyncOptions = useRef(null); // guarda { tipoSync, unidadeId } até o usuário escolher o arquivo

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const resContatos = await api.get('/contatos');
      setContatos(resContatos.data);
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const abrirNovoContato = () => {
    setFormData({ unidade_id: '', nome: '', telefone: '' });
    setModoEdicao('novo');
  };

  const abrirEdicao = (contato) => {
    setFormData({ unidade_id: contato.unidade_id, nome: contato.nome, telefone: contato.telefone || '' });
    setModoEdicao(contato);
  };

  const cancelarEdicao = () => {
    setModoEdicao(null);
    setFormData({ unidade_id: '', nome: '', telefone: '' });
  };

  const salvarContato = async () => {
    if (!formData.unidade_id || !formData.nome.trim()) {
      return toast.error('Unidade e nome são obrigatórios.');
    }
    setSalvando(true);
    try {
      // Normaliza o telefone antes de enviar ao banco
      const payload = {
        ...formData,
        telefone: formatarTelefone(formData.telefone) || null
      };
      if (modoEdicao === 'novo') {
        await api.post('/contatos', payload);
        toast.success('Contato criado com sucesso!');
      } else {
        await api.put(`/contatos/${modoEdicao.id}`, payload);
        toast.success('Contato atualizado!');
      }
      cancelarEdicao();
      await carregarDados();
      onContatosAtualizados?.();
    } catch {
      toast.error('Erro ao salvar contato.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirContato = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/contatos/${id}`);
      toast.success('Contato removido.');
      await carregarDados();
      onContatosAtualizados?.();
    } catch {
      toast.error('Erro ao excluir contato.');
    }
  };

  const handleImportarCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { tipoSync, unidadeId } = pendingSyncOptions.current || {};
    const toastId = toast.loading('Importando contatos…');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Se for Sync por Unidade, filtra o payload pelo nome da unidade selecionada
          let linhas = results.data;
          if (tipoSync === 'unidade' && unidadeId) {
            const unidadeSel = unidades.find(u => String(u.id) === String(unidadeId));
            if (unidadeSel) {
              const nomeUpper = unidadeSel.nome_unidade.trim().toUpperCase();
              linhas = results.data.filter(l => {
                const col = (l.UNIDADE || l.unidade || l['Unidade'] || '').trim().toUpperCase();
                return col === nomeUpper;
              });
            }
          }

          const res = await api.post('/contatos/importar', linhas.map(l => ({
            ...l,
            TELEFONE: formatarTelefone(l.TELEFONE || l.telefone || l['Telefone'] || '') || undefined
          })));
          toast.success(res.data.mensagem, { id: toastId });
          await carregarDados();
          onContatosAtualizados?.();
        } catch (err) {
          toast.error(err.response?.data?.erro || 'Erro na importação.', { id: toastId });
        }
      }
    });
    e.target.value = null;
  };

  const handleConfirmarImportacao = ({ tipoSync, unidadeId }) => {
    pendingSyncOptions.current = { tipoSync, unidadeId };
    setIsInstrucoesOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const contatosFiltrados = contatos.filter(c => {
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || '').includes(busca);
    const matchUnidade = !filtroUnidade || String(c.unidade_id) === String(filtroUnidade);
    return matchBusca && matchUnidade;
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><User size={18} /></div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Gestão de Responsáveis</h2>
              <p className="text-[10px] text-slate-400 font-medium">Cadastro de contatos por unidade</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar de Filtros + Ações */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white shrink-0 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[140px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
          <select
            value={filtroUnidade}
            onChange={e => setFiltroUnidade(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer min-w-[140px]"
          >
            <option value="">Todas as unidades</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.nome_unidade}</option>)}
          </select>

          <div className="flex gap-1.5 ml-auto">
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportarCSV} />
            <button
              onClick={() => setIsInstrucoesOpen(true)}
              className="h-9 px-3 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
              title="Importar CSV: colunas UNIDADE | NOME | TELEFONE"
            >
              <Upload size={14} /> Importar CSV
            </button>
            <button
              onClick={abrirNovoContato}
              className="h-9 px-3 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shadow-teal-200 cursor-pointer"
            >
              <Plus size={14} /> Novo
            </button>
          </div>
        </div>

        {/* Formulário inline de criação/edição */}
        {modoEdicao !== null && (
          <div className="px-6 py-4 border-b border-teal-100 bg-teal-50/40 shrink-0 animate-in slide-in-from-top-2 duration-200">
            <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-3">
              {modoEdicao === 'novo' ? '+ Novo Responsável' : `Editando: ${modoEdicao.nome}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={formData.unidade_id}
                onChange={e => setFormData(f => ({ ...f, unidade_id: e.target.value }))}
                className="h-9 px-3 flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="">Selecionar unidade…</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nome_unidade}</option>)}
              </select>
              <input
                type="text"
                placeholder="Nome completo*"
                value={formData.nome}
                onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))}
                className="h-9 px-3 flex-1 min-w-[140px] bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              <input
                type="text"
                placeholder="(86) 9 8640-8410"
                value={formData.telefone}
                onChange={e => setFormData(f => ({ ...f, telefone: mascaraTelefone(e.target.value) }))}
                className="h-9 px-3 w-[160px] bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              <button
                onClick={salvarContato}
                disabled={salvando}
                className="h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
              >
                <Save size={13} /> {salvando ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={cancelarEdicao}
                className="h-9 px-3 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle size={13} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Contatos */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-bold">Carregando…</div>
          ) : contatosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl"><User size={28} className="text-slate-300" /></div>
              <p className="text-xs font-bold text-slate-400">Nenhum responsável cadastrado ainda.</p>
              <p className="text-[11px] text-slate-300">Use o botão "Novo" ou importe um CSV.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Responsável</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Unidade</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contatosFiltrados.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-black text-teal-700">{c.nome.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-slate-500 font-medium">{c.telefone || <span className="italic text-slate-300">não informado</span>}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-bold text-slate-600">{c.unidades_clientes?.nome_unidade}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({c.unidades_clientes?.uf})</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => abrirEdicao(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Editar">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">
            📄 CSV: colunas <strong className="font-mono">UNIDADE</strong> | <strong className="font-mono">NOME</strong> | <strong className="font-mono">TELEFONE</strong> — exatamente em maiúsculas
          </p>
        </div>
      </div>

      <ModalInstrucoesImportacaoContatos
        isOpen={isInstrucoesOpen}
        onClose={() => setIsInstrucoesOpen(false)}
        onConfirm={handleConfirmarImportacao}
        unidades={unidades}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={excluirContato}
        title="Excluir responsável?"
        message="Esta ação não pode ser desfeita. O histórico de contatos vinculado será mantido."
        confirmLabel="Excluir"
      />
    </div>,
    document.body
  );
}
