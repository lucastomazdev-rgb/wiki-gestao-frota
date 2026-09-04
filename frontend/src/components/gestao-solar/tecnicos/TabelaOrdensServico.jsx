import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Wrench, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Truck, 
  FileText, 
  User, 
  Box, 
  AlertTriangle,
  ChevronRight,
  Eye
} from 'lucide-react';

export default function TabelaOrdensServico({
  ordens = [],
  loading = false,
  onAtualizarStatus,
  onConfirmarDevolucao,
  filtroPendenteDevolucao,
  setFiltroPendenteDevolucao,
  filtroStatus,
  setFiltroStatus,
  busca,
  setBusca,
  onNovaOS
}) {
  const [modalConfirmacaoDevolucao, setModalConfirmacaoDevolucao] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Realizado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-black uppercase">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Realizado</span>
          </span>
        );
      case 'Aguardando data':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-black uppercase">
            <Clock size={12} className="text-amber-600" />
            <span>Aguardando Data</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-black uppercase">
            <Calendar size={12} className="text-slate-500" />
            <span>Agendado</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por Placa, O.S, NF ou Unidade..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Devoluções Pendentes */}
          <button
            type="button"
            onClick={() => setFiltroPendenteDevolucao(!filtroPendenteDevolucao)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
              filtroPendenteDevolucao
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-amber-500/20'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
          >
            <RotateCcw size={14} className={filtroPendenteDevolucao ? 'animate-spin-slow' : ''} />
            <span>⚠️ Devoluções Pendentes</span>
          </button>

          {/* Filtro de Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="">Todos os Status</option>
            <option value="Agendado">Agendado</option>
            <option value="Aguardando data">Aguardando Data</option>
            <option value="Realizado">Realizado</option>
          </select>

          {/* Botão Nova O.S */}
          <button
            type="button"
            onClick={onNovaOS}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Wrench size={14} />
            <span>+ Lançar O.S.</span>
          </button>
        </div>
      </div>

      {/* Tabela Operacional */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-black text-[10px]">
                <th className="py-3.5 px-4">O.S & Data</th>
                <th className="py-3.5 px-4">Veículo / Unidade</th>
                <th className="py-3.5 px-4">Técnico Responsável</th>
                <th className="py-3.5 px-4">Serviço Prestado</th>
                <th className="py-3.5 px-4 text-center">Deslocamento</th>
                <th className="py-3.5 px-4 text-right">Valor Total / NF</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Logística Reversa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Carregando Ordens de Serviço...
                  </td>
                </tr>
              ) : ordens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Nenhuma Ordem de Serviço encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                ordens.map((os) => {
                  const hasPendingReturn = os.exige_devolucao && !os.equipamento_devolvido && os.status === 'Realizado';

                  return (
                    <tr 
                      key={os.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasPendingReturn ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* O.S & Data */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 block text-xs">
                          {os.numero_os}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(os.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      {/* Veículo / Unidade */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-900 text-white font-black text-[11px] rounded-lg tracking-wider">
                            {os.placa}
                          </span>
                          {os.uf && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md uppercase">
                              {os.uf}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold block mt-0.5 truncate max-w-[150px]">
                          {os.unidade || os.tipo_veiculo || 'Solar Frota'}
                        </span>
                      </td>

                      {/* Técnico */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                          {os.tecnico?.nome || 'Técnico Terceirizado'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {os.tecnico?.regiao || '-'}
                        </span>
                      </td>

                      {/* Serviço & Equipamentos Utilizados */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block text-xs">
                          {os.nome_servico}
                        </span>
                        {os.equipamentos_utilizados && Array.isArray(os.equipamentos_utilizados) && os.equipamentos_utilizados.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {os.equipamentos_utilizados.map((eq, i) => (
                              <span 
                                key={i}
                                className="px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[9px] font-black"
                              >
                                {eq.modelo} ({eq.quantidade} un)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Deslocamento KM */}
                      <td className="py-3.5 px-4 text-center">
                        {os.teve_km_rodado ? (
                          <div className="inline-block text-center">
                            <span className="font-black text-slate-800 text-[11px] block">
                              {os.km_quantidade} km
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              R$ {Number(os.valor_km_total).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      {/* Total Cobrado & NF */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 text-xs block text-emerald-700">
                          R$ {Number(os.valor_total_cobrado).toFixed(2)}
                        </span>
                        {os.numero_nf ? (
                          <span className="text-[10px] font-bold text-slate-500 block">
                            NF: {os.numero_nf}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-medium">
                            Sem NF
                          </span>
                        )}
                      </td>

                      {/* Status com Dropdown */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={os.status}
                          onChange={(e) => onAtualizarStatus(os.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-xl border transition-all cursor-pointer outline-none ${
                            os.status === 'Realizado'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-black'
                              : os.status === 'Aguardando data'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Agendado">Agendado</option>
                          <option value="Aguardando data">Aguardando Data</option>
                          <option value="Realizado">Realizado ✅</option>
                        </select>
                      </td>

                      {/* Logística Reversa / Devolução de Material */}
                      <td className="py-3.5 px-4 text-center">
                        {!os.exige_devolucao ? (
                          <span className="text-slate-300 font-bold" title="Não exige devolução de peças">-</span>
                        ) : os.equipamento_devolvido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black" title={`Confirmado por: ${os.usuario_devolucao || 'Operador'}`}>
                            <CheckCircle2 size={12} className="text-emerald-700" />
                            <span>Devolvido</span>
                          </span>
                        ) : os.status === 'Realizado' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black animate-pulse">
                              <AlertTriangle size={11} className="text-amber-700" />
                              <span>Devolução Pendente</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setModalConfirmacaoDevolucao(os)}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                            >
                              Confirmar Recebimento
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold">
                            Previsto na Realização
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Recebimento de Devolução */}
      {modalConfirmacaoDevolucao && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-amber-100 bg-amber-50/60 flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Confirmar Devolução de Peça
                </h3>
                <p className="text-xs text-slate-500">
                  Logística Reversa da O.S. {modalConfirmacaoDevolucao.numero_os}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Você confirma o recebimento físico do equipamento/peça retirado na manutenção do veículo <strong className="text-slate-900 font-black">{modalConfirmacaoDevolucao.placa}</strong> pelo técnico <strong className="text-slate-900">{modalConfirmacaoDevolucao.tecnico?.nome}</strong>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                Esta ação finalizará a pendência de devolução desta Ordem de Serviço.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalConfirmacaoDevolucao(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onConfirmarDevolucao(modalConfirmacaoDevolucao.id);
                  setModalConfirmacaoDevolucao(null);
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Confirmar Recebimento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
