import React from 'react';
import { MessageCircle, WifiOff } from 'lucide-react';

export default function FalhasTabs({ abaAtiva, setAbaAtiva }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5 flex gap-1.5 w-fit">
      <button
        type="button"
        onClick={() => setAbaAtiva('lista')}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          abaAtiva === 'lista'
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
        }`}
      >
        <WifiOff size={15} /> Lista de Falhas
      </button>

      <button
        type="button"
        onClick={() => setAbaAtiva('contato')}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          abaAtiva === 'contato'
            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
            : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
        }`}
      >
        <MessageCircle size={15} /> Contato
      </button>
    </div>
  );
}
