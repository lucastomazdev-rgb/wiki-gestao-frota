import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  X, Copy, Check, MessageCircle, Phone, Mail,
  Truck, Bike, Video, AlertTriangle, CheckCircle2,
  ExternalLink, Star, Clock
} from 'lucide-react';
import { formatarPlacasAgrupadas } from '../../../utils/falhasFormatters';

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
 * ModalContatoWhatsApp
 *
 * Painel atômico para envio/cópia de mensagem WhatsApp por unidade.
 * Puxa contatos exclusivamente de Gestão de Unidades (unidade_responsaveis).
 * Se a unidade não possui contatos cadastrados, impede a cópia e o envio.
 * Ao copiar, aciona o backend para atualizar apenas as falhas pendentes para "Aguardando Retorno",
 * mantendo qualquer outra tratativa anterior inalterada.
 */
export default function ModalContatoWhatsApp({
  isOpen,
  onClose,
  unidadeData,
  onContatado,
  onIrGestaoUnidades
}) {
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
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

  useEffect(() => {
    if (isOpen && unidadeData) {
      const contatos = Array.isArray(unidadeData.contatos) ? unidadeData.contatos : [];
      if (contatos.length === 1) {
        setContatoSelecionado(contatos[0]);
      } else if (contatos.length > 1) {
        // Pré-seleciona contato principal se houver, ou o primeiro
        const principal = contatos.find((c) => c.principal) || contatos[0];
        setContatoSelecionado(principal);
      } else {
        setContatoSelecionado(null);
      }
      setCopiado(false);
    }
  }, [isOpen, unidadeData]);

  const {
    nome_unidade = '',
    uf = '',
    falhas = [],
    contatos = [],
    ultimoContato = null,
    lote_id = null
  } = unidadeData || {};

  const temContatos = contatos.length > 0;

  // Breakdown por categoria
  const caminhoes = useMemo(
    () => falhas.filter((f) => String(f.tipo_veiculo || '').toUpperCase().includes('CAMINH')),
    [falhas]
  );
  const motos = useMemo(
    () => falhas.filter((f) => String(f.tipo_veiculo || '').toUpperCase().includes('MOTO')),
    [falhas]
  );
  const videos = useMemo(
    () => falhas.filter((f) => {
      const t = String(f.tipo_veiculo || '').toUpperCase();
      return t.includes('VÍDEO') || t.includes('VIDEO') || t.includes('DASHCAM') || t.includes('CÂMERA');
    }),
    [falhas]
  );

  const textoAgrupadoPlacas = useMemo(() => formatarPlacasAgrupadas(falhas), [falhas]);

  const mensagem = useMemo(() => {
    return `Bom dia, tudo bem?
Notamos que os veículos abaixo estão sem sinal no nosso sistema de rastreamento há mais de 24 horas:

${textoAgrupadoPlacas}

Sabemos que isso costuma acontecer se o veículo estiver parado, na oficina ou com a bateria desligada, o que corta a energia do rastreador. Vocês saberiam me confirmar se esses veículos estão rodando normalmente nas rotas diárias?`.trim();
  }, [textoAgrupadoPlacas]);

  if (!isOpen || !unidadeData) return null;

  const handleCopiar = async () => {
    if (!temContatos || !contatoSelecionado) {
      return toast.error('A unidade não possui responsável cadastrado. Ação bloqueada.');
    }

    setEnviando(true);
    try {
      // 1. Copia texto para a área de transferência
      await navigator.clipboard.writeText(mensagem);

      // 2. Chamada atômica ao backend: atualiza apenas os pendentes para "Aguardando Retorno"
      if (lote_id) {
        await api.post('/gestao-solar/falhas/contato-unidade', {
          lote_id,
          unidade: nome_unidade,
          contato_nome: contatoSelecionado.nome || null
        });
      }

      setCopiado(true);
      toast.success(`Mensagem copiada! Pendências de "${nome_unidade}" atualizadas para "Aguardando Retorno".`);
      onContatado?.({
        unidade: nome_unidade,
        contato: contatoSelecionado
      });

      // Fecha o modal suavemente após feedback
      setTimeout(() => {
        onClose();
        setCopiado(false);
      }, 1300);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao registrar contato da unidade.';
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-sm">
              <MessageCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-800 tracking-tight">Contato WhatsApp</h2>
                {uf && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md">
                    {uf}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold truncate max-w-[280px]">
                {nome_unidade}
              </p>
              {ultimoContato?.data && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-0.5">
                  <Clock size={11} className="text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Contatado em <strong className="font-black text-emerald-800">{formatarDataSimples(ultimoContato.data)}</strong>
                    {ultimoContato.usuario ? (
                      <> por <strong className="font-black text-emerald-800">{ultimoContato.usuario}</strong></>
                    ) : ''}
                  </span>
                </div>
              )}
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

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto flex-1 custom-scrollbar p-6 space-y-5">
          
          {/* Card Resumo de Falhas da Unidade */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Veículos com falha nesta unidade
              </p>
              <span className="text-xs font-black px-2.5 py-1 bg-slate-800 text-white rounded-lg">
                Total: {falhas.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {caminhoes.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
                  <Truck size={14} className="text-slate-500" />
                  <span className="text-xs font-black text-slate-800">{caminhoes.length}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Caminhões</span>
                </div>
              )}
              {motos.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
                  <Bike size={14} className="text-slate-500" />
                  <span className="text-xs font-black text-slate-800">{motos.length}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Motos</span>
                </div>
              )}
              {videos.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
                  <Video size={14} className="text-slate-500" />
                  <span className="text-xs font-black text-slate-800">{videos.length}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Vídeo / Câmera</span>
                </div>
              )}
            </div>
          </div>

          {/* Seleção de Contato vindo da Gestão de Unidades */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Responsável para contato (Gestão de Unidades)
              </label>
              {onIrGestaoUnidades && (
                <button
                  type="button"
                  onClick={onIrGestaoUnidades}
                  className="text-[10px] font-black text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ExternalLink size={11} /> Gestão de Unidades
                </button>
              )}
            </div>

            {!temContatos ? (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 text-amber-800">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black">Nenhum responsável cadastrado nesta unidade!</p>
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                      Para garantir a rastreabilidade e segurança operacional, a mensagem não pode ser copiada nem enviada sem um contato cadastrado.
                    </p>
                  </div>
                </div>
                {onIrGestaoUnidades && (
                  <button
                    type="button"
                    onClick={onIrGestaoUnidades}
                    className="self-start mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    Cadastrar Contato em Gestão de Unidades <ExternalLink size={12} />
                  </button>
                )}
              </div>
            ) : contatos.length === 1 ? (
              <div className="flex items-center gap-3 p-3.5 bg-teal-50 border border-teal-200 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-teal-700">
                    {contatos[0].nome?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-800 truncate">{contatos[0].nome}</p>
                    {contatos[0].principal && (
                      <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                        <Star size={10} className="fill-amber-500" /> Principal
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 items-center">
                    {contatos[0].telefone && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700 bg-white/70 px-2 py-0.5 rounded-lg border border-teal-200/60">
                        <Phone size={10} className="text-teal-600 shrink-0" />
                        <span>{contatos[0].telefone}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopiarTelefoneDigitos(e, contatos[0].telefone)}
                          className="p-1 hover:bg-teal-100 rounded-md text-slate-400 hover:text-teal-700 transition-colors cursor-pointer ml-0.5"
                          title="Copiar número limpo (apenas dígitos)"
                          aria-label="Copiar apenas dígitos do número"
                        >
                          {copiadoTel === contatos[0].telefone ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </span>
                    )}
                    {contatos[0].email && (
                      <span className="flex items-center gap-1">
                        <Mail size={10} className="text-slate-400" /> {contatos[0].email}
                      </span>
                    )}
                  </div>
                </div>
                <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {contatos.map((c) => {
                  const isSelected = contatoSelecionado?.id === c.id || contatoSelecionado?.nome === c.nome;
                  return (
                    <button
                      key={c.id || c.nome}
                      type="button"
                      onClick={() => setContatoSelecionado(c)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-200/50'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-[11px] font-black">
                          {c.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-slate-800 truncate">{c.nome}</p>
                          {c.principal && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                              <Star size={9} className="fill-amber-500" /> Principal
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400 font-medium items-center">
                          {c.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} className="shrink-0" />
                              <span>{c.telefone}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopiarTelefoneDigitos(e, c.telefone)}
                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-0.5"
                                title="Copiar número limpo (apenas dígitos)"
                                aria-label="Copiar apenas dígitos do número"
                              >
                                {copiadoTel === c.telefone ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={10} /> {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={16} className="text-teal-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prévia da Mensagem (Balão WhatsApp) */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Prévia da Mensagem (Agrupada por Tratativa)
            </label>
            <div className="relative">
              <div className="bg-[#E7FFDB] border border-[#d4f5c0] rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium shadow-sm">
                {mensagem}
              </div>
              <div className="absolute -left-1 top-3 w-3 h-3 bg-[#E7FFDB] border-l border-b border-[#d4f5c0] rotate-45 shadow-[-2px_2px_0_rgba(0,0,0,0.04)]" />
            </div>
          </div>
        </div>

        {/* Footer com botão e validação */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0 flex flex-col gap-2">
          {!temContatos ? (
            <div className="text-center py-1">
              <p className="text-xs font-black text-rose-600 flex items-center justify-center gap-1.5">
                <AlertTriangle size={14} /> Mensagem bloqueada: cadastre um responsável na Gestão de Unidades
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 text-center font-medium">
              Ao copiar, as falhas <span className="font-black text-slate-700">pendentes</span> mudarão para{' '}
              <span className="font-black text-teal-700">Aguardando Retorno</span>. Veículos com tratativas anteriores permanecem inalterados.
            </p>
          )}

          <button
            type="button"
            onClick={handleCopiar}
            disabled={!temContatos || !contatoSelecionado || enviando || copiado}
            className={`w-full h-12 flex items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
              copiado
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : !temContatos
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {copiado ? (
              <>
                <Check size={18} /> Mensagem Copiada com Sucesso!
              </>
            ) : enviando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando Contato…
              </>
            ) : (
              <>
                <Copy size={18} /> Copiar Mensagem WhatsApp
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
