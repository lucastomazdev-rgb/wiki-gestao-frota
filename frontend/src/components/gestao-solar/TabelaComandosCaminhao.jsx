import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, CheckCircle2, AlertCircle, Info, Hash, Zap, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COMMAND_CATEGORIES = [
  {
    id: 'padrao',
    label: 'Configuração Padrão',
    subLabel: 'Base Operacional',
    badge: 'Obrigatório',
    description: 'Configuração essencial para todos os veículos com leitura via rede CAN.',
    commands: [
      { id: 'c1', cmd: 'SCT65 15', desc: 'TOLERANCIA BASE' },
      { id: 'c2', cmd: 'SCT66 300', desc: 'TOLERANCIA MOTOR PARADO' },
      { id: 'c3', cmd: 'SCT67 40', desc: 'TOLERANCIA EMBREAGEM' },
      { id: 'c4', cmd: 'SCT68 5', desc: 'TOLERANCIA PARADO ACELERANADO' },
      { id: 'c5', cmd: 'SCT69 5', desc: 'TOLERANCIA MOVIMENTO SEM TRACAO' },
      { id: 'c6', cmd: 'VS08,FF,090', desc: 'VALOR MINIMO PARA EXCESSO DE VELOCIDADE' },
      { id: 'c7', cmd: 'VS08,104,015', desc: 'VALOR MINIMO MOVIMENTO SEM TRACAO' },
      { id: 'c8', cmd: 'SUT00,QCT01,7,10,+791,+1099', desc: 'FAIXA 1' },
      { id: 'c9', cmd: 'SUT01,QCT01,7,10,+1101,+1400', desc: 'FAIXA 2' },
      { id: 'c10', cmd: 'SUT02,QCT01,7,10,+1401,+1700', desc: 'FAIXA 3' },
      { id: 'c11', cmd: 'SUT03,QCT01,7,10,+1701,+2000', desc: 'FAIXA 4' },
      { id: 'c12', cmd: 'SUT04,QCT01,7,10,+2001,+2600', desc: 'FAIXA 5' },
      { id: 'c13', cmd: 'SUT05,QCT01,7,10,+2601,+3500', desc: 'FAIXA 6' },
      { id: 'c14', cmd: 'SUT06,QCT01,7,10,+3501,+9999', desc: 'FAIXA 7' },
      // SUT07 e SUT12 serão dinâmicos baseado na transmissão
      { id: 'c15_dynamic', cmd: '', desc: 'RPM ABAIXO DO IDEAL' },
      { id: 'c16_dynamic', cmd: '', desc: 'RPM MOVIMENTO SEM TRACAO' },
      { id: 'c17', cmd: 'SUT13,QCT01,7,10,+1000,+9999', desc: 'RPM PARADO ACELERANDO' },
      { id: 'c18', cmd: 'SUT18,QCT03,7,5,+35,+999', desc: 'VELOCIDADE CURVA BRUSCA' },
      { id: 'c19', cmd: 'SUT19,GSR0,24,5,-350,+350', desc: 'PARAMETRO CURVA BRUSCA' },
      { id: 'c20', cmd: 'SUT16,QAC,4,5,+20,+300', desc: 'ACELERACAO BRUSCA' },
      { id: 'c21', cmd: 'SUT17,QAC,4,5,-300,-15', desc: 'FRENAGEM BRUSCA' },
      { id: 'c22', cmd: 'GMV_CAL_AB0000', desc: 'CALIBRAR O SENSOR DE CURVA' },
      { id: 'c23', cmd: 'STD010060', desc: 'TD01 = GERA REPORTE A CADA 1 MIN COM IGN++' },
      { id: 'c24', cmd: 'STD020600', desc: 'TD02 = GERA REPORTE A CADA 10 MIN COM IGN--' }
    ]
  },
  {
    id: 'igfisica',
    label: 'Ignição Física',
    subLabel: 'Sem rede CAN',
    badge: 'Reduzido',
    description: 'Comandos específicos para instalações em caminhões sem rede CAN.',
    commands: [
      { id: 'if1', cmd: 'VS16,00,1100', desc: 'PARA CARRO SEM REDE CAN' },
      { id: 'if2', cmd: 'VS16,02,9999', desc: 'PARA CARRO SEM REDE CAN' }
    ]
  },
  {
    id: 'velogps',
    label: 'Velocidade por GPS',
    subLabel: 'Backup Velocidade',
    badge: 'Opcional',
    description: 'Comandos específicos para verificar a velocidade do veículo por GPS.',
    commands: [
      { id: 'v1', cmd: 'VS08,07,255', desc: 'VELOCIDADE POR GPS' },
      { id: 'v2', cmd: 'SUT11,QTT,33,3,+00,+300', desc: 'VELOCIDADE POR GPS' },
      { id: 'v3', cmd: 'SED009 TT00++ IN07++ SGN NN {SCT03 VUT11}', desc: 'VELOCIDADE POR GPS (Lógica Evento)' }
    ]
  },
  {
    id: 'limparcartao',
    label: 'Limpar Cartão',
    subLabel: 'Manutenção VIRLOC',
    badge: 'Útil',
    description: 'Comando utilizado para realizar a limpeza da memória de todos os cartões do equipamento.',
    commands: [
      { id: 'lc1', cmd: 'VCRN', desc: 'LIMPAR A MEMÓRIA DE TODOS OS CARTÕES DO VIRLOC.' }
    ]
  }
];

