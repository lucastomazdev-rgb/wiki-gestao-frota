import React from 'react';
import { Clock, MessageCircle, WifiOff } from 'lucide-react';

export default function FalhasTabs({ abaAtiva, setAbaAtiva }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-1.5 flex gap-1">
      <button
        onClick={() => setAbaAtiva('lista')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
          abaAtiva === 'lista' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <WifiOff size={14} /> Lista de Falhas
      </button>
      <button
        onClick={() => setAbaAtiva('contatos')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
          abaAtiva === 'contatos'
            ? 'bg-[#25D366] text-white shadow-sm shadow-green-200'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <MessageCircle size={14} /> Painel de Contatos
      </button>
      <button
        onClick={() => setAbaAtiva('historico')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
          abaAtiva === 'historico' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <Clock size={14} /> Historico
      </button>
    </div>
  );
}
