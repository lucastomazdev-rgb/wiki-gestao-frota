import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const duration = toastData.duration || 4500;

    const newToast = {
      id,
      type: toastData.type || 'info', // 'success' | 'error' | 'info' | 'update' | 'undo'
      title: toastData.title,
      message: toastData.message,
      duration,
      onUndo: toastData.onUndo,
      onConfirm: toastData.onConfirm,
      actionText: toastData.actionText || 'Desfazer',
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        if (newToast.type === 'undo' && newToast.onConfirm) {
          newToast.onConfirm();
        }
        removeToast(id);
      }, duration);

      newToast._timer = timer;
    }

    return id;
  }, [removeToast]);

  const handleUndo = useCallback((toast) => {
    if (toast._timer) clearTimeout(toast._timer);
    if (toast.onUndo) toast.onUndo();
    removeToast(toast.id);
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Sucesso!') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Ocorreu um erro') => addToast({ type: 'error', title, message, duration: 6000 }),
    info: (message, title = 'Informação') => addToast({ type: 'info', title, message }),
    update: (message, title = 'Atualizado') => addToast({ type: 'update', title, message }),
    undo: (message, { onUndo, onConfirm, duration = 5000, title = 'Item removido' }) => 
      addToast({ type: 'undo', title, message, onUndo, onConfirm, duration }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, handleUndo }}>
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
