import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { BookOpen, Truck, Bike, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';

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

  // Admin status from centralized server-side check
  const { isAdmin: isSysAdmin, hasPermission } = useAuth();
  const isAdmin = isSysAdmin || hasPermission('tutoriais');

  // Handlers for Equipamentos
  const handleEditEquip = (equip) => {
    setEditingItem(equip);
    setFormData(equip ? { ...equip } : { nome: '', codigo: '', status: 'Ativo', finalidade: activeTab });
    setIsModalOpen(true);
  };

  const handleSaveEquip = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const toastId = toast.loading('Salvando equipamento...');
    const payload = {
        ...formData,
        id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
    };
    const { error } = await supabase.from('equipamentos_padrao').upsert(payload);
    if (error) {
        toast.error('Erro ao salvar.', { id: toastId });
    } else {
        toast.success('Equipamento salvo!', { id: toastId });
        queryClient.invalidateQueries({ queryKey: ['equipamentos_padrao'] });
        setIsModalOpen(false);
    }
  };

  const handleDeleteEquip = async () => {
    const id = confirmDeleteEquip;
    setConfirmDeleteEquip(null);
    const { error } = await supabase.from('equipamentos_padrao').delete().eq('id', id);
    if (error) {
        toast.error('Erro ao excluir.');
    } else {
        toast.success('Excluído!');
        queryClient.invalidateQueries({ queryKey: ['equipamentos_padrao'] });
    }
  };

  // Download logic (Centralized logic for signing URLs)
  const handleDownloadRequest = (tipo, destino, arquivo) => {
      if (!arquivo) return toast.error('Arquivo não disponível.');
      setConfirmDownload({ tipo, destino, arquivo });
  };

  const executeDownload = async () => {
    if (confirmDownload?.arquivo?.url) {
      try {
        toast.loading('Preparando download...', { id: 'download-progress' });
        const bucketName = 'arquivos_tutoriais';
        const url = confirmDownload.arquivo.url;
        const bucketMarker = `/object/public/${bucketName}/`;
        const markerIndex = url.indexOf(bucketMarker);
        if (markerIndex === -1) throw new Error('URL inválida');

        const filePath = decodeURIComponent(url.substring(markerIndex + bucketMarker.length));
        const nomeOriginal = confirmDownload.arquivo.nome || filePath.split('/').pop();

        const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 60, { download: nomeOriginal });
        if (error) throw error;
        window.open(data.signedUrl, '_blank');
        toast.success('Download iniciado!', { id: 'download-progress' });
      } catch {
        toast.error('Erro no download.', { id: 'download-progress' });
      }
    }
    setConfirmDownload(null);
  };

  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 flex flex-col xl:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-r from-transparent to-teal-500/5 pointer-events-none"></div>
        <div className="flex items-center gap-5 z-10 w-full xl:w-auto">
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-teal-600 shadow-inner"><BookOpen size={28} /></div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">Base de Conhecimento</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Biblioteca de Equipamentos e Scripts</p>
          </div>
        </div>
        <div className="flex w-full xl:w-auto bg-slate-100/80 p-1.5 rounded-2xl relative z-10 border border-slate-200/50 shadow-inner overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 min-w-[160px] ${activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
              <tab.icon size={18} className={activeTab === tab.id ? 'text-teal-600' : ''} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-HEADER */}
      <div className="flex bg-white/60 p-1.5 rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto custom-scrollbar w-full xl:w-fit mb-2">
        {['Equipamentos', 'Downloads', 'Ferramentas'].map(sub => (
          <button key={sub} onClick={() => setActiveSubTab(sub)} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex-1 md:flex-none whitespace-nowrap ${activeSubTab === sub ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'}`}>
            {sub === 'Downloads' ? 'Arquivos & Downloads' : sub === 'Ferramentas' ? (activeTab === 'CAMINHÃO' ? 'Comandos para configuração' : activeTab === 'MOTO' ? 'Conversão 1-Wire' : 'Ferramentas Técnicas') : 'Equipamentos Base'}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex flex-col gap-6 w-full h-full min-h-[500px]">
          {activeSubTab === 'Equipamentos' && <EquipamentosTab activeTab={activeTab} isAdmin={isAdmin} onEdit={handleEditEquip} onDelete={setConfirmDeleteEquip} />}
          {activeSubTab === 'Downloads' && <DownloadsTab activeTab={activeTab} isAdmin={isAdmin} unidadeSelecionada={unidadeSelecionada} setUnidadeSelecionada={setUnidadeSelecionada} perfilMotoSelecionado={perfilMotoSelecionado} setPerfilMotoSelecionado={setPerfilMotoSelecionado} onDownload={handleDownloadRequest} />}
          {activeSubTab === 'Ferramentas' && <FerramentasTab activeTab={activeTab} />}
      </div>

      {/* SHARED MODALS */}
      <ModalEquipamento isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingItem={editingItem} formData={formData} setFormData={setFormData} onSave={handleSaveEquip} isAdmin={isAdmin} />
      <ModalDownload confirmDownload={confirmDownload} onClose={() => setConfirmDownload(null)} onConfirm={executeDownload} />
      <ConfirmModal isOpen={!!confirmDeleteEquip} onCancel={() => setConfirmDeleteEquip(null)} onConfirm={handleDeleteEquip} title="Excluir Equipamento" message="Deseja remover permanentemente este item da base? Esta ação não pode ser desfeita." />
    </div>
  );
}
