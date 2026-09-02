import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * ConfirmModal – modal de confirmação reutilizável.
 * Redesenhado: Teal no non-danger, ARIA dialog attributes.
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirmação',
  message = 'Tem certeza que deseja continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  danger = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] relative z-10 animate-fade-in-up overflow-hidden border border-slate-100">

        {/* Top color bar */}
        <div className={`h-1.5 w-full ${danger ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-teal-500 to-teal-600'}`} />

        <div className="p-8">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border ${
            danger
              ? 'bg-rose-50 border-rose-100 text-rose-500'
              : 'bg-teal-50 border-teal-100 text-teal-500'
          }`}>
            {danger ? <Trash2 size={28} strokeWidth={2} /> : <AlertTriangle size={28} strokeWidth={2} />}
          </div>

          <h3 id="confirm-modal-title" className="text-xl font-black text-slate-800 tracking-tight text-center leading-snug mb-2">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-500 text-center leading-relaxed mb-8 px-2">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl text-slate-500 font-extrabold text-sm hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200 flex items-center justify-center gap-2"
            >
              <X size={16} />
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 rounded-xl text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md ${
                danger
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-[0_8px_20px_rgba(244,63,94,0.35)] border border-rose-400'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-[0_8px_20px_rgba(20,184,166,0.35)] border border-teal-400'
              }`}
            >
              {danger ? <Trash2 size={16} /> : <AlertTriangle size={16} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
