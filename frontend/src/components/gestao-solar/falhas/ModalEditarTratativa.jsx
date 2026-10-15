import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const STATUS_OPTIONS = [
  'Pendente de Contato',
  'Aguardando Retorno',
  'Agendado Manutenção',
  'Aguardando Técnico',
  'Oficina',
  'Parado',
  'Retirada em Aberto',
  'Voltou a comunicar'
];

export default function ModalEditarTratativa({
  isOpen,
  onClose,
  registro,
  onUpdateSuccess
}) {
  const [statusTratativa, setStatusTratativa] = useState('Pendente de Contato');
  const [ordemServico, setOrdemServico] = useState('');
  const [dataContato, setDataContato] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (registro) {
      setStatusTratativa(registro.status_tratativa || 'Pendente de Contato');
      setOrdemServico(registro.ordem_servico || '');
      setDataContato(
        registro.data_contato ? String(registro.data_contato).split('T')[0] : ''
      );
      setObservacao(registro.observacao || '');
    }
  }, [registro]);

  if (!isOpen || !registro) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const res = await api.put(`/gestao-solar/falhas/registros/${registro.id}`, {
        status_tratativa: statusTratativa,
        ordem_servico: ordemServico.trim() || null,
        data_contato: dataContato || null,
        observacao: observacao.trim() || null
      });

      toast.success('Tratativa atualizada com sucesso!');
      onUpdateSuccess(res.data?.data?.registro);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao atualizar tratativa.';
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
              <Edit size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-black text-slate-900 text-base">
                  {registro.placa}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                  {registro.tipo_falha}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {registro.unidade || 'Unidade não informada'} {registro.uf ? `(${registro.uf})` : ''}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status da Tratativa */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Status da Tratativa <span className="text-rose-500">*</span>
            </label>
            <select
              value={statusTratativa}
              onChange={(e) => setStatusTratativa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
              required
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Ordem de Serviço */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Número da Ordem de Serviço (O.S.)
            </label>
            <input
              type="text"
              placeholder="Ex: 104291"
              value={ordemServico}
              onChange={(e) => setOrdemServico(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Data do Contato */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Data do Contato
            </label>
            <input
              type="date"
              value={dataContato}
              onChange={(e) => setDataContato(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Observações
            </label>
            <textarea
              rows={3}
              placeholder="Observações pertinentes sobre a tratativa deste veículo..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
