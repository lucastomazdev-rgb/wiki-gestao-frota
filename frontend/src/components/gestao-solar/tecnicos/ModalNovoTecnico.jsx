import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  UploadCloud, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  DollarSign,
  Phone
} from 'lucide-react';
import api from '../../../services/api';
import { openTechnicianDocument } from '../../../services/technicianDocuments';
import toast from 'react-hot-toast';

const formatarTelefone = (valor) => {
  const digits = (valor || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const SERVICOS_SUGERIDOS = [
  { nome_servico: 'Instalação Padrão', valor: 120, gera_devolucao: false, is_km: false },
  { nome_servico: 'Instalação com Identificador', valor: 150, gera_devolucao: false, is_km: false },
  { nome_servico: 'Manutenção Preventiva', valor: 90, gera_devolucao: true, is_km: false },
  { nome_servico: 'Manutenção Corretiva', valor: 110, gera_devolucao: true, is_km: false },
  { nome_servico: 'Desinstalação / Retirada', valor: 80, gera_devolucao: true, is_km: false },
  { nome_servico: 'KM Rodado', valor: 1.50, gera_devolucao: false, is_km: true }
];

export default function ModalNovoTecnico({ isOpen, onClose, tecnicoParaEditar, onSuccess }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [regiao, setRegiao] = useState('');
  const [homologado, setHomologado] = useState(false);
  const [servicos, setServicos] = useState([
    { nome_servico: 'Instalação Padrão', valor: '120.00', gera_devolucao: false, is_km: false }
  ]);
  
  const [arquivoCnh, setArquivoCnh] = useState(null);
  const [arquivoComprovante, setArquivoComprovante] = useState(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(tecnicoParaEditar);

  useEffect(() => {
    if (tecnicoParaEditar) {
      setNome(tecnicoParaEditar.nome || '');
      setTelefone(tecnicoParaEditar.telefone ? formatarTelefone(tecnicoParaEditar.telefone) : '');
      setRegiao(tecnicoParaEditar.regiao || '');
      setHomologado(Boolean(tecnicoParaEditar.homologado));
      if (tecnicoParaEditar.servicos_precos && tecnicoParaEditar.servicos_precos.length > 0) {
        setServicos(tecnicoParaEditar.servicos_precos.map(s => ({
          id: s.id,
          nome_servico: s.nome_servico,
          valor: String(s.valor),
          gera_devolucao: Boolean(s.gera_devolucao),
          is_km: Boolean(s.is_km)
        })));
      }
    } else {
      setNome('');
      setTelefone('');
      setRegiao('');
      setHomologado(false);
      setServicos([
        { nome_servico: 'Instalação Padrão', valor: '120.00', gera_devolucao: false, is_km: false }
      ]);
      setArquivoCnh(null);
      setArquivoComprovante(null);
    }
  }, [tecnicoParaEditar, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenDocument = async (type) => {
    try {
      await openTechnicianDocument(tecnicoParaEditar.id, type);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível abrir o documento.');
    }
  };

  const handleAddServico = () => {
    setServicos(prev => [
      ...prev,
      { nome_servico: '', valor: '', gera_devolucao: false, is_km: false }
    ]);
  };

  const handleRemoveServico = (index) => {
    if (servicos.length <= 1) {
      toast.error('É obrigatório manter pelo menos 1 serviço na tabela do técnico.');
      return;
    }
    setServicos(prev => prev.filter((_, i) => i !== index));
  };

  const handleServicoChange = (index, field, value) => {
    setServicos(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      // Auto-detecção de manutenção ao alterar o nome
      if (field === 'nome_servico') {
        const containsManut = /manuten[cç][aã]o/i.test(value);
        copy[index].gera_devolucao = containsManut;
        copy[index].is_km = /km/i.test(value);
      }
      return copy;
    });
  };

  const handleAdicionarSugerido = (sug) => {
    const jaExiste = servicos.some(s => s.nome_servico.toLowerCase() === sug.nome_servico.toLowerCase());
    if (jaExiste) {
      toast.error(`O serviço "${sug.nome_servico}" já está na lista.`);
      return;
    }

    setServicos(prev => [
      ...prev,
      {
        nome_servico: sug.nome_servico,
        valor: String(sug.valor.toFixed(2)),
        gera_devolucao: sug.gera_devolucao,
        is_km: sug.is_km
      }
    ]);
    toast.success(`Serviço "${sug.nome_servico}" adicionado!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('O Nome do técnico é obrigatório.');
      return;
    }

    const numerosTelefone = telefone.replace(/\D/g, '');
    if (numerosTelefone && numerosTelefone.length < 11) {
      toast.error('Informe o telefone completo no formato (DDD) 9 + 8 dígitos.');
      return;
    }

    if (!regiao.trim()) {
      toast.error('A Região de atendimento é obrigatória.');
      return;
    }

    if (servicos.length === 0) {
      toast.error('O técnico precisa ter pelo menos 1 serviço cadastrado.');
      return;
    }

    for (const s of servicos) {
      if (!s.nome_servico.trim()) {
        toast.error('Preencha o nome de todos os serviços listados.');
        return;
      }
      if (isNaN(Number(s.valor)) || Number(s.valor) < 0) {
        toast.error(`Informe um valor válido para o serviço "${s.nome_servico}".`);
        return;
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('nome', nome.trim());
      formData.append('telefone', telefone.trim());
      formData.append('regiao', regiao.trim());
      formData.append('homologado', String(homologado));
      formData.append('servicos', JSON.stringify(servicos));

      if (arquivoCnh) {
        formData.append('cnh', arquivoCnh);
      }
      if (arquivoComprovante) {
        formData.append('comprovante_residencia', arquivoComprovante);
      }

      if (isEditing) {
        await api.put(`/gestao-solar/tecnicos/${tecnicoParaEditar.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Técnico atualizado com sucesso!');
      } else {
        await api.post('/gestao-solar/tecnicos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Novo técnico terceirizado cadastrado!');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar técnico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-tecnico-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-sm">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 id="modal-tecnico-title" className="text-lg font-black text-slate-900 tracking-tight">
                {isEditing ? 'Editar Técnico Terceirizado' : 'Novo Técnico Terceirizado'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Preencha os dados cadastrais, anexe documentos e defina a tabela de preços individual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Seção 1: Dados Gerais */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-teal-600" />
              1. Dados Principais (Obrigatórios)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nome Completo do Técnico *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Souza"
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  required
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={15} />
                  </span>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(85) 99999-9999"
                    maxLength={15}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all tracking-wide"
                    required
                  />
                </div>
              </div>

              {/* Região */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Região de Atendimento *
                </label>
                <input
                  type="text"
                  value={regiao}
                  onChange={(e) => setRegiao(e.target.value)}
                  placeholder="Ex: Fortaleza e Região Metropolitana / CE"
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  required
                />
              </div>

              {/* Homologado */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Técnico Homologado? *
                </label>
                <select
                  value={homologado ? 'sim' : 'nao'}
                  onChange={(e) => setHomologado(e.target.value === 'sim')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  <option value="sim">Sim - Homologado e Aprovado ✅</option>
                  <option value="nao">Não - Em Processo de Homologação ⏳</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Seção 2: Documentos (Opcionais) */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <UploadCloud size={16} className="text-teal-600" />
              2. Documentação do Técnico (Opcional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CNH */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-teal-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    CNH (Motorista)
                  </span>
                  {tecnicoParaEditar?.cnh_url && !arquivoCnh && (
                    <button
                      type="button"
                      onClick={() => handleOpenDocument('cnh')}
                      className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200"
                    >
                      <Eye size={11} /> Ver Anexo
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setArquivoCnh(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                {arquivoCnh && (
                  <span className="text-[11px] text-teal-600 font-bold block mt-1.5 truncate">
                    ✓ {arquivoCnh.name}
                  </span>
                )}
              </div>

              {/* Comprovante de Residência */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-teal-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Comprovante de Endereço
                  </span>
                  {tecnicoParaEditar?.comprovante_residencia_url && !arquivoComprovante && (
                    <button
                      type="button"
                      onClick={() => handleOpenDocument('comprovante')}
                      className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200"
                    >
                      <Eye size={11} /> Ver Anexo
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setArquivoComprovante(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                {arquivoComprovante && (
                  <span className="text-[11px] text-teal-600 font-bold block mt-1.5 truncate">
                    ✓ {arquivoComprovante.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Seção 3: Tabela de Valores Individual (Obrigatória com pelo menos 1 serviço) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-teal-600" />
                  3. Tabela de Valores do Técnico (Mínimo 1 Serviço) *
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Cadastre os serviços e os respectivos valores acordados para este profissional.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddServico}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus size={14} /> Adicionar Serviço
              </button>
            </div>

            {/* Atalhos do Catálogo Sugerido */}
            <div className="mb-4 p-3 bg-teal-50/50 rounded-2xl border border-teal-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-800 mb-1.5">
                <Sparkles size={13} className="text-teal-600" />
                <span>Atalhos do Catálogo Padronizado (clique para incluir na tabela):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SERVICOS_SUGERIDOS.map((sug) => (
                  <button
                    type="button"
                    key={sug.nome_servico}
                    onClick={() => handleAdicionarSugerido(sug)}
                    className="px-2.5 py-1 bg-white hover:bg-teal-600 text-slate-700 hover:text-white border border-teal-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <span>+ {sug.nome_servico}</span>
                    <span className="opacity-75 font-normal text-[10px]">
                      (R$ {sug.valor.toFixed(2)})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista Dinâmica de Serviços */}
            <div className="space-y-2.5">
              {servicos.map((servico, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all hover:bg-slate-50"
                >
                  {/* Nome do Serviço */}
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Serviço #{index + 1} *
                    </label>
                    <input
                      type="text"
                      value={servico.nome_servico}
                      onChange={(e) => handleServicoChange(index, 'nome_servico', e.target.value)}
                      placeholder="Ex: Instalação, Manutenção, KM Rodado..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>

                  {/* Valor Cobrado */}
                  <div className="w-full sm:w-36">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Valor (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={servico.valor}
                        onChange={(e) => handleServicoChange(index, 'valor', e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-1 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Toggle Gera Devolução / Peça Reversa */}
                  <div className="w-full sm:w-36 pt-1 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={servico.gera_devolucao}
                        onChange={(e) => handleServicoChange(index, 'gera_devolucao', e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600" title="Exige devolução de peça quando concluído">
                        Gera Devolução?
                      </span>
                    </label>
                  </div>

                  {/* Botão Excluir Linha */}
                  <div className="pt-1 sm:pt-4 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleRemoveServico(index)}
                      disabled={servicos.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title={servicos.length <= 1 ? 'Mínimo de 1 serviço obrigatório' : 'Excluir serviço'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gravando Técnico...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isEditing ? 'Salvar Alterações' : 'Concluir Cadastro do Técnico'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
