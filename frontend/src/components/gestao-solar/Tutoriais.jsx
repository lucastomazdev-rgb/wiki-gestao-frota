import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { BookOpen, Truck, Bike, Video, CheckCircle2, ShieldCheck, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// Sub-components
import EquipamentosTab from './tutoriais/EquipamentosTab';
import DownloadsTab from './tutoriais/DownloadsTab';
import FerramentasTab from './tutoriais/FerramentasTab';
import { ModalEquipamento, ModalDownload } from './tutoriais/TutoriaisModals';
import ConfirmModal from './ConfirmModal';

export default function Tutoriais() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('CAMINHÃO');
  const [activeSubTab, setActiveSubTab] = useState('Equipamentos');
  
  // Selection states (kept here to persist across sub-tab switches in the same session)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [perfilMotoSelecionado, setPerfilMotoSelecionado] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ nome: '', codigo: '', status: 'Ativo', finalidade: 'CAMINHÃO' });
  const [confirmDownload, setConfirmDownload] = useState(null);
  const [confirmDeleteEquip, setConfirmDeleteEquip] = useState(null);

  const tabs = [
    { id: 'CAMINHÃO', label: 'Caminhões', icon: Truck },
    { id: 'MOTO', label: 'Motos', icon: Bike },
    { id: 'VÍDEO', label: 'Vídeo', icon: Video },
  ];

  // Gestão Solar: qualquer usuário com acesso ao módulo tem permissão de upload e gerenciamento
  const { user } = useAuth();
  const isAdmin = Boolean(user?.role === 'ADMIN' || user?.can_access_gestao_solar);

  // Sub-abas dinâmicas conforme a categoria
  const subTabsForCurrent = activeTab === 'VÍDEO'
    ? [{ key: 'Equipamentos', label: 'Equipamentos Base' }]
    : activeTab === 'MOTO'
      ? [
          { key: 'Equipamentos', label: 'Equipamentos Base' },
          { key: 'Downloads', label: 'Arquivos & Downloads' },
          { key: 'Ferramentas', label: 'Conversão 1-Wire' },
        ]
      : [
          { key: 'Equipamentos', label: 'Equipamentos Base' },
          { key: 'Downloads', label: 'Arquivos & Downloads' },
          { key: 'Ferramentas', label: 'Comandos de Configuração' },
        ];

  // Handlers for Equipamentos
  const handleEditEquip = (equip) => {
    setEditingItem(equip);
    setFormData(equip ? { ...equip } : { nome: '', codigo: '', status: 'Ativo', finalidade: activeTab });
    setIsModalOpen(true);
  };

  const handleSaveEquip = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Apenas usuários com permissão Gestão Solar podem cadastrar equipamentos.');
      return;
    }
    const toastId = toast.loading('Salvando equipamento...');
    try {
      const payload = {
        ...formData,
        id: editingItem ? editingItem.id : undefined,
      };
      await api.post('/tutoriais/equipamentos', payload);
      toast.success('Equipamento salvo com sucesso!', { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['equipamentos_padrao'] });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar equipamento.', { id: toastId });
    }
  };

  const handleDeleteEquip = async () => {
    const id = confirmDeleteEquip;
    setConfirmDeleteEquip(null);
    const toastId = toast.loading('Removendo equipamento...');
    try {
      await api.delete(`/tutoriais/equipamentos/${id}`);
      toast.success('Equipamento excluído!', { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['equipamentos_padrao'] });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao excluir equipamento.', { id: toastId });
    }
  };

  // Download logic
  const handleDownloadRequest = (tipo, destino, arquivo) => {
    if (!arquivo || !arquivo.url) {
      return toast.error('Arquivo ainda não disponível para download.');
    }
    setConfirmDownload({ tipo, destino, arquivo });
  };

  const executeDownload = () => {
    if (confirmDownload?.arquivo?.url) {
      window.open(confirmDownload.arquivo.url, '_blank');
      toast.success('Download iniciado!');
    }
    setConfirmDownload(null);
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-r from-transparent to-teal-500/5 pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          <div className="p-3.5 bg-teal-50 border border-teal-100 rounded-2xl text-teal-600 shadow-inner shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
                Tutoriais & Conhecimentos Gerais
              </h2>
              {isAdmin && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                  <ShieldCheck size={12} /> Gestão Solar
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Equipamentos Homologados, Scripts e Comandos Técnicos
            </p>
          </div>
        </div>
        
        {/* SELETOR DE ABAS PRINCIPAIS (Compacto e sem scroll interno feio) */}
        <div className="inline-flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 shadow-inner shrink-0 z-10">
          {tabs.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveSubTab('Equipamentos');
                }} 
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <tab.icon size={16} className={isSelected ? 'text-teal-600' : 'text-slate-400'} /> 
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-HEADER (Equipamentos Base | Downloads | Ferramentas Técnicas) */}
      <div className="flex bg-white/80 backdrop-blur-xs p-1 rounded-2xl border border-slate-200/70 shadow-xs w-full sm:w-fit mb-1">
        {subTabsForCurrent.map(sub => {
          const isSelected = activeSubTab === sub.key;
          return (
            <button 
              key={sub.key} 
              onClick={() => setActiveSubTab(sub.key)} 
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-initial whitespace-nowrap cursor-pointer ${
                isSelected 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50/70'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex flex-col gap-6 w-full h-full min-h-[500px]">
        {activeSubTab === 'Equipamentos' && (
          <EquipamentosTab 
            activeTab={activeTab} 
            isAdmin={isAdmin} 
            onEdit={handleEditEquip} 
            onDelete={setConfirmDeleteEquip} 
          />
        )}

        {activeSubTab === 'Downloads' && activeTab !== 'VÍDEO' && (
          <DownloadsTab 
            activeTab={activeTab} 
            isAdmin={isAdmin} 
            unidadeSelecionada={unidadeSelecionada} 
            setUnidadeSelecionada={setUnidadeSelecionada} 
            perfilMotoSelecionado={perfilMotoSelecionado} 
            setPerfilMotoSelecionado={setPerfilMotoSelecionado} 
            onDownload={handleDownloadRequest} 
          />
        )}

        {activeSubTab === 'Ferramentas' && activeTab !== 'VÍDEO' && (
          <FerramentasTab activeTab={activeTab} />
        )}
      </div>

      {/* MODAIS COMPARTILHADOS */}
      <ModalEquipamento 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingItem={editingItem} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleSaveEquip} 
        isAdmin={isAdmin} 
      />

      <ModalDownload 
        confirmDownload={confirmDownload} 
        onClose={() => setConfirmDownload(null)} 
        onConfirm={executeDownload} 
      />

      <ConfirmModal 
        isOpen={!!confirmDeleteEquip} 
        onCancel={() => setConfirmDeleteEquip(null)} 
        onConfirm={handleDeleteEquip} 
        title="Excluir Equipamento" 
        message="Deseja remover permanentemente este item da base? Esta ação não pode ser desfeita." 
      />
    </div>
  );
}
