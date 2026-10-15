import React from 'react';
import { Edit, Sparkles, AlertTriangle, Truck, MapPin, Calendar, Clock, BatteryWarning } from 'lucide-react';

const isBateriaBaixa = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const str = String(val).trim().replace(',', '.');
  const match = str.match(/[-+]?\d*\.?\d+/);
  if (match) {
    const num = parseFloat(match[0]);
    if (!isNaN(num)) return num < 11;
  }
  const lower = str.toLowerCase();
  return lower.includes('baixa') || lower.includes('critica') || lower.includes('crítica');
};

const formatarBateria = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim();
  return str.toLowerCase().endsWith('v') ? str : `${str}V`;
};

const classeTratativa = (tratativa) => {
  const t = String(tratativa || 'Pendente de Contato').trim();
  if (t === 'Pendente de Contato') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (t === 'Voltou a comunicar') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (t === 'Agendado Manutenção') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (t === 'Oficina') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-teal-50 text-teal-700 border-teal-200';
};

const formatarDataHora = (dataStr) => {
  if (!dataStr) return '-';
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

const formatarDataSimples = (dataStr) => {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default function FalhasTable({
  registros = [],
  onEditRegistro,
  carregando = false
}) {
  if (carregando) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-teal-600 border-t-transparent mb-3" />
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Carregando dados das falhas...
        </p>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Truck size={24} />
        </div>
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          Nenhuma falha encontrada
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Não há registros para os filtros selecionados ou nenhuma extração foi importada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Visualização Mobile: Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden p-4">
        {registros.map((item) => (
          <div
            key={item.id}
            className={`border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all ${
              item.tipo_falha === 'FALHA RECORRENTE'
                ? 'bg-amber-50/20 border-amber-200/80'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <span className="font-mono font-black text-slate-900 text-base tracking-wider block">
                  {item.placa}
                </span>
                {item.tipo_veiculo && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {item.tipo_veiculo}
                  </span>
                )}
              </div>

              {/* Badge Nova Falha vs Recorrente */}
              {item.tipo_falha === 'FALHA RECORRENTE' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  <AlertTriangle size={12} className="text-amber-600" />
                  Recorrente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  <Sparkles size={12} className="text-teal-600" />
                  Nova Falha
                </span>
              )}
            </div>

            {/* Informações detalhadas */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Unidade:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">
                  {item.unidade || 'Não informada'} {item.uf ? `(${item.uf})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Última Transmissão:</span>
                <span className="font-mono font-bold text-slate-700">
                  {formatarDataHora(item.ultima_transmissao)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Bateria:</span>
                {(() => {
                  const batCritica = isBateriaBaixa(item.nivel_bateria);
                  const batTexto = formatarBateria(item.nivel_bateria);
                  if (!batTexto) {
                    return <span className="font-bold text-slate-400 text-xs">S/ Bat</span>;
                  }
                  if (batCritica) {
                    return (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                        <BatteryWarning size={12} className="text-rose-500 shrink-0" />
                        {batTexto} (Crítica)
                      </span>
                    );
                  }
                  return <span className="font-bold text-slate-700 text-xs">{batTexto}</span>;
                })()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tratativa:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${classeTratativa(item.status_tratativa)}`}>
                  {item.status_tratativa || 'Pendente de Contato'}
                </span>
              </div>
              {item.ordem_servico && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">O.S.:</span>
                  <span className="font-mono font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    #{item.ordem_servico}
                  </span>
                </div>
              )}
            </div>

            {/* Botão de Ação */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => onEditRegistro(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit size={14} />
                <span>Atualizar Tratativa</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Visualização Desktop: Tabela */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-5 py-3.5">Veículo / Placa</th>
              <th className="px-4 py-3.5">Classificação</th>
              <th className="px-4 py-3.5">Unidade / UF</th>
              <th className="px-4 py-3.5">Última Transmissão</th>
              <th className="px-3 py-3.5 text-center">Bateria</th>
              <th className="px-4 py-3.5">Tratativa Atual</th>
              <th className="px-4 py-3.5">Ordem de Serviço</th>
              <th className="px-4 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {registros.map((item) => {
              const isRecorrente = item.tipo_falha === 'FALHA RECORRENTE';
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isRecorrente ? 'bg-amber-50/15' : ''
                  }`}
                >
                  {/* Veículo & Placa */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                        {item.placa}
                      </span>
                      {item.tipo_veiculo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {item.tipo_veiculo}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Classificação: Nova Falha vs Falha Recorrente */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {isRecorrente ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/90 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        <AlertTriangle size={12} className="text-amber-500" />
                        Recorrente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200/90 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        <Sparkles size={12} className="text-teal-600" />
                        Nova Falha
                      </span>
                    )}
                  </td>

                  {/* Unidade & UF */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-800 truncate max-w-[180px]">
                      {item.unidade || 'Não informada'}
                    </div>
                    {item.uf && (
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {item.uf}
                      </span>
                    )}
                  </td>

                  {/* Última Transmissão */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-mono font-medium text-slate-700">
                      {formatarDataHora(item.ultima_transmissao)}
                    </div>
                  </td>

                  {/* Bateria */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {(() => {
                      const batCritica = isBateriaBaixa(item.nivel_bateria);
                      const batTexto = formatarBateria(item.nivel_bateria);
                      if (!batTexto) {
                        return (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200">
                            S/ Bat
                          </span>
                        );
                      }
                      if (batCritica) {
                        return (
                          <span
                            title="Bateria Crítica (< 11V)"
                            className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                          >
                            <BatteryWarning size={12} className="text-rose-500 shrink-0" />
                            {batTexto}
                          </span>
                        );
                      }
                      return (
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {batTexto}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Status Tratativa */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-2xs ${classeTratativa(item.status_tratativa)}`}>
                      {item.status_tratativa || 'Pendente de Contato'}
                    </span>
                    {item.data_contato && (
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                        Contato: {formatarDataSimples(item.data_contato)}
                      </span>
                    )}
                  </td>

                  {/* O.S. */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {item.ordem_servico ? (
                      <span className="font-mono font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        #{item.ordem_servico}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Sem O.S.
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEditRegistro(item)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-teal-200"
                      title="Editar Tratativa / O.S."
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
