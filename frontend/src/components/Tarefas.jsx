import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, ChevronDown, Clock, MessageSquare, Plus, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import ConfirmModal from './ConfirmModal';
import TarefasBoard from './tarefas/TarefasBoard';
import TarefasStatsCards from './tarefas/TarefasStatsCards';
import { COLUMNS } from './tarefas/constants';
import { useTarefasData } from './tarefas/useTarefasData';
import { useTarefasDerivedData } from './tarefas/useTarefasDerivedData';

export default function Tarefas() {
  const { isAdmin } = useAuth();
  const {
    tasks,
    activeId,
    session,
    users,
    isNewTaskModalOpen,
    isTaskDetailsModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    selectedTask,
    isEditingDesc,
    tempDesc,
    currentTime,
    timeOffset,
    newTask,
    newComment,
    comments,
    setIsNewTaskModalOpen,
    setIsEditingDesc,
    setTempDesc,
    setNewTask,
    setNewComment,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleCreateTask,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteTask,
    handleAssignTask,
    handleAddComment,
    handleSaveDesc,
    openTaskDetails,
    closeTaskDetails
  } = useTarefasData({ isAdmin });

  const { columnsData, totalDemandas, concluidas, minhasDemandas, activeTask } = useTarefasDerivedData({
    tasks,
    activeId,
    currentUserId: session?.user?.id
  });

  return (
    <div className="flex flex-col h-auto w-full relative z-[10] transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <TarefasStatsCards
        totalDemandas={totalDemandas}
        concluidas={concluidas}
        minhasDemandas={minhasDemandas}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
      />

      <TarefasBoard
        columnsData={columnsData}
        onTaskClick={openTaskDetails}
        onRequestDelete={openDeleteModal}
        isAdmin={isAdmin}
        currentUserId={session?.user?.id}
        usersList={users}
        currentTime={currentTime + timeOffset}
        activeTask={activeTask}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Excluir Demanda"
        message={`Tem certeza que deseja apagar permanentemente a demanda "${taskToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Manter Demanda"
        onConfirm={handleDeleteTask}
        onCancel={closeDeleteModal}
        danger={true}
      />

      {/* New Task Modal */}
      {isNewTaskModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[20000] p-4 overflow-y-auto animate-in fade-in duration-300" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col my-auto max-h-[95vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl shadow-sm"><Plus size={20} /></div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Nova Demanda</h3>
              </div>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título da Tarefa</label>
                  <input 
                    type="text" 
                    required
                    value={newTask.titulo}
                    onChange={(e) => setNewTask({...newTask, titulo: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-bold text-xs text-slate-700 bg-white shadow-sm"
                    placeholder="Ex: Verificar telemetria do veículo XYZ..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descrição Detalhada</label>
                  <textarea 
                    value={newTask.descricao}
                    onChange={(e) => setNewTask({...newTask, descricao: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-medium text-slate-600 resize-none h-28 custom-scrollbar bg-white shadow-sm"
                    placeholder="Adicione mais detalhes sobre a demanda..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Coluna</label>
                    <div className="relative group">
                      <select
                        value={newTask.status}
                        onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-bold text-slate-700 bg-white appearance-none cursor-pointer shadow-sm"
                      >
                        {COLUMNS.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><ChevronDown size={14} /></div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Prioridade</label>
                    <div className="relative group">
                      <select
                        value={newTask.prioridade}
                        onChange={(e) => setNewTask({...newTask, prioridade: e.target.value})}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-bold text-slate-700 bg-white appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="Baixa">Baixa (72h)</option>
                        <option value="Normal">Normal (48h)</option>
                        <option value="Alta">Alta (24h)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><ChevronDown size={14} /></div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Atribuir Responsável</label>
                      <div className="relative group">
                        <select
                          value={newTask.atribuido_a}
                          onChange={(e) => setNewTask({...newTask, atribuido_a: e.target.value})}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-bold text-slate-700 bg-white appearance-none cursor-pointer shadow-sm"
                        >
                          <option value="">-- Selecionar Usuário --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.email.split('@')[0]}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><UserIcon size={14} /></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-6 h-11 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 h-11 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  Confirmar <Plus size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
      {/* Task Details Modal */}
      {isTaskDetailsModalOpen && selectedTask && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[20000] p-4 overflow-y-auto animate-in fade-in duration-300" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col my-auto max-h-[95vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 shrink-0">
              <div className="pr-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-widest border shadow-sm ${
                    selectedTask.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    selectedTask.status === 'Em andamento' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    selectedTask.status === 'Aguardando Retorno' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {selectedTask.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100">
                    <Clock size={12} className="text-slate-300" />
                    Criação: {new Date(selectedTask.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight">{selectedTask.titulo}</h2>
              </div>
              <button onClick={closeTaskDetails} aria-label="Fechar detalhes da tarefa" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all shrink-0 cursor-pointer">
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  {/* Description Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <AlertCircle size={14} className="text-slate-300" />
                        Descrição da Demanda
                      </h4>
                      {!isEditingDesc && (
                        <button 
                          onClick={() => setIsEditingDesc(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 px-3 py-1.5 hover:bg-teal-50 rounded-lg transition-all border border-teal-100 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    
                    {isEditingDesc ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <textarea 
                          value={tempDesc}
                          onChange={e => setTempDesc(e.target.value)}
                          className="w-full bg-white p-5 rounded-2xl text-[13px] font-medium text-slate-600 border border-teal-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 outline-none resize-none min-h-[140px] shadow-sm transition-all custom-scrollbar leading-relaxed"
                          placeholder="Adicione os detalhes da demanda..."
                        />
                        <div className="flex justify-end gap-3 px-1">
                           <button onClick={() => setIsEditingDesc(false)} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancelar</button>
                           <button onClick={handleSaveDesc} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer">Salvar Alteração</button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onDoubleClick={() => setIsEditingDesc(true)}
                        className="bg-slate-50/50 p-6 rounded-2xl text-[13px] font-medium text-slate-600 whitespace-pre-wrap min-h-[120px] border border-slate-100 hover:border-teal-200 hover:bg-white cursor-pointer transition-all leading-relaxed group relative shadow-inner"
                        title="Duplo clique para editar"
                      >
                        {selectedTask.descricao || <span className="text-slate-300 italic font-normal">Nenhum detalhe adicional...</span>}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-teal-400 uppercase tracking-widest">Double click to edit</div>
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="pt-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 ml-1">
                      <MessageSquare size={14} className="text-slate-300" />
                      Linha do Tempo / Comentários ({comments.length})
                    </h4>
                    
                    <div className="space-y-6 mb-8 pr-3">
                      {comments.map((comment, idx) => (
                        <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-md shrink-0">
                            {users.find(u => u.id === comment.usuario_id)?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none p-4 shadow-sm group hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">
                                {users.find(u => u.id === comment.usuario_id)?.email?.split('@')[0] || 'Usuário'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                {new Date(comment.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{comment.comentario}</p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 mb-4 items-center flex flex-col gap-3">
                           <div className="p-3 bg-white rounded-2xl text-slate-200 shadow-sm"><MessageSquare size={24} /></div>
                           <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Sem comentários</span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-3 bg-slate-50 p-2 rounded-2xl shadow-inner border border-slate-100 group focus-within:bg-white transition-all duration-300">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Escreva um comentário..."
                        className="flex-1 bg-transparent px-4 py-2.5 rounded-xl outline-none text-[13px] font-medium text-slate-700"
                      />
                      <button 
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 disabled:opacity-30 transition-all hover:scale-105 active:scale-95 shadow-md shadow-teal-500/10 cursor-pointer"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                </div>

                {/* Sidebar Details Panel */}
                <div className="space-y-6">
                  <div className="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                    {/* Responsável Section */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Responsável</h4>
                      
                      {isAdmin ? (
                        <div className="space-y-3">
                           <div className="relative group">
                             <select 
                                value={selectedTask.atribuido_a || ''}
                                onChange={(e) => handleAssignTask(selectedTask.id, e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none appearance-none cursor-pointer shadow-sm transition-all"
                              >
                                <option value="">Sem Responsável</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.email}</option>
                                ))}
                             </select>
                             <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400"><UserIcon size={14} /></div>
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 px-1 uppercase tracking-tighter">Somente Administradores podem reatribuir demandas.</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                            {selectedTask.atribuido_a && users.find(u => u.id === selectedTask.atribuido_a) ? (
                               <span className="font-black text-base">{users.find(u => u.id === selectedTask.atribuido_a).email.charAt(0).toUpperCase()}</span>
                            ) : (
                              <UserIcon size={20} className="text-teal-200" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-black text-slate-800 truncate uppercase tracking-tight leading-none mb-1">
                              {selectedTask.atribuido_a && users.find(u => u.id === selectedTask.atribuido_a) ? users.find(u => u.id === selectedTask.atribuido_a).email.split('@')[0] : 'Indisponível'}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Encarregado</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Ações / Status Section */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Status da Ação</h4>
                      {selectedTask.status !== 'Concluído' ? (
                         <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><Clock size={16} /></div>
                            <p className="text-[11px] font-bold text-amber-800 leading-tight">Mova o item para a última coluna do Kanban para finalizar.</p>
                         </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            <CheckCircle2 size={18} /> Finalizado
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 px-1 text-center">Este item foi movido para o histórico de conclusão.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Confirmação de Exclusão */}
      {isDeleteModalOpen && createPortal(
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          title="Excluir Demanda"
          message={`Tem certeza que deseja apagar permanentemente a demanda "${taskToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Sim, Excluir"
          cancelLabel="Manter Demanda"
          onConfirm={handleDeleteTask}
          onCancel={closeDeleteModal}
          danger={true}
        />
      , document.body)}
    </div>
  );
}

