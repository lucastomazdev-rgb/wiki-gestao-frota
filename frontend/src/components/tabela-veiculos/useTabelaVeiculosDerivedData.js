import { useCallback, useMemo } from 'react';
import { ITENS_POR_PAGINA } from './constants';

export function useTabelaVeiculosDerivedData({
  unidadesLookup,
  modelosLookup,
  kpisInstalacoes,
  totalPaginasBackend,
  totalRegistros,
  paginaAtual,
  veiculos,
  placasOrigem,
  filtroPlacaTransfer,
  filtroTipoTransfer,
  placasSelecionadas,
  unidadesLista,
  unidadeOrigem,
  unidadeDestino,
  setPlacasSelecionadas
}) {
  const unidadesDisponiveis = useMemo(
    () => [...new Set(unidadesLookup.map((item) => item?.nome_unidade).filter(Boolean))].sort(),
    [unidadesLookup]
  );
  const ufsDisponiveis = useMemo(
    () => [...new Set(unidadesLookup.map((item) => item?.uf).filter(Boolean))].sort(),
    [unidadesLookup]
  );
  const tiposDisponiveis = useMemo(
    () => [...new Set(modelosLookup.map((item) => item?.tipo_veiculo).filter(Boolean))].sort(),
    [modelosLookup]
  );

  const countCaminhoes = kpisInstalacoes?.tipos?.caminhao || 0;
  const countMotos = kpisInstalacoes?.tipos?.moto || 0;
  const countVideos = kpisInstalacoes?.tipos?.video || 0;
  const totalPaginas = totalPaginasBackend;
  const indexPrimeiro = totalRegistros === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
  const indexUltimo = Math.min(paginaAtual * ITENS_POR_PAGINA, totalRegistros);
  const veiculosPaginados = veiculos;

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

  const placasFiltradas = useMemo(
    () =>
      placasOrigem.filter((veiculo) => {
        const matchPlaca = veiculo.placa?.toLowerCase().includes(filtroPlacaTransfer.toLowerCase());
        const tipo = veiculo.modelos_rastreadores?.tipo_veiculo?.toUpperCase() || '';
        const matchTipo = !filtroTipoTransfer || tipo === filtroTipoTransfer.toUpperCase();
        return matchPlaca && matchTipo;
      }),
    [filtroPlacaTransfer, filtroTipoTransfer, placasOrigem]
  );

  const toggleTodas = useCallback(() => {
    if (placasSelecionadas.size === placasFiltradas.length) {
      setPlacasSelecionadas(new Set());
    } else {
      const novasSels = new Set(placasSelecionadas);
      placasFiltradas.forEach((veiculo) => novasSels.add(veiculo.id));
      setPlacasSelecionadas(novasSels);
    }
  }, [placasFiltradas, placasSelecionadas, setPlacasSelecionadas]);

  const nomeUnidadeOrigem = unidadesLista.find((item) => String(item.id) === String(unidadeOrigem))?.nome_unidade;
  const nomeUnidadeDestino = unidadesLista.find((item) => String(item.id) === String(unidadeDestino))?.nome_unidade;

  return {
    unidadesDisponiveis,
    ufsDisponiveis,
    tiposDisponiveis,
    countCaminhoes,
    countMotos,
    countVideos,
    totalPaginas,
    getPaginasExibidas,
    indexPrimeiro,
    indexUltimo,
    veiculosPaginados,
    placasFiltradas,
    toggleTodas,
    nomeUnidadeOrigem,
    nomeUnidadeDestino
  };
}
