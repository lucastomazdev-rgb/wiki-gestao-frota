import express from 'express';
import { z } from 'zod';
import { restrictToGestaoSolar } from '../middleware/auth.js';

const VALID_SERVICES = ['Retirada', 'Manutenção', 'Instalação', 'Vistoria'];
const VALID_STATUSES = ['Agendado', 'Aguardando Data', 'Aguardando Técnico', 'Realizado', 'Frustrado'];
const VALID_TECH_TYPES = ['CORPVS', 'TERCEIRIZADO'];

const normalizePlate = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
const normalizePhone = (value) => String(value || '').trim();

const createAgendamentoSchema = z.object({
  data_agendamento: z.string().trim().nullable().optional().transform(val => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }),
  placa: z.string().transform(normalizePlate).refine(v => v.length >= 5 && v.length <= 8, 'Placa inválida (deve ter entre 5 e 8 caracteres).'),
  unidade: z.string().trim().max(200).nullable().optional(),
  uf: z.string().trim().max(2).transform(v => v ? v.toUpperCase() : null).nullable().optional(),
  tipo_veiculo: z.string().trim().max(100).nullable().optional(),
  nome_responsavel: z.string().trim().min(2, 'Nome do responsável é obrigatório (mínimo 2 caracteres).').max(200),
  contato_responsavel: z.string().trim().min(10, 'Contato do responsável é obrigatório com DDD.').max(30),
  numero_os: z.string().trim().max(100).nullable().optional(),
  servico: z.enum(VALID_SERVICES, { errorMap: () => ({ message: 'Serviço deve ser Retirada, Manutenção, Instalação ou Vistoria.' }) }),
  tipo_tecnico: z.enum(VALID_TECH_TYPES, { errorMap: () => ({ message: 'Tipo de técnico deve ser CORPVS ou TERCEIRIZADO.' }) }),
  tecnico_id: z.string().uuid('ID do técnico deve ser um UUID válido.'),
  status: z.enum(VALID_STATUSES).default('Agendado'),
  motivo_frustrado: z.string().trim().nullable().optional(),
  observacoes: z.string().trim().nullable().optional()
}).strict();

const updateAgendamentoSchema = createAgendamentoSchema.partial().extend({
  dados_realizado: z.object({
    km_rodado: z.coerce.number().min(0).optional().default(0),
    equipamentos_utilizados: z.array(z.object({
      modelo: z.string().trim().min(1).max(150),
      quantidade: z.coerce.number().int().min(1)
    })).optional().default([]),
    numero_nf: z.string().trim().max(100).nullable().optional()
  }).optional().nullable()
});

const tecnicoCorpvsSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres.').max(200, 'Nome muito longo.')
}).strict();

