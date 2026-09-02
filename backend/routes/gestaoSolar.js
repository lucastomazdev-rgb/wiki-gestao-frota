import express from 'express';
import { z } from 'zod';
import { protect, restrictToGestaoSolar } from '../middleware/auth.js';

export default function createGestaoSolarRouter(prisma) {
  const router = express.Router();

  // All routes inside this router require authentication and Gestão Solar permission
  router.use(protect, restrictToGestaoSolar);

  // Helper date formatter
  const parseIsoDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // =========================================================================
  // 1. INSTALAÇÕES (FROTA OPERACIONAL)
  // =========================================================================

  // Listar instalações com paginação e filtros
  router.get('/instalacoes', async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const paginated = req.query.paginated === 'true' || req.query.paginated === true;
      const { placa, unidade, uf, tipo, operacao } = req.query;

      const where = {};

      if (placa && placa.trim()) {
        where.placa = { contains: placa.trim(), mode: 'insensitive' };
      }

      if (operacao && operacao.trim()) {
        where.operacao = { contains: operacao.trim(), mode: 'insensitive' };
      }

      if (unidade && unidade.trim()) {
        where.unidades_clientes = {
          nome_unidade: { contains: unidade.trim(), mode: 'insensitive' }
        };
      }

      if (uf && uf.trim()) {
        where.unidades_clientes = {
          ...(where.unidades_clientes || {}),
          uf: { equals: uf.trim().toUpperCase() }
        };
      }

      if (tipo && tipo.trim()) {
        where.modelos_rastreadores = {
          tipo_veiculo: { contains: tipo.trim(), mode: 'insensitive' }
        };
      }

      const total = await prisma.instalacoes.count({ where });

      const queryOptions = {
        where,
        include: {
          unidades_clientes: {
            select: { id: true, nome_unidade: true, cod_cliente: true, razao_social: true, uf: true }
          },
          modelos_rastreadores: {
            select: { id: true, nome_modelo: true, tipo_veiculo: true, valor_instalacao: true, valor_mensalidade: true }
          }
        },
        orderBy: { criado_em: 'desc' }
      };

      if (paginated) {
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
      }

      const instalacoes = await prisma.instalacoes.findMany(queryOptions);

      if (paginated) {
        return res.status(200).json({
          data: instalacoes,
          pagination: {
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit) || 1
          }
        });
      }

      res.status(200).json(instalacoes);
    } catch (error) {
      next(error);
    }
  });

  // KPIs da frota (contadores por categoria)
  router.get('/instalacoes/kpis', async (req, res, next) => {
    try {
      const { placa, unidade, uf, tipo, operacao } = req.query;
      const where = {};

      if (placa && placa.trim()) {
        where.placa = { contains: placa.trim(), mode: 'insensitive' };
      }
      if (operacao && operacao.trim()) {
        where.operacao = { contains: operacao.trim(), mode: 'insensitive' };
      }
      if (unidade && unidade.trim()) {
        where.unidades_clientes = { nome_unidade: { contains: unidade.trim(), mode: 'insensitive' } };
      }
      if (uf && uf.trim()) {
        where.unidades_clientes = { ...(where.unidades_clientes || {}), uf: { equals: uf.trim().toUpperCase() } };
      }
      if (tipo && tipo.trim()) {
        where.modelos_rastreadores = { tipo_veiculo: { contains: tipo.trim(), mode: 'insensitive' } };
      }

      const instalacoes = await prisma.instalacoes.findMany({
        where,
        select: {
          modelo_id: true,
          modelos_rastreadores: {
            select: { tipo_veiculo: true }
          }
        }
      });

      let caminhao = 0;
      let moto = 0;
      let video = 0;

      for (const item of instalacoes) {
        const t = (item.modelos_rastreadores?.tipo_veiculo || '').toUpperCase();
        if (t.includes('CAMINH') || t.includes('PESAD') || t.includes('CARRETA')) {
          caminhao++;
        } else if (t.includes('MOTO')) {
          moto++;
        } else if (t.includes('VÍDEO') || t.includes('VIDEO') || t.includes('CÂMER') || t.includes('CAMER') || t.includes('DASH')) {
          video++;
        }
      }

      res.status(200).json({
        total: instalacoes.length,
        tipos: {
          caminhao,
          moto,
          video
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Criar nova instalação
  router.post('/instalacoes', async (req, res, next) => {
    try {
      const {
        descricao_veiculo,
        modulo,
        operacao,
        placa,
        data_instalacao,
        unidade_id,
        modelo_id
      } = req.body;

      if (!placa || !placa.trim()) {
        return res.status(400).json({ status: 'error', erro: 'Placa é obrigatória.' });
      }

      const novaInstalacao = await prisma.instalacoes.create({
        data: {
          descricao_veiculo: descricao_veiculo?.trim() || null,
          modulo: modulo?.trim() || null,
          operacao: operacao?.trim() || null,
          placa: placa.trim().toUpperCase(),
          data_instalacao: parseIsoDate(data_instalacao),
          unidade_id: unidade_id ? parseInt(unidade_id, 10) : null,
          modelo_id: modelo_id ? parseInt(modelo_id, 10) : null
        },
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        }
      });

      res.status(201).json(novaInstalacao);
    } catch (error) {
      next(error);
    }
  });

  // Atualizar instalação existente
  router.put('/instalacoes/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        descricao_veiculo,
        modulo,
        operacao,
        placa,
        data_instalacao,
        unidade_id,
        modelo_id
      } = req.body;

      const atual = await prisma.instalacoes.findUnique({ where: { id } });
      if (!atual) {
        return res.status(404).json({ status: 'error', erro: 'Instalação não encontrada.' });
      }

      const novoUnidadeId = unidade_id ? parseInt(unidade_id, 10) : null;

      // Se mudou de unidade, registra movimentação
      if (atual.unidade_id && novoUnidadeId && atual.unidade_id !== novoUnidadeId) {
        await prisma.log_movimentacoes.create({
          data: {
            placa: placa?.trim().toUpperCase() || atual.placa,
            tipo: 'TRANSFERENCIA',
            unidade_origem_id: atual.unidade_id,
            unidade_destino_id: novoUnidadeId,
            usuario_id: req.user?.id || null
          }
        }).catch(err => console.error('Erro ao registrar log de movimentação:', err));
      }

      const atualizada = await prisma.instalacoes.update({
        where: { id },
        data: {
          descricao_veiculo: descricao_veiculo !== undefined ? descricao_veiculo?.trim() || null : atual.descricao_veiculo,
          modulo: modulo !== undefined ? modulo?.trim() || null : atual.modulo,
          operacao: operacao !== undefined ? operacao?.trim() || null : atual.operacao,
          placa: placa ? placa.trim().toUpperCase() : atual.placa,
          data_instalacao: data_instalacao !== undefined ? parseIsoDate(data_instalacao) : atual.data_instalacao,
          unidade_id: unidade_id !== undefined ? novoUnidadeId : atual.unidade_id,
          modelo_id: modelo_id !== undefined ? (modelo_id ? parseInt(modelo_id, 10) : null) : atual.modelo_id
        },
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        }
      });

      res.status(200).json(atualizada);
    } catch (error) {
      next(error);
    }
  });

  // Excluir instalação
  router.delete('/instalacoes/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.instalacoes.delete({ where: { id } });
      res.status(200).json({ mensagem: 'Instalação deletada com sucesso!' });
    } catch (error) {
      next(error);
    }
  });

  // Transferência em lote de veículos entre unidades
  router.post('/instalacoes/transferir', async (req, res, next) => {
    try {
      const { unidade_origem_id, unidade_destino_id, placas } = req.body;
      if (!unidade_destino_id || !Array.isArray(placas) || placas.length === 0) {
        return res.status(400).json({ erro: 'Unidade destino e lista de placas são obrigatórias.' });
      }

      const destId = parseInt(unidade_destino_id, 10);
      const origId = unidade_origem_id ? parseInt(unidade_origem_id, 10) : null;

      const upperPlacas = placas.map(p => String(p).trim().toUpperCase());

      // Atualiza as instalações
      await prisma.instalacoes.updateMany({
        where: { placa: { in: upperPlacas } },
        data: { unidade_id: destId }
      });

      // Cria os registros de movimentação
      for (const p of upperPlacas) {
        await prisma.log_movimentacoes.create({
          data: {
            placa: p,
            tipo: 'TRANSFERENCIA',
            unidade_origem_id: origId,
            unidade_destino_id: destId,
            usuario_id: req.user?.id || null
          }
        }).catch(() => {});
      }

      res.status(200).json({
        mensagem: 'Transferência concluída com sucesso!',
        transferidos: upperPlacas.length
      });
    } catch (error) {
      next(error);
    }
  });

  // Baixa / Retirada Operacional
  router.post('/instalacoes/retirar', async (req, res, next) => {
    try {
      const { placa, status, data_retirada } = req.body;
      if (!placa) {
        return res.status(400).json({ erro: 'Placa é obrigatória.' });
      }

      const upperPlaca = placa.trim().toUpperCase();
      const inst = await prisma.instalacoes.findFirst({
        where: { placa: upperPlaca }
      });

      // Cria registro na tabela retiradas
      const retirada = await prisma.retiradas.create({
        data: {
          placa: upperPlaca,
          status: status || 'Retirado',
          data_retirada: parseIsoDate(data_retirada) || new Date(),
          unidade_id: inst?.unidade_id || null,
          modelo_id: inst?.modelo_id || null
        }
      });

      // Remove da frota ativa instalacoes
      if (inst) {
        await prisma.instalacoes.delete({ where: { id: inst.id } });
      }

      res.status(200).json({
        mensagem: 'Veículo retirado da frota ativa e registrado no histórico.',
        retirada
      });
    } catch (error) {
      next(error);
    }
  });

  // Sync / Importação em Lote CSV
  router.post('/instalacoes/sync', async (req, res, next) => {
    try {
      const { payload, relatorio } = req.body;
      const rows = Array.isArray(payload) ? payload : (Array.isArray(req.body) ? req.body : []);

      if (rows.length === 0) {
        return res.status(400).json({ erro: 'Nenhuma linha enviada para importação.' });
      }

      // Carrega unidades e modelos para busca de ids
      const unidades = await prisma.unidades_clientes.findMany();
      const modelos = await prisma.modelos_rastreadores.findMany();

      const mapUnidades = {};
      unidades.forEach(u => { mapUnidades[u.nome_unidade.trim().toUpperCase()] = u.id; });

      const mapModelos = {};
      modelos.forEach(m => { mapModelos[m.nome_modelo.trim().toUpperCase()] = m.id; });

      let inseridos = 0;
      let atualizados = 0;

      for (const row of rows) {
        const p = (row.placa || row['Placa'] || '').trim().toUpperCase();
        if (!p) continue;

        const nomeU = (row.nome_unidade || row['Unidade'] || '').trim().toUpperCase();
        const nomeM = (row.nome_modelo || row['Modelo'] || row['Tipo'] || '').trim().toUpperCase();

        const uid = mapUnidades[nomeU] || (row.unidade_id ? parseInt(row.unidade_id, 10) : null);
        const mid = mapModelos[nomeM] || (row.modelo_id ? parseInt(row.modelo_id, 10) : null);

        const dataInst = parseIsoDate(row.data_instalacao || row['Data Instalação']);

        const existing = await prisma.instalacoes.findFirst({ where: { placa: p } });
        if (existing) {
          await prisma.instalacoes.update({
            where: { id: existing.id },
            data: {
              descricao_veiculo: row.descricao_veiculo || existing.descricao_veiculo,
              modulo: row.modulo || existing.modulo,
              operacao: row.operacao || existing.operacao,
              data_instalacao: dataInst || existing.data_instalacao,
              unidade_id: uid || existing.unidade_id,
              modelo_id: mid || existing.modelo_id
            }
          });
          atualizados++;
        } else {
          await prisma.instalacoes.create({
            data: {
              placa: p,
              descricao_veiculo: row.descricao_veiculo || null,
              modulo: row.modulo || null,
              operacao: row.operacao || null,
              data_instalacao: dataInst || new Date(),
              unidade_id: uid,
              modelo_id: mid
            }
          });
          inseridos++;
        }
      }

      res.status(200).json({
        mensagem: 'Sincronização concluída com sucesso!',
        relatorio: {
          inseridos,
          atualizados,
          total: rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 2. GESTÃO DE UNIDADES (unidades_clientes)
  // =========================================================================

  router.get('/unidades', async (req, res, next) => {
    try {
      const rows = await prisma.$queryRaw`
        SELECT 
          u.id, 
          u.nome_unidade, 
          u.cod_cliente,
          u.razao_social,
          u.uf,
          u.criado_em,
          COUNT(i.id)::int as total_veiculos,
          COUNT(CASE WHEN UPPER(m.tipo_veiculo) IN ('CAMINHÃO', 'CAMINHAO') THEN 1 END)::int as cams,
          COUNT(CASE WHEN UPPER(m.tipo_veiculo) IN ('MOTO', 'MOTOCICLETA') THEN 1 END)::int as motos,
          COUNT(CASE WHEN UPPER(m.tipo_veiculo) IN ('VÍDEO', 'VIDEO', 'CÂMERA', 'CAMERA', 'DASHCAM') THEN 1 END)::int as vids
        FROM public.unidades_clientes u
        LEFT JOIN public.instalacoes i ON i.unidade_id = u.id
        LEFT JOIN public.modelos_rastreadores m ON m.id = i.modelo_id
        GROUP BY u.id, u.nome_unidade, u.cod_cliente, u.razao_social, u.uf, u.criado_em
        ORDER BY u.nome_unidade ASC;
      `;

      const unidades = rows.map(r => ({
        id: r.id,
        nome_unidade: r.nome_unidade,
        cod_cliente: r.cod_cliente,
        razao_social: r.razao_social,
        uf: r.uf,
        criado_em: r.criado_em,
        totalVeiculos: Number(r.total_veiculos || 0),
        kpi: {
          cams: Number(r.cams || 0),
          motos: Number(r.motos || 0),
          vids: Number(r.vids || 0)
        }
      }));

      res.status(200).json(unidades);
    } catch (error) {
      next(error);
    }
  });

  router.post('/unidades', async (req, res, next) => {
    try {
      const { nome_unidade, cod_cliente, uf, razao_social } = req.body;
      if (!nome_unidade || !nome_unidade.trim()) {
        return res.status(400).json({ erro: 'Nome da unidade é obrigatório.' });
      }

      const nova = await prisma.unidades_clientes.create({
        data: {
          nome_unidade: nome_unidade.trim(),
          cod_cliente: cod_cliente ? parseInt(cod_cliente, 10) : null,
          uf: uf ? uf.trim().toUpperCase().substring(0, 2) : null,
          razao_social: razao_social?.trim() || null
        }
      });

      res.status(201).json(nova);
    } catch (error) {
      next(error);
    }
  });

  router.put('/unidades/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { nome_unidade, cod_cliente, uf, razao_social } = req.body;

      const atualizada = await prisma.unidades_clientes.update({
        where: { id },
        data: {
          nome_unidade: nome_unidade?.trim(),
          cod_cliente: cod_cliente !== undefined ? (cod_cliente ? parseInt(cod_cliente, 10) : null) : undefined,
          uf: uf ? uf.trim().toUpperCase().substring(0, 2) : undefined,
          razao_social: razao_social !== undefined ? razao_social?.trim() : undefined
        }
      });

      res.status(200).json(atualizada);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/unidades/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      await prisma.unidades_clientes.delete({ where: { id } });
      res.status(200).json({ mensagem: 'Unidade excluída com sucesso!' });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 3. MODELOS DE RASTREADORES (modelos_rastreadores)
  // =========================================================================

  router.get('/modelos', async (req, res, next) => {
    try {
      const modelos = await prisma.modelos_rastreadores.findMany({
        orderBy: { nome_modelo: 'asc' }
      });
      res.status(200).json(modelos);
    } catch (error) {
      next(error);
    }
  });

  router.post('/modelos', async (req, res, next) => {
    try {
      const { nome_modelo, tipo_veiculo, valor_instalacao, valor_mensalidade } = req.body;
      if (!nome_modelo || !tipo_veiculo) {
        return res.status(400).json({ erro: 'Nome do modelo e tipo de veículo são obrigatórios.' });
      }

      const novo = await prisma.modelos_rastreadores.create({
        data: {
          nome_modelo: nome_modelo.trim(),
          tipo_veiculo: tipo_veiculo.trim(),
          valor_instalacao: valor_instalacao ? parseFloat(valor_instalacao) : 0,
          valor_mensalidade: valor_mensalidade ? parseFloat(valor_mensalidade) : 0
        }
      });

      res.status(201).json(novo);
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4. RETIRADAS / HISTÓRICO DE BAIXAS (retiradas)
  // =========================================================================

  router.get('/retiradas', async (req, res, next) => {
    try {
      const lista = await prisma.retiradas.findMany({
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        },
        orderBy: { data_retirada: 'desc' }
      });
      res.status(200).json(lista);
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 5. TIMELINE MENSAL DE MOVIMENTAÇÕES
  // =========================================================================

  router.get('/timeline', async (req, res, next) => {
    try {
      const mes = parseInt(req.query.mes, 10);
      const ano = parseInt(req.query.ano, 10);

      if (!mes || !ano || mes < 1 || mes > 12) {
        return res.status(400).json({ erro: 'Mês (1-12) e ano são obrigatórios.' });
      }

      const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
      const fimMes = new Date(Date.UTC(mes === 12 ? ano + 1 : ano, mes === 12 ? 0 : mes, 1));

      // 1. Novas instalações no mês
      const novas = await prisma.instalacoes.findMany({
        where: {
          data_instalacao: {
            gte: inicioMes,
            lt: fimMes
          }
        },
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        },
        orderBy: { data_instalacao: 'desc' }
      });

      // 2. Retiradas no mês
      const retiradas = await prisma.retiradas.findMany({
        where: {
          data_retirada: {
            gte: inicioMes,
            lt: fimMes
          }
        },
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        },
        orderBy: { data_retirada: 'desc' }
      });

      // 3. Transferências no mês
      const transferencias = await prisma.log_movimentacoes.findMany({
        where: {
          tipo: 'TRANSFERENCIA',
          data_movimentacao: {
            gte: inicioMes,
            lt: fimMes
          }
        },
        include: {
          unidades_clientes_log_movimentacoes_unidade_origem_idTounidades_clientes: true,
          unidades_clientes_log_movimentacoes_unidade_destino_idTounidades_clientes: true
        },
        orderBy: { data_movimentacao: 'desc' }
      });

      res.status(200).json({
        novas,
        retiradas,
        transferencias: transferencias.map(t => ({
          id: t.id,
          placa: t.placa,
          data_movimentacao: t.data_movimentacao,
          origem: t.unidades_clientes_log_movimentacoes_unidade_origem_idTounidades_clientes,
          destino: t.unidades_clientes_log_movimentacoes_unidade_destino_idTounidades_clientes
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
