import React, { createContext, useContext, useCallback } from 'react';
import hotToast from 'react-hot-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toastWrapper = {
    success: (message, title) => {
      return hotToast.success(title ? `${title}: ${message}` : message);
    },
    error: (message, title) => {
      return hotToast.error(title ? `${title}: ${message}` : message, { duration: 6000 });
    },
    info: (message, title) => {
      return hotToast(title ? `${title}: ${message}` : message, {
        icon: 'ℹ️',
      });
    },
    update: (message, title) => {
      return hotToast.success(title ? `${title}: ${message}` : message);
    },
    undo: (message, { onUndo, onConfirm, duration = 5000, title } = {}) => {
      return hotToast((t) => (
        <span className="flex items-center gap-3 text-xs font-sans">
          <span>{title ? `${title}: ${message}` : message}</span>
          {onUndo && (
            <button
              onClick={() => {
                hotToast.dismiss(t.id);
                onUndo();
              }}
              className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg font-bold text-xs border border-amber-500/40 transition-colors cursor-pointer"
            >
              Desfazer
            </button>
          )}
        </span>
      ), { duration });
    },
    remove: (id) => hotToast.dismiss(id),
  };

  return (
    <ToastContext.Provider value={{ toast: toastWrapper, toasts: [], removeToast: toastWrapper.remove, handleUndo: () => {} }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context.toast;
}

export function useToastState() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastState deve ser usado dentro de um ToastProvider');
  }
  return context;
}

