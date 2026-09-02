import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, CalendarRange, TrendingUp, TrendingDown, ArrowRightLeft, 
  Loader2, PackageOpen, ChevronRight, ChevronDown, MapPin, 
  Building2, Car, Truck, Bike, Video 
} from 'lucide-react';
import api from '../../services/api';

const MESES = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
];

const MESES_EXTENSO = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-3 w-36 rounded" />
        </div>
      </div>
    </div>
  );
}

function EmptySection({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
      <PackageOpen size={36} className="mb-3 opacity-40" />
      <p className="text-[11px] font-black uppercase tracking-widest">Não há {label} neste mês</p>
    </div>
  );
}

function SectionBadge({ count, color, icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2.5 rounded-xl border shadow-inner ${color.bg} ${color.border} ${color.text}`}>
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">{label}</h4>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${color.sub}`}>
          {count} {count === 1 ? 'registro' : 'registros'}
        </p>
      </div>
      <div className={`ml-auto text-lg font-black ${color.text} tabular-nums`}>
        {count}
      </div>
    </div>
  );
}

function PlacaCardNova({ item, delay }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-teal-50/40 border border-teal-100/60 hover:border-teal-300 hover:bg-teal-50/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group"
      style={{ animation: `fadeSlideIn 0.3s ease-out ${delay}ms both` }}
    >
      <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
        <TrendingUp size={14} strokeWidth={3} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-black text-slate-800 text-sm tracking-wider">{item.placa}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-slate-400 truncate">{item.unidades_clientes?.nome_unidade || '—'}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-[10px] font-bold text-teal-600">
          {item.data_instalacao ? new Date(item.data_instalacao + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
        </span>
      </div>
    </div>
  );
}

function PlacaCardRetirada({ item, delay }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/40 border border-amber-100/60 hover:border-amber-300 hover:bg-amber-50/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group"
      style={{ animation: `fadeSlideIn 0.3s ease-out ${delay}ms both` }}
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
        <TrendingDown size={14} strokeWidth={3} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-black text-slate-800 text-sm tracking-wider">{item.placa}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-slate-400 truncate">{item.unidades_clientes?.nome_unidade || '—'}</span>
          {item.status && (
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
              item.status === 'Retirado' ? 'bg-amber-100/60 text-amber-600 border-amber-200/50' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {item.status}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-[10px] font-bold text-amber-600">
          {item.data_retirada ? new Date(item.data_retirada).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
        </span>
      </div>
    </div>
  );
}

function PlacaCardTransferencia({ item, delay }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/40 border border-sky-100/60 hover:border-sky-300 hover:bg-sky-50/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group"
      style={{ animation: `fadeSlideIn 0.3s ease-out ${delay}ms both` }}
    >
      <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 group-hover:rotate-6 transition-all">
        <ArrowRightLeft size={14} strokeWidth={3} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-black text-slate-800 text-sm tracking-wider">{item.placa}</span>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[9px] font-black text-amber-700 bg-amber-100/55 px-1.5 py-0.5 rounded border border-amber-200/40 truncate max-w-[100px]" title={item.origem?.nome_unidade}>
            {item.origem?.nome_unidade || '—'}
          </span>
          <span className="text-[9px] text-slate-350 font-black">→</span>
          <span className="text-[9px] font-black text-teal-700 bg-teal-100/55 px-1.5 py-0.5 rounded border border-teal-200/40 truncate max-w-[100px]" title={item.destino?.nome_unidade}>
            {item.destino?.nome_unidade || '—'}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-[10px] font-bold text-sky-600">
          {item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString('pt-BR') : '—'}
        </span>
      </div>
    </div>
  );
}

function getVehicleIcon(tipo) {
  const norm = String(tipo || '').toLowerCase().trim();
  if (norm.includes('caminhão') || norm.includes('caminhao')) {
    return <Truck size={14} className="text-slate-400" />;
  }
  if (norm.includes('moto') || norm.includes('motocicleta')) {
    return <Bike size={14} className="text-slate-400" />;
  }
  if (norm.includes('vídeo') || norm.includes('video') || norm.includes('câmera') || norm.includes('camera')) {
    return <Video size={14} className="text-slate-400" />;
  }
  return <Car size={14} className="text-slate-400" />;
}

const groupData = (items, type) => {
  if (!items || !Array.isArray(items)) return [];

  const groups = {};
  items.forEach(item => {
    let uf = 'Sem UF';
    let unidade = 'Sem Unidade';
    let tipoVeiculo = 'Outros';

    if (type === 'transferencia') {
      uf = item.destino?.uf || item.origem?.uf || 'Sem UF';
      unidade = item.destino?.nome_unidade || item.origem?.nome_unidade || 'Sem Unidade';
      tipoVeiculo = item.tipo_veiculo || 'Outros';
    } else {
      uf = item.unidades_clientes?.uf || 'Sem UF';
      unidade = item.unidades_clientes?.nome_unidade || 'Sem Unidade';
      tipoVeiculo = item.modelos_rastreadores?.tipo_veiculo || 'Outros';
    }

    const ufKey = String(uf).toUpperCase().trim();
    const unidadeKey = String(unidade).trim();
    const tipoKey = String(tipoVeiculo).trim();

    if (!groups[ufKey]) {
      groups[ufKey] = {
        name: ufKey,
        count: 0,
        unidades: {}
      };
    }
    
    if (!groups[ufKey].unidades[unidadeKey]) {
      groups[ufKey].unidades[unidadeKey] = {
        name: unidadeKey,
        count: 0,
        tipos: {}
      };
    }

    if (!groups[ufKey].unidades[unidadeKey].tipos[tipoKey]) {
      groups[ufKey].unidades[unidadeKey].tipos[tipoKey] = {
        name: tipoKey,
        count: 0,
        items: []
      };
    }

    groups[ufKey].count += 1;
    groups[ufKey].unidades[unidadeKey].count += 1;
    groups[ufKey].unidades[unidadeKey].tipos[tipoKey].count += 1;
    groups[ufKey].unidades[unidadeKey].tipos[tipoKey].items.push(item);
  });

  return Object.values(groups).map(ufGroup => {
    return {
      ...ufGroup,
      unidades: Object.values(ufGroup.unidades).map(unidadeGroup => {
        return {
          ...unidadeGroup,
          tipos: Object.values(unidadeGroup.tipos).map(tipoGroup => {
            return {
              ...tipoGroup
            };
          }).sort((a, b) => b.count - a.count)
        };
      }).sort((a, b) => b.count - a.count)
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
};

function GroupedSection({
  title,
  groupedData,
  sectionKey,
  color,
  icon: Icon,
  cardType,
  emptyLabel
}) {
  const [expandedUFs, setExpandedUFs] = useState({});
  const [expandedUnidades, setExpandedUnidades] = useState({});
  const [expandedTipos, setExpandedTipos] = useState({});

  const toggleUF = (uf) => {
    setExpandedUFs(prev => ({ ...prev, [uf]: !prev[uf] }));
  };

  const toggleUnidade = (uf, unidade) => {
    const key = `${uf}-${unidade}`;
    setExpandedUnidades(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTipo = (uf, unidade, tipo) => {
    const key = `${uf}-${unidade}-${tipo}`;
    setExpandedTipos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCount = useMemo(() => {
    return groupedData.reduce((acc, uf) => acc + uf.count, 0);
  }, [groupedData]);

  return (
    <section className="mb-6">
      <SectionBadge
        count={totalCount}
        color={color}
        icon={Icon}
        label={title}
      />
      {groupedData.length > 0 ? (
        <div className="space-y-2.5 ml-1 animate-in fade-in duration-300">
          {groupedData.map((ufGroup) => {
            const isUfExpanded = !!expandedUFs[ufGroup.name];
            return (
              <div key={ufGroup.name} className="border border-slate-200/70 rounded-2xl overflow-hidden bg-slate-50/30 shadow-sm transition-all">
                {/* Level 1: UF Header */}
                <button
                  onClick={() => toggleUF(ufGroup.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                    isUfExpanded ? 'bg-slate-100/70 text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border flex items-center justify-center ${color.bg} ${color.border} ${color.text}`}>
                    <MapPin size={13} />
                  </div>
                  <span className="text-xs font-black tracking-widest text-slate-800">{ufGroup.name}</span>
                  <div className="h-px bg-slate-200/60 flex-1 ml-2" />
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${color.bg} ${color.border} ${color.text} tabular-nums`}>
                    {ufGroup.count} {ufGroup.count === 1 ? 'registro' : 'registros'}
                  </span>
                  {isUfExpanded ? (
                    <ChevronDown size={15} className="text-slate-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={15} className="text-slate-400 transition-transform duration-200" />
                  )}
                </button>

                {/* Level 1 Content: Unidades */}
                {isUfExpanded && (
                  <div className="p-3 bg-slate-50/10 border-t border-slate-200/50 space-y-2 animate-in fade-in duration-200">
                    {ufGroup.unidades.map((unidadeGroup) => {
                      const isUnidadeExpanded = !!expandedUnidades[`${ufGroup.name}-${unidadeGroup.name}`];
                      return (
                        <div key={unidadeGroup.name} className="border border-slate-200/40 rounded-xl overflow-hidden bg-white shadow-sm">
                          {/* Level 2: Unidade Header */}
                          <button
                            onClick={() => toggleUnidade(ufGroup.name, unidadeGroup.name)}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-all duration-200 ${
                              isUnidadeExpanded ? 'bg-slate-50/60 text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50/50'
                            }`}
                          >
                            <Building2 size={13} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-700 tracking-tight">{unidadeGroup.name}</span>
                            <div className="h-px bg-slate-100 flex-1 ml-1" />
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-full tabular-nums">
                              {unidadeGroup.count}
                            </span>
                            {isUnidadeExpanded ? (
                              <ChevronDown size={13} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={13} className="text-slate-400" />
                            )}
                          </button>

                          {/* Level 2 Content: Tipos de Veículos */}
                          {isUnidadeExpanded && (
                            <div className="p-2.5 bg-slate-50/30 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
                              {unidadeGroup.tipos.map((tipoGroup) => {
                                const isTipoExpanded = !!expandedTipos[`${ufGroup.name}-${unidadeGroup.name}-${tipoGroup.name}`];
                                const hasManyPlates = tipoGroup.items.length > 10;
                                
                                return (
                                  <div key={tipoGroup.name} className="rounded-xl border border-slate-200/50 overflow-hidden bg-white shadow-sm">
                                    {/* Level 3: Tipo Header */}
                                    <button
                                      onClick={() => toggleTipo(ufGroup.name, unidadeGroup.name, tipoGroup.name)}
                                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-200 ${
                                        isTipoExpanded ? 'bg-slate-50/30 text-slate-850' : 'bg-white text-slate-650 hover:bg-slate-50/20'
                                      }`}
                                    >
                                      {getVehicleIcon(tipoGroup.name)}
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{tipoGroup.name}</span>
                                      <div className="h-px bg-slate-100 flex-1 ml-1.5" />
                                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-200/30 px-1.5 py-0.5 rounded-full tabular-nums">
                                        {tipoGroup.count}
                                      </span>
                                      {isTipoExpanded ? (
                                        <ChevronDown size={12} className="text-slate-400" />
                                      ) : (
                                        <ChevronRight size={12} className="text-slate-400" />
                                      )}
                                    </button>

                                    {/* Level 3 Content: Placas List */}
                                    {isTipoExpanded && (
                                      <div className="p-2.5 bg-slate-50/15 border-t border-slate-100 animate-in fade-in duration-200">
                                        <div className={`space-y-2 ${hasManyPlates ? 'max-h-[300px] overflow-y-auto pr-1 scrollbar-thin' : ''}`}>
                                          {tipoGroup.items.map((item, idx) => {
                                            if (cardType === 'nova') {
                                              return <PlacaCardNova key={item.id} item={item} delay={idx * 25} />;
                                            } else if (cardType === 'retirada') {
                                              return <PlacaCardRetirada key={item.id} item={item} delay={idx * 25} />;
                                            } else {
                                              return <PlacaCardTransferencia key={item.id} item={item} delay={idx * 25} />;
                                            }
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptySection label={emptyLabel} />
      )}
    </section>
  );
}

export default function ModalTimeline({ isOpen, onClose }) {
  const agora = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(agora.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(agora.getFullYear());
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anosDisponiveis, setAnosDisponiveis] = useState([agora.getFullYear()]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/timeline', {
          params: { mes: mesSelecionado, ano: anoSelecionado }
        });
        if (!cancelled) {
          setDados(data);
          if (data.anos_disponiveis?.length > 0) {
            setAnosDisponiveis(data.anos_disponiveis);
          }
        }
      } catch {
        if (!cancelled) setDados({ novas: [], retiradas: [], transferencias: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [isOpen, mesSelecionado, anoSelecionado]);

  const totalMovimentacoes = useMemo(() => {
    if (!dados) return 0;
    return (dados.novas?.length || 0) + (dados.retiradas?.length || 0) + (dados.transferencias?.length || 0);
  }, [dados]);

  // Compute grouped structures
  const novasAgrupadas = useMemo(() => {
    return groupData(dados?.novas, 'nova');
  }, [dados?.novas]);

  const retiradasAgrupadas = useMemo(() => {
    return groupData(dados?.retiradas, 'retirada');
  }, [dados?.retiradas]);

  const transferenciasAgrupadas = useMemo(() => {
    return groupData(dados?.transferencias, 'transferencia');
  }, [dados?.transferencias]);

  if (!isOpen) return null;

  return (
    <>
      {/* CSS for custom animations & styling */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-timeline-title">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

        <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">

          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-teal-50/30 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-md shadow-teal-200/50">
                <CalendarRange size={20} />
              </div>
              <div>
                <h3 id="modal-timeline-title" className="text-lg font-black text-slate-800 tracking-tight">
                  Movimentação Mensal
                </h3>
                <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest leading-none mt-1">
                  {MESES_EXTENSO[mesSelecionado]} {anoSelecionado} • {loading ? '...' : `${totalMovimentacoes} movimentações`}
                </p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95">
              <X size={20} />
            </button>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Período</span>
                <div className="h-px w-4 bg-slate-200" />
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-md">
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer shadow-sm"
                  aria-label="Selecionar mês"
                >
                  {MESES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  className="w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer shadow-sm"
                  aria-label="Selecionar ano"
                >
                  {anosDisponiveis.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-50/10">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="skeleton h-6 w-40 rounded" />
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : totalMovimentacoes === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-5">
                  <CalendarRange size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-black text-slate-400 mb-1">Nenhuma movimentação</p>
                <p className="text-[11px] font-bold text-slate-300 text-center max-w-xs">
                  Não há dados de instalações, retiradas ou transferências em {MESES_EXTENSO[mesSelecionado]} de {anoSelecionado}.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Seção: Placas Novas */}
                <GroupedSection
                  title="Instalações Novas"
                  groupedData={novasAgrupadas}
                  sectionKey="novas"
                  color={{
                    bg: 'bg-teal-50',
                    border: 'border-teal-200/60',
                    text: 'text-teal-600',
                    sub: 'text-teal-400'
                  }}
                  icon={TrendingUp}
                  cardType="nova"
                  emptyLabel="instalações novas"
                />

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
                </div>

                {/* Seção: Retiradas */}
                <GroupedSection
                  title="Retiradas"
                  groupedData={retiradasAgrupadas}
                  sectionKey="retiradas"
                  color={{
                    bg: 'bg-amber-50',
                    border: 'border-amber-200/60',
                    text: 'text-amber-600',
                    sub: 'text-amber-400'
                  }}
                  icon={TrendingDown}
                  cardType="retirada"
                  emptyLabel="retiradas"
                />

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
                </div>

                {/* Seção: Mudanças de Titularidade */}
                <GroupedSection
                  title="Mudanças de Titularidade"
                  groupedData={transferenciasAgrupadas}
                  sectionKey="transferencias"
                  color={{
                    bg: 'bg-sky-50',
                    border: 'border-sky-200/60',
                    text: 'text-sky-600',
                    sub: 'text-sky-400'
                  }}
                  icon={ArrowRightLeft}
                  cardType="transferencia"
                  emptyLabel="transferências"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400">
              {!loading && dados ? (
                <>
                  <span className="text-teal-600 font-black">{dados.novas?.length || 0}</span> novas • {' '}
                  <span className="text-amber-600 font-black">{dados.retiradas?.length || 0}</span> retiradas • {' '}
                  <span className="text-sky-600 font-black">{dados.transferencias?.length || 0}</span> transferências
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" /> Carregando dados...
                </span>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all duration-200 hover:text-slate-700 active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
