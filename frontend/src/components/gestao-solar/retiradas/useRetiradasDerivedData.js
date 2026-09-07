import { useCallback, useMemo } from 'react';
import { ITENS_POR_PAGINA, STATUS_RETIRADA_OPTIONS } from './constants';

export function useRetiradasDerivedData({
  unidadesLookup,
  modelosLookup,
  kpisRetiradas,
  totalPaginasBackend,
  totalRegistros,
  paginaAtual,
  retiradas
}) {
  const unidadesDisponiveis = useMemo(() => {
    if (unidadesLookup && unidadesLookup.length > 0) {
      return [...new Set(unidadesLookup.map((item) => item?.nome_unidade).filter(Boolean))].sort();
    }
    if (kpisRetiradas?.opcoesFiltros?.unidades && kpisRetiradas.opcoesFiltros.unidades.length > 0) {
      return kpisRetiradas.opcoesFiltros.unidades;
    }
    return [...new Set(retiradas.map((item) => item?.unidades_clientes?.nome_unidade).filter(Boolean))].sort();
  }, [unidadesLookup, kpisRetiradas?.opcoesFiltros?.unidades, retiradas]);

  const ufsDisponiveis = useMemo(() => {
    if (unidadesLookup && unidadesLookup.length > 0) {
      return [...new Set(unidadesLookup.map((item) => item?.uf).filter(Boolean))].sort();
    }
    if (kpisRetiradas?.opcoesFiltros?.ufs && kpisRetiradas.opcoesFiltros.ufs.length > 0) {
      return kpisRetiradas.opcoesFiltros.ufs;
    }
    return [...new Set(retiradas.map((item) => item?.unidades_clientes?.uf).filter(Boolean))].sort();
  }, [unidadesLookup, kpisRetiradas?.opcoesFiltros?.ufs, retiradas]);

  const tiposDisponiveis = useMemo(() => {
    if (modelosLookup && modelosLookup.length > 0) {
      return [...new Set(modelosLookup.map((item) => item?.tipo_veiculo).filter(Boolean))].sort();
    }
    if (kpisRetiradas?.opcoesFiltros?.tipos && kpisRetiradas.opcoesFiltros.tipos.length > 0) {
      return kpisRetiradas.opcoesFiltros.tipos;
    }
    return [...new Set(retiradas.map((item) => item?.modelos_rastreadores?.tipo_veiculo).filter(Boolean))].sort();
  }, [modelosLookup, kpisRetiradas?.opcoesFiltros?.tipos, retiradas]);

  const statusDisponiveis = useMemo(() => {
    if (kpisRetiradas?.opcoesFiltros?.status && kpisRetiradas.opcoesFiltros.status.length > 0) {
      return kpisRetiradas.opcoesFiltros.status;
    }
    return STATUS_RETIRADA_OPTIONS;
  }, [kpisRetiradas?.opcoesFiltros?.status]);

  const countCaminhoes = kpisRetiradas?.tipos?.caminhao || 0;
  const countMotos = kpisRetiradas?.tipos?.moto || 0;
  const countVideos = kpisRetiradas?.tipos?.video || 0;
  const volumeBaixas = kpisRetiradas?.total ?? totalRegistros;
  const receitaTaxas = kpisRetiradas?.totalReceita || 0;

  const totalPaginas = totalPaginasBackend;
  const indexPrimeiro = totalRegistros === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
  const indexUltimo = Math.min(paginaAtual * ITENS_POR_PAGINA, totalRegistros);

  const retiradasPaginadas = useMemo(() => {
    return Array.isArray(retiradas) ? retiradas : [];
  }, [retiradas]);

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
    unidadesDisponiveis,
    ufsDisponiveis,
    tiposDisponiveis,
    statusDisponiveis,
    countCaminhoes,
    countMotos,
    countVideos,
    volumeBaixas,
    receitaTaxas,
    totalPaginas,
    getPaginasExibidas,
    indexPrimeiro,
    indexUltimo,
    retiradasPaginadas
  };
}
