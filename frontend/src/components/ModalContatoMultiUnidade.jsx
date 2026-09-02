import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  X, Copy, Check, MessageCircle, User,
  Building2, ChevronDown
} from 'lucide-react';
import { formatarPlacasAgrupadas } from '../utils/falhasFormatters';

// =====================================================================
// MODAL CONTATO MULTI-UNIDADE — Mesmo responsável, múltiplas unidades
// =====================================================================
export default function ModalContatoMultiUnidade({ isOpen, onClose, contatos, unidadesComFalhas, onContatado }) {
  const [responsavelSelecionado, setResponsavelSelecionado] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setResponsavelSelecionado(null);
      setIsDropdownOpen(false);
      setCopiado(false);
    }
  }, [isOpen]);

  // Responsáveis únicos que aparecem em MAIS de uma unidade com falhas
  const responsaveisMultiUnidade = useMemo(() => {
    if (!isOpen || !contatos || !unidadesComFalhas) return [];
    
    const mapaResponsavel = {}; // nome -> { contato, unidades[] }

    contatos.forEach(c => {
      const unidade = unidadesComFalhas.find(u => u.unidade_id === c.unidade_id);
      if (!unidade) return; // ignora responsáveis de unidades SEM falhas

      if (!mapaResponsavel[c.nome]) {
        mapaResponsavel[c.nome] = { contato: c, unidades: [] };
      }
      // Evita duplicatas de unidade para o mesmo responsável
      const jaAdicionado = mapaResponsavel[c.nome].unidades.some(u => u.unidade_id === unidade.unidade_id);
      if (!jaAdicionado) {
        mapaResponsavel[c.nome].unidades.push(unidade);
      }
    });

    // Filtra apenas responsáveis com 2+ unidades
    return Object.values(mapaResponsavel)
      .filter(r => r.unidades.length >= 2)
      .sort((a, b) => (a.contato?.nome || '').localeCompare(b.contato?.nome || ''));
  }, [isOpen, contatos, unidadesComFalhas]);

  const dadosSelecionados = useMemo(() => {
    return responsavelSelecionado
      ? responsaveisMultiUnidade.find(r => r.contato.id === responsavelSelecionado?.id)
      : null;
  }, [responsavelSelecionado, responsaveisMultiUnidade]);

  // Gera o bloco de placas por unidade com o agrupamento de tratativas
  const blocoUnidades = useMemo(() => {
    if (!dadosSelecionados) return '';
    return dadosSelecionados.unidades.map(u => {
        const textoAgrupado = formatarPlacasAgrupadas(u.falhas || []);
        return `${u.nome_unidade}:\n${textoAgrupado}`;
      }).join('\n\n');
  }, [dadosSelecionados]);

  const mensagem = useMemo(() => {
    if (!dadosSelecionados) return '';
    return `Bom dia, tudo bem?
Notamos que os veículos abaixo estão sem sinal no nosso sistema de rastreamento há mais de 24 horas:

${blocoUnidades}

Sabemos que isso costuma acontecer se o veículo estiver parado, na oficina ou com a bateria desligada, o que corta a energia do rastreador. Vocês saberiam me confirmar se esses veículos estão rodando normalmente nas rotas diárias?`.trim();
  }, [blocoUnidades, dadosSelecionados]);

  if (!isOpen) return null;

  const handleCopiar = async () => {
    if (!dadosSelecionados) return toast.error('Selecione um responsável.');
    setEnviando(true);
    try {
      await navigator.clipboard.writeText(mensagem);

      // Monta payload: uma entrada por unidade
      const unidadesPayload = dadosSelecionados.unidades.map(u => ({
        unidade_id: u.unidade_id,
        placas: u.falhas.map(f => f.placa)
      }));

      await api.post('/falhas/registrar-contato-multi', {
        contato_id: dadosSelecionados.contato.id,
        unidades: unidadesPayload,
        mensagem_texto: mensagem
      });

      setCopiado(true);
      toast.success(`Mensagem copiada! ${dadosSelecionados.unidades.length} unidades registradas no histórico.`);

      // Notifica o pai para marcar todas as unidades como contatadas
      dadosSelecionados.unidades.forEach(u => {
        onContatado?.({ unidade_id: u.unidade_id, contato: dadosSelecionados.contato });
      });

      setTimeout(() => { onClose(); setCopiado(false); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao registrar contato.');
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 flex flex-col overflow-hidden min-h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <MessageCircle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Contato Multi-Unidade</h2>
              <p className="text-[10px] text-slate-400 font-medium">Responsável com falhas em múltiplas unidades</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar p-6 space-y-5">

          {/* Aviso se não houver responsáveis multi-unidade */}
          {responsaveisMultiUnidade.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <Building2 size={32} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-600">Nenhum responsável compartilhado</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Não há responsável cadastrado em 2 ou mais unidades com falhas simultaneamente.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Seletor de Responsável */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Selecionar Responsável
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(v => !v)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                      isDropdownOpen ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {responsavelSelecionado ? (
                        <div>
                          <p className="text-sm font-black text-slate-800">{responsavelSelecionado.nome}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {dadosSelecionados?.unidades.length} unidades · {dadosSelecionados?.unidades.reduce((s, u) => s + u.falhas.length, 0)} falhas no total
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 font-medium">Selecionar responsável…</p>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                      <div className="p-1.5 space-y-0.5">
                        {responsaveisMultiUnidade.map(r => (
                          <button
                            key={r.contato.id}
                            onClick={() => { setResponsavelSelecionado(r.contato); setIsDropdownOpen(false); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                              responsavelSelecionado?.id === r.contato.id
                                ? 'bg-orange-50 border border-orange-200'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-black text-orange-700">{r.contato.nome.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">{r.contato.nome}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {r.unidades.map(u => u.nome_unidade).join(' · ')}
                              </p>
                            </div>
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
                              {r.unidades.reduce((s, u) => s + u.falhas.length, 0)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown das Unidades */}
              {dadosSelecionados && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Unidades incluídas na mensagem
                  </label>
                  <div className="space-y-2">
                    {dadosSelecionados.unidades.map(u => (
                      <div key={u.unidade_id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg flex-shrink-0">
                          <Building2 size={14} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{u.nome_unidade}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.uf}</p>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                          {u.falhas.length} placa{u.falhas.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview da Mensagem */}
              {dadosSelecionados && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Preview da mensagem
                  </label>
                  <div className="relative">
                    <div className="bg-[#E7FFDB] border border-[#d4f5c0] rounded-2xl rounded-tl-sm p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium shadow-sm max-h-64 overflow-y-auto custom-scrollbar">
                      {mensagem}
                    </div>
                    <div className="absolute -left-1 top-3 w-3 h-3 bg-[#E7FFDB] border-l border-b border-[#d4f5c0] rotate-45 shadow-[-2px_2px_0_rgba(0,0,0,0.05)]" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 shrink-0">
          <button
            onClick={handleCopiar}
            disabled={!responsavelSelecionado || enviando || copiado || responsaveisMultiUnidade.length === 0}
            className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
              copiado
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : responsavelSelecionado
                ? 'bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md shadow-green-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {copiado ? (
              <><Check size={16} /> Mensagem Copiada!</>
            ) : enviando ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registrando…</>
            ) : (
              <><Copy size={16} /> Copiar Mensagem Multi-Unidade</>
            )}
          </button>
          {responsavelSelecionado && !copiado && (
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Ao copiar, as falhas de <span className="font-bold text-orange-600">{dadosSelecionados?.unidades.length} unidade(s)</span> serão marcadas como <span className="font-bold text-teal-600">Aguardando Retorno</span> e salvas no histórico.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
