import React from 'react';
import { X, FileCode, Database, Check, Loader2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

export function ModalEquipamento({ isOpen, onClose, editingItem, formData, setFormData, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-equip-title">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 id="modal-equip-title" className="text-lg font-black text-slate-800 tracking-tight">
            {editingItem ? 'Editar Equipamento' : 'Novo Equipamento'}
          </h3>
          <button onClick={onClose} aria-label="Fechar modal" className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Nome de Exibição</label>
            <input 
              type="text" required placeholder="Ex: Rastreador GV55 Lite..."
              className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 outline-none transition-all shadow-inner"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Código do Produto (SKU)</label>
            <input 
              type="text" required placeholder="Ex: 1100"
              className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 outline-none transition-all shadow-inner uppercase"
              value={formData.codigo}
              onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Categoria (Aba)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 outline-none transition-all shadow-inner"
                value={formData.finalidade}
                onChange={e => setFormData({...formData, finalidade: e.target.value})}
              >
                <option value="CAMINHÃO">P/ Caminhões</option>
                <option value="MOTO">P/ Motos</option>
                <option value="VÍDEO">P/ Vídeo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Status Operacional</label>
              <select 
                className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 outline-none transition-all shadow-inner"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Ativo">Ativo (Homologado)</option>
                <option value="Inativo">Inativo (Descontinuado)</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 text-slate-500 font-extrabold text-sm rounded-xl hover:bg-slate-100 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3.5 bg-teal-600 text-white font-extrabold text-sm rounded-xl hover:bg-teal-700 hover:shadow-lg transition-all">Confirmar Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalDownload({ confirmDownload, onClose, onConfirm }) {
  if (!confirmDownload) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-download-title">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] relative z-20 animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100 text-center p-8">
        <div className={`mx-auto w-20 h-20 border-2 rounded-full flex items-center justify-center mb-6 relative ${confirmDownload.tipo === 'Script' ? 'bg-teal-50 border-teal-100 text-teal-500' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
          {confirmDownload.tipo === 'Script' ? <FileCode size={36} /> : <Database size={36} />}
        </div>
        <h3 id="modal-download-title" className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight mb-3">Download {confirmDownload.tipo}</h3>
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">Você está prestes a baixar o arquivo configurado para:<br/><span className="text-slate-800 font-bold">{confirmDownload.destino}</span></p>
        <div className="space-y-3">
          <button onClick={onConfirm} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${confirmDownload.tipo === 'Script' ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/30' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/30'} shadow-lg`}>Baixar Agora</button>
          <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">Voltar</button>
        </div>
      </div>
    </div>
  );
}