export default function createAgendamentosRouter(prisma, protect) {
  const router = express.Router();

  // Exige autenticação e permissão de Gestão Solar em todas as rotas de agendamento
  router.use(protect, restrictToGestaoSolar);

  // =========================================================================
  // 1. TÉCNICOS CORPVS (CRUD)
  // =========================================================================

  // Listar técnicos próprios da CORPVS
  router.get('/tecnicos-corpvs', async (req, res, next) => {
    try {
      const tecnicos = await prisma.tecnicos_corpvs.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' }
      });
      res.status(200).json({ status: 'success', data: { tecnicos } });
    } catch (error) {
      next(error);
    }
  });

  // Criar novo técnico CORPVS (persistente para uso futuro)
  router.post('/tecnicos-corpvs', async (req, res, next) => {
    try {
      const input = tecnicoCorpvsSchema.parse(req.body);
      const nomeFormatado = input.nome.replace(/\s+/g, ' ').trim();

      // Upsert ou reaproveitamento caso já exista
      const existente = await prisma.tecnicos_corpvs.findFirst({
        where: { nome: { equals: nomeFormatado, mode: 'insensitive' } }
      });

      if (existente) {
        if (!existente.ativo) {
          const reativado = await prisma.tecnicos_corpvs.update({
            where: { id: existente.id },
            data: { ativo: true }
          });
          return res.status(200).json({
            status: 'success',
            message: 'Técnico reativado com sucesso.',
            data: { tecnico: reativado }
          });
        }
        return res.status(200).json({
          status: 'success',
          message: 'Técnico já cadastrado.',
          data: { tecnico: existente }
        });
      }

      const novo = await prisma.tecnicos_corpvs.create({
        data: {
          nome: nomeFormatado,
          ativo: true
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Técnico CORPVS cadastrado com sucesso!',
        data: { tecnico: novo }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 2. INDICADORES (KPIS)
  // =========================================================================

  router.get('/agendamentos/kpis', async (req, res, next) => {
    try {
      const [total, realizados, agendados, aguardandoData, aguardandoTecnico, frustrados] = await Promise.all([
        prisma.agendamentos.count(),
        prisma.agendamentos.count({ where: { status: 'Realizado' } }),
        prisma.agendamentos.count({ where: { status: 'Agendado' } }),
        prisma.agendamentos.count({ where: { status: 'Aguardando Data' } }),
        prisma.agendamentos.count({ where: { status: 'Aguardando Técnico' } }),
        prisma.agendamentos.count({ where: { status: 'Frustrado' } })
      ]);

      const pendentes = agendados + aguardandoData + aguardandoTecnico;

      res.status(200).json({
        status: 'success',
        data: {
          total,
          realizados,
          pendentes,
          frustrados,
          statusBreakdown: {
            agendados,
            aguardandoData,
            aguardandoTecnico,
            realizados,
            frustrados
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Listar unidades distintas existentes na tabela de agendamentos
  router.get('/agendamentos/unidades', async (req, res, next) => {
    try {
      const registros = await prisma.agendamentos.findMany({
        where: {
          unidade: { not: null }
        },
        select: { unidade: true },
        distinct: ['unidade'],
        orderBy: { unidade: 'asc' }
      });

      const lista = registros
        .map(r => r.unidade?.trim())
        .filter(Boolean)
        .filter((val, idx, self) => self.indexOf(val) === idx);

      res.status(200).json({
        status: 'success',
        data: { unidades: lista }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 3. LISTAGEM DE AGENDAMENTOS (TABELA COM FILTROS & PAGINAÇÃO)
  // =========================================================================

  router.get('/agendamentos', async (req, res, next) => {
    try {
      const {
        busca,
        status,
        servico,
        tipo_tecnico,
        unidade,
        data_inicio,
        data_fim,
        page,
        limit
      } = req.query;

      const where = {};

      if (status && status.trim()) {
        where.status = status.trim();
      }

      if (servico && servico.trim()) {
        where.servico = servico.trim();
      }

      if (tipo_tecnico && tipo_tecnico.trim()) {
        where.tipo_tecnico = tipo_tecnico.trim().toUpperCase();
      }

      if (unidade && unidade.trim()) {
        where.unidade = { equals: unidade.trim(), mode: 'insensitive' };
      }

      if (busca && busca.trim()) {
        const termo = busca.trim();
        where.OR = [
          { placa: { contains: termo.replace(/[^a-zA-Z0-9]/g, ''), mode: 'insensitive' } },
          { nome_responsavel: { contains: termo, mode: 'insensitive' } },
          { contato_responsavel: { contains: termo, mode: 'insensitive' } },
          { numero_os: { contains: termo, mode: 'insensitive' } },
          { nome_tecnico: { contains: termo, mode: 'insensitive' } },
          { unidade: { contains: termo, mode: 'insensitive' } }
        ];
      }

      if (data_inicio || data_fim) {
        where.data_agendamento = {};
        if (data_inicio) {
          const dIni = new Date(data_inicio);
          if (!isNaN(dIni.getTime())) where.data_agendamento.gte = dIni;
        }
        if (data_fim) {
          const dFim = new Date(data_fim);
          if (!isNaN(dFim.getTime())) where.data_agendamento.lte = dFim;
        }
      }

      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (p - 1) * l;

      const [total, itens] = await Promise.all([
        prisma.agendamentos.count({ where }),
        prisma.agendamentos.findMany({
          where,
          include: {
            tecnico_corpvs: { select: { id: true, nome: true } },
            tecnico_terceirizado: { select: { id: true, nome: true, regiao: true, homologado: true } },
            ordem_terceirizado: { select: { id: true, numero_os: true, status: true, valor_total_cobrado: true } }
          },
          orderBy: [
            { unidade: { sort: 'asc', nulls: 'last' } },
            { data_agendamento: 'desc' },
            { criado_em: 'desc' }
          ],
          skip,
          take: l
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          agendamentos: itens,
          pagination: {
            total,
            page: p,
            limit: l,
            total_pages: Math.ceil(total / l) || 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4. AGENDAMENTOS TERCEIRIZADOS PENDENTES DE LANÇAMENTO NA ABA DE TERCEIRIZADOS
  // =========================================================================

  router.get('/agendamentos/terceirizados-pendentes', async (req, res, next) => {
    try {
      const pendentes = await prisma.agendamentos.findMany({
        where: {
          tipo_tecnico: 'TERCEIRIZADO',
          ordem_servico_terceirizado_id: null
        },
        include: {
          tecnico_terceirizado: {
            select: { id: true, nome: true, regiao: true, homologado: true }
          }
        },
        orderBy: { criado_em: 'desc' }
      });

      res.status(200).json({
        status: 'success',
        data: { pendentes, total: pendentes.length }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 5. CRIAR NOVO AGENDAMENTO (POST)
  // =========================================================================

  router.post('/agendamentos', async (req, res, next) => {
    try {
      const input = createAgendamentoSchema.parse(req.body);

      let tecnicoNome = '';
      let tecnicoCorpvsId = null;
      let tecnicoTerceirizadoId = null;

      if (input.tipo_tecnico === 'CORPVS') {
        const tec = await prisma.tecnicos_corpvs.findUnique({
          where: { id: input.tecnico_id }
        });
        if (!tec) {
          return res.status(404).json({ status: 'error', message: 'Técnico CORPVS selecionado não foi encontrado.' });
        }
        tecnicoNome = tec.nome;
        tecnicoCorpvsId = tec.id;
      } else {
        const tec = await prisma.tecnicos_terceirizados.findUnique({
          where: { id: input.tecnico_id }
        });
        if (!tec || !tec.ativo) {
          return res.status(404).json({ status: 'error', message: 'Técnico terceirizado não foi encontrado ou está inativo.' });
        }
        tecnicoNome = tec.nome;
        tecnicoTerceirizadoId = tec.id;
      }

      const novoAgendamento = await prisma.agendamentos.create({
        data: {
          data_agendamento: input.data_agendamento,
          placa: input.placa,
          unidade: input.unidade || null,
          uf: input.uf || null,
          tipo_veiculo: input.tipo_veiculo || null,
          nome_responsavel: input.nome_responsavel,
          contato_responsavel: normalizePhone(input.contato_responsavel),
          numero_os: input.numero_os || null,
          servico: input.servico,
          tipo_tecnico: input.tipo_tecnico,
          tecnico_corpvs_id: tecnicoCorpvsId,
          tecnico_terceirizado_id: tecnicoTerceirizadoId,
          nome_tecnico: tecnicoNome,
          status: input.status,
          motivo_frustrado: input.status === 'Frustrado' ? (input.motivo_frustrado || null) : null,
          observacoes: input.observacoes || null
        },
        include: {
          tecnico_corpvs: true,
          tecnico_terceirizado: true
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Agendamento registrado com sucesso!',
        data: { agendamento: novoAgendamento }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 6. ATUALIZAR AGENDAMENTO (PUT) - INCLUI FECHAMENTO COMO "REALIZADO"
  // =========================================================================

  router.put('/agendamentos/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const input = updateAgendamentoSchema.parse(req.body);

      const agendamentoAtual = await prisma.agendamentos.findUnique({
        where: { id }
      });

      if (!agendamentoAtual) {
        return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado.' });
      }

      const updateData = {};

      if (input.data_agendamento !== undefined) updateData.data_agendamento = input.data_agendamento;
      if (input.placa !== undefined) updateData.placa = input.placa;
      if (input.unidade !== undefined) updateData.unidade = input.unidade;
      if (input.uf !== undefined) updateData.uf = input.uf;
      if (input.tipo_veiculo !== undefined) updateData.tipo_veiculo = input.tipo_veiculo;
      if (input.nome_responsavel !== undefined) updateData.nome_responsavel = input.nome_responsavel;
      if (input.contato_responsavel !== undefined) updateData.contato_responsavel = normalizePhone(input.contato_responsavel);
      if (input.numero_os !== undefined) updateData.numero_os = input.numero_os;
      if (input.servico !== undefined) updateData.servico = input.servico;
      if (input.observacoes !== undefined) updateData.observacoes = input.observacoes;

      if (input.tipo_tecnico !== undefined && input.tecnico_id !== undefined) {
        updateData.tipo_tecnico = input.tipo_tecnico;
        if (input.tipo_tecnico === 'CORPVS') {
          const tec = await prisma.tecnicos_corpvs.findUnique({ where: { id: input.tecnico_id } });
          if (!tec) return res.status(404).json({ status: 'error', message: 'Técnico CORPVS não encontrado.' });
          updateData.tecnico_corpvs_id = tec.id;
          updateData.tecnico_terceirizado_id = null;
          updateData.nome_tecnico = tec.nome;
        } else {
          const tec = await prisma.tecnicos_terceirizados.findUnique({ where: { id: input.tecnico_id } });
          if (!tec) return res.status(404).json({ status: 'error', message: 'Técnico Terceirizado não encontrado.' });
          updateData.tecnico_corpvs_id = null;
          updateData.tecnico_terceirizado_id = tec.id;
          updateData.nome_tecnico = tec.nome;
        }
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === 'Frustrado') {
          updateData.motivo_frustrado = input.motivo_frustrado || agendamentoAtual.motivo_frustrado;
        } else {
          updateData.motivo_frustrado = null;
        }

        // Se marcado como Realizado com dados complementares do modal
        if (input.status === 'Realizado' && input.dados_realizado) {
          updateData.dados_realizado = {
            ...input.dados_realizado,
            concluido_em: new Date().toISOString()
          };

          // Se houver uma O.S. vinculada do terceirizado, sincroniza a conclusão
          if (agendamentoAtual.ordem_servico_terceirizado_id) {
            await prisma.ordens_servicos_terceirizados.update({
              where: { id: agendamentoAtual.ordem_servico_terceirizado_id },
              data: {
                status: 'Realizado',
                numero_nf: input.dados_realizado.numero_nf || undefined
              }
            }).catch(() => {});
          }
        }
      }

      const atualizado = await prisma.agendamentos.update({
        where: { id },
        data: updateData,
        include: {
          tecnico_corpvs: true,
          tecnico_terceirizado: true,
          ordem_terceirizado: true
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Agendamento atualizado com sucesso.',
        data: { agendamento: atualizado }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 7. EXCLUIR AGENDAMENTO (DELETE)
  // =========================================================================

  router.delete('/agendamentos/:id', async (req, res, next) => {
    try {
      const { id } = req.params;

      const agendamento = await prisma.agendamentos.findUnique({
        where: { id }
      });

      if (!agendamento) {
        return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado.' });
      }

      await prisma.agendamentos.delete({ where: { id } });

      res.status(200).json({
        status: 'success',
        message: 'Agendamento excluído com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 8. VINCULAR O.S. DE TERCEIRIZADO A UM AGENDAMENTO
  // =========================================================================

  router.post('/agendamentos/:id/vincular-os', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { ordem_id } = z.object({ ordem_id: z.string().uuid() }).parse(req.body);

      const agendamento = await prisma.agendamentos.update({
        where: { id },
        data: { ordem_servico_terceirizado_id: ordem_id }
      });

      res.status(200).json({
        status: 'success',
        message: 'Agendamento vinculado à Ordem de Serviço com sucesso!',
        data: { agendamento }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
