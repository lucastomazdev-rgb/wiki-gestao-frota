import React from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  Clock, 
  MessageSquare, 
  Plus, 
  User as UserIcon, 
  X,
  Send,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../ConfirmModal';
import TarefasBoard from './tarefas/TarefasBoard';
import TarefasStatsCards from './tarefas/TarefasStatsCards';
import { COLUMNS } from './tarefas/constants';
import { useTarefasData } from './tarefas/useTarefasData';
import { useTarefasDerivedData } from './tarefas/useTarefasDerivedData';

export default function Tarefas() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const currentUserId = user?.id;

  const {
    tasks,
    activeId,
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
    isLoadingTasks,
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
  } = useTarefasData({ user, isAdmin });

  const { columnsData, totalDemandas, concluidas, minhasDemandas, activeTask } = useTarefasDerivedData({
    tasks,
    activeId,
    currentUserId
  });

  const canEditSelectedTask = selectedTask && (isAdmin || selectedTask.criado_por === currentUserId);
  const canDeleteSelectedTask = selectedTask && (isAdmin || selectedTask.criado_por === currentUserId);

  return (
    <div className="flex flex-col h-auto w-full relative z-[10] transition-all duration-300">
      {/* Cards de Métricas e Botão Nova Demanda */}
      <TarefasStatsCards
        totalDemandas={totalDemandas}
        concluidas={concluidas}
        minhasDemandas={minhasDemandas}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
      />

      {/* Quadro Kanban */}
      <TarefasBoard
        columnsData={columnsData}
        onTaskClick={openTaskDetails}
        onRequestDelete={openDeleteModal}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        usersList={users}
        currentTime={currentTime + timeOffset}
        activeTask={activeTask}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Excluir Demanda"
        message={`Tem certeza que deseja apagar permanentemente a demanda "${taskToDelete?.titulo}"? Esta ação não poderá ser desfeita.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Manter Demanda"
        onConfirm={handleDeleteTask}
        onCancel={closeDeleteModal}
        danger={true}
      />

      {/* Modal: Nova Demanda */}
      {isNewTaskModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[20000] p-4 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[92vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl shadow-xs">
                  <Plus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Nova Demanda</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Cadastre uma nova solicitação no quadro da frota</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)} 
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Título da Demanda <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={newTask.titulo}
                  onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-bold text-xs text-slate-700 bg-white shadow-xs"
                  placeholder="Ex: Verificar telemetria do caminhão ABC-1234..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Descrição Detalhada
                </label>
                <textarea 
                  value={newTask.descricao}
                  onChange={(e) => setNewTask({ ...newTask, descricao: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-medium text-slate-600 resize-none h-28 custom-scrollbar bg-white shadow-xs leading-relaxed"
                  placeholder="Descreva detalhadamente a solicitação, contexto ou instruções adicionais..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Coluna Inicial
                  </label>
                  <div className="relative">
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                      className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-bold text-slate-700 bg-white appearance-none cursor-pointer shadow-xs"
                    >
                      {COLUMNS.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Prioridade / SLA
                  </label>
                  <div className="relative">
                    <select
                      value={newTask.prioridade}
                      onChange={(e) => setNewTask({ ...newTask, prioridade: e.target.value })}
                      className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-bold text-slate-700 bg-white appearance-none cursor-pointer shadow-xs"
                    >
                      <option value="Baixa">Baixa (72h)</option>
                      <option value="Normal">Normal (48h)</option>
                      <option value="Alta">Alta (24h)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Atribuição: EXCLUSIVA PARA ADM */}
                {isAdmin ? (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Atribuir Responsável (ADM)
                    </label>
                    <div className="relative">
                      <select
                        value={newTask.atribuido_a}
                        onChange={(e) => setNewTask({ ...newTask, atribuido_a: e.target.value })}
                        className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-xs font-bold text-slate-700 bg-white appearance-none cursor-pointer shadow-xs"
                      >
                        <option value="">-- Sem Responsável Inicial --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name ? `${u.name} (${u.email})` : u.email}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={14} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
                    <Lock size={14} className="text-slate-400 shrink-0" />
                    <span>A atribuição de responsáveis é realizada posteriormente por administradores.</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-5 h-11 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 h-11 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer font-sans"
                >
                  <span>Criar Demanda</span>
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Modal: Detalhes da Demanda */}
      {isTaskDetailsModalOpen && selectedTask && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[20000] p-4 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[92vh]">
            {/* Cabeçalho */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/70 shrink-0">
              <div className="pr-8">
                <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-lg tracking-widest border shadow-xs ${
                    selectedTask.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedTask.status === 'Em andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedTask.status === 'Aguardando Retorno' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {selectedTask.status}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    <Clock size={11} className="text-slate-400" />
                    Criado em: {new Date(selectedTask.created_at).toLocaleDateString('pt-BR')}
                  </span>

                  {selectedTask.criador && (
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      Autor: {selectedTask.criador.name || selectedTask.criador.email}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                  {selectedTask.titulo}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {canDeleteSelectedTask && (
                  <button
                    type="button"
                    onClick={() => openDeleteModal(selectedTask)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer"
                    title="Excluir Demanda"
                  >
                    <X size={20} className="hidden" />
                    <span className="text-xs font-bold text-rose-500 hover:underline px-2 py-1">Excluir</span>
                  </button>
                )}
                
                <button 
                  type="button"
                  onClick={closeTaskDetails} 
                  aria-label="Fechar detalhes da tarefa" 
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna Principal: Descrição e Comentários */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Seção de Descrição */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={14} className="text-slate-400" />
                        Descrição da Demanda
                      </h4>
                      
                      {canEditSelectedTask && !isEditingDesc && (
                        <button 
                          type="button"
                          onClick={() => setIsEditingDesc(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 px-3 py-1 hover:bg-teal-50 rounded-lg transition-all border border-teal-200 cursor-pointer"
                        >
                          Editar Descrição
                        </button>
                      )}
                    </div>
                    
                    {isEditingDesc ? (
                      <div className="space-y-3">
                        <textarea 
                          value={tempDesc}
                          onChange={e => setTempDesc(e.target.value)}
                          className="w-full bg-white p-4 rounded-2xl text-xs font-medium text-slate-700 border border-teal-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none resize-none min-h-[130px] shadow-xs transition-all custom-scrollbar leading-relaxed"
                          placeholder="Adicione os detalhes da demanda..."
                        />
                        <div className="flex justify-end gap-2.5">
                          <button 
                            type="button" 
                            onClick={() => setIsEditingDesc(false)} 
                            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button" 
                            onClick={handleSaveDesc} 
                            className="px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            Salvar Alteração
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onDoubleClick={() => {
                          if (canEditSelectedTask) setIsEditingDesc(true);
                        }}
                        className={`p-5 rounded-2xl text-xs font-medium text-slate-700 whitespace-pre-wrap min-h-[100px] border leading-relaxed ${
                          canEditSelectedTask 
                            ? 'bg-slate-50/60 border-slate-200 hover:border-teal-300 hover:bg-white cursor-pointer transition-all group relative'
                            : 'bg-slate-50/40 border-slate-200 cursor-default'
                        }`}
                        title={canEditSelectedTask ? "Duplo clique para editar" : undefined}
                      >
                        {selectedTask.descricao || (
                          <span className="text-slate-400 italic font-normal">Nenhum detalhe adicional fornecido...</span>
                        )}
                        {canEditSelectedTask && (
                          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black text-teal-600 uppercase tracking-widest">
                            Duplo clique para editar
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seção de Comentários / Linha do Tempo */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-400" />
                      Linha do Tempo / Comentários ({comments.length})
                    </h4>
                    
                    <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {comments.map((comment) => {
                        const author = comment.usuario || users.find(u => u.id === comment.usuario_id);
                        const authorName = author?.name || author?.email || 'Usuário';
                        const initial = authorName.charAt(0).toUpperCase();

                        return (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                              {initial}
                            </div>
                            <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 shadow-xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-slate-800">
                                  {authorName}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  {new Date(comment.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                {comment.comentario}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {comments.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                          <MessageSquare size={20} className="text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Nenhum comentário registrado ainda.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Formulário para novo comentário */}
                    <form onSubmit={handleAddComment} className="flex gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:border-teal-400 transition-all">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Escreva uma observação ou comentário sobre a demanda..."
                        className="flex-1 bg-transparent px-3 py-2 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
                      />
                      <button 
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Enviar</span>
                        <Send size={12} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Coluna Lateral: Painel de Informações & Responsável */}
                <div className="space-y-6">
                  <div className="bg-slate-50/80 p-5 rounded-[1.8rem] border border-slate-200 shadow-xs flex flex-col gap-6">
                    
                    {/* Seção Responsável */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-0.5">
                        Responsável Designado
                      </h4>
                      
                      {isAdmin ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <select 
                              value={selectedTask.atribuido_a || ''}
                              onChange={(e) => handleAssignTask(selectedTask.id, e.target.value)}
                              className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none appearance-none cursor-pointer shadow-xs"
                            >
                              <option value="">-- Sem Responsável --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name ? `${u.name} (${u.email})` : u.email}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                              <UserIcon size={14} />
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                            Você é Administrador e pode alterar o responsável a qualquer momento.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 font-black text-sm shrink-0">
                            {selectedTask.responsavel ? (
                              (selectedTask.responsavel.name || selectedTask.responsavel.email).charAt(0).toUpperCase()
                            ) : (
                              <UserIcon size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-800 block truncate">
                              {selectedTask.responsavel 
                                ? (selectedTask.responsavel.name || selectedTask.responsavel.email)
                                : 'Não atribuído'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Encarregado
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Status da Ação */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-0.5">
                        Status no Quadro
                      </h4>
                      {selectedTask.status !== 'Concluído' ? (
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-3">
                          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                            <Clock size={16} />
                          </div>
                          <p className="text-[11px] font-semibold text-amber-900 leading-tight">
                            Arraste a demanda para a coluna "Concluído" no Kanban para finalizar o atendimento.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                            Demanda Finalizada
                          </span>
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
    </div>
  );
}
