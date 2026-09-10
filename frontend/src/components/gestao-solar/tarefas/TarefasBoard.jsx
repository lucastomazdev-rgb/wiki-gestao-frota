import React from 'react';
import {
  DndContext,
  closestCorners,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Clock, Filter, Layers, Lock, MessageSquare, Sliders, Tag, Trash2, User as UserIcon, Wrench } from 'lucide-react';
import { COLUMNS } from './constants';

export function getCategoryMeta(categoria) {
  if (!categoria) return null;
  if (categoria === 'Configuração/Perfil') {
    return {
      label: 'Configuração / Perfil',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/90 hover:bg-sky-100/70',
      icon: Sliders,
      hoverBorder: 'hover:border-sky-300'
    };
  }
  if (categoria === 'Manutenção') {
    return {
      label: 'Manutenção',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/70',
      icon: Wrench,
      hoverBorder: 'hover:border-amber-300'
    };
  }
  return {
    label: categoria,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/90 hover:bg-slate-200/70',
    icon: Tag,
    hoverBorder: 'hover:border-slate-400'
  };
}

function SortableTaskCard({ task, onClick, onDelete, isAdmin, currentUserId, usersList, currentTime }) {
  const canDrag = isAdmin || task.criado_por === currentUserId || task.atribuido_a === currentUserId;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: !canDrag
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-32 bg-teal-50/50 rounded-xl border-2 border-dashed border-teal-300 opacity-50 mb-3"
      />
    );
  }

  const isAssignedToMe = task.atribuido_a === currentUserId;
  const isCreatedByMe = task.criado_por === currentUserId;
  const assignedUser = task.responsavel || usersList?.find((user) => user.id === task.atribuido_a);
  const creatorUser = task.criador || usersList?.find((user) => user.id === task.criado_por);
  const categoryMeta = getCategoryMeta(task.categoria);
  const CategoryIcon = categoryMeta?.icon;

  const getExpirationData = () => {
    if (!task.created_at || task.status === 'Concluído') return null;
    const p = task.prioridade || 'Normal';
    const hoursAllowed = p === 'Alta' ? 24 : p === 'Baixa' ? 72 : 48;
    const maxTime = hoursAllowed * 60 * 60 * 1000;

    const rawElapsed = currentTime - new Date(task.created_at).getTime();
    const elapsed = Math.max(0, rawElapsed);

    const percentExpended = Math.min(Math.max((elapsed / maxTime) * 100, 0), 100);
    const percentRemaining = 100 - percentExpended;

    let color = 'bg-emerald-500';
    if (percentExpended > 50) color = 'bg-amber-500';
    if (percentExpended > 80) color = 'bg-rose-500';

    const leftMs = maxTime - elapsed;
    let textStr = '';
    let isExpired = false;

    if (leftMs <= 0) {
      textStr = 'Expirado';
      isExpired = true;
      color = 'bg-rose-600';
    } else {
      const h = Math.floor(leftMs / (1000 * 60 * 60));
      const m = Math.floor((leftMs % (1000 * 60 * 60)) / (1000 * 60));
      textStr = `${h}h ${m}m restantes`;
    }

    return { percentRemaining, timeLeft: textStr, color, isExpired, p };
  };

  const expData = getExpirationData();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      onClick={() => onClick(task)}
      className={`p-3 rounded-2xl mb-3 transition-all duration-300 group relative overflow-hidden select-none ${
        canDrag
          ? 'cursor-grab active:cursor-grabbing hover:scale-[1.015] active:scale-95'
          : 'cursor-pointer hover:border-slate-300'
      } ${
        isAssignedToMe
          ? 'bg-gradient-to-br from-teal-50/40 to-white border border-teal-400 shadow-md shadow-teal-500/10 hover:border-teal-500'
          : categoryMeta
            ? `bg-white border border-slate-200/80 shadow-xs hover:shadow-md ${categoryMeta.hoverBorder}`
            : 'bg-white border border-slate-200/70 shadow-xs hover:shadow-md hover:border-teal-300'
      }`}
    >
      {isAssignedToMe && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500 rounded-l-2xl"></div>}
      
      {/* Badge de Categoria (quando presente) */}
      {categoryMeta && (
        <div className="mb-2 pl-0.5 flex items-center">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-2xs transition-colors ${categoryMeta.badgeClass}`}>
            <CategoryIcon size={10} strokeWidth={2.4} />
            <span>{categoryMeta.label}</span>
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-2 pl-0.5">
        <h4 className="font-black text-slate-800 text-[13px] tracking-tight leading-snug pr-14 break-words">
          {task.titulo}
        </h4>

        <div className="flex items-center gap-1 absolute top-2.5 right-2.5">
          {!canDrag && !isAdmin && (
            <span
              className="p-1 text-slate-300 group-hover:text-slate-400 transition-colors"
              title="Apenas o autor ou administradores podem mover esta demanda"
            >
              <Lock size={12} strokeWidth={2.2} />
            </span>
          )}

          {(isAdmin || isCreatedByMe) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(task);
              }}
              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer"
              title="Excluir Demanda"
            >
              <Trash2 size={14} strokeWidth={2.5} />
            </button>
          )}

          {task.status === 'Concluído' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
        </div>
      </div>

      {task.descricao && (
        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mb-3 mt-1 leading-relaxed pl-0.5">
          {task.descricao}
        </p>
      )}

      {expData && (
        <div className="mt-2 mb-3 px-0.5">
          <div className="flex justify-between items-end mb-1.5">
            <span
              className={`text-[8px] font-black uppercase tracking-widest ${
                expData.p === 'Alta' ? 'text-rose-600' : expData.p === 'Normal' ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              Prioridade {expData.p}
            </span>
            <span
              className={`text-[9px] font-black flex items-center gap-1 ${
                expData.isExpired ? 'text-rose-600 animate-pulse' : 'text-slate-400'
              }`}
            >
              <Clock size={10} /> {expData.timeLeft}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden shadow-inner">
            <div
              className={`h-full ${expData.color} transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
              style={{ width: `${expData.percentRemaining}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
        {/* Atribuição */}
        <div className="flex items-center gap-2">
          {assignedUser ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                isAssignedToMe
                  ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={`Atribuído a: ${assignedUser.name || assignedUser.email}`}
            >
              <UserIcon size={10} />
              <span className="max-w-[80px] truncate">{(assignedUser.name || assignedUser.email).split('@')[0]}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-slate-50 text-slate-400 border border-slate-100">
              <span>Sem Atribuição</span>
            </div>
          )}

          {/* Badge Criador */}
          {creatorUser && (
            <span className="text-[9px] text-slate-400 hidden sm:inline" title={`Criado por: ${creatorUser.name || creatorUser.email}`}>
              por {(creatorUser.name || creatorUser.email).split('@')[0]}
            </span>
          )}
        </div>

        {/* Comentários */}
        <div className="flex items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors font-bold">
          <MessageSquare size={12} />
          <span>{task.commentCount || 0}</span>
        </div>
      </div>
    </div>
  );
}

function Column({ id, title, tasks, onTaskClick, onDeleteTask, isAdmin, currentUserId, usersList, currentTime }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col shrink-0 lg:flex-1 lg:min-w-0 min-w-[270px] bg-slate-50/70 rounded-[2rem] border border-slate-200/70 p-4 h-full shadow-inner relative overflow-hidden group/column"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-0 group-hover/column:opacity-100 transition-opacity"></div>

      <div className="flex items-center justify-between mb-4 px-1.5 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-slate-700 text-[11px] uppercase tracking-widest">{title}</h3>
          <span className="bg-white text-slate-800 text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-xs border border-slate-200">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 px-1 -mx-1 relative z-10 overflow-y-auto custom-scrollbar max-h-[620px] py-1">
        <SortableContext id={id} items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onDelete={onDeleteTask}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                usersList={usersList}
                currentTime={currentTime}
              />
            ))}
          </div>
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 bg-white/40 transition-colors">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-300">
              <Layers size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma Demanda</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TarefasBoard({
  columnsData,
  onTaskClick,
  onRequestDelete,
  isAdmin,
  currentUserId,
  usersList,
  currentTime,
  activeTask,
  onDragStart,
  onDragOver,
  onDragEnd,
  categoryFilter,
  onCategoryFilterChange,
  categoryCounts
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="flex flex-col flex-grow w-full">
      {/* Barra de Filtro de Categorias */}
      {categoryCounts && onCategoryFilterChange && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1.5 shrink-0">
              <Filter size={12} className="text-slate-400" />
              Categorias:
            </span>

            <button
              type="button"
              onClick={() => onCategoryFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <span>Todas</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                categoryFilter === 'ALL' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {categoryCounts.ALL || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onCategoryFilterChange('Configuração/Perfil')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                categoryFilter === 'Configuração/Perfil'
                  ? 'bg-sky-600 text-white shadow-xs shadow-sky-600/20'
                  : 'bg-white text-sky-700 border border-sky-200/80 hover:bg-sky-50/70'
              }`}
            >
              <Sliders size={11} strokeWidth={2.4} />
              <span>Configuração / Perfil</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                categoryFilter === 'Configuração/Perfil' ? 'bg-sky-700 text-sky-100' : 'bg-sky-100 text-sky-700'
              }`}>
                {categoryCounts['Configuração/Perfil'] || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onCategoryFilterChange('Manutenção')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                categoryFilter === 'Manutenção'
                  ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
                  : 'bg-white text-amber-800 border border-amber-200/80 hover:bg-amber-50/70'
              }`}
            >
              <Wrench size={11} strokeWidth={2.4} />
              <span>Manutenção</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                categoryFilter === 'Manutenção' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
              }`}>
                {categoryCounts['Manutenção'] || 0}
              </span>
            </button>

            {categoryCounts.NONE > 0 && (
              <button
                type="button"
                onClick={() => onCategoryFilterChange('NONE')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  categoryFilter === 'NONE'
                    ? 'bg-slate-600 text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span>Sem Categoria</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                  categoryFilter === 'NONE' ? 'bg-slate-500 text-slate-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {categoryCounts.NONE}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quadro Kanban com rolagem horizontal se necessário */}
      <div className="flex-grow overflow-x-auto pb-8 -mx-4 px-4 lg:mx-0 lg:px-0 custom-scrollbar-horizontal">
        <div className="flex gap-4 min-h-[520px] h-full min-w-[1100px] lg:min-w-full items-start px-1 py-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            {COLUMNS.map((columnId) => (
              <Column
                key={columnId}
                id={columnId}
                title={columnId}
                tasks={columnsData[columnId] || []}
                onTaskClick={onTaskClick}
                onDeleteTask={onRequestDelete}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                usersList={usersList}
                currentTime={currentTime}
              />
            ))}

            <DragOverlay>
              {activeTask ? (
                <div className="transform scale-105 rotate-1 opacity-95 shadow-2xl cursor-grabbing">
                  <SortableTaskCard
                    task={activeTask}
                    onClick={() => {}}
                    onDelete={() => {}}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    usersList={usersList}
                    currentTime={currentTime}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
