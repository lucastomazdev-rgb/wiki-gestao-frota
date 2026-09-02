import React from 'react';
import { Edit, Layers, Loader2, LogOut, Trash2, Truck } from 'lucide-react';

export default function TabelaVeiculosListView({
  veiculosPaginados,
  isLoadingVeiculos,
  onEditarVeiculo,
  onAbrirRetirada,
  onDelete
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {veiculosPaginados.length > 0 ? (
          veiculosPaginados.map((veiculo, idx) => (
            <div
              key={veiculo.id}
              className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Placa</span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tighter">{veiculo.placa}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mensalidade</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                    R$ {Number(veiculo.modelos_rastreadores?.valor_mensalidade).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Layers size={14} className="text-slate-400" />
                  <span className="text-xs font-bold truncate">{veiculo.unidades_clientes?.nome_unidade}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    {veiculo.modulo}
                  </span>
                  <span className="px-2 py-1 bg-teal-50 border border-teal-100 rounded-md text-[10px] font-black text-teal-600 uppercase tracking-tighter">
                    {veiculo.modelos_rastreadores?.tipo_veiculo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => onEditarVeiculo(veiculo)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-teal-50 text-teal-600 rounded-xl transition-all duration-300 border border-transparent hover:border-teal-100 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-sm active:scale-95 group" title="Editar">
                  <Edit size={16} className="group-hover:rotate-12 transition-transform" /> <span className="text-[10px] font-black uppercase">Editar</span>
                </button>
                <button onClick={() => onAbrirRetirada(veiculo)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-orange-50 text-orange-600 rounded-xl transition-all duration-300 border border-transparent hover:border-orange-100 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-sm active:scale-95 group" title="Retirar">
                  <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" /> <span className="text-[10px] font-black uppercase">Retirar</span>
                </button>
                <button onClick={() => onDelete(veiculo.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-100 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-sm active:scale-95 group" title="Excluir">
                  <Trash2 size={16} className="group-hover:scale-110 group-hover:rotate-6 transition-transform" /> <span className="text-[10px] font-black uppercase">Excluir</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Nenhum veículo encontrado</div>
        )}
      </div>

      <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-[0.15em] border-b border-slate-200">
              <th className="p-3 pl-5 font-black w-[15%]">Placa</th>
              <th className="p-3 font-black w-[15%]">Módulo</th>
              <th className="p-3 font-black w-[30%]">Unidade</th>
              <th className="p-3 font-black w-[15%]">Tipo</th>
              <th className="p-3 font-black w-[15%] text-right pr-5">Mensalidade</th>
              <th className="p-3 font-black w-[10%] text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingVeiculos ? (
              <tr>
                <td colSpan="6" className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-teal-500" size={32} />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Frota...</span>
                  </div>
                </td>
              </tr>
            ) : veiculosPaginados.length > 0 ? (
              veiculosPaginados.map((veiculo, idx) => (
                <tr
                  key={veiculo.id}
                  className="hover:bg-slate-50/50 transition-colors group animate-in fade-in duration-300"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="p-3 pl-5">
                    <span className="font-black text-slate-800 text-xs tracking-tight uppercase">{veiculo.placa}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-500 font-bold text-[11px] truncate block">{veiculo.modulo}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-700 text-xs truncate block">{veiculo.unidades_clientes?.nome_unidade}</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:bg-white transition-colors">
                      {veiculo.modelos_rastreadores?.tipo_veiculo}
                    </span>
                  </td>
                  <td className="p-3 text-right pr-5">
                    <span className="font-black text-emerald-600 text-xs">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(veiculo.modelos_rastreadores?.valor_mensalidade)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => onEditarVeiculo(veiculo)} className="p-1.5 text-teal-500 hover:bg-teal-50 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:shadow-sm active:scale-90" title="Editar"><Edit size={14} /></button>
                      <button onClick={() => onAbrirRetirada(veiculo)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:shadow-sm active:scale-90" title="Retirar"><LogOut size={14} /></button>
                      <button onClick={() => onDelete(veiculo.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:shadow-sm active:scale-90" title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Busca sem resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