export default function TabelaComandosCaminhao() {
  const [activeTab, setActiveTab] = useState(COMMAND_CATEGORIES[0].id);
  const [transmissao, setTransmissao] = useState('manual'); // manual | automatica
  const [highlightedId, setHighlightedId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const DURATION = 20000;

  const handleCopy = (cmdId, cmdText) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    navigator.clipboard.writeText(cmdText);
    setHighlightedId(cmdId);
    setTimeLeft(100);

    toast.success('Copiado!', {
      style: {
        borderRadius: '10px',
        background: '#064e3b',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    });

    const updateRate = 50;
    const decrement = (updateRate / DURATION) * 100;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - decrement;
        return next > 0 ? next : 0;
      });
    }, updateRate);

    timerRef.current = setTimeout(() => {
      setHighlightedId(null);
      setTimeLeft(0);
      clearInterval(intervalRef.current);
    }, DURATION);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Lógica para obter os comandos com os RPMs dinâmicos
  const getCommands = (catId) => {
    const category = COMMAND_CATEGORIES.find(c => c.id === catId);
    if (catId === 'padrao') {
      return category.commands.map(cmd => {
        if (cmd.id === 'c15_dynamic') {
          return { 
            ...cmd, 
            cmd: transmissao === 'manual' ? 'SUT07,QCT01,7,10,+791,+1099' : 'SUT07,QCT01,7,10,+7000,+9000' 
          };
        }
        if (cmd.id === 'c16_dynamic') {
          return { 
            ...cmd, 
            cmd: transmissao === 'manual' ? 'SUT12,QCT01,7,15,+100,+790' : 'SUT12,QCT01,7,15,+8000,+9000' 
          };
        }
        return cmd;
      });
    }
    return category.commands;
  };

  const selectedData = COMMAND_CATEGORIES.find(c => c.id === activeTab);
  const currentCommands = getCommands(activeTab);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      
      {/* 📑 BARRA DE ABAS E TOGGLE DE TRANSMISSÃO */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner flex overflow-x-auto no-scrollbar max-w-full">
          {COMMAND_CATEGORIES.map(cat => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 min-w-[140px] whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <Terminal size={18} className={isActive ? 'text-teal-600' : 'opacity-40'} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ⚙️ TOGGLE DE TRANSMISSÃO (Apenas Visível em Configuração Padrão) */}
        {activeTab === 'padrao' && (
          <div className="flex-shrink-0 animate-in zoom-in-95 duration-300 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-inner flex gap-1">
            <button 
              onClick={() => {
                setTransmissao('manual');
                setHighlightedId(null); // Limpa destaque para evitar confusão de valores
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                transmissao === 'manual' 
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Settings2 size={16} />
              Manual
            </button>
            <button 
              onClick={() => {
                setTransmissao('automatica');
                setHighlightedId(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                transmissao === 'automatica' 
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Zap size={16} />
              Automático
            </button>
          </div>
        )}
      </div>

      {/* 📟 CONSOLE DE COMANDOS (Layout de Tabela) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
        
        {/* Header da Seção */}
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border transition-colors ${transmissao === 'manual' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              <Zap size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">{selectedData.label}</h4>
                {activeTab === 'padrao' && (
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${
                    transmissao === 'manual' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-teal-500 text-white border-teal-600'
                  }`}>
                    {transmissao === 'manual' ? 'MANUAL' : 'AUTOMÁTICO'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{selectedData.description}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Resultados</span>
             <span className="text-xl font-black text-teal-600 leading-none">{currentCommands.length}</span>
          </div>
        </div>

        {/* ESTRUTURA TABULAR COM SCROLL INTERNO */}
        <div className="flex-1 min-h-[400px] max-h-[550px] overflow-y-auto custom-scrollbar relative">
          
          <div className="sticky top-0 z-30 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 px-8 py-3 grid grid-cols-[50px_1.5fr_2fr_100px] gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <div>#</div>
            <div>Comando</div>
            <div>Descrição / Função</div>
            <div className="text-center">Ação</div>
          </div>

          <div className="divide-y divide-slate-100">
            {currentCommands.map((c, index) => {
              const isHighlighted = highlightedId === c.id;
              return (
                <div 
                  key={c.id} 
                  className={`grid grid-cols-[50px_1.5fr_2fr_100px] gap-6 px-8 py-4 items-center transition-all duration-300 relative group animate-in slide-in-from-left-2 duration-300 ${
                    isHighlighted 
                      ? 'bg-teal-50/30' 
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {isHighlighted && (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 z-10" />
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-500 z-10" />
                      <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500 z-10" />
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 z-10" />
                    </>
                  )}

                  <div className="text-[11px] font-mono font-black text-slate-300 group-hover:text-teal-600 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="relative group/cmd min-w-0">
                    <div className={`p-3 rounded-xl font-mono text-[13px] font-bold border transition-all truncate ${
                      isHighlighted 
                        ? 'bg-slate-900 text-teal-400 border-teal-500 shadow-lg shadow-teal-500/10 scale-[1.02] z-20' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 group-hover:border-slate-300'
                    }`}>
                      {c.cmd}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight truncate ${isHighlighted ? 'text-teal-800' : 'text-slate-600'}`} title={c.desc}>
                      {c.desc}
                    </p>
                  </div>

                  {/* 📟 BOTÃO DE COPIRA COM TIMER NEOMÓRFICO */}
                  <div className="relative flex justify-center items-center w-12 h-12">
                    {/* Cálculo dos segundos restantes */}
                    {(() => {
                      const secondsLeft = Math.ceil((timeLeft / 100) * 20);
                      return (
                        <>
                          <button 
                            onClick={() => handleCopy(c.id, c.cmd)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-20 ${
                              isHighlighted 
                                ? 'bg-white/40 backdrop-blur-md border border-white/40 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.8),inset_-2px_-2px_5px_rgba(0,0,0,0.05)] scale-110' 
                                : 'bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          >
                            {!isHighlighted && <Copy size={18} />}
                          </button>

                          {isHighlighted && (
                            <div className="absolute inset-[-10px] pointer-events-none z-30 flex items-center justify-center">
                              {/* Círculo de Progresso (Drenagem) */}
                              <svg className="absolute w-[68px] h-[68px] rotate-[-90deg]">
                                {/* Trilho (Círculo de Fundo) */}
                                <circle
                                  cx="34"
                                  cy="34"
                                  r="30"
                                  stroke="#c3f6e81a"
                                  strokeWidth="3"
                                  fill="transparent"
                                />
                                {/* Anel de Luz Real */}
                                <circle
                                  cx="34"
                                  cy="34"
                                  r="30"
                                  stroke="#c3f6e8"
                                  strokeWidth="3"
                                  fill="transparent"
                                  strokeDasharray={188.5}
                                  strokeDashoffset={188.5 * (1 - timeLeft / 100)}
                                  strokeLinecap="round"
                                  className="transition-all duration-100 ease-linear"
                                  style={{ filter: 'drop-shadow(0 0 4px #c3f6e8)' }}
                                />
                              </svg>

                              {/* Conteúdo Centralizado: Ícone + Segundos */}
                              <div className="flex flex-col items-center gap-0.5 z-40 transform translate-y-[1px]">
                                <Copy size={16} className="text-[#5c7a99]" />
                                <span className="text-[13px] font-black text-[#5c7a99] leading-none tracking-tighter">
                                  {secondsLeft}s
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">{transmissao.toUpperCase()} ATIVO</span>
           </div>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #e2e8f0; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
