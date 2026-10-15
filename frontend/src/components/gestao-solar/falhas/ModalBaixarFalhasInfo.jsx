import React from 'react';
import { X, Download, ExternalLink, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ModalBaixarFalhasInfo({ isOpen, onClose, onOpenImport }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Fluxo de Extração de Falhas
              </h3>
              <p className="text-xs text-slate-500">
                Procedimento padrão operacional da frota Solar Coca-Cola
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-900 leading-relaxed">
                <span className="font-black uppercase tracking-wider block text-[11px] mb-0.5">
                  Frequência Recomendada:
                </span>
                A extração deve ser efetuada preferencialmente às <strong>quartas-feiras à tarde</strong>, quando os veículos estão em rota operacional.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Como funciona o fluxo:
            </h4>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Com o portal do sistema de rastreamento (ex: Vanguarda) aberto no seu navegador, extraia o relatório de veículos sem comunicação.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                O arquivo (.xlsx ou .csv) será baixado na sua pasta local de Downloads.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clique no botão <strong>"Importar Planilha"</strong> aqui na Wiki. O sistema calcula automaticamente o que é <strong>Nova Falha</strong> e o que é <strong>Falha Recorrente</strong> comparando com a extração anterior.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenImport();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <span>Ir para Importar Planilha</span>
          </button>
        </div>
      </div>
    </div>
  );
}
