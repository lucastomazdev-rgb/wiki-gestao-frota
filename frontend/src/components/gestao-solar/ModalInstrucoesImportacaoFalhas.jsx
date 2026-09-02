import React, { useState, useEffect } from 'react';
import { Upload, X, Check } from 'lucide-react';

export default function ModalInstrucoesImportacaoFalhas({ isOpen, onClose, onConfirm, unidades = [] }) {
  const [isImportRulesAccepted, setIsImportRulesAccepted] = useState(false);
  const [syncMode, setSyncMode] = useState('full');
  const [selectedUnidade, setSelectedUnidade] = useState('');
  const [resetContatos, setResetContatos] = useState(true);
  const [syncUpdateMode, setSyncUpdateMode] = useState('incremental');
  const [confirmMirror, setConfirmMirror] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsImportRulesAccepted(false);
        setSyncMode('full');
        setSelectedUnidade('');
        setResetContatos(true);
        setSyncUpdateMode('incremental');
        setConfirmMirror(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl border border-rose-200">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Importar Falhas de Comunicação</h3>
              <p className="text-[9px] text-rose-600 font-black uppercase tracking-widest mt-1">Padrão de Arquivo CSV</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-sm text-slate-600 font-medium mb-4">
            Para garantir o sucesso da importação, seu arquivo <strong className="text-slate-800 font-black">.CSV</strong> deve conter as colunas abaixo:
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-slate-50 shadow-inner">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-700 text-xs border-b border-slate-200">
                    <th className="p-3 pl-4 font-black">Placa</th>
                    <th className="p-3 font-black">Última Transmissão</th>
                    <th className="p-3 font-black">Bateria (V)</th>
                    <th className="p-3 font-black">Tratativa</th>
                    <th className="p-3 font-black">Data Contato</th>
                    <th className="p-3 font-black">O.S.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-600">
                  <tr className="bg-slate-50/50">
                    <td className="p-3 pl-4 font-black text-slate-800">AAA-0000</td>
                    <td className="p-3 border-l border-slate-200/50">15/05/2026 14:30</td>
                    <td className="p-3 border-l border-slate-200/50">12.5</td>
                    <td className="p-3 border-l border-slate-200/50">Pendente de Contato</td>
                    <td className="p-3 border-l border-slate-200/50">10/05/2026</td>
                    <td className="p-3 border-l border-slate-200/50">12345</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 pl-4 font-black text-slate-800">BBB-1111</td>
                    <td className="p-3 border-l border-slate-200/50">14/05/2026 09:15</td>
                    <td className="p-3 border-l border-slate-200/50">10.2</td>
                    <td className="p-3 border-l border-slate-200/50">Agendado Manutenção</td>
                    <td className="p-3 border-l border-slate-200/50">11/05/2026</td>
                    <td className="p-3 border-l border-slate-200/50"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Escopo da Importação</h4>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="syncMode" 
                  value="full" 
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                  checked={syncMode === 'full'}
                  onChange={() => setSyncMode('full')}
                />
                <span className="text-sm text-slate-700 font-medium group-hover:text-rose-700 transition-colors">
                  <strong className="font-black">Toda a base:</strong> processa as falhas válidas encontradas no arquivo.
                </span>
              </label>
              
              <label className="flex gap-3 cursor-pointer group items-start">
                <div className="mt-0.5">
                  <input 
                    type="radio" 
                    name="syncMode" 
                    value="unidade" 
                    className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                    checked={syncMode === 'unidade'}
                    onChange={() => setSyncMode('unidade')}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium group-hover:text-rose-700 transition-colors">
                    <strong className="font-black">Somente uma unidade:</strong> processa apenas falhas vinculadas à unidade escolhida abaixo.
                  </span>
                  {syncMode === 'unidade' && (
                    <div className="mt-3">
                      <select 
                        value={selectedUnidade}
                        onChange={(e) => setSelectedUnidade(e.target.value)}
                        className="w-full sm:w-2/3 p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      >
                        <option value="">-- Selecione a Unidade --</option>
                        {unidades.map(u => (
                          <option key={u.id} value={u.id}>{u.nome_unidade}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>


          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Modo de Atualização</h4>
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="syncUpdateModeFalhas" value="incremental" className="mt-0.5 w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300" checked={syncUpdateMode === 'incremental'} onChange={() => { setSyncUpdateMode('incremental'); setConfirmMirror(false); }} />
                <span className="text-sm text-slate-700 font-medium group-hover:text-rose-700 transition-colors">
                  <strong className="font-black">Atualização incremental:</strong> cria e atualiza falhas, sem apagar placas ausentes no arquivo.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="syncUpdateModeFalhas" value="espelho" className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300" checked={syncUpdateMode === 'espelho'} onChange={() => setSyncUpdateMode('espelho')} />
                <span className="text-sm text-slate-700 font-medium group-hover:text-red-700 transition-colors">
                  <strong className="font-black">Substituir base pelo arquivo:</strong> remove falhas ausentes no CSV dentro do escopo escolhido.
                </span>
              </label>
              {syncUpdateMode === 'espelho' && (
                <label className="flex items-start gap-3 mt-1 p-3 rounded-xl bg-red-50 border border-red-200 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500 border-red-300" checked={confirmMirror} onChange={(e) => setConfirmMirror(e.target.checked)} />
                  <span className="text-xs font-bold text-red-700">Confirmo que registros ausentes no arquivo serão excluídos no escopo selecionado.</span>
                </label>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
            <label className="flex gap-3 cursor-pointer group items-start">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={resetContatos}
                  onChange={(e) => setResetContatos(e.target.checked)}
                  className="w-4 h-4 rounded-full text-rose-600 focus:ring-rose-500 border-slate-300"
                />
              </div>
              <div className="flex-1">
                <span className="text-sm text-slate-700 font-medium group-hover:text-rose-700 transition-colors">
                  <strong className="font-black">Resetar contato:</strong> Irá tornar todos os contatos das unidades como pendentes ao registrar nova importação.
                </span>
              </div>
            </label>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 shadow-sm">
            <h4 className="text-sm font-bold text-orange-800 mb-2">Observações Importantes - Módulo</h4>
            <p className="text-xs text-orange-700 leading-relaxed">
              O campo <strong className="font-extrabold">Tratativa</strong> mapeia a operação interna e deve usar estritamente os cenários permitidos: <em>"Pendente de Contato"</em>, <em>"Aguardando Retorno"</em>, <em>"Agendado Manutenção"</em>, <em>"Aguardando Técnico"</em>, <em>"Oficina"</em>, <em>"Parado"</em>, <em>"Retirada em Aberto"</em> ou <em>"Voltou a comunicar"</em>.
            </p>
          </div>
        </div>

        <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <label className="flex items-center gap-3 cursor-pointer group mb-6 p-1">
            <div className="relative flex items-center justify-center shrink-0">
              <input 
                type="checkbox" 
                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-[6px] checked:bg-rose-500 checked:border-rose-500 transition-all cursor-pointer shadow-sm hover:border-rose-400"
                checked={isImportRulesAccepted}
                onChange={(e) => setIsImportRulesAccepted(e.target.checked)}
              />
              <Check size={14} strokeWidth={3} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-rose-700 transition-colors select-none">
              Li e entendi como o arquivo deve ser formatado
            </span>
          </label>

          <div className="flex gap-3 pt-0">
            <button 
              onClick={onClose} 
              className="px-5 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              disabled={!isImportRulesAccepted || (syncMode === 'unidade' && !selectedUnidade) || (syncUpdateMode === 'espelho' && !confirmMirror)}
              onClick={() => onConfirm({ tipoSync: syncMode, unidadeId: selectedUnidade, modoSync: syncUpdateMode, confirmarDelecaoAusentes: syncUpdateMode === 'espelho' && confirmMirror, resetContatos })}
              className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Selecionar Arquivo CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

