import { useMemo } from 'react';
import { COLUMNS } from './constants';

export function useTarefasDerivedData({ tasks, activeId, currentUserId, categoryFilter = 'ALL' }) {
  const filteredTasks = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'ALL') return tasks;
    if (categoryFilter === 'NONE') return tasks.filter((task) => !task.categoria);
    return tasks.filter((task) => task.categoria === categoryFilter);
  }, [tasks, categoryFilter]);

  const columnsData = useMemo(
    () =>
      COLUMNS.reduce((acc, colTitle) => {
        acc[colTitle] = filteredTasks.filter((task) => task.status === colTitle);
        return acc;
      }, {}),
    [filteredTasks]
  );

  const totalDemandas = tasks.length;
  const concluidas = useMemo(() => tasks.filter((task) => task.status === 'Concluído').length, [tasks]);
  const minhasDemandas = useMemo(
    () => tasks.filter((task) => task.atribuido_a === currentUserId && task.status !== 'Concluído').length,
    [currentUserId, tasks]
  );
  const activeTask = useMemo(() => tasks.find((task) => task.id === activeId) || null, [activeId, tasks]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: tasks.length, NONE: 0 };
    for (const t of tasks) {
      if (!t.categoria) {
        counts.NONE = (counts.NONE || 0) + 1;
      } else {
        counts[t.categoria] = (counts[t.categoria] || 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  return {
    columnsData,
    filteredTasks,
    totalDemandas,
    concluidas,
    minhasDemandas,
    activeTask,
    categoryCounts
  };
}
