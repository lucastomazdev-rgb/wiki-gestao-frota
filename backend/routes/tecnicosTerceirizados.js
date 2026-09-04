import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import { restrictTo, restrictToGestaoSolar } from '../middleware/auth.js';
import {
  createPrivateDownloadUrl,
  deletePrivateFile,
  extractObjectPath,
  uploadPrivateFile
} from '../services/storage.js';

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 }
});

const BUCKET_NAME = 'documentos_terceirizados';

const uploadDocument = (file, prefix) => uploadPrivateFile({ bucket: BUCKET_NAME, file, prefix });

export default function createTecnicosTerceirizadosRouter(prisma, protect) {
  const router = express.Router();

  // Todas as rotas requerem autenticação e acesso à Gestão Solar
  router.use(protect, restrictToGestaoSolar);

  const normalizePlate = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
  };
  const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

  const orderSchema = z.object({
    numero_os: z.string().trim().min(1).max(100),
    tecnico_id: z.string().uuid(),
    servico_id: z.string().uuid(),
    placa: z.string().transform(normalizePlate).refine(value => value.length >= 5 && value.length <= 8, 'Placa inválida.'),
    uf: z.string().trim().length(2).transform(value => value.toUpperCase()).nullable().optional(),
    unidade: z.string().trim().max(200).nullable().optional(),
    tipo_veiculo: z.string().trim().max(100).nullable().optional(),
    teve_km_rodado: z.boolean().default(false),
    km_quantidade: z.coerce.number().min(0).max(100000).default(0),
    numero_nf: z.string().trim().max(100).nullable().optional(),
    status: z.enum(['Agendado', 'Aguardando data', 'Realizado']).default('Agendado'),
    equipamentos_utilizados: z.array(z.object({
      modelo: z.string().trim().min(1).max(150).transform(value => value.toUpperCase()),
      quantidade: z.coerce.number().int().min(1).max(10000)
    }).strict()).max(50).default([])
  }).strict();

  const consolidateEquipment = (items) => [...items.reduce((map, item) => {
    map.set(item.modelo, (map.get(item.modelo) || 0) + item.quantidade);
    return map;
  }, new Map())].map(([modelo, quantidade]) => ({ modelo, quantidade }));

  const decrementEquipmentStock = async (tx, tecnicoId, equipments, reason) => {
    for (const item of equipments) {
      const updated = await tx.tecnico_equipamentos.updateMany({
        where: {
          tecnico_id: tecnicoId,
          modelo_equipamento: item.modelo,
          quantidade: { gte: item.quantidade }
        },
        data: {
          quantidade: { decrement: item.quantidade },
          atualizado_em: new Date()
        }
      });

      if (updated.count !== 1) {
        throw httpError(409, `Saldo insuficiente do equipamento "${item.modelo}".`);
      }

      await tx.tecnico_movimentacoes_equipamentos.create({
        data: {
          tecnico_id: tecnicoId,
          modelo_equipamento: item.modelo,
          tipo: 'BAIXA_OS',
          quantidade: item.quantidade,
          motivo_ou_os: reason
        }
      });
    }
  };

  // =========================================================================
  // 1. TÉCNICOS TERCEIRIZADOS (CRUD + SERVIÇOS + EQUIPAMENTOS)
  // =========================================================================

  // Listar todos os técnicos terceirizados com filtros
  router.get('/tecnicos', async (req, res, next) => {
    try {
      const { busca, regiao, homologado } = req.query;
      const where = { ativo: true };

      if (busca && busca.trim()) {
        where.OR = [
          { nome: { contains: busca.trim(), mode: 'insensitive' } },
          { regiao: { contains: busca.trim(), mode: 'insensitive' } }
        ];
      }

      if (regiao && regiao.trim()) {
        where.regiao = { contains: regiao.trim(), mode: 'insensitive' };
      }

      if (homologado !== undefined && homologado !== '') {
        where.homologado = homologado === 'true' || homologado === true;
      }

      const tecnicos = await prisma.tecnicos_terceirizados.findMany({
        where,
        include: {
          servicos_precos: {
            orderBy: { nome_servico: 'asc' }
          },
          equipamentos: {
            orderBy: { modelo_equipamento: 'asc' }
          },
          _count: {
            select: {
              ordens_servicos: true
            }
          }
        },
        orderBy: { nome: 'asc' }
      });

      res.status(200).json({
        status: 'success',
        data: { tecnicos }
      });
    } catch (error) {
      next(error);
    }
  });

  // Obter detalhes de um único técnico
  router.get('/tecnicos/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const tecnico = await prisma.tecnicos_terceirizados.findUnique({
        where: { id },
        include: {
          servicos_precos: { orderBy: { nome_servico: 'asc' } },
          equipamentos: { orderBy: { modelo_equipamento: 'asc' } },
          movimentacoes_equipamentos: {
            orderBy: { criado_em: 'desc' },
            take: 20
          },
          ordens_servicos: {
            orderBy: { criado_em: 'desc' },
            take: 20
          }
        }
      });

      if (!tecnico) {
        return res.status(404).json({ status: 'error', message: 'Técnico não encontrado.' });
      }

      res.status(200).json({
        status: 'success',
        data: { tecnico }
      });
    } catch (error) {
      next(error);
    }
  });

  // Gera uma URL assinada de curta duração. Apenas administradores podem
  // visualizar CNH e comprovante, sem tornar os arquivos públicos.
  router.get('/tecnicos/:id/documentos/:tipo', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const tipo = z.enum(['cnh', 'comprovante']).parse(req.params.tipo);
      const tecnico = await prisma.tecnicos_terceirizados.findUnique({
        where: { id: req.params.id },
        select: {
          cnh_url: true,
          cnh_nome: true,
          comprovante_residencia_url: true,
          comprovante_residencia_nome: true
        }
      });

      if (!tecnico) return res.status(404).json({ status: 'error', message: 'Técnico não encontrado.' });

      const storedValue = tipo === 'cnh' ? tecnico.cnh_url : tecnico.comprovante_residencia_url;
      const downloadName = tipo === 'cnh' ? tecnico.cnh_nome : tecnico.comprovante_residencia_nome;
      const objectPath = extractObjectPath(storedValue, BUCKET_NAME);
      if (!objectPath) return res.status(404).json({ status: 'error', message: 'Documento não encontrado.' });

      const url = await createPrivateDownloadUrl({
        bucket: BUCKET_NAME,
        objectPath,
        downloadName,
        expiresIn: 60
      });

      res.status(200).json({ status: 'success', data: { url, expiresIn: 60 } });
    } catch (error) {
      next(error);
    }
  });

  // Criar novo técnico terceirizado com upload opcional de CNH e Comprovante de Residência
  router.post('/tecnicos', uploadMemory.fields([
    { name: 'cnh', maxCount: 1 },
    { name: 'comprovante_residencia', maxCount: 1 }
  ]), async (req, res, next) => {
    const uploadedPaths = [];
    try {
      const { nome, telefone, regiao, homologado, servicos: rawServicos } = req.body;

      if (!nome || !nome.trim()) {
        return res.status(400).json({ status: 'error', message: 'O nome do técnico é obrigatório.' });
      }
      if (!regiao || !regiao.trim()) {
        return res.status(400).json({ status: 'error', message: 'A região de atendimento é obrigatória.' });
      }

      // Parse dos serviços
      let servicos = [];
      try {
        servicos = typeof rawServicos === 'string' ? JSON.parse(rawServicos) : (rawServicos || []);
      } catch (e) {
        return res.status(400).json({ status: 'error', message: 'Formato inválido para a tabela de serviços.' });
      }

      if (!Array.isArray(servicos) || servicos.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'É obrigatório cadastrar pelo menos 1 serviço na tabela de valores do técnico.'
        });
      }

      // Validação de cada serviço
      for (const s of servicos) {
        if (!s.nome_servico || !s.nome_servico.trim()) {
          return res.status(400).json({ status: 'error', message: 'Todo serviço deve ter um nome preenchido.' });
        }
        if (s.valor === undefined || s.valor === null || isNaN(Number(s.valor)) || Number(s.valor) < 0) {
          return res.status(400).json({ status: 'error', message: `Valor inválido para o serviço "${s.nome_servico}".` });
        }
      }

      // Upload de documentos no Supabase Storage se fornecidos
      let cnhData = null;
      let comprovanteData = null;

      if (req.files?.cnh?.[0]) {
        cnhData = await uploadDocument(req.files.cnh[0], 'cnh');
        uploadedPaths.push(cnhData.path);
      }

      if (req.files?.comprovante_residencia?.[0]) {
        comprovanteData = await uploadDocument(req.files.comprovante_residencia[0], 'comprovante');
        uploadedPaths.push(comprovanteData.path);
      }

      const isHomologado = homologado === 'true' || homologado === true;

      // Criação transacional do técnico e sua tabela de serviços
      const novoTecnico = await prisma.$transaction(async (tx) => {
        const tec = await tx.tecnicos_terceirizados.create({
          data: {
            nome: nome.trim(),
            telefone: telefone ? telefone.trim() : null,
            regiao: regiao.trim(),
            homologado: isHomologado,
            cnh_url: cnhData?.path || null,
            cnh_nome: cnhData?.nome || null,
            comprovante_residencia_url: comprovanteData?.path || null,
            comprovante_residencia_nome: comprovanteData?.nome || null,
            ativo: true
          }
        });

        // Inserir serviços
        const servicosData = servicos.map(s => {
          const nomeClean = s.nome_servico.trim();
          const containsManutencao = /manuten[cç][aã]o/i.test(nomeClean);
          const isKm = /km/i.test(nomeClean);
          
          return {
            tecnico_id: tec.id,
            nome_servico: nomeClean,
            valor: Number(s.valor),
            gera_devolucao: parseBoolean(s.gera_devolucao, containsManutencao),
            is_km: parseBoolean(s.is_km, isKm)
          };
        });

        await tx.tecnico_servicos_precos.createMany({
          data: servicosData
        });

        return tx.tecnicos_terceirizados.findUnique({
          where: { id: tec.id },
          include: {
            servicos_precos: true,
            equipamentos: true
          }
        });
      }, { maxWait: 10000, timeout: 30000 });

      res.status(201).json({
        status: 'success',
        message: 'Técnico terceirizado cadastrado com sucesso!',
        data: { tecnico: novoTecnico }
      });
    } catch (error) {
      await Promise.allSettled(uploadedPaths.map(objectPath => deletePrivateFile({ bucket: BUCKET_NAME, objectPath })));
      next(error);
    }
  });

  // Atualizar dados cadastrais do técnico e sua tabela de serviços
  router.put('/tecnicos/:id', uploadMemory.fields([
    { name: 'cnh', maxCount: 1 },
    { name: 'comprovante_residencia', maxCount: 1 }
  ]), async (req, res, next) => {
    const uploadedPaths = [];
    const replacedPaths = [];
    try {
      const { id } = req.params;
      const { nome, telefone, regiao, homologado, ativo, servicos: rawServicos } = req.body;

      const tecExistente = await prisma.tecnicos_terceirizados.findUnique({ where: { id } });
      if (!tecExistente) {
        return res.status(404).json({ status: 'error', message: 'Técnico não encontrado.' });
      }

      const updateData = {};
      if (nome && nome.trim()) updateData.nome = nome.trim();
      if (telefone !== undefined) updateData.telefone = telefone ? telefone.trim() : null;
      if (regiao && regiao.trim()) updateData.regiao = regiao.trim();
      if (homologado !== undefined) updateData.homologado = homologado === 'true' || homologado === true;
      if (ativo !== undefined) updateData.ativo = ativo === 'true' || ativo === true;

      // Upload se novo documento foi enviado
      if (req.files?.cnh?.[0]) {
        const cnhData = await uploadDocument(req.files.cnh[0], 'cnh');
        uploadedPaths.push(cnhData.path);
        const oldPath = extractObjectPath(tecExistente.cnh_url, BUCKET_NAME);
        if (oldPath) replacedPaths.push(oldPath);
        updateData.cnh_url = cnhData.path;
        updateData.cnh_nome = cnhData.nome;
      }

      if (req.files?.comprovante_residencia?.[0]) {
        const compData = await uploadDocument(req.files.comprovante_residencia[0], 'comprovante');
        uploadedPaths.push(compData.path);
        const oldPath = extractObjectPath(tecExistente.comprovante_residencia_url, BUCKET_NAME);
        if (oldPath) replacedPaths.push(oldPath);
        updateData.comprovante_residencia_url = compData.path;
        updateData.comprovante_residencia_nome = compData.nome;
      }

      // Processar serviços se enviados
      let servicosProcessados = null;
      if (rawServicos !== undefined) {
        let parsed = [];
        try {
          parsed = typeof rawServicos === 'string' ? JSON.parse(rawServicos) : rawServicos;
        } catch (e) {
          return res.status(400).json({ status: 'error', message: 'Formato inválido para a tabela de serviços.' });
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          return res.status(400).json({
            status: 'error',
            message: 'O técnico precisa ter pelo menos 1 serviço cadastrado em sua tabela de valores.'
          });
        }

        for (const s of parsed) {
          if (!s.nome_servico || !s.nome_servico.trim()) {
            return res.status(400).json({ status: 'error', message: 'Todo serviço deve ter um nome preenchido.' });
          }
          if (s.valor === undefined || s.valor === null || isNaN(Number(s.valor)) || Number(s.valor) < 0) {
            return res.status(400).json({ status: 'error', message: `Valor inválido para o serviço "${s.nome_servico}".` });
          }
        }

        servicosProcessados = parsed.map(s => {
          const nomeClean = s.nome_servico.trim();
          const containsManutencao = /manuten[cç][aã]o/i.test(nomeClean);
          const isKm = /km/i.test(nomeClean);
          return {
            tecnico_id: id,
            nome_servico: nomeClean,
            valor: Number(s.valor),
            gera_devolucao: parseBoolean(s.gera_devolucao, containsManutencao),
            is_km: parseBoolean(s.is_km, isKm)
          };
        });
      }

      const tecnicoAtualizado = await prisma.$transaction(async (tx) => {
        await tx.tecnicos_terceirizados.update({
          where: { id },
          data: updateData
        });

        if (servicosProcessados) {
          await tx.tecnico_servicos_precos.deleteMany({
            where: { tecnico_id: id }
          });
          await tx.tecnico_servicos_precos.createMany({
            data: servicosProcessados
          });
        }

        return tx.tecnicos_terceirizados.findUnique({
          where: { id },
          include: {
            servicos_precos: { orderBy: { nome_servico: 'asc' } },
            equipamentos: { orderBy: { modelo_equipamento: 'asc' } }
          }
        });
      }, { maxWait: 10000, timeout: 30000 });

      await Promise.allSettled(replacedPaths.map(objectPath => deletePrivateFile({ bucket: BUCKET_NAME, objectPath })));

      res.status(200).json({
        status: 'success',
        message: 'Cadastro do técnico atualizado com sucesso!',
        data: { tecnico: tecnicoAtualizado }
      });
    } catch (error) {
      await Promise.allSettled(uploadedPaths.map(objectPath => deletePrivateFile({ bucket: BUCKET_NAME, objectPath })));
      next(error);
    }
  });

  // Excluir técnico (ou desativar se tiver O.S. vinculada) - Apenas Administradores
  router.delete('/tecnicos/:id', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const { id } = req.params;
      const tecnico = await prisma.tecnicos_terceirizados.findUnique({
        where: { id },
        select: {
          cnh_url: true,
          comprovante_residencia_url: true,
          _count: { select: { ordens_servicos: true } }
        }
      });
      if (!tecnico) return res.status(404).json({ status: 'error', message: 'Técnico não encontrado.' });

      if (tecnico._count.ordens_servicos > 0) {
        // Se houver O.S., faz soft delete para não corromper histórico financeiro
        await prisma.tecnicos_terceirizados.update({
          where: { id },
          data: { ativo: false }
        });
        return res.status(200).json({
          status: 'success',
          message: 'Técnico desativado com sucesso (histórico de O.S. preservado).'
        });
      }

      // Se não houver O.S., exclui definitivamente
      await prisma.tecnicos_terceirizados.delete({
        where: { id }
      });

      const paths = [tecnico.cnh_url, tecnico.comprovante_residencia_url]
        .map(value => extractObjectPath(value, BUCKET_NAME))
        .filter(Boolean);
      await Promise.allSettled(paths.map(objectPath => deletePrivateFile({ bucket: BUCKET_NAME, objectPath })));

      res.status(200).json({
        status: 'success',
        message: 'Técnico excluído com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 2. TABELA DE PREÇOS / SERVIÇOS POR TÉCNICO
  // =========================================================================

  // Adicionar novo serviço à tabela do técnico (Apenas Administradores)
  router.post('/tecnicos/:id/servicos', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const { id: tecnico_id } = req.params;
      const { nome_servico, valor, gera_devolucao, is_km } = req.body;

      if (!nome_servico || !nome_servico.trim()) {
        return res.status(400).json({ status: 'error', message: 'Nome do serviço é obrigatório.' });
      }
      if (valor === undefined || isNaN(Number(valor)) || Number(valor) < 0) {
        return res.status(400).json({ status: 'error', message: 'Valor inválido.' });
      }

      const nomeClean = nome_servico.trim();
      const containsManutencao = /manuten[cç][aã]o/i.test(nomeClean);

      const novoServico = await prisma.tecnico_servicos_precos.create({
        data: {
          tecnico_id,
          nome_servico: nomeClean,
          valor: Number(valor),
          gera_devolucao: parseBoolean(gera_devolucao, containsManutencao),
          is_km: parseBoolean(is_km, /km/i.test(nomeClean))
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Serviço adicionado à tabela do técnico.',
        data: { servico: novoServico }
      });
    } catch (error) {
      next(error);
    }
  });

  // Excluir serviço da tabela do técnico (Apenas Administradores)
  router.delete('/tecnicos/:id/servicos/:servicoId', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const { id: tecnico_id, servicoId } = req.params;

      await prisma.$transaction(async (tx) => {
        const servico = await tx.tecnico_servicos_precos.findFirst({
          where: { id: servicoId, tecnico_id },
          select: { id: true }
        });
        if (!servico) {
          const error = new Error('Serviço não encontrado para este técnico.');
          error.statusCode = 404;
          throw error;
        }

        const totalServicos = await tx.tecnico_servicos_precos.count({ where: { tecnico_id } });
        if (totalServicos <= 1) {
          const error = new Error('O técnico precisa ter pelo menos 1 serviço cadastrado.');
          error.statusCode = 400;
          throw error;
        }

        await tx.tecnico_servicos_precos.delete({ where: { id: servicoId } });
      });

      res.status(200).json({
        status: 'success',
        message: 'Serviço removido com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 3. CONTROLE DE ESTOQUE / CARGA DE EQUIPAMENTOS PARA O TÉCNICO (P0 - OPÇÃO A)
  // =========================================================================

  // Listar todos os equipamentos padrão da frota (Caminhão, Moto, Vídeo) sem duplicados para sugestão
  router.get('/equipamentos-padrao-sugestoes', async (req, res, next) => {
    try {
      const lista = await prisma.equipamentos_padrao.findMany({
        where: { status: 'Ativo' },
        select: { nome: true, finalidade: true, codigo: true },
        orderBy: { nome: 'asc' }
      });

      // Deduplica por nome limpo (ex: "CHIP ALGAR" aparece 1 única vez)
      const mapUnicos = new Map();
      for (const eq of lista) {
        const nomeLimpo = eq.nome.trim();
        const key = nomeLimpo.toUpperCase();
        if (!mapUnicos.has(key)) {
          mapUnicos.set(key, {
            nome: nomeLimpo,
            codigo: eq.codigo,
            finalidades: [eq.finalidade]
          });
        } else {
          const existing = mapUnicos.get(key);
          if (eq.finalidade && !existing.finalidades.includes(eq.finalidade)) {
            existing.finalidades.push(eq.finalidade);
          }
        }
      }

      const equipamentos = Array.from(mapUnicos.values()).sort((a, b) => a.nome.localeCompare(b.nome));

      res.status(200).json({
        status: 'success',
        data: { equipamentos }
      });
    } catch (error) {
      next(error);
    }
  });

  // Adicionar remessa / envio de equipamentos para o técnico (suporta envio individual ou em LOTE/MÚLTIPLOS)
  router.post('/tecnicos/:id/equipamentos/carga', async (req, res, next) => {
    try {
      const { id: tecnico_id } = req.params;
      const { modelo_equipamento, quantidade, itens, motivo_ou_os } = req.body;

      // Normaliza para array de itens
      let listaItens = [];
      if (Array.isArray(itens) && itens.length > 0) {
        listaItens = itens.map(i => ({
          modelo: String(i.modelo_equipamento || i.modelo || '').trim().toUpperCase(),
          quantidade: parseInt(i.quantidade, 10) || 0
        })).filter(i => i.modelo && i.quantidade > 0);
      } else if (modelo_equipamento && quantidade) {
        const qtd = parseInt(quantidade, 10);
        if (qtd > 0) {
          listaItens.push({
            modelo: String(modelo_equipamento).trim().toUpperCase(),
            quantidade: qtd
          });
        }
      }

      if (listaItens.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Selecione ou informe pelo menos um equipamento com quantidade maior que zero.'
        });
      }

      const motivoTexto = motivo_ou_os?.trim() || 'Remessa de materiais enviada ao técnico';

      const resultado = await prisma.$transaction(async (tx) => {
        const itensAtualizados = [];

        for (const item of listaItens) {
          const itemEquip = await tx.tecnico_equipamentos.upsert({
            where: {
              tecnico_id_modelo_equipamento: {
                tecnico_id,
                modelo_equipamento: item.modelo
              }
            },
            update: {
              quantidade: { increment: item.quantidade },
              atualizado_em: new Date()
            },
            create: {
              tecnico_id,
              modelo_equipamento: item.modelo,
              quantidade: item.quantidade
            }
          });

          await tx.tecnico_movimentacoes_equipamentos.create({
            data: {
              tecnico_id,
              modelo_equipamento: item.modelo,
              tipo: 'CARGA_ENVIADA',
              quantidade: item.quantidade,
              motivo_ou_os: motivoTexto
            }
          });

          itensAtualizados.push(itemEquip);
        }

        const saldoFinal = await tx.tecnico_equipamentos.findMany({
          where: { tecnico_id },
          orderBy: { modelo_equipamento: 'asc' }
        });

        return { itensAtualizados, saldoFinal };
      }, { maxWait: 10000, timeout: 30000 });

      res.status(200).json({
        status: 'success',
        message: `${listaItens.length} tipo(s) de equipamento(s) carregado(s) com sucesso para o técnico!`,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  });

  // Atualizar / Editar diretamente a quantidade de um equipamento já cadastrado (Apenas Administradores)
  router.put('/tecnicos/:id/equipamentos/:equipId', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const { id: tecnico_id, equipId } = req.params;
      const { quantidade: qtdNova, motivo } = z.object({
        quantidade: z.coerce.number().int().min(0).max(1000000),
        motivo: z.string().trim().max(255).optional()
      }).strict().parse(req.body);

      const resultado = await prisma.$transaction(async (tx) => {
        const equipAtual = await tx.tecnico_equipamentos.findFirst({
          where: { id: equipId, tecnico_id }
        });
        if (!equipAtual) throw httpError(404, 'Equipamento não encontrado para este técnico.');

        const qtdAnterior = equipAtual.quantidade;
        const diferenca = qtdNova - qtdAnterior;
        const update = await tx.tecnico_equipamentos.updateMany({
          where: { id: equipId, tecnico_id, quantidade: qtdAnterior },
          data: {
            quantidade: qtdNova,
            atualizado_em: new Date()
          }
        });
        if (update.count !== 1) throw httpError(409, 'O saldo foi alterado por outro usuário. Atualize a tela e tente novamente.');

        await tx.tecnico_movimentacoes_equipamentos.create({
          data: {
            tecnico_id,
            modelo_equipamento: equipAtual.modelo_equipamento,
            tipo: 'AJUSTE_MANUAL',
            quantidade: Math.abs(diferenca),
            motivo_ou_os: motivo || `Ajuste manual de quantidade (${qtdAnterior} -> ${qtdNova} un)`
          }
        });

        return tx.tecnico_equipamentos.findUnique({ where: { id: equipId } });
      }, { maxWait: 10000, timeout: 30000 });

      res.status(200).json({
        status: 'success',
        message: `Saldo de "${equipAtual.modelo_equipamento}" ajustado com sucesso para ${qtdNova} un.`,
        data: { equipamento: resultado }
      });
    } catch (error) {
      next(error);
    }
  });

  // Excluir registro de equipamento do técnico (zerando ou removendo) - Apenas Administradores
  router.delete('/tecnicos/:id/equipamentos/:equipId', restrictTo('ADMIN'), async (req, res, next) => {
    try {
      const { id: tecnico_id, equipId } = req.params;

      const equipAtual = await prisma.tecnico_equipamentos.findUnique({
        where: { id: equipId }
      });

      if (!equipAtual || equipAtual.tecnico_id !== tecnico_id) {
        return res.status(404).json({ status: 'error', message: 'Equipamento não encontrado.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.tecnico_equipamentos.delete({
          where: { id: equipId }
        });

        await tx.tecnico_movimentacoes_equipamentos.create({
          data: {
            tecnico_id,
            modelo_equipamento: equipAtual.modelo_equipamento,
            tipo: 'REMOCAO_ITEM',
            quantidade: equipAtual.quantidade,
            motivo_ou_os: 'Remoção do item do estoque do técnico'
          }
        });
      }, { maxWait: 10000, timeout: 30000 });

      res.status(200).json({
        status: 'success',
        message: `Equipamento "${equipAtual.modelo_equipamento}" removido do saldo do técnico.`
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 4. CONSULTA RÁPIDA DE VEÍCULOS POR PLACA
  // =========================================================================

  // Buscar dados da placa na base de instalações da Solar
  router.get('/veiculos/buscar-placa/:placa', async (req, res, next) => {
    try {
      const placaLimpa = normalizePlate(req.params.placa);

      if (!placaLimpa) {
        return res.status(400).json({ status: 'error', message: 'Placa inválida.' });
      }

      // Busca na tabela instalacoes com joins para unidades_clientes e modelos_rastreadores
      const veiculo = await prisma.instalacoes.findUnique({
        where: { placa: placaLimpa },
        include: {
          unidades_clientes: true,
          modelos_rastreadores: true
        }
      });

      if (!veiculo) {
        return res.status(200).json({
          status: 'success',
          found: false,
          data: null,
          message: 'Veículo não encontrado na base prévia. Os dados podem ser preenchidos manualmente.'
        });
      }

      res.status(200).json({
        status: 'success',
        found: true,
        data: {
          placa: veiculo.placa,
          uf: veiculo.unidades_clientes?.uf || null,
          unidade: veiculo.unidades_clientes?.nome_unidade || null,
          tipo_veiculo: veiculo.modelos_rastreadores?.tipo_veiculo || veiculo.descricao_veiculo || null,
          modelo_rastreador: veiculo.modelos_rastreadores?.nome_modelo || null
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // 5. ORDENS DE SERVIÇO & LOGÍSTICA REVERSA
  // =========================================================================

  // Listar Ordens de Serviço com filtros avançados
  router.get('/ordens-servicos/kpis', async (req, res, next) => {
    try {
      const [totalTecnicos, totalHomologados, equipment, pendentesDevolucao] = await Promise.all([
        prisma.tecnicos_terceirizados.count({ where: { ativo: true } }),
        prisma.tecnicos_terceirizados.count({ where: { ativo: true, homologado: true } }),
        prisma.tecnico_equipamentos.aggregate({ _sum: { quantidade: true } }),
        prisma.ordens_servicos_terceirizados.count({
          where: { status: 'Realizado', exige_devolucao: true, equipamento_devolvido: false }
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          totalTecnicos,
          totalHomologados,
          totalEquipamentos: equipment._sum.quantidade || 0,
          pendentesDevolucao
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/ordens-servicos', async (req, res, next) => {
    try {
      const { tecnico_id, status, pendente_devolucao, busca, page, limit } = req.query;

      const where = {};

      if (tecnico_id && tecnico_id.trim()) {
        where.tecnico_id = tecnico_id.trim();
      }

      if (status && status.trim()) {
        where.status = status.trim();
      }

      if (pendente_devolucao === 'true' || pendente_devolucao === true) {
        where.status = 'Realizado';
        where.exige_devolucao = true;
        where.equipamento_devolvido = false;
      }

      if (busca && busca.trim()) {
        where.OR = [
          { placa: { contains: busca.trim(), mode: 'insensitive' } },
          { numero_os: { contains: busca.trim(), mode: 'insensitive' } },
          { numero_nf: { contains: busca.trim(), mode: 'insensitive' } },
          { unidade: { contains: busca.trim(), mode: 'insensitive' } }
        ];
      }

      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
      const skip = (p - 1) * l;

      const [total, ordens] = await Promise.all([
        prisma.ordens_servicos_terceirizados.count({ where }),
        prisma.ordens_servicos_terceirizados.findMany({
          where,
          include: {
            tecnico: {
              select: {
                id: true,
                nome: true,
                regiao: true,
                homologado: true
              }
            }
          },
          orderBy: { criado_em: 'desc' },
          skip,
          take: l
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          ordens,
          pagination: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Lançar nova Ordem de Serviço para um técnico
  router.post('/ordens-servicos', async (req, res, next) => {
    try {
      const input = orderSchema.parse(req.body);
      const equips = consolidateEquipment(input.equipamentos_utilizados);

      // Execução transacional
      const novaOS = await prisma.$transaction(async (tx) => {
        const servico = await tx.tecnico_servicos_precos.findFirst({
          where: { id: input.servico_id, tecnico_id: input.tecnico_id },
          select: { id: true, nome_servico: true, valor: true, gera_devolucao: true, is_km: true }
        });
        if (!servico) throw httpError(404, 'Serviço não encontrado na tabela deste técnico.');
        if (servico.is_km) throw httpError(400, 'Selecione um serviço principal; KM é calculado separadamente.');

        const kmService = input.teve_km_rodado
          ? await tx.tecnico_servicos_precos.findFirst({
            where: { tecnico_id: input.tecnico_id, is_km: true },
            orderBy: { criado_em: 'asc' },
            select: { valor: true }
          })
          : null;
        if (input.teve_km_rodado && !kmService) {
          throw httpError(400, 'Este técnico não possui uma tarifa de KM cadastrada.');
        }

        const vServico = Number(servico.valor);
        const qKm = input.teve_km_rodado ? input.km_quantidade : 0;
        const vKmUnit = kmService ? Number(kmService.valor) : 0;
        const vKmTotal = Number((qKm * vKmUnit).toFixed(2));
        const vTotal = Number((vServico + vKmTotal).toFixed(2));

        // Se a O.S. já entrar como "Realizado", realiza a baixa dos equipamentos do estoque do técnico
        if (input.status === 'Realizado' && equips.length > 0) {
          await decrementEquipmentStock(
            tx,
            input.tecnico_id,
            equips,
            `Baixa automática O.S. ${input.numero_os} (Placa: ${input.placa})`
          );
        }

        return tx.ordens_servicos_terceirizados.create({
          data: {
            numero_os: input.numero_os,
            tecnico_id: input.tecnico_id,
            servico_id: servico.id,
            placa: input.placa,
            uf: input.uf || null,
            unidade: input.unidade || null,
            tipo_veiculo: input.tipo_veiculo || null,
            nome_servico: servico.nome_servico,
            valor_servico: vServico,
            teve_km_rodado: input.teve_km_rodado,
            km_quantidade: qKm,
            valor_km_unitario: vKmUnit,
            valor_km_total: vKmTotal,
            valor_total_cobrado: vTotal,
            numero_nf: input.numero_nf || null,
            status: input.status,
            equipamentos_utilizados: equips.length > 0 ? equips : null,
            exige_devolucao: servico.gera_devolucao,
            equipamento_devolvido: false
          },
          include: {
            tecnico: {
              select: { id: true, nome: true, regiao: true }
            }
          }
        });
      }, { maxWait: 10000, timeout: 30000 });

      res.status(201).json({
        status: 'success',
        message: 'Ordem de Serviço cadastrada com sucesso!',
        data: { ordem_servico: novaOS }
      });
    } catch (error) {
      next(error);
    }
  });

  // Atualizar Status da O.S. (com baixa automática de estoque ao marcar como "Realizado")
  router.patch('/ordens-servicos/:id/status', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = z.object({
        status: z.enum(['Agendado', 'Aguardando data', 'Realizado'])
      }).strict().parse(req.body);

      const osAtualizada = await prisma.$transaction(async (tx) => {
        const current = await tx.ordens_servicos_terceirizados.findUnique({ where: { id } });
        if (!current) throw httpError(404, 'Ordem de serviço não encontrada.');

        if (current.status === 'Realizado' && status !== 'Realizado') {
          throw httpError(409, 'Uma O.S. realizada não pode voltar para um status anterior.');
        }

        if (status === 'Realizado' && current.status !== 'Realizado') {
          const claim = await tx.ordens_servicos_terceirizados.updateMany({
            where: { id, status: { not: 'Realizado' } },
            data: { status: 'Realizado' }
          });
          if (claim.count !== 1) throw httpError(409, 'Esta O.S. já foi concluída por outra operação.');

          const equips = consolidateEquipment(
            Array.isArray(current.equipamentos_utilizados)
              ? orderSchema.shape.equipamentos_utilizados.parse(current.equipamentos_utilizados)
              : []
          );
          await decrementEquipmentStock(
            tx,
            current.tecnico_id,
            equips,
            `Baixa na conclusão da O.S. ${current.numero_os} (Placa: ${current.placa})`
          );
        } else if (current.status !== status) {
          await tx.ordens_servicos_terceirizados.update({ where: { id }, data: { status } });
        }

        return tx.ordens_servicos_terceirizados.findUnique({
          where: { id },
          include: {
            tecnico: {
              select: { id: true, nome: true, regiao: true }
            }
          }
        });
      }, { maxWait: 10000, timeout: 30000 });

      res.status(200).json({
        status: 'success',
        message: `Status da O.S. atualizado para "${status}".`,
        data: { ordem_servico: osAtualizada }
      });
    } catch (error) {
      next(error);
    }
  });

  // Confirmar recebimento do equipamento retirado (Logística Reversa / Manutenção)
  router.patch('/ordens-servicos/:id/confirmar-devolucao', async (req, res, next) => {
    try {
      const { id } = req.params;
      const userName = req.user?.name || 'Operador Solar';

      const updated = await prisma.ordens_servicos_terceirizados.updateMany({
        where: {
          id,
          status: 'Realizado',
          exige_devolucao: true,
          equipamento_devolvido: false
        },
        data: {
          equipamento_devolvido: true,
          data_devolucao: new Date(),
          usuario_devolucao: userName
        }
      });

      if (updated.count !== 1) {
        return res.status(409).json({
          status: 'error',
          message: 'A O.S. não está realizada, não exige devolução ou já foi confirmada.'
        });
      }

      const osFinalizada = await prisma.ordens_servicos_terceirizados.findUnique({
        where: { id },
        include: {
          tecnico: {
            select: { id: true, nome: true, regiao: true }
          }
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Devolução de equipamento confirmada com sucesso! Logística reversa finalizada.',
        data: { ordem_servico: osFinalizada }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
