import { useCallback, useMemo } from 'react';

export function useFalhasDerivedData({
  falhas,
  kpisFalhas,
  totalRegistros,
  totalPaginasBackend,
  paginaAtual,
  itensPorPagina,
  ufsFiltroDisponiveis,
  unidadesFiltroDisponiveis,
  filtroUF,
  modelosLookup,
  unidadesLookup,
  normalizarPlaca
}) {
  const ufsUnicas = useMemo(
    () =>
      [...new Set(ufsFiltroDisponiveis.map((uf) => String(uf || '').trim().toUpperCase()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [ufsFiltroDisponiveis]
  );

  const unidadesUnicas = useMemo(() => {
    const base = filtroUF
      ? unidadesFiltroDisponiveis.filter(
          (item) => String(item?.uf || '').trim().toUpperCase() === String(filtroUF || '').trim().toUpperCase()
        )
      : unidadesFiltroDisponiveis;
    const valores = base.map((item) => item?.nome_unidade).filter(Boolean);
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [filtroUF, unidadesFiltroDisponiveis]);

  const tiposUnicos = useMemo(() => {
    const valores = modelosLookup.map((item) => item?.tipo_veiculo).filter(Boolean);
    return [...new Set(valores)].sort();
  }, [modelosLookup]);

  const unidadesUnicasObjs = useMemo(() => {
    const map = new Map();
    falhas.forEach((item) => {
      if (item.unidade_id && item.unidades_clientes?.nome_unidade) {
        map.set(item.unidade_id, {
          id: item.unidade_id,
          nome_unidade: item.unidades_clientes.nome_unidade
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome_unidade.localeCompare(b.nome_unidade));
  }, [falhas]);

  const unidadesUnicasMassa = useMemo(() => {
    const valores = unidadesLookup.map((item) => item?.nome_unidade).filter(Boolean);
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b));
  }, [unidadesLookup]);

  const totalFalhas = kpisFalhas?.total || totalRegistros;
  const pendentesContato = kpisFalhas?.pendentes_contato || 0;
  const emTratativa = kpisFalhas?.em_tratativa || 0;
  const totalBateriaBaixa = kpisFalhas?.bateria_baixa?.total || 0;
  const batCam = kpisFalhas?.bateria_baixa?.caminhao || 0;
  const batMoto = kpisFalhas?.bateria_baixa?.moto || 0;
  const batVid = kpisFalhas?.bateria_baixa?.video || 0;

  const itensAtuais = falhas;
  const totalPaginas = totalPaginasBackend;
  const indexOfFirstItem = totalRegistros === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
  const indexOfLastItem = Math.min(paginaAtual * itensPorPagina, totalRegistros);

  const placasDaPagina = useMemo(
    () => [...new Set(itensAtuais.map((item) => normalizarPlaca(item?.placa)).filter(Boolean))],
    [itensAtuais, normalizarPlaca]
  );
  const chaveCacheResumo = useMemo(() => placasDaPagina.join(','), [placasDaPagina]);

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
    batCam,
    batMoto,
    batVid,
    chaveCacheResumo,
    emTratativa,
    getPaginasExibidas,
    indexOfFirstItem,
    indexOfLastItem,
    itensAtuais,
    pendentesContato,
    placasDaPagina,
    tiposUnicos,
    totalBateriaBaixa,
    totalFalhas,
    totalPaginas,
    ufsUnicas,
    unidadesUnicas,
    unidadesUnicasMassa,
    unidadesUnicasObjs
  };
}
