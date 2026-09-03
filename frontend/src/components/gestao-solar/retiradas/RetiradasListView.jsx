import React from 'react';
import { Calendar, Edit, Layers, Loader2, Trash2 } from 'lucide-react';

export default function RetiradasListView({
  retiradasPaginadas,
  isLoadingRetiradas,
  onEditarRetirada,
  onDelete
}) {
  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch {
      return dataStr;
    }
  };

  const getStatusBadgeStyle = (status) => {
    const st = (status || '').toLowerCase();
    if (st.includes('retirado')) {
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    if (st.includes('roubado') || st.includes('sinistro') || st.includes('perda')) {
      return 'bg-rose-50 text-rose-700 border-rose-200/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Visualização de Cards para Telas Menores (Mobile / Tablet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {isLoadingRetiradas ? (
          <div className="col-span-full py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-orange-500" size={32} />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando Retiradas...</span>
            </div>
          </div>
        ) : retiradasPaginadas.length > 0 ? (
          retiradasPaginadas.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Placa</span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.placa}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeStyle(item.status)}`}>
                  {item.status || 'Retirado'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Layers size={14} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-bold truncate">
                    {item.unidades_clientes?.nome_unidade || 'Unidade não informada'}
                  </span>
                  {item.unidades_clientes?.uf && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">
                      {item.unidades_clientes.uf}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="font-bold text-[11px]">{formatarData(item.data_retirada)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-orange-600">
                      {item.status === 'Retirado'
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.modelos_rastreadores?.valor_instalacao || 0)
                        : 'R$ 0,00'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.modelos_rastreadores?.tipo_veiculo && (
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[9px] font-black text-slate-600 uppercase">
                      {item.modelos_rastreadores.tipo_veiculo}
                    </span>
                  )}
                  {item.modelos_rastreadores?.nome_modelo && (
                    <span className="px-2 py-0.5 bg-orange-50 border border-orange-200/60 rounded-md text-[9px] font-black text-orange-600 uppercase">
                      {item.modelos_rastreadores.nome_modelo}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onEditarRetirada(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-orange-50 text-orange-600 rounded-xl transition-all duration-300 border border-transparent hover:border-orange-100 active:scale-95 text-[10px] font-black uppercase cursor-pointer"
                >
                  <Edit size={14} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-100 active:scale-95 text-[10px] font-black uppercase cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
            Nenhuma retirada encontrada
          </div>
        )}
      </div>

      {/* Visualização de Tabela (Desktop) */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-white">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-[0.15em] border-b border-slate-200">
              <th className="p-3 pl-5 font-black w-[14%]">Placa</th>
              <th className="p-3 font-black w-[28%]">
                <span className="inline-flex items-center gap-1.5">
                  <span>Unidade / UF</span>
                  <span className="text-[9px] font-black bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200/60 tracking-tight">
                    CLIENTE
                  </span>
                </span>
              </th>
              <th className="p-3 font-black w-[15%]">Tipo / Modelo</th>
              <th className="p-3 font-black w-[15%] text-center">Status</th>
              <th className="p-3 font-black w-[13%]">Data Baixa</th>
              <th className="p-3 font-black w-[15%] text-right pr-5">Taxa Cobrada</th>
              <th className="p-3 font-black w-[10%] text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingRetiradas ? (
              <tr>
                <td colSpan="7" className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-orange-500" size={32} />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Retiradas...</span>
                  </div>
                </td>
              </tr>
            ) : retiradasPaginadas.length > 0 ? (
              retiradasPaginadas.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition-colors group animate-in fade-in duration-300"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <td className="p-3 pl-5">
                    <span className="font-black text-slate-800 text-xs tracking-tight uppercase">{item.placa}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col leading-tight min-w-0 pr-2">
                      <span className="font-bold text-slate-700 text-xs truncate">
                        {item.unidades_clientes?.nome_unidade || '-'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          {item.unidades_clientes?.uf || 'UF'}
                        </span>
                        {item.unidades_clientes?.cod_cliente && (
                          <span className="text-[9px] text-slate-400 font-medium">
                            • Cód: {item.unidades_clientes.cod_cliente}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-600 uppercase tracking-tight group-hover:bg-white transition-colors">
                        {item.modelos_rastreadores?.tipo_veiculo || 'N/D'}
                      </span>
                      {item.modelos_rastreadores?.nome_modelo && (
                        <span className="text-[10px] text-slate-400 font-bold truncate">
                          {item.modelos_rastreadores.nome_modelo}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getStatusBadgeStyle(item.status)}`}>
                      {item.status || 'Retirado'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-600 font-bold text-xs">
                      {formatarData(item.data_retirada)}
                    </span>
                  </td>
                  <td className="p-3 text-right pr-5">
                    <span className="font-black text-orange-600 text-xs">
                      {item.status === 'Retirado'
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.modelos_rastreadores?.valor_instalacao || 0)
                        : <span className="text-slate-300 italic font-bold">R$ 0,00</span>
                      }
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => onEditarRetirada(item)}
                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-125 hover:shadow-xs active:scale-90 cursor-pointer"
                        title="Editar Retirada"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-125 hover:shadow-xs active:scale-90 cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Nenhuma retirada encontrada para os filtros selecionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
