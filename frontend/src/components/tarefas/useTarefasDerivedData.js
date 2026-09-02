import { useMemo } from 'react';
import { COLUMNS } from './constants';

export function useTarefasDerivedData({ tasks, activeId, currentUserId }) {
  const columnsData = useMemo(
    () =>
      COLUMNS.reduce((acc, colTitle) => {
        acc[colTitle] = tasks.filter((task) => task.status === colTitle);
        return acc;
      }, {}),
    [tasks]
  );

  const totalDemandas = tasks.length;
  const concluidas = useMemo(() => tasks.filter((task) => task.status === 'Concluído').length, [tasks]);
  const minhasDemandas = useMemo(
    () => tasks.filter((task) => task.atribuido_a === currentUserId && task.status !== 'Concluído').length,
    [currentUserId, tasks]
  );
  const activeTask = useMemo(() => tasks.find((task) => task.id === activeId) || null, [activeId, tasks]);

  return {
    columnsData,
    totalDemandas,
    concluidas,
    minhasDemandas,
    activeTask
  };
}
