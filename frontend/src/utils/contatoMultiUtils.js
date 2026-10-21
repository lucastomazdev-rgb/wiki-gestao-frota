/**
 * Utilitários de Dupla Validação (Nome + Número) e Agrupamento Multi-Unidade
 * Módulo de Falhas de Comunicação - Gestão Solar
 */

/**
 * Normaliza um nome para comparação:
 * - Remove acentos
 * - Converte para minúsculas
 * - Remove espaços duplos e trim
 *
 * @param {string} nome
 * @returns {string}
 */
export function normalizarNome(nome) {
  if (!nome || typeof nome !== 'string') return '';
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normaliza um telefone para comparação:
 * - Mantém apenas dígitos numéricos
 * - Remove prefixo internacional '55' caso presente em números com 12 ou 13 dígitos
 * - Remove zero inicial de DDD (ex: '085' -> '85')
 *
 * @param {string} telefone
 * @returns {string}
 */
export function normalizarTelefone(telefone) {
  if (!telefone) return '';
  let digits = String(telefone).replace(/\D/g, '');

  // Remove DDI do Brasil (55) se o tamanho indicar formato internacional completo
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  // Remove zero de operadora ou DDD inicial (ex: 085 -> 85)
  digits = digits.replace(/^0+/, '');

  return digits;
}

/**
 * Compara dois números de telefone considerando formatações brasileiras:
 * - Exige no mínimo 8 dígitos em ambos
 * - Se ambos possuem DDD (comprimento >= 10 dígitos), os DDDs devem coincidir
 * - Os 8 dígitos finais (assinante) devem coincidir
 *
 * @param {string} telA
 * @param {string} telB
 * @returns {boolean}
 */
export function telefonesCoincidem(telA, telB) {
  const a = normalizarTelefone(telA);
  const b = normalizarTelefone(telB);

  if (!a || !b) return false;
  if (a.length < 8 || b.length < 8) return false;

  // Comparação idêntica direta
  if (a === b) return true;

  // Se ambos possuem DDD informado (10 ou 11 dígitos), verifica se o DDD é o mesmo
  if (a.length >= 10 && b.length >= 10) {
    const dddA = a.slice(0, 2);
    const dddB = b.slice(0, 2);
    if (dddA !== dddB) return false;
  }

  // Compara os últimos 8 dígitos (número do assinante)
  const ultimosA = a.slice(-8);
  const ultimosB = b.slice(-8);

  return ultimosA === ultimosB;
}

/**
 * Formata um número de telefone com máscara visual legível:
 * Ex: '85999991234' -> '(85) 99999-1234'
 *
 * @param {string} telefone
 * @returns {string}
 */
export function formatarTelefoneExibicao(telefone) {
  const digitos = normalizarTelefone(telefone);
  if (!digitos) return String(telefone || '').trim();

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  if (digitos.length === 9) {
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
  }
  if (digitos.length === 8) {
    return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
  }

  return String(telefone).trim();
}

/**
 * Agrupa os responsáveis multi-unidade que atendem à regra de dupla validação estrita:
 * 1. Nome normalizado coincidente
 * 2. Telefone válido com dígitos coincidentes
 * 3. Presente em 2 ou mais unidades com falhas no lote atual
 *
 * @param {Array} unidadesComFalhas - Lista de unidades com falhas e seus contatos associados
 * @returns {Array} Lista de responsáveis multi-unidade qualificados
 */
export function agruparResponsaveisMultiUnidade(unidadesComFalhas = []) {
  if (!Array.isArray(unidadesComFalhas) || unidadesComFalhas.length === 0) {
    return [];
  }

  // Lista de grupos qualificados:
  // cada item: { chave, nome, telefone, contato, unidades: [] }
  const grupos = [];

  unidadesComFalhas.forEach((unidade) => {
    const contatos = Array.isArray(unidade.contatos) ? unidade.contatos : [];

    contatos.forEach((contato) => {
      const nomeNorm = normalizarNome(contato?.nome);
      const telNorm = normalizarTelefone(contato?.telefone);

      // Regra Estrita: exige tanto nome válido quanto telefone com pelo menos 8 dígitos
      if (!nomeNorm || !telNorm || telNorm.length < 8) {
        return;
      }

      // Procura se já existe um grupo com este mesmo nome e telefone coincidente
      let grupoExistente = grupos.find((g) => {
        return normalizarNome(g.nome) === nomeNorm && telefonesCoincidem(g.telefone, contato.telefone);
      });

      if (!grupoExistente) {
        grupoExistente = {
          id: `${nomeNorm}__${telNorm.slice(-8)}`,
          nome: contato.nome?.trim(),
          telefone: contato.telefone?.trim(),
          contatoBase: contato,
          unidades: []
        };
        grupos.push(grupoExistente);
      }

      // Evita duplicar a mesma unidade cliente no mesmo responsável
      const jaPossuiUnidade = grupoExistente.unidades.some(
        (u) => u.nome_unidade?.trim().toLowerCase() === unidade.nome_unidade?.trim().toLowerCase()
      );

      if (!jaPossuiUnidade) {
        grupoExistente.unidades.push(unidade);
      }
    });
  });

  // Filtra apenas responsáveis que possuem falhas em 2 ou mais unidades distintas
  const qualificados = grupos.filter((g) => g.unidades.length >= 2);

  // Calcula estatísticas e ordena alfabeticamente pelo nome
  return qualificados
    .map((g) => {
      const totalFalhas = g.unidades.reduce((acc, u) => acc + (u.falhas?.length || 0), 0);
      const pendentes = g.unidades.reduce(
        (acc, u) =>
          acc +
          (u.falhas?.filter((f) => f.status_tratativa === 'Pendente de Contato' || !f.status_tratativa)?.length || 0),
        0
      );

      return {
        ...g,
        totalFalhas,
        totalPendentes: pendentes,
        totalUnidades: g.unidades.length
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));
}
