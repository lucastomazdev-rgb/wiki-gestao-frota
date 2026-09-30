import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Navigation, 
  Box, 
  Plus, 
  Trash2, 
  FileText, 
  Loader2 
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function ModalConcluirAgendamento({
  isOpen,
  onClose,
  agendamento,
  onSuccess
}) {
  const [teveKm, setTeveKm] = useState(false);
  const [kmRodado, setKmRodado] = useState(0);

  const [teveEquipamento, setTeveEquipamento] = useState(false);
  const [equipamentos, setEquipamentos] = useState([
    { modelo: '', quantidade: 1 }
  ]);

  const [numeroNf, setNumeroNf] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!isOpen || !agendamento) return null;

  const handleAddEquipamento = () => {
    setEquipamentos(prev => [...prev, { modelo: '', quantidade: 1 }]);
  };

  const handleRemoveEquipamento = (idx) => {
    setEquipamentos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEquipChange = (idx, field, value) => {
    setEquipamentos(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleConfirmar = async (e) => {
    e.preventDefault();

    const equipsFiltrados = teveEquipamento
      ? equipamentos
          .filter(e => e.modelo.trim())
          .map(e => ({
            modelo: e.modelo.trim().toUpperCase(),
            quantidade: Math.max(1, parseInt(e.quantidade, 10) || 1)
          }))
      : [];

    const payload = {
      status: 'Realizado',
      dados_realizado: {
        km_rodado: teveKm ? Math.max(0, Number(kmRodado) || 0) : 0,
        equipamentos_utilizados: equipsFiltrados,
        numero_nf: numeroNf.trim() || null
      }
    };

    try {
      setSalvando(true);
      await api.put(`/gestao-solar/agendamentos/${agendamento.id}`, payload);
      toast.success('Agendamento marcado como Realizado com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao concluir agendamento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Concluir Atendimento
              </h3>
              <p className="text-xs text-emerald-100">
                Placa: <strong className="text-white font-mono">{agendamento.placa}</strong> • {agendamento.servico}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário de Perguntas */}
        <form onSubmit={handleConfirmar} className="p-6 space-y-5">
          
          {/* Pergunta 1: KM Rodado */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation size={15} className="text-teal-600" />
                Houve deslocamento com KM rodado?
              </span>

              <div className="inline-flex p-0.5 bg-slate-200 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTeveKm(false)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    !teveKm ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setTeveKm(true)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    teveKm ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Sim
                </button>
              </div>
            </div>

            {teveKm && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-600">
                  Quantidade de KM:
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={kmRodado}
                  onChange={(e) => setKmRodado(e.target.value)}
                  placeholder="Ex: 45"
                  className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required={teveKm}
                />
                <span className="text-xs font-bold text-slate-500">km</span>
              </div>
            )}
          </div>

          {/* Pergunta 2: Equipamentos / Peças */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Box size={15} className="text-teal-600" />
                Foram utilizados ou trocados materiais/equipamentos?
              </span>

              <div className="inline-flex p-0.5 bg-slate-200 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTeveEquipamento(false)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    !teveEquipamento ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setTeveEquipamento(true)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    teveEquipamento ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Sim
                </button>
              </div>
            </div>

            {teveEquipamento && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5 animate-in fade-in">
                {equipamentos.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.modelo}
                      onChange={(e) => handleEquipChange(idx, 'modelo', e.target.value)}
                      placeholder="Modelo (ex: CHICOTE 24V, CHIP ALGAR)"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleEquipChange(idx, 'quantidade', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center"
                    />
                    {equipamentos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipamento(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddEquipamento}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 mt-2"
                >
                  <Plus size={14} /> Adicionar mais um item
                </button>
              </div>
            )}
          </div>

          {/* Pergunta 3: Nota Fiscal (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Número da Nota Fiscal (NF) <span className="text-slate-400 font-normal lowercase">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={numeroNf}
                onChange={(e) => setNumeroNf(e.target.value)}
                placeholder="Ex: NF-12948"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
              <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </div>
          </div>

          {/* Botões */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {salvando && <Loader2 size={15} className="animate-spin" />}
              <span>Confirmar Conclusão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
