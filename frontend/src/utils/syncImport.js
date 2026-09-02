export const buildSyncPayload = (linhas, syncConfig = {}) => ({
  linhas,
  tipo_sync: syncConfig.tipoSync || 'full',
  unidade_sync_id: syncConfig.unidadeId || null,
  modo_sync: syncConfig.modoSync || 'incremental',
  confirmar_delecao_ausentes: !!syncConfig.confirmarDelecaoAusentes
});

export const formatSyncReportMessage = (fallback, relatorio) => {
  if (!relatorio) return fallback;

  const partes = [
    `${relatorio.validos ?? relatorio.inseridos ?? 0} linha(s) inserida(s)`,
    `${relatorio.atualizados ?? 0} atualizada(s)`
  ];

  return `${fallback}: ${partes.join(', ')}.`;
};
