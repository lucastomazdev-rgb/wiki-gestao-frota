import express from 'express';
import { z } from 'zod';
import { restrictTo, restrictToGestaoSolar } from '../middleware/auth.js';
import { recordAuditEvent } from '../services/auditLogger.js';

const VALID_STATUSES = ['Demandas', 'Em andamento', 'Aguardando Retorno', 'Concluído'];
const VALID_PRIORITIES = ['Baixa', 'Normal', 'Alta'];

const createTaskSchema = z.object({
  titulo: z.string().trim().min(1, 'Título é obrigatório.').max(255, 'Título deve ter no máximo 255 caracteres.'),
  descricao: z.string().trim().optional().nullable(),
  status: z.enum(VALID_STATUSES).optional().default('Demandas'),
  prioridade: z.enum(VALID_PRIORITIES).optional().default('Normal'),
  categoria: z.string().trim().max(50, 'Categoria deve ter no máximo 50 caracteres.').optional().nullable(),
  atribuido_a: z.string().uuid().optional().nullable()
});

const updateTaskSchema = z.object({
  titulo: z.string().trim().min(1, 'Título é obrigatório.').max(255).optional(),
  descricao: z.string().trim().optional().nullable(),
  prioridade: z.enum(VALID_PRIORITIES).optional(),
  categoria: z.string().trim().max(50, 'Categoria deve ter no máximo 50 caracteres.').optional().nullable()
});

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, { errorMap: () => ({ message: 'Coluna/Status inválido.' }) }),
  ordem: z.number().int().optional()
});

const assignTaskSchema = z.object({
  atribuido_a: z.string().uuid().nullable().optional()
});

const createCommentSchema = z.object({
  comentario: z.string().trim().min(1, 'Comentário não pode ser vazio.').max(3000, 'Comentário muito longo.')
});

