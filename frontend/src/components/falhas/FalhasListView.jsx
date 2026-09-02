import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const tratativaClass = (tratativa) =>
  (tratativa || 'Pendente de Contato') === 'Pendente de Contato'
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : tratativa === 'Voltou a comunicar'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : tratativa === 'Oficina'
        ? 'bg-slate-100 text-slate-700 border-slate-200'
        : 'bg-teal-50 text-teal-700 border-teal-100';

export default function FalhasListView({
  itensAtuaisComResumo,
  abrirModalEditar,
  handleDelete,
  classeStatusAgendamento,
  subtextoAgendamento
}) {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden p-4">
        {itensAtuaisComResumo.length > 0 ? (
          itensAtuaisComResumo.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                (item.tratativa || 'Pendente de Contato') === 'Pendente de Contato' ? 'ring-1 ring-rose-100 bg-rose-50/5' : ''
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-black text-slate-800 tracking-wide text-base leading-none">{item.placa}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">{item.modelos_rastreadores?.tipo_veiculo}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${tratativaClass(
                    item.tratativa
                  )}`}
                >
                  {item.tratativa || 'Pendente de Contato'}
                </span>
              </div>

              <div className="mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${classeStatusAgendamento(item.statusAgendamento)}`}>
                  {item.statusAgendamento}
                </span>
                {subtextoAgendamento(item) && <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{subtextoAgendamento(item)}</div>}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unidade / UF</span>
                  <div className="text-[11px] font-bold text-slate-700 truncate">{item.unidades_clientes?.nome_unidade}</div>
                  <div className="text-[10px] font-bold text-slate-400">{item.unidades_clientes?.uf}</div>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ultima Transm.</span>
                  <div className="text-[11px] font-bold text-slate-700">
                    {item.ultima_transmissao
                      ? new Date(item.ultima_transmissao).toLocaleString('pt-BR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' })
                      : '-'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                    {item.bateria !== null && item.bateria !== undefined && item.bateria !== '' ? `Bat ${item.bateria}v` : 'S/ Bat'}
                  </span>
                  {item.ordem_servico && (
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      O.S #{item.ordem_servico}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => abrirModalEditar(item)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-300 border border-blue-100/50 hover:scale-110 hover:-translate-y-0.5 active:scale-90"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all duration-300 border border-rose-100/50 hover:scale-110 hover:-translate-y-0.5 active:scale-90"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhuma falha encontrada</div>
        )}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">Veiculo</th>
              <th className="px-6 py-4">Localizacao</th>
              <th className="px-6 py-4 whitespace-nowrap">Comunicacao / Bateria</th>
              <th className="px-6 py-4">Status Atual</th>
              <th className="px-6 py-4 whitespace-nowrap">Agendamento</th>
              <th className="px-6 py-4 whitespace-nowrap">Referencia</th>
              <th className="px-6 py-4 text-center">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-[11px]">
            {itensAtuaisComResumo.map((item, idx) => (
              <tr
                key={item.id}
                className={`hover:bg-slate-50/70 transition-colors animate-in fade-in duration-300 ${
                  (item.tratativa || 'Pendente de Contato') === 'Pendente de Contato' ? 'bg-rose-50/10' : ''
                }`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <td className="px-6 py-4 align-middle">
                  <div className="font-black text-slate-800 tracking-wide text-sm">{item.placa}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{item.modelos_rastreadores?.tipo_veiculo}</div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <div className="font-bold text-slate-700 leading-tight truncate max-w-[150px]">{item.unidades_clientes?.nome_unidade}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">{item.unidades_clientes?.uf}</div>
                </td>
                <td className="px-6 py-4 align-middle whitespace-nowrap">
                  <div className="font-bold text-slate-600">
                    {item.ultima_transmissao
                      ? new Date(item.ultima_transmissao).toLocaleString('pt-BR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' })
                      : '-'}
                  </div>
                  <div className="flex items-center mt-1.5 space-x-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-100 shadow-sm px-1.5 py-0.5 rounded-md">
                      {item.bateria !== null && item.bateria !== undefined && item.bateria !== '' ? `Bat ${item.bateria}v` : 'S/ Bat'}
                    </span>
                    {item.bateria !== null && item.bateria !== undefined && item.bateria !== '' && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest shadow-sm ${
                          parseFloat(item.bateria) < 11.0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}
                      >
                        {parseFloat(item.bateria) < 11.0 ? 'Critico' : 'OK'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block shadow-sm border ${
                      (item.tratativa || 'Pendente de Contato') === 'Pendente de Contato'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : item.tratativa === 'Voltou a comunicar'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : item.tratativa === 'Oficina'
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-teal-50 border-teal-200 text-teal-700'
                    }`}
                  >
                    {item.tratativa || 'Pendente de Contato'}
                  </span>
                  {item.data_contato && (
                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider block">
                      Atualizado: {new Date(item.data_contato).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 align-middle">
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block shadow-sm border ${classeStatusAgendamento(item.statusAgendamento)}`}>
                    {item.statusAgendamento}
                  </span>
                  {subtextoAgendamento(item) && (
                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider block">{subtextoAgendamento(item)}</div>
                  )}
                </td>
                <td className="px-6 py-4 align-middle">
                  {item.ordem_servico ? (
                    <div className="font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-md border border-teal-100 inline-block">
                      O.S #<span className="text-xs">{item.ordem_servico}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 font-medium italic">Sem Vinculo</span>
                  )}
                </td>
                <td className="px-6 py-4 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => abrirModalEditar(item)}
                      className="text-blue-500 hover:text-blue-700 transition-all duration-300 p-2 bg-blue-50/50 hover:bg-blue-100 border border-transparent hover:border-blue-200 shadow-sm rounded-xl cursor-pointer hover:scale-110 hover:-translate-y-0.5 active:scale-90"
                      title="Auditar / Atualizar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-rose-500 hover:text-rose-700 transition-all duration-300 p-2 bg-rose-50/50 hover:bg-rose-100 border border-transparent hover:border-rose-200 shadow-sm rounded-xl cursor-pointer hover:scale-110 hover:-translate-y-0.5 active:scale-90"
                      title="Excluir Registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {itensAtuaisComResumo.length === 0 && (
              <tr>
                <td colSpan="7" className="p-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
                  Nenhuma falha detectada com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
