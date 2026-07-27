import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, RefreshCw, RotateCcw, X, Trash2 } from 'lucide-react';
import { useToastState } from '../../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast, handleUndo } = useToastState();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((t) => {
          // Visual configs per type
          let accentBorder = 'border-amber-500/30';
          let glowShadow = 'shadow-[0_8px_30px_rgb(245,158,11,0.12)]';
          let progressBg = 'bg-gradient-to-r from-amber-500 to-amber-400';
          let icon = <Info className="w-5 h-5 text-amber-400 shrink-0" />;

          if (t.type === 'success') {
            accentBorder = 'border-emerald-500/40';
            glowShadow = 'shadow-[0_8px_30px_rgb(16,185,129,0.15)]';
            progressBg = 'bg-gradient-to-r from-emerald-500 to-teal-400';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (t.type === 'error') {
            accentBorder = 'border-rose-500/40';
            glowShadow = 'shadow-[0_8px_30px_rgb(244,63,94,0.15)]';
            progressBg = 'bg-gradient-to-r from-rose-500 to-red-400';
            icon = <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (t.type === 'update') {
            accentBorder = 'border-cyan-500/40';
            glowShadow = 'shadow-[0_8px_30px_rgb(56,189,248,0.15)]';
            progressBg = 'bg-gradient-to-r from-cyan-500 to-blue-400';
            icon = <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0 animate-spin-slow" />;
          } else if (t.type === 'undo') {
            accentBorder = 'border-amber-500/50';
            glowShadow = 'shadow-[0_8px_30px_rgb(245,158,11,0.2)]';
            progressBg = 'bg-gradient-to-r from-amber-500 to-rose-500';
            icon = <Trash2 className="w-5 h-5 text-amber-400 shrink-0" />;
          }

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto relative overflow-hidden bg-slate-900/90 backdrop-blur-xl border ${accentBorder} ${glowShadow} rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 group text-slate-100 font-sans`}
            >
              {/* Icon */}
              <div className="pt-0.5">{icon}</div>

              {/* Body Content */}
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-bold text-white tracking-wide uppercase font-sans">
                  {t.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans font-normal break-words">
                  {t.message}
                </p>

                {/* Undo Button if Type === 'undo' */}
                {t.type === 'undo' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleUndo(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.actionText || 'Desfazer'}
                    </button>
                    <span className="text-[11px] text-slate-400 font-sans">Ação expira em 5s</span>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                aria-label="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Decreasing Progress Bar */}
              {t.duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: t.duration / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-0.5 ${progressBg}`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
