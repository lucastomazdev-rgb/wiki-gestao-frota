import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { COLUMNS, DEFAULT_NEW_TASK } from './constants';

export function useTarefasData({ user, isAdmin }) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const dragSourceStatusRef = useRef(null);
  const dragSourceTaskRef = useRef(null);

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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const isSubmittingCommentRef = useRef(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // -------------------------------------------------------------------------
  // 1. QUERY: Buscar Tarefas com Polling Inteligente a cada 10 segundos
  // -------------------------------------------------------------------------
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['gestao-solar', 'tarefas'],
    queryFn: async () => {
      const response = await api.get('/gestao-solar/tarefas');
      const data = response.data.data || [];

      // Calcular drift de relógio
      let maxDrift = 0;
      const now = Date.now();
      for (const t of data) {
        if (t.created_at) {
          const drift = new Date(t.created_at).getTime() - now;
          if (drift > maxDrift) maxDrift = drift;
        }
      }
      if (maxDrift > 0) setTimeOffset(maxDrift);

      return data;
    },
    refetchInterval: 10000, // 10s polling
    refetchOnWindowFocus: true
  });

  // -------------------------------------------------------------------------
  // 2. QUERY: Buscar Usuários Elegíveis para Atribuição e Visualização
  // -------------------------------------------------------------------------
  const { data: users = [] } = useQuery({
    queryKey: ['gestao-solar', 'tarefas', 'usuarios'],
    queryFn: async () => {
      const response = await api.get('/gestao-solar/tarefas/usuarios');
      return response.data.data || [];
    },
    staleTime: 60000
  });

  // Atualização periódica do relógio local (para barras de tempo/SLA)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------------------
  // 3. COMENTÁRIOS: Carregar comentários da tarefa selecionada
  // -------------------------------------------------------------------------
  const fetchComments = useCallback(async (taskId) => {
    if (!taskId) return;
    setIsLoadingComments(true);
    try {
      const response = await api.get(`/gestao-solar/tarefas/${taskId}/comentarios`);
      setComments(response.data.data || []);
    } catch {
      toast.error('Erro ao carregar comentários da demanda.');
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // 4. DRAG AND DROP: Manipulação local e persistência no backend
  // -------------------------------------------------------------------------
  const handleDragStart = useCallback((event) => {
    const taskId = event.active.id;
    setActiveId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    dragSourceStatusRef.current = task?.status || null;
    dragSourceTaskRef.current = task || null;
  }, [tasks]);

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const activeTaskId = active.id;
      const overId = over.id;
      if (activeTaskId === overId) return;

      const isActiveTask = active.data.current?.type === 'Task';
      if (!isActiveTask) return;

      const activeTask = tasks.find((t) => t.id === activeTaskId);
      const overStatus = COLUMNS.includes(overId) ? overId : tasks.find((t) => t.id === overId)?.status;

      if (!overStatus || !activeTask) return;

      if (activeTask.status !== overStatus) {
        queryClient.setQueryData(['gestao-solar', 'tarefas'], (oldTasks) => {
          if (!oldTasks) return [];
          return oldTasks.map((t) => (t.id === activeTaskId ? { ...t, status: overStatus } : t));
        });
      }
    },
    [queryClient, tasks]
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveId(null);

      const initialStatus = dragSourceStatusRef.current;
      const initialTask = dragSourceTaskRef.current;
      dragSourceStatusRef.current = null;
      dragSourceTaskRef.current = null;

      const activeTaskId = active.id;

      // Se soltou fora de qualquer droppable válido
      if (!over) {
        if (initialStatus) {
          queryClient.setQueryData(['gestao-solar', 'tarefas'], (oldTasks) => {
            if (!oldTasks) return [];
            return oldTasks.map((t) => (t.id === activeTaskId ? { ...t, status: initialStatus } : t));
          });
        }
        return;
      }

      const overId = over.id;
      const destinationStatus = COLUMNS.includes(overId)
        ? overId
        : tasks.find((t) => t.id === overId)?.status;

      // Se não identificou coluna válida
      if (!destinationStatus) {
        if (initialStatus) {
          queryClient.setQueryData(['gestao-solar', 'tarefas'], (oldTasks) => {
            if (!oldTasks) return [];
            return oldTasks.map((t) => (t.id === activeTaskId ? { ...t, status: initialStatus } : t));
          });
        }
        return;
      }

      // Se a coluna final for a mesma coluna original de partida, não há chamada de rede
      if (initialStatus && destinationStatus === initialStatus) {
        queryClient.setQueryData(['gestao-solar', 'tarefas'], (oldTasks) => {
          if (!oldTasks) return [];
          return oldTasks.map((t) => (t.id === activeTaskId ? { ...t, status: initialStatus } : t));
        });
        return;
      }

      // Atualização otimista no cache local
      queryClient.setQueryData(['gestao-solar', 'tarefas'], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map((t) => (t.id === activeTaskId ? { ...t, status: destinationStatus } : t));
      });

      try {
        await api.patch(`/gestao-solar/tarefas/${activeTaskId}/status`, { status: destinationStatus });

        if (destinationStatus === 'Concluído' && initialStatus !== 'Concluído') {
          toast.success(`Demanda "${initialTask?.titulo || 'Demanda'}" concluída!`, { icon: '🎉' });
        }
        queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Erro ao mover demanda no Kanban.';
        toast.error(errorMsg);
        // Em caso de erro na requisição, reverte imediatamente para o status inicial
        if (initialStatus) {
          queryClient.setQueryData(['gestao-solar', 'tarefas'], (oldTasks) => {
            if (!oldTasks) return [];
            return oldTasks.map((t) => (t.id === activeTaskId ? { ...t, status: initialStatus } : t));
          });
        }
        queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
      }
    },
    [queryClient, tasks]
  );

  // -------------------------------------------------------------------------
  // 5. CRIAÇÃO DE TAREFA
  // -------------------------------------------------------------------------
  const handleCreateTask = useCallback(
    async (event) => {
      event.preventDefault();
      if (!newTask.titulo.trim()) {
        toast.error('Informe o título da demanda.');
        return;
      }

      const loadingToast = toast.loading('Criando demanda...');
      try {
        const payload = {
          titulo: newTask.titulo.trim(),
          descricao: newTask.descricao?.trim() || null,
          status: newTask.status || 'Demandas',
          prioridade: newTask.prioridade || 'Normal',
          categoria: newTask.categoria?.trim() || null
        };

        // Apenas ADM pode atribuir na criação
        if (isAdmin && newTask.atribuido_a) {
          payload.atribuido_a = newTask.atribuido_a;
        }

        await api.post('/gestao-solar/tarefas', payload);

        toast.success('Demanda criada com sucesso!', { id: loadingToast });
        setIsNewTaskModalOpen(false);
        setNewTask(DEFAULT_NEW_TASK);
        queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Erro ao criar demanda.';
        toast.error(errorMsg, { id: loadingToast });
      }
    },
    [isAdmin, newTask, queryClient]
  );

  // -------------------------------------------------------------------------
  // 6. EXCLUSÃO DE TAREFA
  // -------------------------------------------------------------------------
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
      await api.delete(`/gestao-solar/tarefas/${taskToDelete.id}`);

      toast.success('Demanda excluída com sucesso!', { id: loadingToast });
      closeDeleteModal();
      if (selectedTask?.id === taskToDelete.id) {
        setIsTaskDetailsModalOpen(false);
        setSelectedTask(null);
      }
      queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Erro ao excluir demanda.';
      toast.error(errorMsg, { id: loadingToast });
    }
  }, [closeDeleteModal, queryClient, selectedTask?.id, taskToDelete]);

  // -------------------------------------------------------------------------
  // 7. ATRIBUIÇÃO DE RESPONSÁVEL (Apenas ADM)
  // -------------------------------------------------------------------------
  const handleAssignTask = useCallback(
    async (taskId, userId) => {
      if (!isAdmin) {
        toast.error('Apenas Administradores podem atribuir responsáveis.');
        return;
      }

      try {
        const response = await api.patch(`/gestao-solar/tarefas/${taskId}/atribuir`, {
          atribuido_a: userId || null
        });

        toast.success('Atribuição atualizada com sucesso!');
        setSelectedTask((prev) => (prev ? { ...prev, atribuido_a: userId || null, responsavel: response.data.data?.responsavel } : prev));
        queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Erro ao atribuir responsável.';
        toast.error(errorMsg);
      }
    },
    [isAdmin, queryClient]
  );

  // -------------------------------------------------------------------------
  // 7.1. ATUALIZAÇÃO DE CATEGORIA
  // -------------------------------------------------------------------------
  const handleUpdateCategory = useCallback(
    async (taskId, categoria) => {
      try {
        const response = await api.put(`/gestao-solar/tarefas/${taskId}`, {
          categoria: categoria || null
        });

        toast.success('Categoria atualizada!');
        const updatedCat = response.data?.data?.categoria ?? (categoria || null);
        setSelectedTask((prev) => (prev ? { ...prev, categoria: updatedCat } : prev));
        queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Erro ao atualizar categoria.';
        toast.error(errorMsg);
      }
    },
    [queryClient]
  );

  // -------------------------------------------------------------------------
  // 8. ADICIONAR COMENTÁRIO
  // -------------------------------------------------------------------------
  const handleAddComment = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (isSubmittingCommentRef.current) return;
      if (!newComment.trim() || !selectedTask) return;

      isSubmittingCommentRef.current = true;
      setIsSubmittingComment(true);

      try {
        const response = await api.post(`/gestao-solar/tarefas/${selectedTask.id}/comentarios`, {
          comentario: newComment.trim()
        });

        setNewComment('');
        setComments((prev) => [...prev, response.data.data]);
        queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
        toast.success('Comentário enviado!');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Erro ao adicionar comentário.';
        toast.error(errorMsg);
      } finally {
        isSubmittingCommentRef.current = false;
        setIsSubmittingComment(false);
      }
    },
    [newComment, queryClient, selectedTask]
  );

  // -------------------------------------------------------------------------
  // 9. SALVAR DESCRIÇÃO DETALHADA
  // -------------------------------------------------------------------------
  const handleSaveDesc = useCallback(async () => {
    if (!selectedTask) return;

    try {
      await api.put(`/gestao-solar/tarefas/${selectedTask.id}`, {
        descricao: tempDesc
      });

      toast.success('Descrição atualizada!');
      setSelectedTask((prev) => (prev ? { ...prev, descricao: tempDesc } : prev));
      setIsEditingDesc(false);
      queryClient.invalidateQueries({ queryKey: ['gestao-solar', 'tarefas'] });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Erro ao atualizar descrição.';
      toast.error(errorMsg);
    }
  }, [queryClient, selectedTask, tempDesc]);

  // -------------------------------------------------------------------------
  // 10. MODAL DE DETALHES
  // -------------------------------------------------------------------------
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
    setSelectedTask(null);
    setComments([]);
  }, []);

  return {
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
    isSubmittingComment,
    comments,
    isLoadingTasks,
    isLoadingComments,
    setIsNewTaskModalOpen,
    setIsEditingDesc,
    setTempDesc,
    setNewTask,
    setNewComment,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleCreateTask,
    handleUpdateCategory,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteTask,
    handleAssignTask,
    handleAddComment,
    handleSaveDesc,
    openTaskDetails,
    closeTaskDetails,
    refetchTasks
  };
}
