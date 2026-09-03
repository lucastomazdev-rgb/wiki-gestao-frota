import React, { useEffect, useState } from 'react';
import { LogOut, X } from 'lucide-react';
import { STATUS_RETIRADA_OPTIONS } from './constants';

export default function ModalFormularioRetirada({
  isOpen,
  onClose,
  retirada,
  unidadesLookup = [],
  modelosLookup = [],
  onSalvar
}) {
  const [placa, setPlaca] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [modeloId, setModeloId] = useState('');
  const [status, setStatus] = useState('Retirado');
  const [dataRetirada, setDataRetirada] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (retirada) {
      setPlaca(retirada.placa || '');
      setUnidadeId(retirada.unidade_id ? String(retirada.unidade_id) : '');
      setModeloId(retirada.modelo_id ? String(retirada.modelo_id) : '');
      setStatus(retirada.status || 'Retirado');
      setDataRetirada(
        retirada.data_retirada
          ? new Date(retirada.data_retirada).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setMotivo(retirada.motivo || '');
    } else {
      setPlaca('');
      setUnidadeId('');
      setModeloId('');
      setStatus('Retirado');
      setDataRetirada(new Date().toISOString().split('T')[0]);
      setMotivo('');
    }
  }, [retirada, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placa.trim()) return;

    setSalvando(true);
    try {
      await onSalvar({
        placa: placa.trim().toUpperCase(),
        unidade_id: unidadeId ? parseInt(unidadeId, 10) : null,
        modelo_id: modeloId ? parseInt(modeloId, 10) : null,
        status,
        data_retirada: dataRetirada,
        motivo: motivo.trim() || null
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-orange-100 bg-orange-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl border border-orange-200">
              <LogOut size={20} className="rotate-180" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {retirada ? 'Editar Registro de Baixa' : 'Registrar Nova Baixa'}
              </h2>
              <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-0.5">
                Módulo Gestão Solar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Placa *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="Ex: ABC1D23"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full uppercase font-black tracking-widest text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Data da Baixa *
              </label>
              <input
                type="date"
                required
                value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)}
                className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Unidade / Base
            </label>
            <select
              value={unidadeId}
              onChange={(e) => setUnidadeId(e.target.value)}
              className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs cursor-pointer"
            >
              <option value="">Selecione a Unidade...</option>
              {unidadesLookup.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome_unidade} {u.uf ? `(${u.uf})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Modelo / Equipamento
              </label>
              <select
                value={modeloId}
                onChange={(e) => setModeloId(e.target.value)}
                className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs cursor-pointer"
              >
                <option value="">Selecione o Modelo...</option>
                {modelosLookup.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome_modelo} - {m.tipo_veiculo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Status da Baixa *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs cursor-pointer"
              >
                {STATUS_RETIRADA_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Motivo / Observações
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o motivo da desativação ou informações relevantes..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full text-slate-800 font-medium bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
            />
          </div>

          {/* Rodapé de Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !placa.trim()}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              {salvando ? 'Salvando...' : retirada ? 'Salvar Alterações' : 'Confirmar Baixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
