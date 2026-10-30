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
  usuario_contato: z.string().trim().max(150).nullable().optional(),
  observacao: z.string().trim().nullable().optional()
}).strict();

const updateMassaSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um veículo.'),
  status_tratativa: z.string().trim().min(1).max(100),
  data_contato: z.union([z.string(), z.date()]).nullable().optional().transform(parseDateOnly),
  usuario_contato: z.string().trim().max(150).nullable().optional(),
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
let lotesDisponiveisCache = { data: null, expiresAt: 0 };

export const clearLoteStaticCache = (loteId = null) => {
  if (loteId) loteStaticCache.delete(loteId);
  else loteStaticCache.clear();
  lotesDisponiveisCache = { data: null, expiresAt: 0 };
};

const getCachedLotesDisponiveis = async (prisma) => {
  const now = Date.now();
  if (lotesDisponiveisCache.data && lotesDisponiveisCache.expiresAt > now) {
    return lotesDisponiveisCache.data;
  }
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
  lotesDisponiveisCache = { data: lotes, expiresAt: now + 5 * 60 * 1000 };
  return lotes;
};

const getOrComputeLoteStaticMeta = async (prisma, loteId) => {
  if (loteStaticCache.has(loteId)) {
    return loteStaticCache.get(loteId);
  }

  const registros = await prisma.falhas_registros.findMany({
    where: { lote_id: loteId },
    select: {
      id: true,
      placa: true,
      uf: true,
      unidade: true,
      tipo_veiculo: true,
      tipo_falha: true,
      status_tratativa: true,
      nivel_bateria: true
    }
  });

  const ufsSet = new Set();
  const unidadesSet = new Set();
  const tiposSet = new Set();
  const idsBateriaBaixa = [];
  const registrosIndex = [];

  for (const reg of registros) {
    const ufNorm = reg.uf ? reg.uf.trim().toUpperCase() : '';
    const unidadeNorm = reg.unidade ? reg.unidade.trim() : '';
    const tipoVeiculoNorm = reg.tipo_veiculo ? reg.tipo_veiculo.trim() : '';
    const batBaixa = isBateriaBaixa(reg.nivel_bateria);

    if (ufNorm) ufsSet.add(ufNorm);
    if (unidadeNorm) unidadesSet.add(unidadeNorm);
    if (tipoVeiculoNorm) tiposSet.add(tipoVeiculoNorm);
    if (batBaixa) {
      idsBateriaBaixa.push(reg.id);
    }

    registrosIndex.push({
      id: reg.id,
      placaNorm: normalizePlate(reg.placa),
      uf: ufNorm,
      unidade: unidadeNorm,
      tipoVeiculoLower: tipoVeiculoNorm.toLowerCase(),
      tipoFalha: reg.tipo_falha ? String(reg.tipo_falha).trim().toUpperCase() : '',
      statusTratativa: reg.status_tratativa ? String(reg.status_tratativa).trim() : '',
      bateriaBaixa: batBaixa
    });
  }

  const meta = {
    filtros_disponiveis: {
      ufs: Array.from(ufsSet).sort(),
      unidades: Array.from(unidadesSet).sort(),
      tipos_veiculo: Array.from(tiposSet).sort()
    },
    idsBateriaBaixa,
    totalBateriaBaixa: idsBateriaBaixa.length,
    registrosIndex
  };

  loteStaticCache.set(loteId, meta);
  return meta;
};

