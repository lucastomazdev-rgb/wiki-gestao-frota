import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  X, Copy, Check, MessageCircle, User,
  Building2, ChevronDown, CheckSquare, Square,
  Truck, Bike, Video, AlertTriangle, Layers, Phone
} from 'lucide-react';
import { formatarPlacasAgrupadas } from '../../../utils/falhasFormatters';
import { formatarTelefoneExibicao } from '../../../utils/contatoMultiUtils';

const formatarDataSimples = (dataStr) => {
  if (!dataStr) return '';
  if (typeof dataStr === 'string' && dataStr.includes('T')) {
    const [ano, mes, dia] = dataStr.split('T')[0].split('-');
    if (ano && mes && dia && dia.length === 2 && mes.length === 2) {
      return `${dia}/${mes}/${ano}`;
    }
  }
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

/**
 * ModalContatoMultiUnidade
 *
 * Permite enviar mensagem de WhatsApp agrupando múltiplas unidades que compartilham
 * o mesmo responsável (identificado por dupla validação estrita: Nome + Telefone).
 *
 * Inclui:
 * - Seletor inteligente do responsável qualificado
 * - Checkboxes individuais por unidade (todas marcadas por padrão)
 * - Resumo dinâmico de frotas das unidades selecionadas (Total, Caminhões, Motos, Câmeras)
 * - Preview WhatsApp em estilo bubble com quebra organizada por unidade
 * - Cópia atômica para o clipboard e atualização em lote no backend
 */
export default function ModalContatoMultiUnidade({
  isOpen,
  onClose,
  responsaveisMulti = [],
  responsavelInicial = null,
  loteAtivo = null,
  onContatadoMulti
}) {
  const [responsavelSelecionadoId, setResponsavelSelecionadoId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState(new Set());
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [copiadoTel, setCopiadoTel] = useState(null);

  const handleCopiarTelefoneDigitos = async (e, tel) => {
    e.stopPropagation();
    const digitos = String(tel || '').replace(/\D/g, '');
    if (!digitos) {
      return toast.error('Nenhum número disponível para copiar.');
    }
    try {
      await navigator.clipboard.writeText(digitos);
      setCopiadoTel(tel);
      toast.success(`Número copiado: ${digitos}`);
      setTimeout(() => setCopiadoTel(null), 1500);
    } catch {
      toast.error('Erro ao copiar número.');
    }
  };

  // Inicialização e sincronização ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setCopiado(false);
      setIsDropdownOpen(false);

      if (responsavelInicial?.id) {
        setResponsavelSelecionadoId(responsavelInicial.id);
      } else if (responsaveisMulti.length > 0) {
        // Pré-seleciona o primeiro responsável disponível
        setResponsavelSelecionadoId(responsaveisMulti[0].id);
      } else {
        setResponsavelSelecionadoId(null);
      }
    } else {
      setResponsavelSelecionadoId(null);
      setUnidadesSelecionadas(new Set());
      setIsDropdownOpen(false);
      setCopiado(false);
    }
  }, [isOpen, responsavelInicial, responsaveisMulti]);

  // Responsável ativo no momento
  const responsavelAtivo = useMemo(() => {
    if (!responsavelSelecionadoId) return null;
    return responsaveisMulti.find((r) => r.id === responsavelSelecionadoId) || null;
  }, [responsavelSelecionadoId, responsaveisMulti]);

  // Sempre que o responsável ativo mudar, pré-seleciona TODAS as unidades dele
  useEffect(() => {
    if (responsavelAtivo && responsavelAtivo.unidades) {
      const nomes = responsavelAtivo.unidades.map((u) => u.nome_unidade);
      setUnidadesSelecionadas(new Set(nomes));
    } else {
      setUnidadesSelecionadas(new Set());
    }
  }, [responsavelAtivo]);

  // Unidades efetivamente marcadas
  const unidadesMarcadas = useMemo(() => {
    if (!responsavelAtivo) return [];
    return (responsavelAtivo.unidades || []).filter((u) =>
      unidadesSelecionadas.has(u.nome_unidade)
    );
  }, [responsavelAtivo, unidadesSelecionadas]);

  // Contadores agregados das unidades marcadas
  const metricasFrota = useMemo(() => {
    let total = 0;
    let cams = 0;
    let motos = 0;
    let videos = 0;

    unidadesMarcadas.forEach((u) => {
      const falhas = u.falhas || [];
      total += falhas.length;

      falhas.forEach((f) => {
        const tipo = String(f.tipo_veiculo || '').toUpperCase();
        if (tipo.includes('CAMINH')) cams += 1;
        else if (tipo.includes('MOTO')) motos += 1;
        else if (
          tipo.includes('VÍDEO') ||
          tipo.includes('VIDEO') ||
          tipo.includes('DASHCAM') ||
          tipo.includes('CÂMERA')
        ) {
          videos += 1;
        }
      });
    });

    return { total, cams, motos, videos };
  }, [unidadesMarcadas]);

  // Toggle de unidade individual
  const toggleUnidade = (nomeUnidade) => {
    setUnidadesSelecionadas((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(nomeUnidade)) {
        proximo.delete(nomeUnidade);
      } else {
        proximo.add(nomeUnidade);
      }
      return proximo;
    });
  };

  // Toggle selecionar todas / desmarcar todas
  const toggleTodas = () => {
    if (!responsavelAtivo) return;
    const todas = responsavelAtivo.unidades.map((u) => u.nome_unidade);
    if (unidadesSelecionadas.size === todas.length) {
      setUnidadesSelecionadas(new Set());
    } else {
      setUnidadesSelecionadas(new Set(todas));
    }
  };

  // Montagem do bloco de texto por unidade selecionada
  const blocoUnidadesTexto = useMemo(() => {
    if (unidadesMarcadas.length === 0) return '';

    return unidadesMarcadas
      .map((u) => {
        const textoAgrupado = formatarPlacasAgrupadas(u.falhas || []);
        const ufStr = u.uf ? ` (${u.uf})` : '';
        return `*${u.nome_unidade}${ufStr}:*\n${textoAgrupado}`;
      })
      .join('\n\n');
  }, [unidadesMarcadas]);

  // Mensagem final formatada para WhatsApp
  const mensagem = useMemo(() => {
    if (unidadesMarcadas.length === 0) return '';

    return `Bom dia, tudo bem?
Notamos que os veículos abaixo estão sem sinal no nosso sistema de rastreamento há mais de 24 horas:

${blocoUnidadesTexto}

Sabemos que isso costuma acontecer se o veículo estiver parado, na oficina ou com a bateria desligada, o que corta a energia do rastreador. Vocês saberiam me confirmar se esses veículos estão rodando normalmente nas rotas diárias?`.trim();
  }, [blocoUnidadesTexto, unidadesMarcadas]);

  if (!isOpen) return null;

  // Ação de copiar e registrar contato simultâneo
  const handleCopiar = async () => {
    if (!responsavelAtivo) {
      return toast.error('Selecione um responsável.');
    }
    if (unidadesMarcadas.length === 0) {
      return toast.error('Selecione pelo menos uma unidade para o envio.');
    }

    setEnviando(true);
    try {
      // 1. Copia para o clipboard
      await navigator.clipboard.writeText(mensagem);

      // 2. Chamada atômica ao backend
      const loteId = loteAtivo?.id || 'latest';
      const nomesUnidades = unidadesMarcadas.map((u) => u.nome_unidade);

      await api.post('/gestao-solar/falhas/contato-multi-unidade', {
        lote_id: loteId,
        unidades: nomesUnidades,
        contato_nome: responsavelAtivo.nome,
        contato_telefone: responsavelAtivo.telefone
      });

      setCopiado(true);
      toast.success(
        `Mensagem copiada! ${nomesUnidades.length} unidade(s) atualizada(s) para "Aguardando Retorno".`
      );

      // Notifica o componente pai para atualização otimista dos cards
      onContatadoMulti?.({
        unidades: nomesUnidades,
        contato: responsavelAtivo.contatoBase || {
          nome: responsavelAtivo.nome,
          telefone: responsavelAtivo.telefone
        }
      });

      // Fecha o modal suavemente após feedback
      setTimeout(() => {
        onClose();
        setCopiado(false);
      }, 1400);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao registrar contato multi-unidade.';
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* 1. Header do Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl shadow-sm">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-800 tracking-tight">Contato Multi-Unidade</h2>
                <span className="text-[10px] font-black px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                  Gestão Solar
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Mesmo responsável com falhas pendentes em múltiplas unidades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Conteúdo com Scroll */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 custom-scrollbar">

          {responsaveisMulti.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Building2 size={32} className="text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-700">Nenhum responsável compartilhado</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Não foram identificados contatos com mesmo nome e telefone cadastrados em 2 ou mais unidades com falhas no lote atual.
              </p>
            </div>
          ) : (
            <>
              {/* Seletor de Responsável Multi-Unidade */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Responsável Compartilhado ({responsaveisMulti.length} disponível{responsaveisMulti.length > 1 ? 'is' : ''})
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((v) => !v)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer bg-white ${
                      isDropdownOpen
                        ? 'border-teal-500 ring-2 ring-teal-100'
                        : 'border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs shrink-0">
                      {responsavelAtivo?.nome?.charAt(0)?.toUpperCase() || <User size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {responsavelAtivo ? (
                        <div>
                          <p className="text-sm font-black text-slate-800 truncate">{responsavelAtivo.nome}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                            {responsavelAtivo.telefone && (
                              <span className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                                <Phone size={10} className="text-teal-600 shrink-0" />
                                <span>{formatarTelefoneExibicao(responsavelAtivo.telefone)}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopiarTelefoneDigitos(e, responsavelAtivo.telefone)}
                                  className="p-1 hover:bg-teal-100 rounded-md text-slate-400 hover:text-teal-700 transition-colors cursor-pointer ml-0.5"
                                  title="Copiar número limpo (apenas dígitos)"
                                  aria-label="Copiar apenas dígitos do número"
                                >
                                  {copiadoTel === responsavelAtivo.telefone ? (
                                    <Check size={11} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </span>
                            )}
                            <span>•</span>
                            <span className="text-teal-700 font-bold">
                              {responsavelAtivo.totalUnidades} unidades vinculadas
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 font-medium">Selecione o responsável…</p>
                      )}
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform shrink-0 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1">
                      {responsaveisMulti.map((r) => {
                        const isAtivo = r.id === responsavelAtivo?.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setResponsavelSelecionadoId(r.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                              isAtivo
                                ? 'bg-teal-50/80 border border-teal-200 text-teal-900'
                                : 'hover:bg-slate-50 border border-transparent text-slate-700'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center font-black text-xs shrink-0">
                              {r.nome.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black truncate">{r.nome}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                <span>{formatarTelefoneExibicao(r.telefone)}</span>
                                {r.telefone && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopiarTelefoneDigitos(e, r.telefone)}
                                    className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                    title="Copiar número limpo (apenas dígitos)"
                                    aria-label="Copiar apenas dígitos do número"
                                  >
                                    {copiadoTel === r.telefone ? (
                                      <Check size={10} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={10} />
                                    )}
                                  </button>
                                )}
                                <span>•</span>
                                <span className="truncate">{r.unidades.map((u) => u.nome_unidade).join(', ')}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black shrink-0">
                              {r.totalUnidades} un.
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Unidades com Checkboxes */}
              {responsavelAtivo && (
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Unidades Incluídas ({unidadesMarcadas.length} de {responsavelAtivo.unidades.length})
                    </label>
                    <button
                      type="button"
                      onClick={toggleTodas}
                      className="text-[10px] font-black text-teal-700 hover:text-teal-900 cursor-pointer uppercase tracking-wider"
                    >
                      {unidadesSelecionadas.size === responsavelAtivo.unidades.length
                        ? 'Desmarcar Todas'
                        : 'Selecionar Todas'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                    {responsavelAtivo.unidades.map((u) => {
                      const isMarcada = unidadesSelecionadas.has(u.nome_unidade);
                      const falhasCount = u.falhas?.length || 0;
                      const pendentesCount =
                        u.falhas?.filter(
                          (f) => f.status_tratativa === 'Pendente de Contato' || !f.status_tratativa
                        ).length || 0;

                      return (
                        <div
                          key={u.nome_unidade}
                          onClick={() => toggleUnidade(u.nome_unidade)}
                          className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                            isMarcada
                              ? 'bg-teal-50/30 border-teal-200 shadow-xs'
                              : 'bg-slate-50/50 border-slate-200/80 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              className="text-teal-600 shrink-0 cursor-pointer"
                              aria-label={isMarcada ? 'Desmarcar' : 'Marcar'}
                            >
                              {isMarcada ? (
                                <CheckSquare size={18} className="text-teal-600" />
                              ) : (
                                <Square size={18} className="text-slate-400" />
                              )}
                            </button>
                            <div className="p-2 bg-white rounded-xl border border-slate-200/70 shrink-0 text-slate-600">
                              <Building2 size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-800 truncate">
                                  {u.nome_unidade}
                                </p>
                                {u.uf && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded">
                                    {u.uf}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {pendentesCount} pendente{pendentesCount > 1 ? 's' : ''} de {falhasCount} falha{falhasCount > 1 ? 's' : ''}
                                {u.ultimoContato?.data && (
                                  <span className="text-emerald-700 font-semibold"> • Contatado em {formatarDataSimples(u.ultimoContato.data)}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-black px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 shrink-0">
                            {falhasCount} placa{falhasCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resumo da Frota das Unidades Selecionadas */}
              {unidadesMarcadas.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-xs font-bold text-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                    Frota Selecionada:
                  </span>
                  <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl font-black text-slate-800">
                    {metricasFrota.total} veículos
                  </div>
                  {metricasFrota.cams > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
                      <Truck size={12} className="text-slate-500" />
                      <span>{metricasFrota.cams}</span>
                      <span className="text-[10px] text-slate-400">Cam.</span>
                    </div>
                  )}
                  {metricasFrota.motos > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
                      <Bike size={12} className="text-slate-500" />
                      <span>{metricasFrota.motos}</span>
                      <span className="text-[10px] text-slate-400">Moto</span>
                    </div>
                  )}
                  {metricasFrota.videos > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
                      <Video size={12} className="text-slate-500" />
                      <span>{metricasFrota.videos}</span>
                      <span className="text-[10px] text-slate-400">Vídeo</span>
                    </div>
                  )}
                </div>
              )}

              {/* Preview da Mensagem Formatada WhatsApp */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Prévia da Mensagem (WhatsApp)
                </label>
                {unidadesMarcadas.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                    Selecione pelo menos uma unidade acima para visualizar a mensagem.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="bg-[#E7FFDB] border border-[#d4f5c0] rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium shadow-xs max-h-56 overflow-y-auto custom-scrollbar">
                      {mensagem}
                    </div>
                    <div className="absolute -left-1 top-3 w-3 h-3 bg-[#E7FFDB] border-l border-b border-[#d4f5c0] rotate-45 shadow-[-2px_2px_0_rgba(0,0,0,0.02)]" />
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* 3. Footer com Botão de Ação */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={handleCopiar}
            disabled={
              !responsavelAtivo ||
              unidadesMarcadas.length === 0 ||
              enviando ||
              copiado ||
              responsaveisMulti.length === 0
            }
            className={`w-full h-12 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-sm ${
              copiado
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : responsavelAtivo && unidadesMarcadas.length > 0
                ? 'bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            {copiado ? (
              <>
                <Check size={18} /> Mensagem Copiada!
              </>
            ) : enviando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando Contatos…
              </>
            ) : (
              <>
                <Copy size={16} /> Copiar Mensagem Multi-Unidade ({unidadesMarcadas.length} un.)
              </>
            )}
          </button>

          {responsavelAtivo && unidadesMarcadas.length > 0 && !copiado && (
            <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
              Ao copiar, apenas as falhas pendentes das{' '}
              <strong className="text-teal-700">{unidadesMarcadas.length} unidade(s) selecionada(s)</strong>{' '}
              serão atualizadas para <strong className="text-slate-700">Aguardando Retorno</strong>.
            </p>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
