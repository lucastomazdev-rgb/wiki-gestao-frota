import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  PackagePlus, 
  Box, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../ConfirmModal';

export default function ModalCargaEquipamentos({ isOpen, onClose, tecnico, onSuccess }) {
  // Tabs internas: 'lote' (Enviar Remessa) | 'editar_saldo' (Ajustar Saldo Atual)
  const [activeTab, setActiveTab] = useState('lote');

  // Sugestões vindas do banco de dados (equipamentos_padrao)
  const [sugestoesCatalogo, setSugestoesCatalogo] = useState([]);
  const [loadingSugestoes, setLoadingSugestoes] = useState(false);
  const [buscaSugestao, setBuscaSugestao] = useState('');

  // Itens selecionados para a nova carga em lote: [{ modelo: string, quantidade: number }]
  const [itensCarga, setItensCarga] = useState([]);

  // Item manual avulso
  const [modeloAvulso, setModeloAvulso] = useState('');
  const [qtdAvulso, setQtdAvulso] = useState(1);
  const [mostrarCampoAvulso, setMostrarCampoAvulso] = useState(false);

  // Motivo geral da remessa
  const [motivo, setMotivo] = useState('');
  const [salvandoCarga, setSalvandoCarga] = useState(false);

  // Estado para edição inline do saldo já existente
  const [equipamentoEmEdicao, setEquipamentoEmEdicao] = useState(null); // id do equipamento
  const [novaQuantidade, setNovaQuantidade] = useState(0);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Estado para exclusão com modal de confirmação bonito
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [excluindoItem, setExcluindoItem] = useState(false);

  // Carregar sugestões de equipamentos padrão do banco
  useEffect(() => {
    if (isOpen) {
      setActiveTab('lote');
      setItensCarga([]);
      setBuscaSugestao('');
      setModeloAvulso('');
      setQtdAvulso(1);
      setMostrarCampoAvulso(false);
      setMotivo('');
      setEquipamentoEmEdicao(null);

      const fetchSugestoes = async () => {
        try {
          setLoadingSugestoes(true);
          const res = await api.get('/gestao-solar/equipamentos-padrao-sugestoes');
          setSugestoesCatalogo(res.data?.data?.equipamentos || []);
        } catch (err) {
          console.error('Erro ao carregar equipamentos padrão:', err);
        } finally {
          setLoadingSugestoes(false);
        }
      };

      fetchSugestoes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tecnico) return null;

  // Filtro de sugestões pelo termo de busca
  const sugestoesFiltradas = sugestoesCatalogo.filter(sug =>
    sug.nome.toLowerCase().includes(buscaSugestao.toLowerCase()) ||
    (sug.codigo && sug.codigo.includes(buscaSugestao))
  );

  // Adicionar ou alternar item da sugestão no lote de carga
  const handleToggleItemSugestao = (nomeModelo) => {
    const jaExiste = itensCarga.find(i => i.modelo.toUpperCase() === nomeModelo.toUpperCase());
    if (jaExiste) {
      setItensCarga(prev => prev.filter(i => i.modelo.toUpperCase() !== nomeModelo.toUpperCase()));
    } else {
      setItensCarga(prev => [...prev, { modelo: nomeModelo, quantidade: 1 }]);
    }
  };

  // Alterar quantidade de um item no lote de carga
  const handleAlterarQtdItem = (modelo, novaQtd) => {
    const qtdNum = Math.max(1, parseInt(novaQtd, 10) || 1);
    setItensCarga(prev =>
      prev.map(i => i.modelo === modelo ? { ...i, quantidade: qtdNum } : i)
    );
  };

  // Remover item do lote de carga
  const handleRemoverItemCarga = (modelo) => {
    setItensCarga(prev => prev.filter(i => i.modelo !== modelo));
  };

  // Adicionar item avulso manual
  const handleAdicionarAvulso = () => {
    if (!modeloAvulso.trim()) {
      toast.error('Informe o nome/modelo do equipamento avulso.');
      return;
    }
    const nomeLimpo = modeloAvulso.trim().toUpperCase();
    const jaExiste = itensCarga.some(i => i.modelo.toUpperCase() === nomeLimpo);
    if (jaExiste) {
      toast.error('Este equipamento já está adicionado na remessa.');
      return;
    }

    setItensCarga(prev => [
      ...prev,
      { modelo: nomeLimpo, quantidade: Math.max(1, parseInt(qtdAvulso, 10) || 1) }
    ]);
    setModeloAvulso('');
    setQtdAvulso(1);
    setMostrarCampoAvulso(false);
    toast.success(`"${nomeLimpo}" adicionado à remessa!`);
  };

  // Submeter Carga em Lote
  const handleSubmitCargaLote = async (e) => {
    e.preventDefault();
    if (itensCarga.length === 0) {
      toast.error('Selecione pelo menos 1 equipamento para enviar.');
      return;
    }

    try {
      setSalvandoCarga(true);
      const res = await api.post(`/gestao-solar/tecnicos/${tecnico.id}/equipamentos/carga`, {
        itens: itensCarga.map(i => ({
          modelo_equipamento: i.modelo,
          quantidade: i.quantidade
        })),
        motivo_ou_os: motivo.trim() || 'Remessa de materiais enviada ao técnico'
      });

      toast.success(res.data?.message || 'Carga enviada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao registrar carga de equipamentos.');
    } finally {
      setSalvandoCarga(false);
    }
  };

  // Iniciar edição inline de saldo
  const handleIniciarEdicaoSaldo = (eq) => {
    setEquipamentoEmEdicao(eq.id);
    setNovaQuantidade(eq.quantidade);
  };

  // Salvar edição direta de quantidade
  const handleSalvarEdicaoSaldo = async (equipId) => {
    const qtdNum = parseInt(novaQuantidade, 10);
    if (isNaN(qtdNum) || qtdNum < 0) {
      toast.error('Informe uma quantidade válida (0 ou maior).');
      return;
    }

    try {
      setSalvandoEdicao(true);
      const res = await api.put(`/gestao-solar/tecnicos/${tecnico.id}/equipamentos/${equipId}`, {
        quantidade: qtdNum,
        motivo: 'Ajuste manual de saldo pelo gestor'
      });

      toast.success(res.data?.message || 'Saldo atualizado com sucesso!');
      setEquipamentoEmEdicao(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao ajustar quantidade.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Excluir item de saldo com confirmação no modal bonito
  const handleConfirmarExcluirSaldo = async () => {
    if (!itemParaExcluir) return;

    try {
      setExcluindoItem(true);
      const res = await api.delete(`/gestao-solar/tecnicos/${tecnico.id}/equipamentos/${itemParaExcluir.id}`);
      toast.success(res.data?.message || 'Equipamento removido do técnico.');
      setItemParaExcluir(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao excluir equipamento.');
    } finally {
      setExcluindoItem(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-carga-title"
      >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-6">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-sm">
              <PackagePlus size={22} />
            </div>
            <div>
              <h2 id="modal-carga-title" className="text-lg font-black text-slate-900 tracking-tight">
                Gestão de Equipamentos do Técnico
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Técnico: <strong className="text-teal-700 font-bold">{tecnico.nome}</strong> ({tecnico.regiao})
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

        {/* Abas Internas */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('lote')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'lote'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers size={14} />
            <span>Enviar Carga em Lote</span>
            {itensCarga.length > 0 && (
              <span className="px-1.5 py-0.2 bg-teal-600 text-white text-[10px] font-black rounded-full ml-1">
                {itensCarga.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editar_saldo')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'editar_saldo'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Box size={14} />
            <span>Editar Saldo em Posse ({tecnico.equipamentos?.length || 0})</span>
          </button>
        </div>

        {/* ABA 1: ENVIAR CARGA EM LOTE */}
        {activeTab === 'lote' && (
          <form onSubmit={handleSubmitCargaLote} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Barra de Busca nas Sugestões do Catálogo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-teal-600" />
                    Selecione os Equipamentos da Frota (Caminhão, Moto, Vídeo)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {sugestoesCatalogo.length} modelos disponíveis
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={buscaSugestao}
                    onChange={(e) => setBuscaSugestao(e.target.value)}
                    placeholder="Filtrar sugestões (ex: VIRLOC, ST4305, CHIP, G40)..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* Grid de Sugestões Únicas */}
                <div className="max-h-44 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl custom-scrollbar flex flex-wrap gap-1.5">
                  {loadingSugestoes ? (
                    <div className="w-full py-4 text-center text-xs text-slate-400">
                      Carregando equipamentos da tabela...
                    </div>
                  ) : sugestoesFiltradas.length === 0 ? (
                    <div className="w-full py-4 text-center text-xs text-slate-400">
                      Nenhum equipamento encontrado com "{buscaSugestao}".
                    </div>
                  ) : (
                    sugestoesFiltradas.map((sug) => {
                      const isSelected = itensCarga.some(i => i.modelo.toUpperCase() === sug.nome.toUpperCase());
                      return (
                        <button
                          type="button"
                          key={sug.nome}
                          onClick={() => handleToggleItemSugestao(sug.nome)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                              : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200 hover:border-teal-200'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{sug.nome}</span>
                          {sug.finalidades && sug.finalidades.length > 0 && (
                            <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {sug.finalidades.join(' / ')}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Botão para abrir campo avulso */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMostrarCampoAvulso(!mostrarCampoAvulso)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{mostrarCampoAvulso ? 'Ocultar item manual' : '+ Adicionar equipamento avulso (não listado)'}</span>
                </button>
              </div>

              {/* Formulário de item avulso */}
              {mostrarCampoAvulso && (
                <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={modeloAvulso}
                    onChange={(e) => setModeloAvulso(e.target.value)}
                    placeholder="Nome/Modelo avulso (ex: ANTENA GPS)..."
                    className="flex-1 px-3 py-1.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-slate-800 uppercase outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={qtdAvulso}
                      onChange={(e) => setQtdAvulso(e.target.value)}
                      className="w-20 px-2 py-1.5 bg-white border border-teal-300 rounded-xl text-xs font-black text-center text-teal-900"
                      placeholder="Qtd"
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarAvulso}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      Inserir
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Itens Selecionados para Envio */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Remessa a Enviar ({itensCarga.length} {itensCarga.length === 1 ? 'item' : 'itens'})
                  </span>
                  {itensCarga.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItensCarga([])}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Limpar todos
                    </button>
                  )}
                </div>

                {itensCarga.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Nenhum item selecionado. Clique nas sugestões acima ou adicione um avulso.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {itensCarga.map((item) => (
                      <div
                        key={item.modelo}
                        className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {item.modelo}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => handleAlterarQtdItem(item.modelo, e.target.value)}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-lg text-xs font-black text-center text-teal-900 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoverItemCarga(item.modelo)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Remover este item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Motivo geral / Rastreio */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Motivo / Rastreio da Remessa (Opcional)
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Remessa início de mês, Sedex BR123456..."
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            {/* Footer Carga em Lote */}
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
                disabled={salvandoCarga || itensCarga.length === 0}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {salvandoCarga ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando Carga...</span>
                  </>
                ) : (
                  <>
                    <PackagePlus size={16} />
                    <span>Confirmar Envio ({itensCarga.length} {itensCarga.length === 1 ? 'item' : 'itens'})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ABA 2: EDITAR SALDO JÁ EXISTENTE EM POSSE */}
        {activeTab === 'editar_saldo' && (
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl mb-4">
                <p className="text-xs text-teal-900 font-medium">
                  Nesta aba você pode <strong>ajustar diretamente a quantidade</strong> de qualquer equipamento que já está registrado na posse do técnico ou excluir itens se necessário.
                </p>
              </div>

              {tecnico.equipamentos && tecnico.equipamentos.length > 0 ? (
                <div className="space-y-2.5">
                  {tecnico.equipamentos.map((eq) => {
                    const emEdicao = equipamentoEmEdicao === eq.id;

                    return (
                      <div
                        key={eq.id}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Box size={16} className="text-teal-600 shrink-0" />
                          <span className="text-xs font-black text-slate-800 truncate uppercase">
                            {eq.modelo_equipamento}
                          </span>
                        </div>

                        {emEdicao ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Novo Saldo:</span>
                            <input
                              type="number"
                              min="0"
                              value={novaQuantidade}
                              onChange={(e) => setNovaQuantidade(e.target.value)}
                              className="w-20 px-2 py-1 bg-white border border-teal-500 rounded-lg text-xs font-black text-center text-teal-900 outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSalvarEdicaoSaldo(eq.id)}
                              disabled={salvandoEdicao}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                              title="Salvar nova quantidade"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEquipamentoEmEdicao(null)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Cancelar edição"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                              eq.quantidade > 0
                                ? 'bg-white text-teal-800 border-teal-200 shadow-2xs'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {eq.quantidade} un
                            </span>

                            <button
                              type="button"
                              onClick={() => handleIniciarEdicaoSaldo(eq)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar quantidade deste equipamento"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setItemParaExcluir(eq)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover item da posse"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum equipamento registrado em posse deste técnico no momento.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Modal de Confirmação Bonito (estilo Tutorial/Base de conhecimento) */}
    <ConfirmModal
      isOpen={Boolean(itemParaExcluir)}
      title="Remover Equipamento da Posse"
      message={
        itemParaExcluir
          ? `Deseja realmente remover o equipamento "${itemParaExcluir.modelo_equipamento}" (${itemParaExcluir.quantidade} un) da posse de ${tecnico?.nome}? Esta ação atualizará o saldo imediatamente.`
          : ''
      }
      confirmLabel={excluindoItem ? 'Removendo...' : 'Remover Equipamento'}
      cancelLabel="Cancelar"
      onConfirm={handleConfirmarExcluirSaldo}
      onCancel={() => !excluindoItem && setItemParaExcluir(null)}
      danger={true}
    />
  </>
);
}
