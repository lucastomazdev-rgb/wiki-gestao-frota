import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ModalRetirada({ isOpen, onClose, veiculo, onConfirm }) {
  const [status, setStatus] = useState('Retirado');
  const [dataRetirada, setDataRetirada] = useState(new Date().toISOString().split('T')[0]); // Data de hoje como padrão

  if (!isOpen || !veiculo) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-50 p-4 transition-all" role="dialog" aria-modal="true" aria-labelledby="modal-retirada-title">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-orange-200">
        <div className="flex justify-between items-center p-6 border-b bg-orange-50/80">
          <h2 id="modal-retirada-title" className="text-xl font-extrabold text-orange-800 tracking-tight">Registro de Baixa Operacional</h2>
          <button onClick={onClose} aria-label="Fechar modal" className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Veículo em Desativação</span>
            <span className="font-black text-slate-800 text-2xl tracking-widest mt-1">{veiculo.placa}</span>
          </div>
          
          <div>
            <label htmlFor="ret-motivo" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Motivo do Desligamento</label>
            <select id="ret-motivo" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm font-bold text-slate-700 transition-all cursor-pointer">
              <option value="Retirado">Retirado / Desinstalado (Normal)</option>
              <option value="Roubado/Não Recuperado">Roubado / Sinistro / Perda Total</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="ret-data" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Data Limite da Retirada</label>
            <input id="ret-data" type="date" value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} className="w-full p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm font-bold text-slate-700 transition-all cursor-pointer" />
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-slate-100 bg-slate-50 gap-3">
          <button onClick={onClose} className="px-6 py-3.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Cancelar</button>
          <button onClick={() => onConfirm(status, dataRetirada)} className="px-6 py-3.5 bg-orange-600 font-bold text-sm text-white rounded-xl hover:bg-orange-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-0">Registrar Retirada</button>
        </div>
      </div>
    </div>
  );
}