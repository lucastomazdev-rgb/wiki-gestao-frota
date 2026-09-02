import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  X, Copy, Check, MessageCircle, Phone,
  Truck, Bike, Video, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { formatarPlacasAgrupadas } from '../utils/falhasFormatters';

// =====================================================================
// MODAL DE CONTATO WHATSAPP — Preview de mensagem + Ação Atômica
// =====================================================================
export default function ModalContatoWhatsApp({ isOpen, onClose, unidadeData, onContatado }) {
  // unidadeData = { unidade_id, nome_unidade, falhas: [], contatos: [] }

  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isOpen && unidadeData) {
      // Se só tiver 1 contato, pré-seleciona automaticamente
      if (unidadeData.contatos?.length === 1) {
        setContatoSelecionado(unidadeData.contatos[0]);
      } else {
        setContatoSelecionado(null);
      }
      setCopiado(false);
    }
  }, [isOpen, unidadeData]);

  if (!isOpen || !unidadeData) return null;

  const { nome_unidade, falhas = [], contatos = [] } = unidadeData;

  // Calculando a lista de placas e breakdown por tipo
  const placas = falhas.map(f => f.placa);
  const caminhoes = falhas.filter(f => f.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'CAMINHÃO');
  const motos = falhas.filter(f => f.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'MOTO');
  const videos = falhas.filter(f => f.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'VÍDEO');

  const textoAgrupadoPlacas = formatarPlacasAgrupadas(falhas);

  const mensagem = `Bom dia, tudo bem?
Notamos que os veículos abaixo estão sem sinal no nosso sistema de rastreamento há mais de 24 horas:

${textoAgrupadoPlacas}

Sabemos que isso costuma acontecer se o veículo estiver parado, na oficina ou com a bateria desligada, o que corta a energia do rastreador. Vocês saberiam me confirmar se esses veículos estão rodando normalmente nas rotas diárias?`.trim();


  const handleCopiar = async () => {
    if (!contatoSelecionado) {
      return toast.error('Selecione um responsável antes de copiar.');
    }

    setEnviando(true);
    try {
      // 1. Copia a mensagem para a área de transferência
      await navigator.clipboard.writeText(mensagem);

      // 2. Ação atômica no backend
      await api.post('/falhas/registrar-contato', {
        unidade_id: unidadeData.unidade_id,
        contato_id: contatoSelecionado.id,
        placas,
        mensagem_texto: mensagem
      });

      setCopiado(true);
      toast.success(`Mensagem copiada! Status das falhas de ${nome_unidade} atualizados.`);
      onContatado?.({ unidade_id: unidadeData.unidade_id, contato: contatoSelecionado });

      // Fecha o modal após 1.5s para o usuário ver o feedback
      setTimeout(() => {
        onClose();
        setCopiado(false);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao registrar contato.');
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-xl">
              <MessageCircle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Contato WhatsApp</h2>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">{nome_unidade}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar p-6 space-y-5">

          {/* Resumo das Falhas da Unidade */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Falhas na unidade</p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-800">{placas.length}</span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Total</p>
              </div>
              <div className="flex gap-4 pl-4 border-l border-slate-200">
                {caminhoes.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Truck size={13} className="text-slate-500" />
                    <span className="text-xs font-black text-slate-700">{caminhoes.length}</span>
                    <span className="text-[10px] text-slate-400">Cam.</span>
                  </div>
                )}
                {motos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Bike size={13} className="text-slate-500" />
                    <span className="text-xs font-black text-slate-700">{motos.length}</span>
                    <span className="text-[10px] text-slate-400">Motos</span>
                  </div>
                )}
                {videos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Video size={13} className="text-slate-500" />
                    <span className="text-xs font-black text-slate-700">{videos.length}</span>
                    <span className="text-[10px] text-slate-400">Vídeo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seleção de Responsável */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Responsável para contato
            </label>
            {contatos.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                <AlertTriangle size={14} />
                Nenhum responsável cadastrado para esta unidade. Adicione um na Gestão de Responsáveis.
              </div>
            ) : contatos.length === 1 ? (
              <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-black text-teal-700">{contatos[0].nome.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{contatos[0].nome}</p>
                  {contatos[0].telefone && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone size={10} />{contatos[0].telefone}
                    </p>
                  )}
                </div>
                <CheckCircle2 size={16} className="text-teal-500 ml-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                {contatos.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setContatoSelecionado(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      contatoSelecionado?.id === c.id
                        ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      contatoSelecionado?.id === c.id ? 'bg-teal-100' : 'bg-slate-100'
                    }`}>
                      <span className={`text-[11px] font-black transition-colors ${
                        contatoSelecionado?.id === c.id ? 'text-teal-700' : 'text-slate-500'
                      }`}>{c.nome.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{c.nome}</p>
                      {c.telefone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} />{c.telefone}
                        </p>
                      )}
                    </div>
                    {contatoSelecionado?.id === c.id && <Check size={15} className="text-teal-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview da Mensagem */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Preview da mensagem
            </label>
            <div className="relative">
              {/* Bolha estilo WhatsApp */}
              <div className="bg-[#E7FFDB] border border-[#d4f5c0] rounded-2xl rounded-tl-sm p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium shadow-sm">
                {mensagem}
              </div>
              <div className="absolute -left-1 top-3 w-3 h-3 bg-[#E7FFDB] border-l border-b border-[#d4f5c0] rotate-45 shadow-[-2px_2px_0_rgba(0,0,0,0.05)]" />
            </div>
          </div>

        </div>

        {/* Footer com ação */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 shrink-0">
          {!contatoSelecionado && contatos.length > 0 && (
            <p className="text-[10px] text-amber-600 font-bold mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Selecione um responsável acima para continuar
            </p>
          )}
          <button
            onClick={handleCopiar}
            disabled={!contatoSelecionado || enviando || copiado}
            className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
              copiado
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : contatoSelecionado
                ? 'bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md shadow-green-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {copiado ? (
              <><Check size={16} /> Mensagem Copiada!</>
            ) : enviando ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registrando…</>
            ) : (
              <><Copy size={16} /> Copiar Mensagem</>
            )}
          </button>
          {contatoSelecionado && !copiado && (
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Ao copiar, as falhas desta unidade serão marcadas como <span className="font-bold text-teal-600">Aguardando Retorno</span>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
