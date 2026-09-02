import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import api from '../../services/api';
import { FileCode, Download, Upload, Loader2, Database, Settings, ChevronRight } from 'lucide-react';
import SearchableSelect from '../shared/SearchableSelect';
import toast from 'react-hot-toast';

export default function DownloadsTab({ 
  activeTab, 
  isAdmin, 
  unidadeSelecionada, 
  setUnidadeSelecionada,
  perfilMotoSelecionado,
  setPerfilMotoSelecionado,
  onDownload
}) {
  const queryClient = useQueryClient();

  const { data: scripts = {} } = useQuery({
    queryKey: ['scripts_unidades'],
    queryFn: async () => {
      const { data, error } = await supabase.from('scripts_unidades').select('*');
      if (error) throw error;
      const dict = {};
      data.forEach(s => { dict[s.unidade] = { url: s.arquivo_url, nome: s.arquivo_nome }; });
      return dict;
    }
  });

  const { data: bibliotecas = {} } = useQuery({
    queryKey: ['bibliotecas_can'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bibliotecas_can').select('*');
      if (error) throw error;
      const dict = {};
      data.forEach(l => { dict[l.id] = { url: l.arquivo_url, nome: l.arquivo_nome }; });
      return dict;
    }
  });

  const { data: perfisMotos = {} } = useQuery({
    queryKey: ['perfis_motos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('perfis_motos').select('*');
      if (error) throw error;
      const dict = {};
      data.forEach(p => { dict[p.nome] = { url: p.arquivo_url, nome: p.arquivo_nome }; });
      return dict;
    }
  });

  const { data: instalacoes = [] } = useQuery({
    queryKey: ['instalacoes'],
    queryFn: async () => {
      const res = await api.get('/instalacoes');
      return res.data;
    }
  });

  const unidadesCaminhao = [...new Set(instalacoes
    .filter(i => i.modelos_rastreadores?.tipo_veiculo?.toUpperCase() === 'CAMINHÃO')
    .map(i => i.unidades_clientes?.nome_unidade)
    .filter(Boolean)
  )].sort();

  const perfisMotosDef = ['COCA MOTO ALGAR', 'COCA MOTO ESEYE', 'COCA FURGAO ALGAR', 'COCA MOTO BAHIA', 'COCA MOTO AMAZONAS'];

  const bibliotecasCanDef = [
    { id: 'bb1', nome: 'Mercebes Benz 2011 - 2023', mock: 'mb_2011_2023.xvm' },
    { id: 'bb2', nome: 'Volkswagen 2011 a 2025', mock: 'vw_2011_2025.xvm' },
    { id: 'bb3', nome: 'Iveco (Padrão)', mock: 'iveco_geral.xvm' },
    { id: 'bb4', nome: 'FMS_VOLVO_SCANIA_MERCEDES2025', mock: 'fms_v2025.xvm' },
    { id: 'bb5', nome: 'Mercedes Sprinter Print House', mock: 'sprinter_print_house.xvm' },
  ];

  const handleUploadGeneric = async (file, type, identifier, metadata = {}) => {
    if (!file || !identifier) return;
    const toastId = toast.loading('Enviando arquivo...');
    
    try {
      const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const fileNameSafe = `${type}_${identifier.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}${fileExt}`;
      
      const { error: uploadErr } = await supabase.storage.from('arquivos_tutoriais').upload(fileNameSafe, file);
      if (uploadErr) throw uploadErr;
      
      const urlPath = supabase.storage.from('arquivos_tutoriais').getPublicUrl(fileNameSafe).data.publicUrl;
      
      let dbError;
      if (type === 'script') {
        dbError = (await supabase.from('scripts_unidades').upsert({
          unidade: identifier, arquivo_url: urlPath, arquivo_nome: file.name
        }, { onConflict: 'unidade' })).error;
      } else if (type === 'lib') {
        dbError = (await supabase.from('bibliotecas_can').upsert({
          id: identifier, nome: metadata.nome, arquivo_url: urlPath, arquivo_nome: file.name
        }, { onConflict: 'id' })).error;
      } else if (type === 'perfil') {
        dbError = (await supabase.from('perfis_motos').upsert({
          nome: identifier, arquivo_url: urlPath, arquivo_nome: file.name
        }, { onConflict: 'nome' })).error;
      }

      if (dbError) throw dbError;
      
      queryClient.invalidateQueries({ queryKey: [type === 'script' ? 'scripts_unidades' : type === 'lib' ? 'bibliotecas_can' : 'perfis_motos'] });
      toast.success('Upload concluído!', { id: toastId });
    } catch {
      toast.error('Erro no upload.', { id: toastId });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeTab === 'CAMINHÃO' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-full">
          {/* SCRIPTS */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-700/50 relative overflow-hidden flex flex-col h-full hover:shadow-[0_20px_40px_rgba(13,148,136,0.2)] transition-shadow">
            <div className="relative z-10 mb-8 border-b border-teal-500/30 pb-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-teal-500/20 text-teal-300 rounded-xl backdrop-blur-sm border border-teal-400/30 shadow-inner"><FileCode size={24} /></div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Scripts de Instalação</h3>
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
              <div>
                <p className="text-[13px] font-medium text-teal-100/90 mb-5 leading-relaxed bg-teal-950/40 p-4 rounded-xl border border-teal-800/50">
                  Selecione a Unidade Operacional abaixo para baixar o script pré-configurado contendo os parâmetros corretos.
                </p>
                <div className="mb-5">
                  <SearchableSelect 
                    placeholder="Selecione uma Unidade..."
                    options={unidadesCaminhao}
                    value={unidadeSelecionada}
                    onChange={setUnidadeSelecionada}
                    icon={Settings}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  disabled={!unidadeSelecionada}
                  onClick={() => onDownload('Script', `Frota de ${unidadeSelecionada}`, scripts[unidadeSelecionada])}
                  className={`w-full py-4.5 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden ${
                    unidadeSelecionada && scripts[unidadeSelecionada]
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 border-none' 
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                  }`}
                >
                  <Download size={20} /> Baixar Script
                </button>

                {isAdmin && unidadeSelecionada && (
                  <label className="w-full py-3.5 rounded-xl border border-teal-500/30 flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest bg-teal-600/20 text-teal-200 hover:bg-teal-600/40 cursor-pointer shadow-inner">
                    <Upload size={16} /> Anexar .xvm / .profile
                    <input type="file" className="hidden" onChange={(e) => handleUploadGeneric(e.target.files[0], 'script', unidadeSelecionada)} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* BIBLIOTECAS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 h-full relative overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
            <div className="relative z-10 mb-8 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm"><Database size={24} /></div>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Bibliotecas CAN</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3.5 relative z-10">
              {bibliotecasCanDef.map(lib => {
                const statusLib = bibliotecas[lib.id]; 
                return (
                  <div key={lib.id} className="group relative flex flex-col p-4 bg-slate-50 border border-slate-200/60 rounded-2xl hover:border-rose-300 hover:shadow-md hover:bg-white transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col pr-4 pl-1 overflow-hidden">
                        <span className="font-extrabold text-slate-800 text-[14px] leading-tight mb-2 truncate">{lib.name || lib.nome}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-inner truncate">{statusLib?.nome || 'Sem Arquivo'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => onDownload('Biblioteca', `Modelo ${lib.nome}`, statusLib)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm ${statusLib ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        > <Download size={18} /> </button>
                        {isAdmin && (
                          <label className="w-11 h-11 rounded-full bg-white border border-dashed border-teal-200 flex items-center justify-center text-teal-400 hover:bg-teal-500 hover:text-white cursor-pointer"><Upload size={16} />
                            <input type="file" className="hidden" onChange={(e) => handleUploadGeneric(e.target.files[0], 'lib', lib.id, { nome: lib.nome })} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTab === 'MOTO' ? (
        <div className="grid grid-cols-1 gap-6 w-full lg:max-w-3xl h-full mx-auto lg:mx-0">
          {/* MOTO PROFILES */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-700/50 relative overflow-hidden flex flex-col h-full hover:shadow-[0_20px_40px_rgba(20,184,166,0.2)] transition-shadow">
            <div className="relative z-10 mb-8 border-b border-teal-500/30 pb-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-teal-500/20 text-teal-300 rounded-xl backdrop-blur-sm border border-teal-400/30 shadow-inner"><FileCode size={24} /></div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Perfis de Leitura</h3>
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
              <p className="text-[13px] font-medium text-teal-100/90 mb-5 leading-relaxed bg-teal-950/40 p-4 rounded-xl border border-teal-800/50">Selecione o perfil de configuração adequado.</p>
              <div className="mb-5 bg-white/10 p-2.5 rounded-2xl border border-white/20 relative">
                <select 
                  className="w-full bg-transparent border-none outline-none appearance-none cursor-pointer pl-4 pr-10 py-3 font-bold text-sm tracking-wide text-white"
                  value={perfilMotoSelecionado}
                  onChange={(e) => setPerfilMotoSelecionado(e.target.value)}
                >
                  <option value="" className="text-slate-800">Selecione...</option>
                  {perfisMotosDef.map(pm => <option key={pm} value={pm} className="text-slate-800">{pm}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  disabled={!perfilMotoSelecionado}
                  onClick={() => onDownload('Perfil', perfilMotoSelecionado, perfisMotos[perfilMotoSelecionado])}
                  className={`w-full py-4.5 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${perfilMotoSelecionado && perfisMotos[perfilMotoSelecionado] ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white' : 'bg-white/5 text-slate-500'}`}
                > <Download size={20} /> Baixar Perfil </button>
                {isAdmin && perfilMotoSelecionado && (
                  <label className="w-full py-3.5 rounded-xl border border-teal-500/30 flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest bg-teal-600/20 text-teal-200 hover:bg-teal-600/40 cursor-pointer shadow-inner">
                    <Upload size={16} /> Anexar .profile
                    <input type="file" className="hidden" onChange={(e) => handleUploadGeneric(e.target.files[0], 'perfil', perfilMotoSelecionado)} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[500px]">
          <Settings size={40} className="text-slate-300 animate-[spin_10s_linear_infinite] mb-6" />
          <h3 className="text-xl font-extrabold tracking-tight text-slate-600 mb-2">Configuração Simplificada</h3>
          <p className="text-sm font-medium text-slate-500 max-w-md">Não há arquivos adicionais para esta categoria.</p>
        </div>
      )}
    </div>
  );
}
