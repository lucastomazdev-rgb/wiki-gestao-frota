import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '../shared/Skeleton';

export default function EquipamentosTab({ activeTab, isAdmin, onEdit, onDelete }) {
  const { data: equipamentos = [], isLoading } = useQuery({
    queryKey: ['equipamentos_padrao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipamentos_padrao').select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  const equipamentosFiltrados = equipamentos.filter(eq => eq.finalidade === activeTab);

  if (isLoading) {
    return (
      <div className="space-y-3 relative z-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-lg" />
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 flex-shrink-0">
               <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 h-full relative overflow-hidden group hover:shadow-lg transition-shadow">
        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-3xl translate-x-10 -translate-y-10 group-hover:bg-slate-100 transition-colors pointer-events-none"></div>
        
        <div className="flex items-center justify-between gap-3 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl border border-slate-200/50"><Layers size={22} /></div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">Equipamentos</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Padrão p/ {activeTab.toLowerCase()}</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => onEdit(null)}
              className="flex-shrink-0 h-10 w-10 sm:w-auto sm:px-4 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center shadow-sm font-bold text-sm gap-2 border border-teal-100 hover:border-teal-600 group/btn"
            >
              <Plus size={18} className="group-hover/btn:rotate-90 transition-transform"/> <span className="hidden sm:inline">Adicionar</span>
            </button>
          )}
        </div>

        <div className="space-y-3 relative z-10">
          {equipamentosFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum equipamento cadastrado</p>
            </div>
          ) : (
            equipamentosFiltrados.map((eq) => (
              <div key={eq.id} className="group/item relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 hover:shadow-md transition-all">
                
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shadow-inner font-extrabold tracking-widest flex-shrink-0">
                    {eq.codigo}
                  </span>
                  <span className="font-extrabold text-slate-800 text-[13px] group-hover/item:text-teal-600 transition-colors truncate">
                    {eq.nome}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                  {isAdmin && (
                    <div className="flex items-center gap-1 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(eq)} 
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors border border-transparent hover:border-teal-100" 
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => onDelete(eq.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100" 
                        title="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                  
                  {isAdmin && <div className="hidden sm:block w-px h-6 bg-slate-200 mx-0.5"></div>}
                  
                  <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-xl border border-emerald-100 shadow-sm" title={eq.status === 'Ativo' ? 'Equipamento Ativo' : 'Inativo'}>
                    {eq.status === 'Ativo' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <AlertCircle size={16} className="text-slate-400" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
