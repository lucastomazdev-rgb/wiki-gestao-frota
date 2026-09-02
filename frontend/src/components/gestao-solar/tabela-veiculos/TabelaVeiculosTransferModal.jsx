import React from 'react';
import { ArrowRight, ArrowRightLeft, Check, Loader2, Search, Truck, X } from 'lucide-react';

export default function TabelaVeiculosTransferModal({
  isOpen,
  transferindo,
  setIsTransferOpen,
  unidadesLista,
  unidadeOrigem,
  handleSelecionarOrigem,
  unidadeDestino,
  setUnidadeDestino,
  nomeUnidadeOrigem,
  nomeUnidadeDestino,
  placasFiltradas,
  placasSelecionadas,
  toggleTodas,
  filtroPlacaTransfer,
  setFiltroPlacaTransfer,
  filtroTipoTransfer,
  setFiltroTipoTransfer,
  togglePlaca,
  placasOrigem,
  onExecutarTransfer
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-transfer-title">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !transferindo && setIsTransferOpen(false)}></div>

      <div className="bg-white w-full max-w-3xl max-h-[95vh] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 px-6 py-4 border-b border-amber-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100/80 text-amber-600 rounded-xl border border-amber-200 shadow-inner">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 id="modal-transfer-title" className="text-lg font-black text-slate-800 tracking-tight">Transferência de Lotação</h3>
              <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest leading-none mt-1">Mover veículos entre unidades</p>
            </div>
          </div>
          <button onClick={() => !transferindo && setIsTransferOpen(false)} aria-label="Fechar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label htmlFor="transfer-origem" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Unidade de Origem</label>
              <select
                id="transfer-origem"
                value={unidadeOrigem}
                onChange={(e) => handleSelecionarOrigem(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all cursor-pointer shadow-sm"
              >
                <option value="">Selecione a unidade atual...</option>
                {unidadesLista.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome_unidade} — {u.uf}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="transfer-destino" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Unidade de Destino</label>
              <select
                id="transfer-destino"
                value={unidadeDestino}
                onChange={(e) => setUnidadeDestino(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 outline-none transition-all cursor-pointer shadow-sm"
                disabled={!unidadeOrigem}
              >
                <option value="">Selecione o destino...</option>
                {unidadesLista.filter((u) => String(u.id) !== String(unidadeOrigem)).map((u) => (
                  <option key={u.id} value={u.id}>{u.nome_unidade} — {u.uf}</option>
                ))}
              </select>
            </div>
          </div>

          {unidadeOrigem && unidadeDestino && (
            <div className="flex items-center justify-center gap-4 mb-8 p-4 bg-gradient-to-r from-amber-50 via-white to-teal-50 rounded-2xl border border-slate-100">
              <span className="text-sm font-extrabold text-amber-700 bg-amber-100 px-4 py-2 rounded-xl border border-amber-200 truncate max-w-[180px]" title={nomeUnidadeOrigem}>{nomeUnidadeOrigem}</span>
              <ArrowRight size={20} className="text-slate-400 flex-shrink-0 animate-pulse" />
              <span className="text-sm font-extrabold text-teal-700 bg-teal-100 px-4 py-2 rounded-xl border border-teal-200 truncate max-w-[180px]" title={nomeUnidadeDestino}>{nomeUnidadeDestino}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-amber-200/60 rounded-2xl overflow-hidden bg-amber-50/30">
              <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-800">Placas da Origem</h4>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">
                      {placasFiltradas.length} veículo(s) filtrado(s) • {placasSelecionadas.size} selecionado(s)
                    </p>
                  </div>
                  {placasFiltradas.length > 0 && (
                    <button
                      onClick={toggleTodas}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors border border-amber-200"
                    >
                      {placasFiltradas.every((v) => placasSelecionadas.has(v.id)) && placasFiltradas.length > 0 ? 'Desmarcar' : 'Selecionar'} Filtradas
                    </button>
                  )}
                </div>

                {unidadeOrigem && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Buscar placa..."
                        value={filtroPlacaTransfer}
                        onChange={(e) => setFiltroPlacaTransfer(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400/50 shadow-sm transition-all"
                      />
                    </div>
                    <select
                      value={filtroTipoTransfer}
                      onChange={(e) => setFiltroTipoTransfer(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400/50 shadow-sm transition-all cursor-pointer"
                    >
                      <option value="">Todos Tipos</option>
                      <option value="Caminhão">Caminhão</option>
                      <option value="Moto">Moto</option>
                      <option value="Vídeo">Vídeo</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {!unidadeOrigem ? (
                  <div className="text-center py-12 text-slate-400">
                    <ArrowRightLeft size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">Selecione uma unidade de origem</p>
                  </div>
                ) : placasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Truck size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum veículo encontrado</p>
                  </div>
                ) : (
                  placasFiltradas.map((v) => {
                    const sel = placasSelecionadas.has(v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => togglePlaca(v.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left group ${
                          sel
                            ? 'bg-amber-100 border-amber-300 shadow-sm'
                            : 'bg-white border-slate-200/70 hover:border-amber-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          sel ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 group-hover:border-amber-400'
                        }`}>
                          {sel && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-extrabold text-slate-800 text-sm tracking-wider">{v.placa}</span>
                          <span className="text-[10px] text-slate-400 font-semibold ml-2 truncate">{v.modelos_rastreadores?.tipo_veiculo}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex-shrink-0 hidden sm:block">{v.modulo}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-2 border-teal-200/60 rounded-2xl overflow-hidden bg-teal-50/30">
              <div className="bg-teal-50 px-5 py-4 border-b border-teal-100">
                <h4 className="text-sm font-extrabold text-teal-800">Destino da Transferência</h4>
                <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mt-0.5">
                  {unidadeDestino ? (nomeUnidadeDestino || 'Destino') : 'Aguardando seleção do destino'}
                </p>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {placasSelecionadas.size === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Check size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">Selecione placas à esquerda</p>
                    <p className="text-[10px] text-slate-400 mt-1">Elas aparecerão aqui para confirmação</p>
                  </div>
                ) : (
                  placasOrigem.filter((v) => placasSelecionadas.has(v.id)).map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-100/50 border-2 border-teal-200 text-left">
                      <div className="w-6 h-6 rounded-lg bg-teal-500 border-2 border-teal-500 text-white flex items-center justify-center flex-shrink-0">
                        <ArrowRight size={14} strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-slate-800 text-sm tracking-wider">{v.placa}</span>
                        <span className="text-[10px] text-teal-600 font-bold ml-2">→ {nomeUnidadeDestino || '...'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            {placasSelecionadas.size > 0
              ? <><span className="font-extrabold text-amber-600">{placasSelecionadas.size}</span> placa(s) selecionada(s) para transferência</>
              : 'Nenhuma placa selecionada'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsTransferOpen(false)}
              disabled={transferindo}
              className="px-6 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
            >Cancelar</button>
            <button
              onClick={onExecutarTransfer}
              disabled={transferindo || placasSelecionadas.size === 0 || !unidadeDestino}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 hover:-translate-y-0.5"
            >
              {transferindo ? <><Loader2 size={18} className="animate-spin" /> Transferindo...</> : <><ArrowRightLeft size={18} /> Confirmar Transferência</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
