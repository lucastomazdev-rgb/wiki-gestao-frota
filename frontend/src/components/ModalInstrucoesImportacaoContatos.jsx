import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Users, AlertCircle, Info } from 'lucide-react';

// =====================================================================
// MODAL DE INSTRUÇÕES — Importação de Responsáveis (Contatos)
// Colunas: UNIDADE | NOME | TELEFONE (exatamente em maiúsculas)
// Modos: Full Sync | Sync por Unidade
// =====================================================================
export default function ModalInstrucoesImportacaoContatos({ isOpen, onClose, onConfirm, unidades = [] }) {
  const [isImportRulesAccepted, setIsImportRulesAccepted] = useState(false);
  const [syncMode, setSyncMode] = useState('full');
  const [selectedUnidade, setSelectedUnidade] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsImportRulesAccepted(false);
        setSyncMode('full');
        setSelectedUnidade('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-import-contatos-title">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-teal-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl border border-teal-200">
              <Users size={20} />
            </div>
            <div>
              <h3 id="modal-import-contatos-title" className="text-lg font-black text-slate-800 tracking-tight">Importação de Responsáveis</h3>
              <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest mt-1">Padrão de Arquivo CSV</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

          {/* Introdução */}
          <p className="text-sm text-slate-600 font-medium mb-4">
            Para garantir o sucesso da importação, seu arquivo <strong className="text-slate-800 font-black">.CSV</strong> deve conter exatamente as colunas abaixo.
            Os nomes das colunas são <strong className="text-rose-600 font-black">case-sensitive</strong> — use <strong className="font-black">exatamente</strong> como indicado (letras maiúsculas).
          </p>

          {/* Tabela de colunas */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 bg-slate-50 shadow-inner">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 text-xs border-b border-slate-200">
                    <th className="p-3 pl-4 font-black">
                      <span className="font-mono bg-slate-800 text-white px-2 py-0.5 rounded-md text-[11px]">UNIDADE</span>
                      <span className="ml-2 text-[10px] text-rose-500 font-black uppercase">obrigatório</span>
                    </th>
                    <th className="p-3 font-black border-l border-slate-200">
                      <span className="font-mono bg-slate-800 text-white px-2 py-0.5 rounded-md text-[11px]">NOME</span>
                      <span className="ml-2 text-[10px] text-rose-500 font-black uppercase">obrigatório</span>
                    </th>
                    <th className="p-3 font-black border-l border-slate-200">
                      <span className="font-mono bg-slate-800 text-white px-2 py-0.5 rounded-md text-[11px]">TELEFONE</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-black uppercase">opcional</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-600">
                  <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-4 font-black text-slate-800">ARACAJU</td>
                    <td className="p-3 font-black text-slate-800 border-l border-slate-200/50">João Silva</td>
                    <td className="p-3 border-l border-slate-200/50 font-mono text-slate-700">86986408410</td>
                  </tr>
                  <tr className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-4 font-black text-slate-800">MOSSORO</td>
                    <td className="p-3 font-black text-slate-800 border-l border-slate-200/50">Maria Souza</td>
                    <td className="p-3 border-l border-slate-200/50 font-mono text-slate-700">84988001111</td>
                  </tr>
                  <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-4 font-black text-slate-800">MOSSORO</td>
                    <td className="p-3 font-black text-slate-800 border-l border-slate-200/50">Carlos Lima</td>
                    <td className="p-3 border-l border-slate-200/50 italic text-slate-400">(vazio)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerta case-sensitive */}
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl mb-5 shadow-sm">
            <h4 className="text-sm font-bold text-rose-800 mb-2 flex items-center gap-2">
              <AlertCircle size={15} />
              Atenção: Nomes de Colunas Case-Sensitive
            </h4>
            <div className="text-xs text-rose-700 leading-relaxed space-y-1">
              <p>O sistema lê os cabeçalhos <strong className="font-black">exatamente</strong> como estão escritos. Se a coluna no seu arquivo for <span className="font-mono bg-rose-100 px-1 rounded">Unidade</span> em vez de <span className="font-mono bg-rose-100 px-1 rounded">UNIDADE</span>, a linha será ignorada.</p>
              <p className="mt-2">✅ Correto: <span className="font-mono font-black">UNIDADE</span> &nbsp;|&nbsp; <span className="font-mono font-black">NOME</span> &nbsp;|&nbsp; <span className="font-mono font-black">TELEFONE</span></p>
              <p>❌ Errado: <span className="font-mono text-rose-400">Unidade</span> &nbsp;|&nbsp; <span className="font-mono text-rose-400">nome</span> &nbsp;|&nbsp; <span className="font-mono text-rose-400">Telefone</span></p>
            </div>
          </div>

          {/* Aviso sobre nomes de unidades */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-5 shadow-sm">
            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Info size={15} />
              Correspondência de Unidades
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              O valor da coluna <span className="font-mono font-black bg-amber-100 px-1 rounded">UNIDADE</span> deve corresponder <strong>exatamente</strong> ao nome de unidade cadastrado no sistema.
              Linhas com unidades não encontradas serão <strong className="text-amber-900">ignoradas</strong> e reportadas no resultado da importação.
            </p>
          </div>

          {/* Nota sobre formatação automática do telefone */}
          <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mb-5 shadow-sm">
            <h4 className="text-sm font-bold text-teal-800 mb-2 flex items-center gap-2">
              <Info size={15} />
              Formatação Automática do Telefone
            </h4>
            <div className="text-xs text-teal-700 leading-relaxed space-y-1">
              <p>O sistema aceita o número no formato <strong>DDD + 9 + número</strong> sem separadores:</p>
              <p className="font-mono bg-teal-100 px-2 py-1 rounded inline-block mt-1">86986408410</p>
              <p className="mt-2">O valor será formatado automaticamente para:</p>
              <p className="font-mono bg-teal-100 px-2 py-1 rounded inline-block mt-1">(86) 9 8640-8410</p>
              <p className="mt-2 text-teal-600">Também aceita formatos com traços e espaços — qualquer sequência de 10 ou 11 dígitos é reconhecida.</p>
            </div>
          </div>

          {/* Modo de Sincronização */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Modo de Sincronização</h4>
            <div className="flex flex-col gap-3">

              {/* Full Sync */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white border border-transparent hover:border-teal-200 transition-all">
                <input
                  type="radio"
                  name="syncModeContatos"
                  value="full"
                  className="w-4 h-4 mt-0.5 text-teal-600 focus:ring-teal-500 border-slate-300"
                  checked={syncMode === 'full'}
                  onChange={() => setSyncMode('full')}
                />
                <span className="text-sm text-slate-700 font-medium group-hover:text-teal-700 transition-colors">
                  <strong className="font-black">Inserção Total (Full Sync):</strong> Insere ou atualiza os responsáveis de <strong>todas as unidades</strong> presentes no arquivo. Não remove nenhum contato existente que não esteja no CSV.
                </span>
              </label>

              {/* Sync por Unidade */}
              <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white border border-transparent hover:border-teal-200 transition-all">
                <div className="mt-0.5">
                  <input
                    type="radio"
                    name="syncModeContatos"
                    value="unidade"
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300"
                    checked={syncMode === 'unidade'}
                    onChange={() => setSyncMode('unidade')}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium group-hover:text-teal-700 transition-colors">
                    <strong className="font-black">Sincronização por Unidade:</strong> Insere apenas os contatos da unidade escolhida abaixo, ignorando as demais linhas do arquivo.
                  </span>

                  {syncMode === 'unidade' && (
                    <div className="mt-3">
                      <select
                        value={selectedUnidade}
                        onChange={(e) => setSelectedUnidade(e.target.value)}
                        className="w-full sm:w-2/3 p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-medium cursor-pointer"
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
        </div>

        {/* Footer */}
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

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              disabled={!isImportRulesAccepted || (syncMode === 'unidade' && !selectedUnidade)}
              onClick={() => onConfirm({ tipoSync: syncMode, unidadeId: selectedUnidade })}
              className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload size={18} /> Selecionar Arquivo CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
