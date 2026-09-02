import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { COLUMNS, DEFAULT_NEW_TASK } from './constants';

export function useTarefasData({ isAdmin }) {
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState('');

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [timeOffset, setTimeOffset] = useState(0);

  const [newTask, setNewTask] = useState(DEFAULT_NEW_TASK);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_usuarios');
      if (error) throw error;
      setUsers(data || []);
    } catch {
      toast.error('Erro ao buscar usuários.');
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: commentsData } = await supabase.from('tarefa_comentarios').select('tarefa_id');
      const counts = (commentsData || []).reduce((acc, curr) => {
        acc[curr.tarefa_id] = (acc[curr.tarefa_id] || 0) + 1;
        return acc;
      }, {});

      let maxDrift = 0;
      const now = Date.now();
      const processedData = (data || []).map((task) => {
        if (task.created_at) {
          const drift = new Date(task.created_at).getTime() - now;
          if (drift > maxDrift) maxDrift = drift;
        }
        return {
          ...task,
          commentCount: counts[task.id] || 0
        };
      });

      if (maxDrift > 0) {
        setTimeOffset(maxDrift);
      }

      setTasks(processedData);
    } catch {
      toast.error('Erro ao buscar tarefas.');
    }
  }, []);

  const fetchComments = useCallback(async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('tarefa_comentarios')
        .select('*')
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch {
      toast.error('Erro ao buscar comentários.');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);

    supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
      setSession(sessionData);
    });

    fetchUsers().then(() => {
      fetchTasks();
    });

    const channel = supabase
      .channel('tarefas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, fetchUsers]);

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const activeTaskId = active.id;
      const overId = over.id;

      if (activeTaskId === overId) return;

      const isActiveTask = active.data.current?.type === 'Task';
      if (!isActiveTask) return;

      const activeTask = tasks.find((task) => task.id === activeTaskId);
      const overTaskTitle = COLUMNS.includes(overId) ? overId : tasks.find((task) => task.id === overId)?.status;

      if (!overTaskTitle || !activeTask) return;

      if (activeTask.status !== overTaskTitle) {
        setTasks((currentTasks) => {
          const activeIndex = currentTasks.findIndex((task) => task.id === activeTaskId);
          const nextTasks = [...currentTasks];
          nextTasks[activeIndex].status = overTaskTitle;
          return nextTasks;
        });
      }
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;

      const activeTaskId = active.id;
      const overId = over.id;

      const activeTask = tasks.find((task) => task.id === activeTaskId);
      const overStatus = COLUMNS.includes(overId) ? overId : tasks.find((task) => task.id === overId)?.status;

      if (!activeTask || !overStatus) return;

      try {
        const { error } = await supabase.from('tarefas').update({ status: overStatus }).eq('id', activeTaskId);

        if (error) throw error;

        if (overStatus === 'Concluído' && activeTask.status !== 'Concluído') {
          toast.success(`Tarefa "${activeTask.titulo}" concluída!`, { icon: '🎉' });
        }
    } catch {
      toast.error('Erro ao mover tarefa.');
      fetchTasks();
      }
    },
    [fetchTasks, tasks]
  );

  const handleCreateTask = useCallback(
    async (event) => {
      event.preventDefault();
      if (!newTask.titulo.trim()) return;

      const loadingToast = toast.loading('Criando demanda...');
      try {
        const payload = {
          titulo: newTask.titulo,
          descricao: newTask.descricao,
          criado_por: session?.user?.id,
          status: newTask.status || 'Demandas',
          prioridade: newTask.prioridade || 'Normal'
        };

        if (isAdmin && newTask.atribuido_a) {
          payload.atribuido_a = newTask.atribuido_a;
        }

        const { error } = await supabase.from('tarefas').insert([payload]);
        if (error) throw error;

        toast.success('Demanda criada com sucesso!', { id: loadingToast });
        setIsNewTaskModalOpen(false);
        setNewTask(DEFAULT_NEW_TASK);
        fetchTasks();
      } catch {
        toast.error('Erro ao criar demanda.', { id: loadingToast });
      }
    },
    [fetchTasks, isAdmin, newTask, session]
  );

  const openDeleteModal = useCallback((task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  }, []);

  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;

    const loadingToast = toast.loading('Excluindo demanda...');
    try {
      const { error: errComments } = await supabase.from('tarefa_comentarios').delete().eq('tarefa_id', taskToDelete.id);
      if (errComments) throw errComments;

      const { error: errTask } = await supabase.from('tarefas').delete().eq('id', taskToDelete.id);
      if (errTask) throw errTask;

      toast.success('Demanda excluída com sucesso!', { id: loadingToast });
      closeDeleteModal();
      fetchTasks();
    } catch {
      toast.error('Erro ao excluir demanda. Verifique sua conexão.', { id: loadingToast });
    }
  }, [closeDeleteModal, fetchTasks, taskToDelete]);

  const handleAssignTask = useCallback(
    async (taskId, userId) => {
      if (!isAdmin) return;
      try {
        const { error } = await supabase.from('tarefas').update({ atribuido_a: userId || null }).eq('id', taskId);
        if (error) throw error;

        toast.success('Atribuição atualizada!');
        fetchTasks();
        setSelectedTask((prev) => ({ ...prev, atribuido_a: userId || null }));
      } catch {
        toast.error('Erro ao atribuir tarefa.');
      }
    },
    [fetchTasks, isAdmin]
  );

  const handleAddComment = useCallback(
    async (event) => {
      event.preventDefault();
      if (!newComment.trim() || !selectedTask) return;

      try {
        const { error } = await supabase.from('tarefa_comentarios').insert([
          {
            tarefa_id: selectedTask.id,
            usuario_id: session?.user?.id,
            comentario: newComment
          }
        ]);
        if (error) throw error;

        setNewComment('');
        fetchComments(selectedTask.id);
        fetchTasks();
    } catch {
      toast.error('Erro ao adicionar comentário.');
    }
    },
    [fetchComments, fetchTasks, newComment, selectedTask, session]
  );

  const handleSaveDesc = useCallback(async () => {
    try {
      const { error } = await supabase.from('tarefas').update({ descricao: tempDesc }).eq('id', selectedTask.id);
      if (error) throw error;

      toast.success('Descrição atualizada!');
      setSelectedTask({ ...selectedTask, descricao: tempDesc });
      setIsEditingDesc(false);
      fetchTasks();
    } catch {
      toast.error('Erro ao atualizar descrição.');
    }
  }, [fetchTasks, selectedTask, tempDesc]);

  const openTaskDetails = useCallback(
    (task) => {
      setSelectedTask(task);
      setTempDesc(task.descricao || '');
      setIsEditingDesc(false);
      setIsTaskDetailsModalOpen(true);
      fetchComments(task.id);
    },
    [fetchComments]
  );

  const closeTaskDetails = useCallback(() => {
    setIsTaskDetailsModalOpen(false);
  }, []);

  return {
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
  };
}
