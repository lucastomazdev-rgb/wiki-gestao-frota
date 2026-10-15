/**
 * Agrupa as placas de falhas por tratativa e gera um texto em linguagem natural.
 * @param {Array} falhas - Lista de falhas da unidade
 * @returns {string} - Texto formatado agrupando as placas pelas tratativas
 */
export const formatarPlacasAgrupadas = (falhas) => {
  if (!Array.isArray(falhas) || falhas.length === 0) return '(nenhuma placa listada)';

  // Agrupar placas por status de tratativa
  const grupos = {};
  falhas.forEach((f) => {
    const status = f.status_tratativa || f.tratativa || 'Pendente de Contato';
    if (!grupos[status]) grupos[status] = [];
    if (f.placa) {
      grupos[status].push(f.placa);
    }
  });

  const parts = [];
  const entradas = Object.entries(grupos);
  const temOutrasTratativas = entradas.some(([status]) => status !== 'Pendente de Contato');

  let tratativasIndex = 0;

  // Primeiro iteramos pelas que já possuem tratativas anteriores conhecidas
  entradas.forEach(([status, placas]) => {
    if (status === 'Pendente de Contato') return;

    const plural = placas.length > 1;
    const textoPlacas = placas.map((p) => `• ${p}`).join('\n');

    let acao = '';
    switch (status) {
      case 'Parado':
        acao = plural ? 'estavam parados' : 'estava parado';
        break;
      case 'Aguardando Retorno':
        acao = plural ? 'estavam aguardando retorno' : 'estava aguardando retorno';
        break;
      case 'Oficina':
        acao = plural ? 'estavam na oficina' : 'estava na oficina';
        break;
      case 'Agendado Manutenção':
      case 'Agendado Manutencao':
        acao = plural ? 'estavam com manutenção agendada' : 'estava com manutenção agendada';
        break;
      case 'Aguardando Técnico':
      case 'Aguardando Tecnico':
        acao = plural ? 'estavam aguardando técnico' : 'estava aguardando técnico';
        break;
      case 'Retirada em Aberto':
        acao = plural ? 'estavam com retirada em aberto' : 'estava com retirada em aberto';
        break;
      case 'Voltou a comunicar':
        acao = plural ? 'tinham voltado a comunicar' : 'tinha voltado a comunicar';
        break;
      default:
        acao = plural ? `estavam com status "${status}"` : `estava com status "${status}"`;
    }

    const s = plural ? 's' : '';
    if (tratativasIndex === 0) {
      parts.push(`Na nossa última tratativa a${s} seguinte${s} placa${s} ${acao}:\n${textoPlacas}`);
    } else {
      parts.push(`A${s} seguinte${s} placa${s} ${acao}:\n${textoPlacas}`);
    }
    tratativasIndex++;
  });

  // Em seguida, tratamos as pendentes (novas falhas)
  const pendentes = grupos['Pendente de Contato'];
  if (pendentes && pendentes.length > 0) {
    const textoPendentes = pendentes.map((p) => `• ${p}`).join('\n');
    if (temOutrasTratativas) {
      parts.push(`Além dessas placas, apareceram novas possíveis falhas que são:\n${textoPendentes}`);
    } else {
      parts.push(`Apareceram as seguintes falhas que necessitam de confirmação:\n${textoPendentes}`);
    }
  }

  return parts.join('\n\n');
};
