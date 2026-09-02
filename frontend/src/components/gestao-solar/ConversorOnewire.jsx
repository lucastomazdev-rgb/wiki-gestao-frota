import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ArrowRight, Cpu, Key, Hash, ListOrdered, CheckCircle2, Copy, Zap, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';

// Função auxiliar de CRC8 Dallas/Maxim
function crc8_dallas(data) {
  let crc = 0x00;
  let poly = 0x8C; // reverso de 0x31
  for (let b of data) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x01) {
        crc = (crc >> 1) ^ poly;
      } else {
        crc >>= 1;
      }
      crc &= 0xFF;
    }
  }
  return crc;
}

export default function ConversorOnewire() {
  const [textInput, setTextInput] = useState('');
  const [resultados, setResultados] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const DURATION = 20000;

  const handleCopy = (id, text) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    navigator.clipboard.writeText(text);
    setHighlightedId(id);
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

  const processarCartoes = () => {
    if (!textInput.trim()) {
      toast.error("Insira pelo menos um cartão.");
      return;
    }

    const linhas = textInput.split('\n').map(l => l.trim().toUpperCase()).filter(Boolean);
    const limitadas = linhas.slice(0, 20);
    
    if (linhas.length > 20) {
      toast.success("Mostrando limite máximo de 20 conversões.");
    }

    const novosResultados = limitadas.map(linha => {
      try {
        let isDec = /^\d+$/.test(linha);
        let originalHex = linha;

        if (isDec) {
          let numParsed = parseInt(linha, 10);
          if (isNaN(numParsed)) throw new Error("Número decimal inválido.");
          let parsedHex = numParsed.toString(16).toUpperCase().padStart(8, '0');
          
          let bytes = [];
          for (let i = 0; i < parsedHex.length; i += 2) {
             bytes.push(parsedHex.substring(i, i + 2));
          }
          originalHex = bytes.reverse().join('');
        }

        originalHex = originalHex.replace(/[^0-9A-F]/g, '');
        if (originalHex.length > 8) {
           originalHex = originalHex.slice(originalHex.length - 8);
        } else if (originalHex.length < 8) {
           originalHex = originalHex.padStart(8, '0');
        }

        let bytesOriginal = [];
        for (let i = 0; i < originalHex.length; i += 2) {
           bytesOriginal.push(originalHex.substring(i, i + 2));
        }
        let reversedHex = bytesOriginal.reverse().join('');
        let decimalValue = parseInt(reversedHex, 16).toString();

        let A = parseInt(originalHex.substring(0, 2), 16);
        let B = parseInt(originalHex.substring(2, 4), 16);
        let C = parseInt(originalHex.substring(4, 6), 16);
        let D = parseInt(originalHex.substring(6, 8), 16);

        let xor_byte = A ^ B ^ C ^ D;
        let serial6 = [0x00, xor_byte, D, C, B, A];
        let rom7 = [0x01].concat(serial6);
        let crc = crc8_dallas(rom7);
        let rom8 = rom7.concat([crc]);
        rom8.reverse();

        let oneWireHex = rom8.map(b => ('0' + b.toString(16)).slice(-2).toUpperCase()).join('');

        return {
          entrada: linha,
          hexOriginal: originalHex,
          hexInvertido: reversedHex,
          decimal: decimalValue,
          onewire: oneWireHex,
          erro: false
        };
      } catch (err) {
        return { entrada: linha, erro: true, mensagem: err.message || 'Formato Inválido' };
      }
    });

    setResultados(novosResultados);
    setIsModalOpen(true);
  };

  const limpar = () => {
    setTextInput('');
    setResultados([]);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden flex flex-col h-full hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-shadow">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/30 rounded-full blur-[40px] translate-x-10 -translate-y-10 pointer-events-none"></div>
      
      <div className="relative z-10 mb-6 border-b border-emerald-500/30 pb-5">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl backdrop-blur-sm border border-emerald-400/30 shadow-inner">
            <Cpu size={24} />
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">Cálculo 1-Wire MOTO</h3>
        </div>
        <p className="text-xs text-emerald-300/80 font-bold uppercase tracking-widest mt-1 ml-14 flex items-center gap-2">
          Converta Cartões RFID (HEX/DEC) para 1-Wire.
        </p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full gap-5">
        <div>
          <label className="text-emerald-200/90 text-xs uppercase tracking-widest font-extrabold ml-1 mb-2 block">Caixa Rápida de Conversão Lote (Máx 20)</label>
          <div className="relative">
            <textarea 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full bg-slate-900/50 backdrop-blur-md border border-emerald-600/30 rounded-2xl p-4 text-emerald-100 placeholder:text-emerald-700 font-mono text-sm leading-relaxed outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-inner h-[120px] custom-scrollbar resize-none"
              placeholder="Cole os cartões aqui (Hexadecimal ou Decimal)...&#10;Ex: 9FBDE3D2&#10;Ex: 3538140575"
            ></textarea>
            {textInput && (
              <span className="absolute bottom-3 right-3 text-[10px] font-bold text-emerald-500/60 bg-slate-900/40 px-2 py-0.5 rounded">
                {textInput.split('\n').filter(Boolean).length}/20 lin.
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={limpar}
            disabled={!textInput && resultados.length === 0}
            className="w-12 h-12 flex-shrink-0 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} />
          </button>
          
          <button 
            onClick={processarCartoes}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all outline-none border border-emerald-400/50 shadow-inner flex justify-center items-center gap-2 h-12"
          >
            Processar Lote Onewire <Zap size={18} />
          </button>
        </div>
      </div>

      {/* MODAL DE RESULTADOS — Estética TabelaComandosCaminhao */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:pl-[calc(16rem+2rem)] overflow-hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200">
            
            {/* Header do Modal */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-teal-50 text-teal-600 border border-teal-100 rounded-2xl shadow-sm">
                  <Cpu size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Resultados 1-Wire</h4>
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-teal-500 text-white border border-teal-600 shadow-sm">
                      SUCESSO
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Confira os IDs Dallas/Maxim calculados para os cartões processados.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 flex-1 md:flex-none justify-center">
                   <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Itens</span>
                   <span className="text-2xl font-black text-teal-600 leading-none">{resultados.length}</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-2xl transition-all border border-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabela de Resultados (Alta Legibilidade) */}
            <div className="flex-1 overflow-y-auto custom-modal-scrollbar relative">
              <div className="sticky top-0 z-30 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 px-8 py-3.5 grid grid-cols-[60px_1.5fr_1.5fr_1fr_100px] gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm">
                <div>#</div>
                <div>ID 1-Wire (Destino)</div>
                <div>Entrada (Origem)</div>
                <div>Decimal</div>
                <div className="text-center">Ação</div>
              </div>

              <div className="divide-y divide-slate-100">
                {resultados.map((res, i) => {
                  const id = `res-${i}`;
                  const isHighlighted = highlightedId === id;
                  return (
                    <div 
                      key={id} 
                      className={`grid grid-cols-[60px_1.5fr_1.5fr_1fr_100px] gap-6 px-8 py-4.5 items-center transition-all duration-300 relative group animate-in slide-in-from-left-2 duration-300 ${
                        isHighlighted 
                          ? 'bg-teal-50/40' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {isHighlighted && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500 z-10 rounded-r-md shadow-[2px_0_10px_rgba(20,184,166,0.2)]" />
                      )}

                      <div className="text-xs font-mono font-black text-slate-300 group-hover:text-teal-600 transition-colors">
                        {String(i + 1).padStart(2, '0')}
                      </div>

                      <div className="relative group/cmd min-w-0">
                        {res.erro ? (
                          <div className="p-3 rounded-xl font-bold text-[11px] text-rose-500 bg-rose-50 border border-rose-100 uppercase tracking-wider">
                            {res.mensagem}
                          </div>
                        ) : (
                          <div className={`p-3.5 rounded-2xl font-mono text-base font-black border transition-all truncate ${
                            isHighlighted 
                              ? 'bg-slate-900 text-teal-400 border-teal-500 shadow-xl shadow-teal-500/10 scale-[1.02] z-20' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 group-hover:border-slate-300'
                          }`}>
                            {res.onewire}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex flex-col gap-1">
                        <p className={`text-sm font-black tracking-tight truncate ${isHighlighted ? 'text-teal-800' : 'text-slate-700'}`} title={res.entrada}>
                          {res.entrada}
                        </p>
                        {!res.erro && (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Info size={10} strokeWidth={3} /> HEX: {res.hexOriginal}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        {!res.erro && (
                          <div className={`flex items-center gap-2 font-mono text-sm font-black ${isHighlighted ? 'text-teal-700' : 'text-slate-600'}`}>
                            <Hash size={12} className={isHighlighted ? 'text-teal-500' : 'text-slate-300'} /> {res.decimal}
                          </div>
                        )}
                      </div>

                      {/* Botão de Cópia Modernizado */}
                      <div className="relative flex justify-center items-center w-12 h-12">
                        {!res.erro && (
                          <>
                            {(() => {
                              const secondsLeft = Math.ceil((timeLeft / 100) * (DURATION / 1000));
                              return (
                                <>
                                  <button 
                                    onClick={() => handleCopy(id, res.onewire)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-20 ${
                                      isHighlighted 
                                        ? 'bg-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05)] border border-teal-100 scale-110' 
                                        : 'bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 shadow-sm'
                                    }`}
                                  >
                                    {!isHighlighted && <Copy size={18} />}
                                  </button>

                                  {isHighlighted && (
                                    <div className="absolute inset-[-10px] pointer-events-none z-30 flex items-center justify-center">
                                      <svg className="absolute w-[68px] h-[68px] rotate-[-90deg]">
                                        <circle cx="34" cy="34" r="30" stroke="#c3f6e8" strokeWidth="3.5" fill="transparent" />
                                        <circle
                                          cx="34" cy="34" r="30" stroke="#34d399" strokeWidth="3.5" fill="transparent"
                                          strokeDasharray={188.5}
                                          strokeDashoffset={188.5 * (1 - timeLeft / 100)}
                                          strokeLinecap="round"
                                          className="transition-all duration-100 ease-linear"
                                          style={{ filter: 'drop-shadow(0 0 5px #34d399)' }}
                                        />
                                      </svg>
                                      <div className="flex flex-col items-center gap-0.5 z-40 transform translate-y-[1px]">
                                        <Copy size={16} className="text-teal-600" strokeWidth={2.5} />
                                        <span className="text-[12px] font-black text-teal-600 leading-none tracking-tighter">
                                          {secondsLeft}s
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="px-8 py-4.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sessão de Conversão Ativa</span>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => { setIsModalOpen(false); setResultados([]); }}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] border border-slate-700"
                  >
                    Concluir
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-modal-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-modal-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb { 
          background: #e2e8f0; 
          border-radius: 10px;
        }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
