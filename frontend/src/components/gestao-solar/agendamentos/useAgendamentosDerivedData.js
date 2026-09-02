import { useCallback, useMemo } from 'react';

const STATUSS_MASSA = new Set(['Agendado', 'Aguardando Data']);
const DIAS_SEMANA_BOARD = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function useAgendamentosDerivedData({
  agendamentos,
  agendamentosCompletos,
  kpisAgendamentos,
  paginaAtual,
  itensPorPagina,
  totalRegistros,
  totalPaginasBackend,
  unidadesFiltroDisponiveis
}) {
  const agendamentosFiltrados = useMemo(
    () =>
      [...agendamentos].sort((a, b) => {
        const dataA = a.data_agendamento ? new Date(a.data_agendamento).getTime() : 0;
        const dataB = b.data_agendamento ? new Date(b.data_agendamento).getTime() : 0;
        return dataB - dataA;
      }),
    [agendamentos]
  );

  const frustradosCompletos = useMemo(
    () => agendamentosCompletos.filter((item) => item.status === 'Frustrado'),
    [agendamentosCompletos]
  );

  const unidadesUnicas = useMemo(
    () =>
      [...new Set(unidadesFiltroDisponiveis.map((item) => item?.nome_unidade).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [unidadesFiltroDisponiveis]
  );

  const unidadesUnicasMassa = useMemo(
    () =>
      [
        ...new Set(
          agendamentosCompletos
            .filter((item) => STATUSS_MASSA.has(item.status))
            .map((item) => item.unidades_clientes?.nome_unidade)
            .filter(Boolean)
        )
      ].sort(),
    [agendamentosCompletos]
  );

  const boardDados = useMemo(() => {
    const dias = DIAS_SEMANA_BOARD.reduce((acc, dia) => ({ ...acc, [dia]: [] }), {});
    agendamentosCompletos.forEach((item) => {
      if (item.status !== 'Agendado' || !item.data_agendamento) return;
      const [ano, mes, dia] = item.data_agendamento.split('T')[0].split('-');
      const dataLocal = new Date(ano, mes - 1, dia);
      const nomeDia = NOMES_DIAS[dataLocal.getDay()];
      if (dias[nomeDia]) {
        dias[nomeDia].push(item);
      }
    });
    return dias;
  }, [agendamentosCompletos]);

  const totalRealizado = kpisAgendamentos?.status?.realizado || 0;
  const totalAgendado = kpisAgendamentos?.status?.agendado || 0;
  const totalFrustrado = kpisAgendamentos?.status?.frustrado || 0;
  const dadosUnidades = kpisAgendamentos?.unidades_top || [];
  const dadosProblemas = kpisAgendamentos?.problemas_top || [];
  const dadosServicos = kpisAgendamentos?.servicos_mix || [];
  const dadosTecnicos = kpisAgendamentos?.tecnicos_perf || [];
  const colorsServicos = ['#1e293b', '#d97706', '#0ea5e9', '#475569', '#94a3b8', '#cbd5e1'];

  const indexOfFirstItem = totalRegistros === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
  const indexOfLastItem = Math.min(paginaAtual * itensPorPagina, totalRegistros);
  const itensAtuais = agendamentosFiltrados;
  const totalPaginas = totalPaginasBackend;

  const getPaginasExibidas = useCallback(() => {
    const paginas = [];
    for (let i = 1; i <= totalPaginas; i += 1) {
      if (i === 1 || i >= totalPaginas - 2 || (i >= paginaAtual - 1 && i <= paginaAtual + 1)) {
        paginas.push(i);
      } else if (paginas[paginas.length - 1] !== '...') {
        paginas.push('...');
      }
    }
    return paginas;
  }, [paginaAtual, totalPaginas]);

  return {
    boardDados,
    colorsServicos,
    dadosProblemas,
    dadosServicos,
    dadosTecnicos,
    dadosUnidades,
    frustradosCompletos,
    getPaginasExibidas,
    indexOfFirstItem,
    indexOfLastItem,
    itensAtuais,
    totalAgendado,
    totalFrustrado,
    totalPaginas,
    totalRealizado,
    unidadesUnicas,
    unidadesUnicasMassa
  };
}
