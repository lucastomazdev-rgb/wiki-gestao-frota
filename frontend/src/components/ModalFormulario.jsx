import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Save } from 'lucide-react';
import { useModelosLookup, useUnidadesLookup } from '../hooks/useLookups';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  descricao_veiculo: '',
  modulo: '',
  operacao: '',
  placa: '',
  data_instalacao: '',
  unidade_id: '',
  modelo_id: ''
};

export default function ModalFormulario({ isOpen, onClose, veiculo, onSaveSuccess }) {
  const { data: unidades = [] } = useUnidadesLookup();
  const { data: modelos = [] } = useModelosLookup();
  
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (veiculo) {
          setFormData({
            descricao_veiculo: veiculo.descricao_veiculo || '',
            modulo: veiculo.modulo,
            operacao: veiculo.operacao,
            placa: veiculo.placa,
            data_instalacao: veiculo.data_instalacao,
            unidade_id: veiculo.unidades_clientes?.id || veiculo.unidade_id || '',
            modelo_id: veiculo.modelos_rastreadores?.id || veiculo.modelo_id || ''
          });
          return;
        }
        setFormData(INITIAL_FORM);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, veiculo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (veiculo) {
        await api.put(`/instalacoes/${veiculo.id}`, formData);
      } else {
        await api.post('/instalacoes', formData);
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao salvar os dados.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center z-[11000] p-4 transition-all" role="dialog" aria-modal="true" aria-labelledby="modal-formulario-title">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[95vh] border border-slate-200 my-auto flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100/80 text-teal-600 rounded-xl border border-teal-200"><Save size={18} /></div>
            <h3 id="modal-formulario-title" className="text-lg font-black text-slate-800 tracking-tight">
              {veiculo ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col">
              <label htmlFor="field-descricao" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ID (Descr. Veículo) *</label>
              <input id="field-descricao" required type="text" name="descricao_veiculo" value={formData.descricao_veiculo} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-black text-slate-700 transition-all placeholder-slate-300" placeholder="A123..." />
            </div>

            <div className="flex flex-col">
              <label htmlFor="field-placa" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Placa *</label>
              <input id="field-placa" required type="text" name="placa" value={formData.placa} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-black text-slate-700 transition-all uppercase placeholder-slate-300" placeholder="AAA-0000" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="field-modulo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Módulo Rastreador *</label>
              <input id="field-modulo" required type="text" name="modulo" value={formData.modulo} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-black text-slate-700 transition-all placeholder-slate-300" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="field-operacao" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Operação de Uso *</label>
              <select 
                id="field-operacao" 
                required 
                name="operacao" 
                value={formData.operacao} 
                onChange={handleChange} 
                className="w-full p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-black text-slate-700 transition-all cursor-pointer"
              >
                <option value="">Selecione a Operação</option>
                <option value="Coca Cola">Coca Cola</option>
                <option value="Operador Logístico">Operador Logístico</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="field-data-inst" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Instalação *</label>
              <input id="field-data-inst" required type="date" name="data_instalacao" value={formData.data_instalacao} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-black text-slate-700 transition-all" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="field-unidade" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unidade Base *</label>
              <select id="field-unidade" required name="unidade_id" value={formData.unidade_id} onChange={handleChange} className="w-full p-2.5 bg-slate-50 cursor-pointer border border-slate-200 shadow-inner rounded-xl outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 text-xs font-black text-slate-700 transition-all">
                <option value="">Selecione a Unidade</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome_unidade} - {u.uf}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col md:col-span-2">
              <label htmlFor="field-modelo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Modelo do Equipamento *</label>
              <select id="field-modelo" required name="modelo_id" value={formData.modelo_id} onChange={handleChange} className="w-full p-2.5 bg-slate-50 cursor-pointer border border-slate-200 shadow-inner rounded-xl outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-500 text-xs font-black text-slate-700 transition-all">
                <option value="">Selecione o Modelo</option>
                {modelos.map(m => (
                  <option key={m.id} value={m.id}>{m.nome_modelo} ({m.tipo_veiculo})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-xs">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-teal-600 font-black text-xs text-white rounded-xl hover:bg-teal-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center">
              <Save size={16} className="mr-2" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