export default function createFalhasRouter(prisma, protect) {
  const router = express.Router();
  clearLoteStaticCache();

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
          status_tratativa: true,
          data_contato: true,
          usuario_contato: true
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
  // =========================================================================
  // 1.8 PAINEL ANALÍTICO DE FALHAS (DASHBOARD ANALÍTICO GESTÃO SOLAR)
  // =========================================================================
  router.get('/falhas/analytics', async (req, res, next) => {
    try {
      const { uf, unidade } = req.query;
      const ufFilter = uf && uf !== 'TODOS' ? String(uf).trim().toUpperCase() : null;
      const unidadeFilter = unidade && unidade !== 'TODAS' ? String(unidade).trim() : null;

      // Helpers de normalização
      const isFalhaRealTratativa = (status) => {
        const st = String(status || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
          .toLowerCase();
        return (
          st === 'aguardando tecnico' ||
          st === 'agendado manutencao' ||
          st === 'agendando manutencao'
        );
      };

      const normalizarCategoriaVeiculo = (rawTipo) => {
        const t = String(rawTipo || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
          .toUpperCase();
        if (t.includes('CAMINH') || t.includes('PESAD') || t.includes('CARRETA') || t === 'CAM') return 'CAM';
        if (t.includes('MOTO') || t === 'MOT') return 'MOT';
        if (t.includes('VIDEO') || t.includes('CAMER') || t.includes('DASH') || t === 'VID') return 'VID';
        return 'OUTROS';
      };

      const classificarFaixaAgendamento = (pct) => {
        if (pct <= 20) return 'critico';    // 0% - 20%: Vermelho forte
        if (pct <= 50) return 'alerta';     // 21% - 50%: Vermelho mais claro
        if (pct <= 70) return 'atencao';    // 51% - 70%: Amarelo
        return 'saudavel';                  // 71% - 100%: Verde
      };

      // 1. Buscar sempre o lote mais recente (última data de extração)
      const loteMaisRecente = await prisma.falhas_lotes.findFirst({
        orderBy: { data_extracao: 'desc' }
      });

      // Buscar total de veículos da frota (tabela instalacoes) e mapa de tipo_veiculo/unidade por placa
      const instalacoesWhere = {};
      if (ufFilter || unidadeFilter) {
        instalacoesWhere.unidades_clientes = {};
        if (ufFilter) instalacoesWhere.unidades_clientes.uf = ufFilter;
        if (unidadeFilter) instalacoesWhere.unidades_clientes.nome_unidade = unidadeFilter;
      }

      const [totalFrotaFiltrada, todasInstalacoesMeta] = await Promise.all([
        prisma.instalacoes.count({ where: instalacoesWhere }),
        prisma.instalacoes.findMany({
          select: {
            placa: true,
            modelos_rastreadores: { select: { tipo_veiculo: true } },
            unidades_clientes: { select: { nome_unidade: true, uf: true } }
          }
        })
      ]);

      const frotaPorPlaca = new Map();
      const ufsFrotaSet = new Set();
      const unidadesFrotaSet = new Set();
      for (const inst of todasInstalacoesMeta) {
        const pNorm = normalizePlate(inst.placa);
        if (pNorm) frotaPorPlaca.set(pNorm, inst);
        const instUf = inst.unidades_clientes?.uf?.trim()?.toUpperCase();
        const instUnidade = inst.unidades_clientes?.nome_unidade?.trim();
        if (instUf) ufsFrotaSet.add(instUf);
        if (instUnidade && (!ufFilter || instUf === ufFilter)) {
          unidadesFrotaSet.add(instUnidade);
        }
      }

      if (!loteMaisRecente) {
        return res.status(200).json({
          status: 'success',
          data: {
            lote: null,
            filtros_disponiveis: {
              ufs: Array.from(ufsFrotaSet).sort(),
              unidades: Array.from(unidadesFrotaSet).sort()
            },
            kpis: {
              total_falhas: 0,
              falhas_reais: 0,
              total_frota: totalFrotaFiltrada,
              saude_frota_pct: 100,
              proporcao_falha_real_pct: 0,
              bateria_critica: { total: 0, CAM: 0, MOT: 0, VID: 0, OUTROS: 0 }
            },
            cobertura_agendamentos: {
              total_falhas_reais: 0,
              presentes_em_agendamentos: 0,
              confirmados_agendado: 0,
              presentes_outro_status: 0,
              ausentes_em_agendamentos: 0,
              pendentes_agendar: 0,
              pct_agendado: 100,
              pct_pendente: 0,
              faixa_cor: 'saudavel',
              placas_detalhe: []
            },
            top_5_unidades: [],
            distribuicao_tratativas: []
          }
        });
      }

      // 2. Buscar todos os registros do último lote
      const registrosLote = await prisma.falhas_registros.findMany({
        where: { lote_id: loteMaisRecente.id },
        select: {
          id: true,
          placa: true,
          unidade: true,
          uf: true,
          tipo_veiculo: true,
          modulo: true,
          ultima_transmissao: true,
          nivel_bateria: true,
          tipo_falha: true,
          status_tratativa: true,
          ordem_servico: true,
          data_contato: true,
          observacao: true
        }
      });

      // Enriquecer registros com dados da tabela instalacoes caso falte UF/Unidade/Tipo
      const ufsSet = new Set(ufsFrotaSet);
      const unidadesSet = new Set(unidadesFrotaSet);

      const registrosEnriquecidos = registrosLote.map((r) => {
        const pNorm = normalizePlate(r.placa);
        const inst = frotaPorPlaca.get(pNorm);
        const ufFinal = (r.uf || inst?.unidades_clientes?.uf || '').trim().toUpperCase();
        const unidadeFinal = (r.unidade || inst?.unidades_clientes?.nome_unidade || 'Não informada').trim();
        const tipoBruto = r.tipo_veiculo || inst?.modelos_rastreadores?.tipo_veiculo || '';
        const categoriaVeiculo = normalizarCategoriaVeiculo(tipoBruto);
        const batCritica = isBateriaBaixa(r.nivel_bateria);
        const falhaReal = isFalhaRealTratativa(r.status_tratativa);

        if (ufFinal) ufsSet.add(ufFinal);
        if (unidadeFinal && (!ufFilter || ufFinal === ufFilter)) {
          unidadesSet.add(unidadeFinal);
        }

        return {
          ...r,
          placaNorm: pNorm,
          ufFinal,
          unidadeFinal,
          tipoBruto,
          categoriaVeiculo,
          batCritica,
          falhaReal
        };
      });

      // 3. Filtrar registros conforme UF e Unidade selecionadas para os KPIs
      const registrosFiltrados = registrosEnriquecidos.filter((r) => {
        if (ufFilter && r.ufFinal !== ufFilter) return false;
        if (unidadeFilter && r.unidadeFinal !== unidadeFilter) return false;
        return true;
      });

      // 4. Calcular Super KPIs
      const totalFalhas = registrosFiltrados.length;
      const registrosFalhasReais = registrosFiltrados.filter((r) => r.falhaReal);
      const falhasReaisCount = registrosFalhasReais.length;

      const proporcaoFalhaRealNum = totalFrotaFiltrada > 0
        ? (falhasReaisCount / totalFrotaFiltrada) * 100
        : 0;
      const saudeFrotaNum = totalFrotaFiltrada > 0
        ? Math.max(0, 100 - proporcaoFalhaRealNum)
        : 100;

      const bateriaCriticaStats = { total: 0, CAM: 0, MOT: 0, VID: 0, OUTROS: 0 };
      const tratativasMap = new Map();

      for (const r of registrosFiltrados) {
        if (r.batCritica) {
          bateriaCriticaStats.total++;
          if (r.categoriaVeiculo === 'CAM') bateriaCriticaStats.CAM++;
          else if (r.categoriaVeiculo === 'MOT') bateriaCriticaStats.MOT++;
          else if (r.categoriaVeiculo === 'VID') bateriaCriticaStats.VID++;
          else bateriaCriticaStats.OUTROS++;
        }

        const st = r.status_tratativa || 'Pendente de Contato';
        tratativasMap.set(st, (tratativasMap.get(st) || 0) + 1);
      }

      // 5. Top 5 Unidades com maior número de falhas (Opção A: Eixo X = Top 5 Unidades)
      // Se houver filtro de UF, ranqueia as Top 5 daquela UF; se houver filtro de unidade única, mantém a visão da UF/Brasil para comparação
      const baseTopUnidades = ufFilter
        ? registrosEnriquecidos.filter((r) => r.ufFinal === ufFilter)
        : registrosEnriquecidos;

      const unidadesAgregadas = new Map();
      for (const r of baseTopUnidades) {
        const key = r.unidadeFinal || 'Não informada';
        if (!unidadesAgregadas.has(key)) {
          unidadesAgregadas.set(key, {
            unidade: key,
            uf: r.ufFinal || '',
            total_falhas: 0,
            falhas_reais: 0,
            bateria_critica: 0
          });
        }
        const entry = unidadesAgregadas.get(key);
        entry.total_falhas++;
        if (r.falhaReal) entry.falhas_reais++;
        if (r.batCritica) entry.bateria_critica++;
      }

      const top5Unidades = Array.from(unidadesAgregadas.values())
        .sort((a, b) => {
          if (b.total_falhas !== a.total_falhas) return b.total_falhas - a.total_falhas;
          return b.falhas_reais - a.falhas_reais;
        })
        .slice(0, 5);

      // 6. Cruzamento de Falhas Reais x Tabela Agendamentos
      // Regra estrita: se uma placa aparecer mais de uma vez em agendamentos, optar SEMPRE pela versão mais recente criada (criado_em DESC)
      const placasReaisBusca = new Set();
      for (const r of registrosFalhasReais) {
        if (r.placa) placasReaisBusca.add(r.placa.trim());
        if (r.placaNorm) placasReaisBusca.add(r.placaNorm);
      }

      const ultimoAgendamentoPorPlaca = new Map();
      if (placasReaisBusca.size > 0 && prisma.agendamentos) {
        const agendamentosDasFalhasReais = await prisma.agendamentos.findMany({
          where: {
            placa: { in: Array.from(placasReaisBusca) }
          },
          select: {
            id: true,
            placa: true,
            data_agendamento: true,
            status: true,
            servico: true,
            tipo_tecnico: true,
            nome_tecnico: true,
            numero_os: true,
            criado_em: true,
            atualizado_em: true
          },
          orderBy: [
            { criado_em: 'desc' },
            { atualizado_em: 'desc' }
          ]
        });

        for (const ag of agendamentosDasFalhasReais) {
          const pNorm = normalizePlate(ag.placa);
          // Como está ordenado por criado_em DESC, o primeiro registro encontrado para a placa é garantidamente o último criado
          if (pNorm && !ultimoAgendamentoPorPlaca.has(pNorm)) {
            ultimoAgendamentoPorPlaca.set(pNorm, ag);
          }
        }
      }

      let presentesEmAgendamentos = 0;
      let confirmadosAgendado = 0;
      let presentesOutroStatus = 0;
      let ausentesEmAgendamentos = 0;
      const placasDetalhe = [];

      for (const r of registrosFalhasReais) {
        const ultimoAg = ultimoAgendamentoPorPlaca.get(r.placaNorm) || null;
        const statusAg = ultimoAg?.status ? String(ultimoAg.status).trim() : null;
        const isStatusAgendado = statusAg !== null && statusAg.toLowerCase() === 'agendado';

        let situacaoAgendamento = 'SEM_REGISTRO';
        if (ultimoAg) {
          presentesEmAgendamentos++;
          if (isStatusAgendado) {
            confirmadosAgendado++;
            situacaoAgendamento = 'AGENDADO';
          } else {
            presentesOutroStatus++;
            situacaoAgendamento = 'OUTRO_STATUS';
          }
        } else {
          ausentesEmAgendamentos++;
        }

        placasDetalhe.push({
          id: r.id,
          placa: r.placa,
          unidade: r.unidadeFinal,
          uf: r.ufFinal,
          tipo_veiculo: r.tipoBruto || r.categoriaVeiculo,
          categoria_veiculo: r.categoriaVeiculo,
          status_tratativa: r.status_tratativa,
          nivel_bateria: r.nivel_bateria,
          bateria_critica: r.batCritica,
          ordem_servico: r.ordem_servico || ultimoAg?.numero_os || null,
          ultima_transmissao: r.ultima_transmissao,
          situacao_agendamento: situacaoAgendamento,
          ultimo_agendamento: ultimoAg ? {
            id: ultimoAg.id,
            status: ultimoAg.status,
            data_agendamento: ultimoAg.data_agendamento,
            servico: ultimoAg.servico,
            nome_tecnico: ultimoAg.nome_tecnico,
            tipo_tecnico: ultimoAg.tipo_tecnico,
            numero_os: ultimoAg.numero_os,
            criado_em: ultimoAg.criado_em
          } : null
        });
      }

      const pendentesAgendar = Math.max(0, falhasReaisCount - confirmadosAgendado);
      const pctAgendado = falhasReaisCount > 0
        ? Number(((confirmadosAgendado / falhasReaisCount) * 100).toFixed(1))
        : 100;
      const pctPendente = falhasReaisCount > 0
        ? Number((100 - pctAgendado).toFixed(1))
        : 0;
      const faixaCor = classificarFaixaAgendamento(pctAgendado);

      const distribuicaoTratativas = Array.from(tratativasMap.entries())
        .map(([status, quantidade]) => ({
          status,
          quantidade,
          percentual: totalFalhas > 0 ? Number(((quantidade / totalFalhas) * 100).toFixed(1)) : 0,
          is_falha_real: isFalhaRealTratativa(status)
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      res.status(200).json({
        status: 'success',
        data: {
          lote: {
            id: loteMaisRecente.id,
            data_extracao: loteMaisRecente.data_extracao,
            descricao: loteMaisRecente.descricao,
            total_veiculos: loteMaisRecente.total_veiculos,
            novas_falhas: loteMaisRecente.novas_falhas,
            recorrentes: loteMaisRecente.recorrentes,
            criado_em: loteMaisRecente.criado_em
          },
          filtros_disponiveis: {
            ufs: Array.from(ufsSet).sort(),
            unidades: Array.from(unidadesSet).sort()
          },
          kpis: {
            total_falhas: totalFalhas,
            falhas_reais: falhasReaisCount,
            total_frota: totalFrotaFiltrada,
            saude_frota_pct: Number(saudeFrotaNum.toFixed(1)),
            proporcao_falha_real_pct: Number(proporcaoFalhaRealNum.toFixed(1)),
            bateria_critica: bateriaCriticaStats
          },
          cobertura_agendamentos: {
            total_falhas_reais: falhasReaisCount,
            presentes_em_agendamentos: presentesEmAgendamentos,
            confirmados_agendado: confirmadosAgendado,
            presentes_outro_status: presentesOutroStatus,
            ausentes_em_agendamentos: ausentesEmAgendamentos,
            pendentes_agendar: pendentesAgendar,
            pct_agendado: pctAgendado,
            pct_pendente: pctPendente,
            faixa_cor: faixaCor,
            placas_detalhe: placasDetalhe
          },
          top_5_unidades: top5Unidades,
          distribuicao_tratativas: distribuicaoTratativas
        }
      });
    } catch (error) {
      next(error);
    }
  });

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

      let statusList = [];
      if (status && (Array.isArray(status) || String(status).trim())) {
        statusList = (Array.isArray(status) ? status : String(status).split(','))
          .map(s => String(s).trim())
          .filter(s => s && s !== 'TODOS');
        if (statusList.length === 1) {
          where.status_tratativa = statusList[0];
        } else if (statusList.length > 1) {
          where.status_tratativa = { in: statusList };
        }
      }

      if (tipo_falha && tipo_falha !== 'TODOS') {
        where.tipo_falha = String(tipo_falha).trim().toUpperCase();
      }

      if (busca && String(busca).trim().length > 0) {
        const termoLimpo = normalizePlate(busca);
        where.placa = { contains: termoLimpo, mode: 'insensitive' };
      }

      const isBateriaBaixaFilterActive = bateria_baixa === 'true' || bateria_baixa === '1' || bateria_baixa === true;
      if (isBateriaBaixaFilterActive) {
        where.id = { in: loteMeta.idsBateriaBaixa };
      }

      const hasActiveFilters = Boolean(
        where.uf ||
        where.unidade ||
        where.tipo_veiculo ||
        where.status_tratativa ||
        where.tipo_falha ||
        where.placa ||
        isBateriaBaixaFilterActive
      );

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

      // 6. Cálculo em memória ultra-rápido (< 0.2ms) para paginação e KPIs dinâmicos
      // Usa o índice leve já em cache no loteMeta para poupar conexões do pool Supabase (PgBouncer)
      const ufFilter = where.uf || null;
      const unidadeFilter = where.unidade || null;
      const tipoVeiculoFilterLower = tipo_veiculo && tipo_veiculo !== 'TODOS'
        ? String(tipo_veiculo).trim().toLowerCase()
        : null;
      const statusSet = statusList.length > 0 ? new Set(statusList) : null;
      const tipoFalhaFilter = where.tipo_falha || null;
      const termoPlacaFilter = busca && String(busca).trim().length > 0
        ? normalizePlate(busca)
        : null;

      let totalFiltrado = 0;
      let kpiNovas = 0;
      let kpiRecorrentes = 0;
      let kpiPendentes = 0;
      let kpiBateriaBaixa = 0;

      for (const item of loteMeta.registrosIndex) {
        if (ufFilter && item.uf !== ufFilter) continue;
        if (unidadeFilter && item.unidade !== unidadeFilter) continue;
        if (tipoVeiculoFilterLower && item.tipoVeiculoLower !== tipoVeiculoFilterLower) continue;
        if (statusSet && !statusSet.has(item.statusTratativa)) continue;
        if (tipoFalhaFilter && item.tipoFalha !== tipoFalhaFilter) continue;
        if (termoPlacaFilter && !item.placaNorm.includes(termoPlacaFilter)) continue;
        if (isBateriaBaixaFilterActive && !item.bateriaBaixa) continue;

        totalFiltrado++;
        if (item.tipoFalha === 'NOVA FALHA') kpiNovas++;
        else if (item.tipoFalha === 'FALHA RECORRENTE') kpiRecorrentes++;
        if (item.statusTratativa === 'Pendente de Contato') kpiPendentes++;
        if (item.bateriaBaixa) kpiBateriaBaixa++;
      }

      const [registros, lotesDisponiveis] = await Promise.all([
        prisma.falhas_registros.findMany({
          where,
          skip,
          take: numLimit,
          orderBy
        }),
        getCachedLotesDisponiveis(prisma)
      ]);

      const kpiTotal = !hasActiveFilters && loteAtivo.total_veiculos !== undefined && loteAtivo.total_veiculos !== null
        ? loteAtivo.total_veiculos
        : totalFiltrado;
      if (!hasActiveFilters) {
        if (loteAtivo.novas_falhas !== undefined && loteAtivo.novas_falhas !== null) {
          kpiNovas = loteAtivo.novas_falhas;
        }
        if (loteAtivo.recorrentes !== undefined && loteAtivo.recorrentes !== null) {
          kpiRecorrentes = loteAtivo.recorrentes;
        }
      }

      // 7. Cruzamento inteligente de agendamentos para as placas da página atual
      const mapaPlacasBusca = new Set();
      registros.forEach(r => {
        if (r.placa) {
          mapaPlacasBusca.add(r.placa.trim());
          mapaPlacasBusca.add(normalizePlate(r.placa));
        }
      });
      const listaPlacas = Array.from(mapaPlacasBusca).filter(Boolean);

      const agendamentosMap = new Map();
      if (prisma.agendamentos && listaPlacas.length > 0) {
        const agendamentosEncontrados = await prisma.agendamentos.findMany({
          where: {
            placa: { in: listaPlacas }
          },
          select: {
            id: true,
            placa: true,
            data_agendamento: true,
            status: true,
            servico: true,
            tipo_tecnico: true,
            nome_tecnico: true,
            numero_os: true,
            criado_em: true
          },
          orderBy: [
            { data_agendamento: 'desc' },
            { criado_em: 'desc' }
          ]
        });

        // Regra de prioridade:
        // Status ativo ('Agendado', 'Aguardando Data', 'Aguardando Técnico') tem precedência sobre status concluído
        const STATUS_ATIVOS = new Set(['Agendado', 'Aguardando Data', 'Aguardando Técnico']);

        agendamentosEncontrados.forEach(ag => {
          const pNorm = normalizePlate(ag.placa);
          const atual = agendamentosMap.get(pNorm);

          if (!atual) {
            agendamentosMap.set(pNorm, ag);
          } else {
            const atualIsAtivo = STATUS_ATIVOS.has(atual.status);
            const novoIsAtivo = STATUS_ATIVOS.has(ag.status);

            if (!atualIsAtivo && novoIsAtivo) {
              agendamentosMap.set(pNorm, ag);
            }
          }
        });
      }

      const registrosComAgendamento = registros.map(r => {
        const pNorm = normalizePlate(r.placa);
        const ag = agendamentosMap.get(pNorm) || null;
        return {
          ...r,
          agendamento: ag ? {
            id: ag.id,
            status: ag.status,
            data_agendamento: ag.data_agendamento,
            servico: ag.servico,
            tipo_tecnico: ag.tipo_tecnico,
            nome_tecnico: ag.nome_tecnico,
            numero_os: ag.numero_os,
            criado_em: ag.criado_em
          } : null
        };
      });

      const totalPages = Math.ceil(totalFiltrado / numLimit) || 1;

      res.status(200).json({
        status: 'success',
        data: {
          lote: loteAtivo,
          lotes: lotesDisponiveis,
          registros: registrosComAgendamento,
          kpis: {
            total: kpiTotal,
            novas_falhas: kpiNovas,
            recorrentes: kpiRecorrentes,
            pendentes: kpiPendentes,
            bateria_baixa: kpiBateriaBaixa
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
          ...(input.usuario_contato !== undefined && { usuario_contato: input.usuario_contato }),
          ...(input.observacao !== undefined && { observacao: input.observacao })
        }
      });
      clearLoteStaticCache(registro?.lote_id);

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
      if (input.usuario_contato !== undefined) {
        updateData.usuario_contato = input.usuario_contato;
      } else if (input.data_contato !== undefined) {
        updateData.usuario_contato = req.user?.name || req.user?.email || null;
      }
      if (input.observacao !== undefined) {
        updateData.observacao = input.observacao;
      }

      const resultado = await prisma.falhas_registros.updateMany({
        where: { id: { in: input.ids } },
        data: updateData
      });
      clearLoteStaticCache();

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
      const nomeUsuario = req.user?.name || req.user?.email || 'Usuário';

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
          usuario_contato: nomeUsuario,
          ...(input.observacao ? { observacao: input.observacao } : {})
        }
      });

      // 2. Veículos que já tinham outra tratativa prévia (ex: Oficina, Parado, etc.):
      // Preservam estritamente sua tratativa original, registrando a nova data_contato e usuario_contato
      const mantidosTratativa = await prisma.falhas_registros.updateMany({
        where: {
          lote_id: input.lote_id,
          unidade: input.unidade,
          status_tratativa: { not: 'Pendente de Contato' }
        },
        data: {
          data_contato: hoje,
          usuario_contato: nomeUsuario
        }
      });
      clearLoteStaticCache(input.lote_id);

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
      const nomeUsuario = req.user?.name || req.user?.email || 'Usuário';

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
          usuario_contato: nomeUsuario,
          ...(input.observacao ? { observacao: input.observacao } : {})
        }
      });

      // 2. Veículos com tratativas prévias mantêm sua tratativa, apenas atualizam data_contato e usuario_contato
      const mantidosTratativa = await prisma.falhas_registros.updateMany({
        where: {
          lote_id: input.lote_id,
          unidade: { in: input.unidades },
          status_tratativa: { not: 'Pendente de Contato' }
        },
        data: {
          data_contato: hoje,
          usuario_contato: nomeUsuario
        }
      });
      clearLoteStaticCache(input.lote_id);

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
