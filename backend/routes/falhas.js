import express from 'express';
import { z } from 'zod';
import { restrictToGestaoSolar, restrictTo } from '../middleware/auth.js';
import { recordAuditEvent } from '../services/auditLogger.js';

const uuidParamSchema = z.string().uuid('ID inválido.');

const normalizePlate = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

const parseDateOnly = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : new Date(Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate()));
  }
  const str = String(val).trim();
  if (!str) return null;

  // Formato brasileiro DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const dia = parseInt(brMatch[1], 10);
    const mes = parseInt(brMatch[2], 10) - 1;
    const ano = parseInt(brMatch[3], 10);
    const d = new Date(Date.UTC(ano, mes, dia));
    return isNaN(d.getTime()) ? null : d;
  }

  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseDateTime = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // Número serial do Excel (ex: 45580.605)
  if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)) && !String(val).includes('/') && !String(val).includes('-'))) {
    const num = Number(val);
    if (num > 30000 && num < 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = Math.round(num * 86400 * 1000);
      const d = new Date(excelEpoch.getTime() + ms);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // Formato brasileiro: DD/MM/YYYY [HH:mm[:ss]]
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (brMatch) {
    const dia = parseInt(brMatch[1], 10);
    const mes = parseInt(brMatch[2], 10) - 1;
    const ano = parseInt(brMatch[3], 10);
    const hora = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
    const min = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
    const seg = brMatch[6] ? parseInt(brMatch[6], 10) : 0;
    const d = new Date(Date.UTC(ano, mes, dia, hora, min, seg));
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato ISO ou YYYY-MM-DD [HH:mm[:ss]]
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (isoMatch) {
    const ano = parseInt(isoMatch[1], 10);
    const mes = parseInt(isoMatch[2], 10) - 1;
    const dia = parseInt(isoMatch[3], 10);
    const hora = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
    const min = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
    const seg = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
    const d = new Date(Date.UTC(ano, mes, dia, hora, min, seg));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const isBateriaBaixa = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const str = String(val).trim().replace(',', '.');
  const match = str.match(/[-+]?\d*\.?\d+/);
  if (match) {
    const num = parseFloat(match[0]);
    if (!isNaN(num)) return num < 11;
  }
  const lower = str.toLowerCase();
  return lower.includes('baixa') || lower.includes('critica') || lower.includes('crítica');
};

const registroImportSchema = z.object({
  placa: z.string().transform(normalizePlate).refine(v => v.length >= 5 && v.length <= 8, 'Placa inválida.'),
  unidade: z.string().trim().max(100).nullable().optional(),
  uf: z.string().trim().max(10).transform(v => v ? v.toUpperCase() : null).nullable().optional(),
  tipo_veiculo: z.string().trim().max(100).nullable().optional(),
  modulo: z.string().trim().max(100).nullable().optional(),
  ultima_transmissao: z.union([z.string(), z.date(), z.number()]).nullable().optional().transform(parseDateTime),
  nivel_bateria: z.string().trim().max(50).nullable().optional(),
  observacao: z.string().trim().nullable().optional()
});

const importarFalhasSchema = z.object({
  data_extracao: z.string().min(8, 'Data da extração é obrigatória.').transform(parseDateOnly).refine(v => v !== null, 'Data da extração inválida.'),
  descricao: z.string().trim().max(255).nullable().optional(),
  ignorar_nao_cadastradas: z.boolean().optional().default(false),
  registros: z.array(registroImportSchema).min(1, 'A lista de registros não pode estar vazia.').max(5000, 'Limite de 5.000 registros por importação excedido.')
});

const updateRegistroSchema = z.object({
  status_tratativa: z.string().trim().min(1).max(100).optional(),
  ordem_servico: z.string().trim().max(100).nullable().optional(),
  data_contato: z.union([z.string(), z.date()]).nullable().optional().transform(parseDateOnly),
  observacao: z.string().trim().nullable().optional()
}).strict();

const updateMassaSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um veículo.'),
  status_tratativa: z.string().trim().min(1).max(100),
  data_contato: z.union([z.string(), z.date()]).nullable().optional().transform(parseDateOnly),
  observacao: z.string().trim().nullable().optional()
});

const contatoUnidadeSchema = z.object({
  lote_id: z.string().uuid('ID do lote inválido.'),
  unidade: z.string().trim().min(1, 'Nome da unidade é obrigatório.'),
  contato_nome: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional()
});

const contatoMultiUnidadeSchema = z.object({
  lote_id: z.string().uuid('ID do lote inválido.'),
  unidades: z.array(z.string().trim().min(1, 'Nome de unidade inválido.')).min(1, 'Selecione pelo menos uma unidade.'),
  contato_nome: z.string().trim().nullable().optional(),
  contato_telefone: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional()
});

const loteStaticCache = new Map();

export const clearLoteStaticCache = (loteId = null) => {
  if (loteId) loteStaticCache.delete(loteId);
  else loteStaticCache.clear();
};

const getOrComputeLoteStaticMeta = async (prisma, loteId) => {
  if (loteStaticCache.has(loteId)) {
    return loteStaticCache.get(loteId);
  }

  const registros = await prisma.falhas_registros.findMany({
    where: { lote_id: loteId },
    select: {
      id: true,
      uf: true,
      unidade: true,
      tipo_veiculo: true,
      nivel_bateria: true
    }
  });

  const ufsSet = new Set();
  const unidadesSet = new Set();
  const tiposSet = new Set();
  const idsBateriaBaixa = [];

  for (const reg of registros) {
    if (reg.uf) ufsSet.add(reg.uf.trim().toUpperCase());
    if (reg.unidade) unidadesSet.add(reg.unidade.trim());
    if (reg.tipo_veiculo) tiposSet.add(reg.tipo_veiculo.trim());
    if (isBateriaBaixa(reg.nivel_bateria)) {
      idsBateriaBaixa.push(reg.id);
    }
  }

  const meta = {
    filtros_disponiveis: {
      ufs: Array.from(ufsSet).sort(),
      unidades: Array.from(unidadesSet).sort(),
      tipos_veiculo: Array.from(tiposSet).sort()
    },
    idsBateriaBaixa,
    totalBateriaBaixa: idsBateriaBaixa.length
  };

  loteStaticCache.set(loteId, meta);
  return meta;
};

export default function createFalhasRouter(prisma, protect) {
  const router = express.Router();

  // Exige autenticação e permissão de Gestão Solar em todas as rotas de falhas
  router.use(protect, restrictToGestaoSolar);

  // =========================================================================
  // 0. VERIFICAR PLACAS ANTES DA IMPORTAÇÃO (IDENTIFICA VEÍCULOS FORA DA BASE)
  // =========================================================================
  router.post('/falhas/verificar-placas', async (req, res, next) => {
    try {
      const { placas } = req.body;
      if (!Array.isArray(placas) || placas.length === 0) {
        return res.status(200).json({
          status: 'success',
          data: { total: 0, cadastradas: 0, nao_encontradas: [] }
        });
      }

      const placasLimpa = Array.from(new Set(placas.map(normalizePlate).filter(Boolean)));
      const cadastradas = await prisma.instalacoes.findMany({
        where: { placa: { in: placasLimpa } },
        select: { placa: true }
      });

      const cadastradasSet = new Set(cadastradas.map(c => normalizePlate(c.placa)));
      const naoEncontradas = placasLimpa.filter(p => !cadastradasSet.has(p));

      res.status(200).json({
        status: 'success',
        data: {
          total: placasLimpa.length,
          cadastradas: cadastradas.length,
          nao_encontradas: naoEncontradas
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 1. LISTAR LOTES DE EXTRAÇÃO (HISTÓRICO DE DATAS)
  // =========================================================================
  router.get('/falhas/lotes', async (req, res, next) => {
    try {
      const lotes = await prisma.falhas_lotes.findMany({
        orderBy: { data_extracao: 'desc' },
        take: 10,
        select: {
          id: true,
          data_extracao: true,
          descricao: true,
          total_veiculos: true,
          novas_falhas: true,
          recorrentes: true,
          criado_em: true
        }
      });

      res.status(200).json({
        status: 'success',
        data: { lotes }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 1.5 RESUMO LEVE DE FALHAS PARA O PAINEL DE CONTATOS (OTIMIZADO PARA VERCEL/RENDER)
  // =========================================================================
  router.get('/falhas/resumo-contatos', async (req, res, next) => {
    try {
      const { lote_id } = req.query;

      let loteAtivoId = lote_id;
      if (!loteAtivoId || loteAtivoId === 'latest') {
        const lote = await prisma.falhas_lotes.findFirst({
          orderBy: { data_extracao: 'desc' },
          select: { id: true }
        });
        if (!lote) return res.status(200).json({ status: 'success', data: [] });
        loteAtivoId = lote.id;
      }

      // Retorna apenas 6 colunas essenciais, poupando tráfego de rede e memória do Node.js
      const registros = await prisma.falhas_registros.findMany({
        where: { lote_id: loteAtivoId },
        select: {
          id: true,
          placa: true,
          unidade: true,
          uf: true,
          tipo_veiculo: true,
          status_tratativa: true
        },
        orderBy: { unidade: 'asc' }
      });

      res.status(200).json({
        status: 'success',
        data: registros
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 2. LISTAR REGISTROS DE FALHAS COM FILTROS, KPIS E PAGINAÇÃO
  // =========================================================================
  router.get('/falhas', async (req, res, next) => {
    try {
      const {
        lote_id,
        uf,
        unidade,
        tipo_veiculo,
        status,
        tipo_falha,
        busca,
        bateria_baixa,
        page = '1',
        limit = '20',
        sort_by = 'unidade',
        sort_dir = 'asc'
      } = req.query;

      // 1. Identificar o lote ativo
      let loteAtivo = null;
      if (lote_id && lote_id !== 'latest') {
        loteAtivo = await prisma.falhas_lotes.findUnique({
          where: { id: lote_id }
        });
      } else {
        loteAtivo = await prisma.falhas_lotes.findFirst({
          orderBy: { data_extracao: 'desc' }
        });
      }

      // Se nenhum lote foi importado ainda
      if (!loteAtivo) {
        return res.status(200).json({
          status: 'success',
          data: {
            lote: null,
            lotes: [],
            registros: [],
            kpis: {
              total: 0,
              novas_falhas: 0,
              recorrentes: 0,
              pendentes: 0,
              bateria_baixa: 0
            },
            pagination: {
              total: 0,
              page: 1,
              limit: Number(limit) || 20,
              totalPages: 1
            },
            filtros_disponiveis: {
              ufs: [],
              unidades: [],
              tipos_veiculo: []
            }
          }
        });
      }

      // 2. Metadados estáticos do lote (em cache: UFs, unidades, tipos e IDs de bateria baixa)
      // Evita ler milhares de registros da tabela a cada troca de página ou debounce de busca
      const loteMeta = await getOrComputeLoteStaticMeta(prisma, loteAtivo.id);

      // 3. Montar filtro Where
      const where = { lote_id: loteAtivo.id };

      if (uf && uf !== 'TODOS') {
        where.uf = String(uf).trim().toUpperCase();
      }

      if (unidade && unidade !== 'TODAS') {
        where.unidade = String(unidade).trim();
      }

      if (tipo_veiculo && tipo_veiculo !== 'TODOS') {
        where.tipo_veiculo = { equals: String(tipo_veiculo).trim(), mode: 'insensitive' };
      }

      if (status && status !== 'TODOS') {
        where.status_tratativa = String(status).trim();
      }

      if (tipo_falha && tipo_falha !== 'TODOS') {
        where.tipo_falha = String(tipo_falha).trim().toUpperCase();
      }

      if (busca && String(busca).trim().length > 0) {
        const termoLimpo = normalizePlate(busca);
        where.placa = { contains: termoLimpo, mode: 'insensitive' };
      }

      if (bateria_baixa === 'true' || bateria_baixa === '1' || bateria_baixa === true) {
        where.id = { in: loteMeta.idsBateriaBaixa };
      }

      // 4. Paginação
      const numPage = Math.max(1, parseInt(page, 10) || 1);
      const isUnlimited = limit === 'all' || limit === '5000' || limit === 'all_active';
      const numLimit = isUnlimited ? 5000 : Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const skip = isUnlimited ? 0 : (numPage - 1) * numLimit;

      // 5. Ordenação
      let orderBy = { unidade: 'asc' };
      const dir = String(sort_dir).toLowerCase() === 'desc' ? 'desc' : 'asc';
      if (sort_by === 'placa') orderBy = { placa: dir };
      else if (sort_by === 'ultima_transmissao') orderBy = { ultima_transmissao: dir };
      else if (sort_by === 'tipo_falha') orderBy = { tipo_falha: dir };
      else if (sort_by === 'status_tratativa') orderBy = { status_tratativa: dir };
      else orderBy = { unidade: dir };

      // 6. Consultas paralelas ultra-leves: registros paginados, total filtrado, seletor de lotes e contagem de pendentes
      const [registros, totalFiltrado, lotesDisponiveis, countPendentes] = await Promise.all([
        prisma.falhas_registros.findMany({
          where,
          skip,
          take: numLimit,
          orderBy
        }),
        prisma.falhas_registros.count({ where }),
        prisma.falhas_lotes.findMany({
          orderBy: { data_extracao: 'desc' },
          take: 10,
          select: {
            id: true,
            data_extracao: true,
            descricao: true,
            total_veiculos: true,
            novas_falhas: true,
            recorrentes: true,
            criado_em: true
          }
        }),
        prisma.falhas_registros.count({
          where: { lote_id: loteAtivo.id, status_tratativa: 'Pendente de Contato' }
        })
      ]);

      const totalPages = Math.ceil(totalFiltrado / numLimit) || 1;
      const totalVeiculosLote = loteAtivo.total_veiculos !== undefined && loteAtivo.total_veiculos !== null
        ? loteAtivo.total_veiculos
        : totalFiltrado;

      res.status(200).json({
        status: 'success',
        data: {
          lote: loteAtivo,
          lotes: lotesDisponiveis,
          registros,
          kpis: {
            total: totalVeiculosLote,
            novas_falhas: loteAtivo.novas_falhas ?? 0,
            recorrentes: loteAtivo.recorrentes ?? 0,
            pendentes: countPendentes,
            bateria_baixa: loteMeta.totalBateriaBaixa
          },
          pagination: {
            total: totalFiltrado,
            page: numPage,
            limit: numLimit,
            totalPages
          },
          filtros_disponiveis: loteMeta.filtros_disponiveis
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 3. IMPORTAR PLANILHA DE FALHAS (COM COMPARAÇÃO HISTÓRICA E RETENÇÃO DE 4 DATAS)
  // =========================================================================
  router.post('/falhas/importar', async (req, res, next) => {
    try {
      const input = importarFalhasSchema.parse(req.body);
      const dataExtracao = input.data_extracao; // Date UTC
      const dataExtracaoStr = dataExtracao.toISOString().split('T')[0];

      // 1. Identificar se já existe um lote para essa mesma data
      const loteMesmoDia = await prisma.falhas_lotes.findFirst({
        where: {
          data_extracao: {
            gte: new Date(Date.UTC(dataExtracao.getUTCFullYear(), dataExtracao.getUTCMonth(), dataExtracao.getUTCDate())),
            lt: new Date(Date.UTC(dataExtracao.getUTCFullYear(), dataExtracao.getUTCMonth(), dataExtracao.getUTCDate() + 1))
          }
        }
      });

      // 2. Buscar o lote imediatamente anterior (mais recente antes desta data) com suas tratativas
      const loteAnterior = await prisma.falhas_lotes.findFirst({
        where: {
          data_extracao: {
            lt: new Date(Date.UTC(dataExtracao.getUTCFullYear(), dataExtracao.getUTCMonth(), dataExtracao.getUTCDate()))
          }
        },
        orderBy: { data_extracao: 'desc' },
        include: {
          registros: {
            select: {
              placa: true,
              status_tratativa: true,
              ordem_servico: true,
              data_contato: true
            }
          }
        }
      });

      // Mapeamento das falhas do lote anterior para cálculo de recorrência e herança de O.S./tratativa
      const mapaAnterior = new Map(
        (loteAnterior?.registros || []).map(r => [normalizePlate(r.placa), r])
      );

      // 3. Coletar todas as placas únicas do arquivo para cruzar com a base da Frota (tabela instalacoes)
      const placasUnicas = new Set();
      for (const reg of input.registros) {
        const placaLimpa = normalizePlate(reg.placa);
        if (placaLimpa) placasUnicas.add(placaLimpa);
      }

      // Consulta em lote na base de veículos da Wiki (equivalente à aba "Fonte" do Google Sheets)
      const veiculosCadastrados = await prisma.instalacoes.findMany({
        where: {
          placa: { in: Array.from(placasUnicas) }
        },
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        }
      });

      const mapaFrota = new Map(
        veiculosCadastrados.map(v => [normalizePlate(v.placa), v])
      );

      // 4. Classificar cada registro: "FALHA RECORRENTE" vs "NOVA FALHA", herdando O.S. e preenchendo Unidade/UF/Tipo
      let countNovas = 0;
      let countRecorrentes = 0;
      const mapaRegistros = new Map();

      for (const reg of input.registros) {
        const placaLimpa = normalizePlate(reg.placa);
        if (!placaLimpa) continue;

        // Dados do veículo cadastrado na frota
        const frota = mapaFrota.get(placaLimpa);

        // Se o usuário optou por descartar placas que não são do cliente/frota
        if (input.ignorar_nao_cadastradas && !frota) {
          continue;
        }

        const unidadeCalculada = frota?.unidades_clientes?.nome_unidade || reg.unidade || 'Não informada';
        const ufCalculada = frota?.unidades_clientes?.uf || reg.uf || null;
        const tipoVeiculoCalculado = frota?.modelos_rastreadores?.tipo_veiculo || reg.tipo_veiculo || null;

        // Dados da extração anterior (se reincidente)
        const falhaAnterior = mapaAnterior.get(placaLimpa);
        const isRecorrente = Boolean(falhaAnterior);
        const tipoFalha = isRecorrente ? 'FALHA RECORRENTE' : 'NOVA FALHA';

        // Herda tratativa, O.S. e data de contato da semana anterior como no Google Sheets
        const statusTratativa = isRecorrente
          ? (falhaAnterior.status_tratativa || 'Pendente de Contato')
          : 'Pendente de Contato';
        const ordemServico = isRecorrente
          ? (falhaAnterior.ordem_servico || null)
          : null;
        const dataContato = isRecorrente
          ? (falhaAnterior.data_contato || null)
          : null;

        mapaRegistros.set(placaLimpa, {
          placa: placaLimpa,
          unidade: unidadeCalculada,
          uf: ufCalculada ? ufCalculada.toUpperCase() : null,
          tipo_veiculo: tipoVeiculoCalculado,
          modulo: reg.modulo || frota?.modulo || null,
          ultima_transmissao: reg.ultima_transmissao || null,
          nivel_bateria: reg.nivel_bateria || null,
          tipo_falha: tipoFalha,
          status_tratativa: statusTratativa,
          ordem_servico: ordemServico,
          data_contato: dataContato,
          observacao: reg.observacao || null
        });
      }

      for (const reg of mapaRegistros.values()) {
        if (reg.tipo_falha === 'NOVA FALHA') countNovas++;
        else countRecorrentes++;
      }

      const totalProcessados = mapaRegistros.size;

      // 4. Executar transação: criar/atualizar lote + inserir registros + aplicar retenção de 4 datas
      const resultadoLote = await prisma.$transaction(async (tx) => {
        let loteId;

        if (loteMesmoDia) {
          // Sobrescreve: remove registros antigos do mesmo dia
          await tx.falhas_registros.deleteMany({
            where: { lote_id: loteMesmoDia.id }
          });

          const loteAtualizado = await tx.falhas_lotes.update({
            where: { id: loteMesmoDia.id },
            data: {
              descricao: input.descricao || `Extração de ${dataExtracaoStr}`,
              total_veiculos: totalProcessados,
              novas_falhas: countNovas,
              recorrentes: countRecorrentes
            }
          });
          loteId = loteAtualizado.id;
        } else {
          // Cria novo lote
          const novoLote = await tx.falhas_lotes.create({
            data: {
              data_extracao: dataExtracao,
              descricao: input.descricao || `Extração de ${dataExtracaoStr}`,
              total_veiculos: totalProcessados,
              novas_falhas: countNovas,
              recorrentes: countRecorrentes
            }
          });
          loteId = novoLote.id;
        }

        // Inserir registros em massa associados ao lote
        const registrosParaInserir = Array.from(mapaRegistros.values()).map(r => ({
          ...r,
          lote_id: loteId
        }));

        if (registrosParaInserir.length > 0) {
          // Inserção em fatias de 500 para não exceder limites de 65.535 parâmetros do PostgreSQL
          const CHUNK_SIZE = 500;
          for (let i = 0; i < registrosParaInserir.length; i += CHUNK_SIZE) {
            const chunk = registrosParaInserir.slice(i, i + CHUNK_SIZE);
            await tx.falhas_registros.createMany({
              data: chunk
            });
          }
        }

        // 5. REGRA DE RETENÇÃO DE 4 DATAS:
        // Busca todos os lotes ordenados por data decrescente
        const todosLotes = await tx.falhas_lotes.findMany({
          orderBy: { data_extracao: 'desc' },
          select: { id: true, data_extracao: true }
        });

        // Se houver mais de 4 datas, exclui as excedentes mais antigas
        if (todosLotes.length > 4) {
          const lotesParaExcluir = todosLotes.slice(4);
          const idsExcluir = lotesParaExcluir.map(l => l.id);

          await tx.falhas_lotes.deleteMany({
            where: { id: { in: idsExcluir } }
          });
        }

        return tx.falhas_lotes.findUnique({
          where: { id: loteId }
        });
      }, {
        maxWait: 10000,
        timeout: 30000
      });

      // Invalida cache de metadados estáticos do lote importado
      clearLoteStaticCache(resultadoLote?.id);

      recordAuditEvent({
        action: 'IMPORTAR_FALHAS',
        performedBy: req.user,
        target: { type: 'falhas_lotes', id: resultadoLote?.id, data_extracao: dataExtracaoStr },
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        details: {
          total_veiculos: totalProcessados,
          novas_falhas: countNovas,
          falhas_recorrentes: countRecorrentes
        }
      });

      res.status(200).json({
        status: 'success',
        message: loteMesmoDia 
          ? `Lote de ${dataExtracaoStr} atualizado com sucesso (${totalProcessados} veículos).`
          : `Nova extração de ${dataExtracaoStr} importada com sucesso (${totalProcessados} veículos).`,
        data: {
          lote: resultadoLote,
          comparacao_anterior: loteAnterior ? {
            data_lote_anterior: loteAnterior.data_extracao,
            total_anterior: loteAnterior.total_veiculos
          } : null,
          resumo: {
            total_veiculos: totalProcessados,
            novas_falhas: countNovas,
            falhas_recorrentes: countRecorrentes
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4. ATUALIZAR STATUS DE TRATATIVA / O.S. DE UM REGISTRO
  // =========================================================================
  router.put('/falhas/registros/:id', async (req, res, next) => {
    try {
      const id = uuidParamSchema.parse(req.params.id);
      const input = updateRegistroSchema.parse(req.body);

      const registro = await prisma.falhas_registros.update({
        where: { id },
        data: {
          ...(input.status_tratativa !== undefined && { status_tratativa: input.status_tratativa }),
          ...(input.ordem_servico !== undefined && { ordem_servico: input.ordem_servico }),
          ...(input.data_contato !== undefined && { data_contato: input.data_contato }),
          ...(input.observacao !== undefined && { observacao: input.observacao })
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Tratativa atualizada com sucesso.',
        data: { registro }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4.5 BUSCAR TODAS AS PLACAS DE UMA UNIDADE NO LOTE ATIVO (TRATATIVA EM MASSA)
  // =========================================================================
  router.get('/falhas/placas-unidade', async (req, res, next) => {
    try {
      const { lote_id, unidade } = req.query;
      if (!unidade || String(unidade).trim().length === 0) {
        return res.status(400).json({ status: 'error', message: 'Unidade é obrigatória.' });
      }

      let loteAtivoId = lote_id;
      if (!loteAtivoId || loteAtivoId === 'latest') {
        const lote = await prisma.falhas_lotes.findFirst({
          orderBy: { data_extracao: 'desc' },
          select: { id: true }
        });
        if (!lote) return res.status(200).json({ status: 'success', data: [] });
        loteAtivoId = lote.id;
      }

      const registros = await prisma.falhas_registros.findMany({
        where: {
          lote_id: loteAtivoId,
          unidade: String(unidade).trim()
        },
        orderBy: { placa: 'asc' },
        select: {
          id: true,
          placa: true,
          unidade: true,
          uf: true,
          tipo_veiculo: true,
          modulo: true,
          status_tratativa: true,
          ultima_transmissao: true,
          nivel_bateria: true,
          ordem_servico: true,
          data_contato: true
        }
      });

      res.status(200).json({
        status: 'success',
        data: registros
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4.6 ATUALIZAR STATUS DE TRATATIVA EM MASSA (MÚLTIPLOS VEÍCULOS)
  // =========================================================================
  router.put('/falhas/registros-massa', async (req, res, next) => {
    try {
      const input = updateMassaSchema.parse(req.body);
      const updateData = {
        status_tratativa: input.status_tratativa
      };
      if (input.data_contato !== undefined) {
        updateData.data_contato = input.data_contato;
      }
      if (input.observacao !== undefined) {
        updateData.observacao = input.observacao;
      }

      const resultado = await prisma.falhas_registros.updateMany({
        where: { id: { in: input.ids } },
        data: updateData
      });

      recordAuditEvent({
        action: 'ATUALIZAR_TRATATIVA_MASSA',
        performedBy: req.user,
        target: { type: 'falhas_registros', count: resultado.count },
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        details: {
          total_afetados: resultado.count,
          status_tratativa: input.status_tratativa,
          data_contato: input.data_contato
        }
      });

      res.status(200).json({
        status: 'success',
        message: `${resultado.count} veículo(s) atualizado(s) com sucesso.`,
        data: { count: resultado.count }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4.7 REGISTRAR CONTATO POR UNIDADE (SELETIVO: APENAS PENDENTES MUDAM)
  // =========================================================================
  router.post('/falhas/contato-unidade', async (req, res, next) => {
    try {
      const input = contatoUnidadeSchema.parse(req.body);
      const hoje = new Date();

      // 1. Atualizar exclusivamente os registros 'Pendente de Contato' para 'Aguardando Retorno'
      const atualizadosPendentes = await prisma.falhas_registros.updateMany({
        where: {
          lote_id: input.lote_id,
          unidade: input.unidade,
          status_tratativa: 'Pendente de Contato'
        },
        data: {
          status_tratativa: 'Aguardando Retorno',
          data_contato: hoje,
          ...(input.observacao ? { observacao: input.observacao } : {})
        }
      });

      // 2. Veículos que já tinham outra tratativa prévia (ex: Oficina, Parado, etc.):
      // Preservam estritamente sua tratativa original, registrando apenas a nova data_contato
      const mantidosTratativa = await prisma.falhas_registros.updateMany({
        where: {
          lote_id: input.lote_id,
          unidade: input.unidade,
          status_tratativa: { not: 'Pendente de Contato' }
        },
        data: {
          data_contato: hoje
        }
      });

      recordAuditEvent({
        action: 'REGISTRAR_CONTATO_UNIDADE',
        performedBy: req.user,
        target: { type: 'unidade', nome: input.unidade, lote_id: input.lote_id },
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        details: {
          pendentes_atualizados: atualizadosPendentes.count,
          tratativas_mantidas: mantidosTratativa.count
        }
      });

      res.status(200).json({
        status: 'success',
        message: `Contato registrado para a unidade ${input.unidade}.`,
        data: {
          pendentes_atualizados: atualizadosPendentes.count,
          tratativas_mantidas: mantidosTratativa.count
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4.8 REGISTRAR CONTATO MULTI-UNIDADE (SELETIVO: APENAS PENDENTES MUDAM)
  // =========================================================================
  router.post('/falhas/contato-multi-unidade', async (req, res, next) => {
    try {
      const input = contatoMultiUnidadeSchema.parse(req.body);
      const hoje = new Date();

      // 1. Atualizar exclusivamente os registros 'Pendente de Contato' para 'Aguardando Retorno'
      // para todas as unidades especificadas pertencentes ao lote ativo
      const atualizadosPendentes = await prisma.falhas_registros.updateMany({
        where: {
          lote_id: input.lote_id,
          unidade: { in: input.unidades },
          status_tratativa: 'Pendente de Contato'
        },
        data: {
          status_tratativa: 'Aguardando Retorno',
          data_contato: hoje,
          ...(input.observacao ? { observacao: input.observacao } : {})
        }
      });

      // 2. Veículos com tratativas prévias mantêm sua tratativa, apenas atualizam data_contato
      const mantidosTratativa = await prisma.falhas_registros.updateMany({
        where: {
          lote_id: input.lote_id,
          unidade: { in: input.unidades },
          status_tratativa: { not: 'Pendente de Contato' }
        },
        data: {
          data_contato: hoje
        }
      });

      recordAuditEvent({
        action: 'REGISTRAR_CONTATO_MULTI_UNIDADE',
        performedBy: req.user,
        target: { type: 'unidades_multi', total_unidades: input.unidades.length, lote_id: input.lote_id },
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        details: {
          unidades: input.unidades,
          contato_nome: input.contato_nome,
          contato_telefone: input.contato_telefone,
          pendentes_atualizados: atualizadosPendentes.count,
          tratativas_mantidas: mantidosTratativa.count
        }
      });

      res.status(200).json({
        status: 'success',
        message: `Contato multi-unidade registrado para ${input.unidades.length} unidade(s).`,
        data: {
          unidades: input.unidades,
          pendentes_atualizados: atualizadosPendentes.count,
          tratativas_mantidas: mantidosTratativa.count
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 5. EXCLUIR UM LOTE DE EXTRAÇÃO (ADMIN / SUPERVISOR)
  // =========================================================================
  router.delete('/falhas/lotes/:id', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const id = uuidParamSchema.parse(req.params.id);

      await prisma.falhas_lotes.delete({
        where: { id }
      });
      clearLoteStaticCache(id);

      recordAuditEvent({
        action: 'DELETE_LOTE_FALHAS',
        performedBy: req.user,
        target: { type: 'falhas_lotes', id },
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        details: null
      });

      res.status(200).json({
        status: 'success',
        message: 'Lote de falhas excluído com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
