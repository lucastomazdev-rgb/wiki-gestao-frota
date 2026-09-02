import React, { useState, useEffect } from 'react';
import { Upload, X, Check } from 'lucide-react';

export default function ModalInstrucoesImportacaoAgendamentos({ isOpen, onClose, onConfirm, unidades = [] }) {
  const [isImportRulesAccepted, setIsImportRulesAccepted] = useState(false);
  const [syncMode, setSyncMode] = useState('full');
  const [selectedUnidade, setSelectedUnidade] = useState('');
  const [syncUpdateMode, setSyncUpdateMode] = useState('incremental');
  const [confirmMirror, setConfirmMirror] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsImportRulesAccepted(false);
        setSyncMode('full');
        setSelectedUnidade('');
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
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-4 border-b border-teal-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl border border-teal-200">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Importar O.S. (Agendamentos)</h3>
              <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest mt-1">Padrão de Arquivo CSV</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-sm text-slate-600 font-medium mb-4">
            Para garantir o sucesso da importação, seu arquivo <strong className="text-slate-800 font-black">.CSV</strong> deve conter as colunas obrigatórias abaixo.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-slate-50 shadow-inner">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-700 text-xs border-b border-slate-200">
                    <th className="p-3 pl-4 font-black">Placa</th>
                    <th className="p-3 font-black">Tipo de Serviço</th>
                    <th className="p-3 font-black">Status</th>
                    <th className="p-3 font-black">Data do Agendamento</th>
                    <th className="p-3 font-black">O.S.</th>
                    <th className="p-3 font-black">Problema Relatado</th>
                    <th className="p-3 font-black">Técnico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-600">
                  <tr className="bg-slate-50/50">
                    <td className="p-3 pl-4 font-black text-slate-800">AAA-0000</td>
                    <td className="p-3 border-l border-slate-200/50">Manutenção</td>
                    <td className="p-3 border-l border-slate-200/50">Agendado</td>
                    <td className="p-3 border-l border-slate-200/50">15/05/2026</td>
                    <td className="p-3 border-l border-slate-200/50">12345</td>
                    <td className="p-3 border-l border-slate-200/50">Rastreador sem comunicação</td>
                    <td className="p-3 border-l border-slate-200/50">Rubens Vieira</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 pl-4 font-black text-slate-800">BBB-1111</td>
                    <td className="p-3 border-l border-slate-200/50">Instalação</td>
                    <td className="p-3 border-l border-slate-200/50">Realizado</td>
                    <td className="p-3 border-l border-slate-200/50">10/05/2026</td>
                    <td className="p-3 border-l border-slate-200/50">12346</td>
                    <td className="p-3 border-l border-slate-200/50">Troca de equipamento</td>
                    <td className="p-3 border-l border-slate-200/50">Cleison Gomes</td>
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
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300"
                  checked={syncMode === 'full'}
                  onChange={() => setSyncMode('full')}
                />
                <span className="text-sm text-slate-700 font-medium group-hover:text-teal-700 transition-colors">
                  <strong className="font-black">Toda a base:</strong> processa os agendamentos válidos encontrados no arquivo.
                </span>
              </label>
              
              <label className="flex gap-3 cursor-pointer group items-start">
                <div className="mt-0.5">
                  <input 
                    type="radio" 
                    name="syncMode" 
                    value="unidade" 
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300"
                    checked={syncMode === 'unidade'}
                    onChange={() => setSyncMode('unidade')}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium group-hover:text-teal-700 transition-colors">
                    <strong className="font-black">Somente uma unidade:</strong> processa apenas agendamentos vinculados à unidade escolhida abaixo.
                  </span>
                  {syncMode === 'unidade' && (
                    <div className="mt-3">
                      <select 
                        value={selectedUnidade}
                        onChange={(e) => setSelectedUnidade(e.target.value)}
                        className="w-full sm:w-2/3 p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
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
                <input type="radio" name="syncUpdateModeAgendamentos" value="incremental" className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300" checked={syncUpdateMode === 'incremental'} onChange={() => { setSyncUpdateMode('incremental'); setConfirmMirror(false); }} />
                <span className="text-sm text-slate-700 font-medium group-hover:text-teal-700 transition-colors">
                  <strong className="font-black">Atualização incremental:</strong> cria e atualiza O.S., sem apagar agendamentos ausentes no arquivo.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="syncUpdateModeAgendamentos" value="espelho" className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300" checked={syncUpdateMode === 'espelho'} onChange={() => setSyncUpdateMode('espelho')} />
                <span className="text-sm text-slate-700 font-medium group-hover:text-red-700 transition-colors">
                  <strong className="font-black">Substituir base pelo arquivo:</strong> remove agendamentos ausentes no CSV dentro do escopo escolhido.
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

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
            <h4 className="text-sm font-bold text-orange-800 mb-2">💡 Dicas de Padronização para os Gráficos</h4>
            <p className="text-xs text-orange-700 mb-3">
              O sistema lê <strong>qualquer texto</strong> que você inserir e cria os gráficos de barras e contagens automaticamente de forma inteligente. Porém, para evitar gráficos divididos e poluídos, sugerimos padronizar as palavras escritas no seu Excel:
            </p>
            <ul className="text-xs text-orange-800 space-y-2 font-medium">
              <li><strong className="font-extrabold">&bull; Problema Relatado:</strong> Prefira usar <em>"Troca do Módulo"</em>, <em>"Vistoria na Instalação"</em>, <em>"Bateria"</em>, <em>"Troca do Identificador"</em>, <em>"Troca da Dashcam"</em>, <em>"Falha de Comunicação"</em> ou <em>"Retirada"</em>.</li>
              <li><strong className="font-extrabold">&bull; Status permitidos:</strong> O sistema mapeia sua operação através de 4 cenários: <em>"Aguardando Data"</em>, <em>"Agendado"</em>, <em>"Realizado"</em> ou <em>"Frustrado"</em>.</li>
              <li><strong className="font-extrabold">&bull; Cabeçalho de Técnico:</strong> use exatamente <em>"Técnico"</em>. Em linhas com status <em>"Realizado"</em>, se vier vazio, o sistema aplica automaticamente o técnico padrão <em>"Frota"</em>.</li>
            </ul>
          </div>
        </div>

        <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <label className="flex items-center gap-3 cursor-pointer group mb-6 p-1">
            <div className="relative flex items-center justify-center shrink-0">
              <input 
                type="checkbox" 
                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-[6px] checked:bg-teal-500 checked:border-teal-500 transition-all cursor-pointer shadow-sm hover:border-teal-400"
                checked={isImportRulesAccepted}
                onChange={(e) => setIsImportRulesAccepted(e.target.checked)}
              />
              <Check size={14} strokeWidth={3} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 transition-colors select-none">
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
              onClick={() => onConfirm({ tipoSync: syncMode, unidadeId: selectedUnidade, modoSync: syncUpdateMode, confirmarDelecaoAusentes: syncUpdateMode === 'espelho' && confirmMirror })}
              className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Selecionar Arquivo CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