export default function createTarefasRouter(prisma, protect) {
  const router = express.Router();

  // Aplica autenticação e controle de acesso ao módulo Gestão Solar a todas as rotas
  router.use(protect, restrictToGestaoSolar);

  // -------------------------------------------------------------------------
  // GET /tarefas - Listar todas as demandas com autor, responsável e qtd comentários
  // -------------------------------------------------------------------------
  router.get('/tarefas', async (req, res, next) => {
    try {
      const tasks = await prisma.tarefas.findMany({
        orderBy: [
          { ordem: 'asc' },
          { created_at: 'desc' }
        ],
        include: {
          criador: {
            select: { id: true, name: true, email: true }
          },
          responsavel: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { comentarios: true }
          }
        }
      });

      const formatted = tasks.map(t => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        status: t.status,
        criado_por: t.criado_por,
        criador: t.criador,
        atribuido_a: t.atribuido_a,
        responsavel: t.responsavel,
        ordem: t.ordem,
        prioridade: t.prioridade,
        categoria: t.categoria,
        created_at: t.created_at,
        commentCount: t._count.comentarios
      }));

      return res.json({
        status: 'success',
        data: formatted
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // GET /tarefas/usuarios - Lista usuários para dropdown de atribuição e visualização
  // -------------------------------------------------------------------------
  router.get('/tarefas/usuarios', async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ADMIN' },
            { can_access_gestao_solar: true }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: { name: 'asc' }
      });

      return res.json({
        status: 'success',
        data: users
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // POST /tarefas - Criar nova demanda
  // Regra: Qualquer usuário da Gestão Solar pode criar, mas NÃO pode atribuir a ninguém.
  // Apenas ADM pode definir atribuido_a na criação.
  // -------------------------------------------------------------------------
  router.post('/tarefas', async (req, res, next) => {
    try {
      const parsed = createTaskSchema.parse(req.body);
      const isAdmin = req.user.role === 'ADMIN';

      // Se não for ADM, forçar atribuido_a = null
      const atribuido_a = isAdmin ? (parsed.atribuido_a || null) : null;

      const created = await prisma.tarefas.create({
        data: {
          titulo: parsed.titulo,
          descricao: parsed.descricao || null,
          status: parsed.status,
          prioridade: parsed.prioridade,
          categoria: parsed.categoria || null,
          criado_por: req.user.id,
          atribuido_a
        },
        include: {
          criador: {
            select: { id: true, name: true, email: true }
          },
          responsavel: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { comentarios: true }
          }
        }
      });

      recordAuditEvent({
        action: 'CREATE_TAREFA',
        actor: { id: req.user.id, email: req.user.email, role: req.user.role },
        target: { type: 'tarefa', id: created.id, titulo: created.titulo, atribuido_a, categoria: created.categoria }
      });

      return res.status(201).json({
        status: 'success',
        data: {
          ...created,
          commentCount: 0
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // PUT /tarefas/:id - Editar tarefa (título, descrição, prioridade)
  // Regra: ADM pode editar qualquer tarefa. Usuário comum só pode editar as que ele criou.
  // -------------------------------------------------------------------------
  router.put('/tarefas/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const parsed = updateTaskSchema.parse(req.body);

      const existing = await prisma.tarefas.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Demanda não encontrada.' });
      }

      const isAdmin = req.user.role === 'ADMIN';
      if (!isAdmin && existing.criado_por !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Você só possui permissão para editar demandas criadas por você.'
        });
      }

      const updated = await prisma.tarefas.update({
        where: { id },
        data: {
          ...(parsed.titulo !== undefined && { titulo: parsed.titulo }),
          ...(parsed.descricao !== undefined && { descricao: parsed.descricao }),
          ...(parsed.prioridade !== undefined && { prioridade: parsed.prioridade }),
          ...(parsed.categoria !== undefined && { categoria: parsed.categoria || null })
        },
        include: {
          criador: { select: { id: true, name: true, email: true } },
          responsavel: { select: { id: true, name: true, email: true } },
          _count: { select: { comentarios: true } }
        }
      });

      return res.json({
        status: 'success',
        data: {
          ...updated,
          commentCount: updated._count.comentarios
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // PATCH /tarefas/:id/status - Movimentar tarefa entre colunas do Kanban
  // Regra: ADM pode mover qualquer tarefa. Usuário comum só pode mover as criadas por ele.
  // -------------------------------------------------------------------------
  router.patch('/tarefas/:id/status', async (req, res, next) => {
    try {
      const { id } = req.params;
      const parsed = updateStatusSchema.parse(req.body);

      const existing = await prisma.tarefas.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Demanda não encontrada.' });
      }

      const isAdmin = req.user.role === 'ADMIN';
      const isCreator = existing.criado_por === req.user.id;
      const isAssigned = existing.atribuido_a === req.user.id;

      if (!isAdmin && !isCreator && !isAssigned) {
        return res.status(403).json({
          status: 'error',
          message: 'Você só possui permissão para mover no Kanban demandas criadas por você ou atribuídas a você.'
        });
      }

      const updated = await prisma.tarefas.update({
        where: { id },
        data: {
          status: parsed.status,
          ...(parsed.ordem !== undefined && { ordem: parsed.ordem })
        }
      });

      return res.json({
        status: 'success',
        data: updated
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // PATCH /tarefas/:id/atribuir - Atribuir responsável a uma demanda
  // Regra: Exclusivo para Administradores (ADM).
  // -------------------------------------------------------------------------
  router.patch('/tarefas/:id/atribuir', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const { id } = req.params;
      const parsed = assignTaskSchema.parse(req.body);

      const existing = await prisma.tarefas.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Demanda não encontrada.' });
      }

      if (parsed.atribuido_a) {
        const userExists = await prisma.user.findUnique({ where: { id: parsed.atribuido_a } });
        if (!userExists) {
          return res.status(400).json({ status: 'error', message: 'Usuário indicado para atribuição não existe.' });
        }
      }

      const updated = await prisma.tarefas.update({
        where: { id },
        data: { atribuido_a: parsed.atribuido_a || null },
        include: {
          criador: { select: { id: true, name: true, email: true } },
          responsavel: { select: { id: true, name: true, email: true } },
          _count: { select: { comentarios: true } }
        }
      });

      recordAuditEvent({
        action: 'ASSIGN_TAREFA',
        actor: { id: req.user.id, email: req.user.email, role: req.user.role },
        target: { type: 'tarefa', id, atribuido_a: parsed.atribuido_a }
      });

      return res.json({
        status: 'success',
        data: {
          ...updated,
          commentCount: updated._count.comentarios
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // DELETE /tarefas/:id - Excluir demanda
  // Regra: ADM pode excluir qualquer tarefa. Usuário comum só pode excluir as que ele criou.
  // -------------------------------------------------------------------------
  router.delete('/tarefas/:id', async (req, res, next) => {
    try {
      const { id } = req.params;

      const existing = await prisma.tarefas.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Demanda não encontrada.' });
      }

      const isAdmin = req.user.role === 'ADMIN';
      if (!isAdmin && existing.criado_por !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Você só possui permissão para excluir demandas criadas por você.'
        });
      }

      await prisma.tarefas.delete({ where: { id } });

      recordAuditEvent({
        action: 'DELETE_TAREFA',
        actor: { id: req.user.id, email: req.user.email, role: req.user.role },
        target: { type: 'tarefa', id, titulo: existing.titulo }
      });

      return res.json({
        status: 'success',
        message: 'Demanda excluída com sucesso.'
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // GET /tarefas/:id/comentarios - Listar comentários de uma demanda
  // Regra: Liberado para todos com acesso ao módulo Gestão Solar.
  // -------------------------------------------------------------------------
  router.get('/tarefas/:id/comentarios', async (req, res, next) => {
    try {
      const { id } = req.params;

      const comments = await prisma.tarefa_comentarios.findMany({
        where: { tarefa_id: id },
        orderBy: { created_at: 'asc' },
        include: {
          usuario: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      return res.json({
        status: 'success',
        data: comments
      });
    } catch (error) {
      return next(error);
    }
  });

  // -------------------------------------------------------------------------
  // POST /tarefas/:id/comentarios - Adicionar comentário a uma demanda
  // Regra: Liberado para todos com acesso ao módulo Gestão Solar.
  // -------------------------------------------------------------------------
  router.post('/tarefas/:id/comentarios', async (req, res, next) => {
    try {
      const { id } = req.params;
      const parsed = createCommentSchema.parse(req.body);

      const task = await prisma.tarefas.findUnique({ where: { id } });
      if (!task) {
        return res.status(404).json({ status: 'error', message: 'Demanda não encontrada.' });
      }

      const comment = await prisma.tarefa_comentarios.create({
        data: {
          tarefa_id: id,
          usuario_id: req.user.id,
          comentario: parsed.comentario
        },
        include: {
          usuario: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      return res.status(201).json({
        status: 'success',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
