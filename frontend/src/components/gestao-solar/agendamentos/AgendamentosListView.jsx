import React from 'react';
import { Building2, CalendarDays, Edit, Trash2 } from 'lucide-react';

const getStatusBadgeClass = (status) => {
  if (status === 'Realizado') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (status === 'Agendado') return 'bg-blue-50 text-blue-600 border-blue-100';
  if (status === 'Frustrado') return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-amber-50 text-amber-600 border-amber-100';
};

const formatDateUTC = (value) =>
  value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Aguardando Data';

export default function AgendamentosListView({ itensAtuais, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden p-4">
        {itensAtuais.length > 0 ? (
          itensAtuais.map((os, idx) => (
            <div
              key={os.id}
              className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    O.S. #{os.ordem_servico || 'S/N'}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">{os.placa}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getStatusBadgeClass(os.status)}`}>
                  {os.status}
                </span>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-xs font-bold truncate">
                    {os.unidades_clientes?.nome_unidade} - {os.unidades_clientes?.uf}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays size={14} className="text-slate-400" />
                  <span className="text-xs font-bold">{formatDateUTC(os.data_agendamento)}</span>
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serviço</span>
                  <span className="text-xs font-bold text-slate-700">{os.tipo_servico}</span>
                  <p className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md mt-1 border border-slate-100 leading-relaxed line-clamp-2">
                    {os.problema || 'Nenhum detalhe informado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onEdit(os)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-teal-50 text-teal-600 rounded-xl transition-all duration-300 border border-transparent hover:border-teal-100 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 group cursor-pointer"
                  title="Editar"
                >
                  <Edit size={16} className="group-hover:rotate-12 transition-transform" />{' '}
                  <span className="text-[10px] font-black uppercase">Editar</span>
                </button>
                <button
                  onClick={() => onDelete(os.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-100 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 group cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" />{' '}
                  <span className="text-[10px] font-black uppercase">Excluir</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
            Nenhum agendamento encontrado
          </div>
        )}
      </div>

      <div className="hidden lg:block overflow-hidden rounded-b-3xl">
        <table className="w-full text-left whitespace-nowrap border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
              <th className="px-6 py-4">O.S. / Data</th>
              <th className="px-6 py-4">Placa / Veículo</th>
              <th className="px-6 py-4">Serviço / Detalhes</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
            {itensAtuais.map((os, idx) => (
              <tr
                key={os.id}
                className="hover:bg-teal-50/20 transition-colors group animate-in fade-in duration-500"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-teal-600 font-black">#{os.ordem_servico || 'S/N'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                      {formatDateUTC(os.data_agendamento)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-black tracking-widest uppercase">{os.placa}</span>
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[180px] mt-0.5">
                      {os.unidades_clientes?.nome_unidade} - {os.unidades_clientes?.uf}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-black">{os.tipo_servico}</span>
                    <span className="text-[10px] text-slate-400 font-medium italic mt-0.5 truncate max-w-[220px]">
                      {os.problema || 'Nenhum detalhe informado'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${getStatusBadgeClass(os.status)}`}>
                    {os.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-1.5 transition-all duration-300">
                    <button
                      onClick={() => onEdit(os)}
                      className="p-2 text-teal-500 hover:bg-teal-50 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-90 cursor-pointer"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(os.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-90 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {itensAtuais.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Busca sem resultados</div>
        )}
      </div>
    </div>
  );
}
