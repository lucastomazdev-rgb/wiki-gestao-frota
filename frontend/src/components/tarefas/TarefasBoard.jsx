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
import { CheckCircle2, Clock, Layers, MessageSquare, Trash2, User as UserIcon } from 'lucide-react';
import { COLUMNS } from './constants';

function SortableTaskCard({ task, onClick, onDelete, isAdmin, currentUserId, usersList, currentTime }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
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
  const assignedUser = usersList?.find((user) => user.id === task.atribuido_a);

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
      {...listeners}
      onClick={() => onClick(task)}
      className={`p-2.5 rounded-2xl mb-3 cursor-grab active:cursor-grabbing transition-all duration-300 group relative overflow-hidden hover:scale-[1.02] active:scale-95 ${
        isAssignedToMe
          ? 'bg-gradient-to-br from-teal-50/40 to-white border border-teal-400 shadow-md shadow-teal-500/10 hover:border-teal-500'
          : 'bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-teal-200'
      }`}
    >
      {isAssignedToMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l-2xl"></div>}
      <div className="flex justify-between items-start mb-2 pl-0.5">
        <h4 className="font-black text-slate-800 text-[13px] tracking-tight leading-tight pr-14 break-words">{task.titulo}</h4>

        {(isAdmin || task.criado_por === currentUserId) && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task);
            }}
            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 absolute top-2 right-8 hover:scale-110 active:scale-90"
            title="Excluir Demanda"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        )}

        {task.status === 'Concluído' && <CheckCircle2 size={14} className="text-emerald-500 absolute top-3 right-3" />}
      </div>

      {task.descricao && (
        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mb-3 mt-1 leading-relaxed">{task.descricao}</p>
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

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          {task.atribuido_a && assignedUser ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                isAssignedToMe
                  ? 'bg-teal-50 text-teal-700 border-teal-100 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <UserIcon size={10} />
              <span className="max-w-[70px] truncate">{assignedUser.email.split('@')[0]}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-slate-50 text-slate-300 border border-slate-100">
              <span>Sem Atribuição</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-300 text-[10px] font-black">
          <div className="flex items-center gap-1 hover:text-teal-500 transition-colors">
            <MessageSquare size={13} />
            <span>{task.commentCount || 0}</span>
          </div>
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
      className="flex flex-col shrink-0 lg:flex-1 lg:min-w-0 min-w-[260px] bg-slate-50/50 rounded-[2rem] border border-slate-200/50 p-4 h-full shadow-inner relative overflow-hidden group/column"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-0 group-hover/column:opacity-100 transition-opacity"></div>

      <div className="flex items-center justify-between mb-4 px-1.5 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-slate-700 text-[11px] uppercase tracking-widest">{title}</h3>
          <span className="bg-white text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-slate-100 ring-1 ring-slate-100">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 px-2 -mx-2 relative z-10 overflow-y-auto custom-scrollbar max-h-[580px] py-2">
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
          <div className="h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 bg-white/30 transition-colors hover:bg-white/50">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-300">
              <Layers size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Vazio</span>
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
  onDragEnd
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="flex-grow overflow-x-auto pb-10 -mx-4 px-4 lg:mx-0 lg:px-0 custom-scrollbar-horizontal">
      <div className="flex gap-4 min-h-[500px] h-full min-w-[1100px] lg:min-w-full items-start px-2 py-1">
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
              tasks={columnsData[columnId]}
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
              <div className="transform scale-105 rotate-2 opacity-90 shadow-2xl cursor-grabbing">
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
  );
}
