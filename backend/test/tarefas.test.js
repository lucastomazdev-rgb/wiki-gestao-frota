import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import createTarefasRouter from '../routes/tarefas.js';

function createTestApp({ user, prisma }) {
  const app = express();
  app.use(express.json());

  // Protect mock injeta req.user
  const mockProtect = (req, res, next) => {
    req.user = user;
    next();
  };

  app.use('/api/gestao-solar', createTarefasRouter(prisma, mockProtect));

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 400).json({ status: 'error', message: err.message });
  });

  return app;
}

// Helper fetch usando servidor local
async function withServer(app, fn) {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/gestao-solar`;
  try {
    await fn(baseUrl);
  } finally {
    server.close();
  }
}

test('Tarefas Security - Usuário sem Gestão Solar deve receber 403', async () => {
  const unauthorizedUser = {
    id: 'user-no-solar',
    email: 'nosolar@corpvs.com.br',
    role: 'USER',
    can_access_gestao_solar: false
  };

  const app = createTestApp({ user: unauthorizedUser, prisma: {} });

  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/tarefas`);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Acesso negado/);
  });
});

test('Tarefas Security - Usuário comum NÃO pode atribuir tarefa na criação', async () => {
  const normalUser = {
    id: 'user-normal-1',
    email: 'tecnico@corpvs.com.br',
    role: 'USER',
    can_access_gestao_solar: true
  };

  let capturedData = null;
  const mockPrisma = {
    tarefas: {
      create: async ({ data }) => {
        capturedData = data;
        return {
          id: 'b622c836-e822-48fb-9764-a69804e8d89a',
          ...data,
          created_at: new Date()
        };
      }
    }
  };

  const app = createTestApp({ user: normalUser, prisma: mockPrisma });

  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Verificar rastreador',
        descricao: 'Teste',
        atribuido_a: '00000000-0000-0000-0000-000000000001' // Tentativa de atribuição
      })
    });

    assert.equal(res.status, 201);
    assert.equal(capturedData.criado_por, normalUser.id);
    assert.equal(capturedData.atribuido_a, null, 'atribuido_a DEVE ser null para usuários não-admin');
  });
});

test('Tarefas Security - ADM PODE atribuir tarefa na criação', async () => {
  const adminUser = {
    id: 'user-admin',
    email: 'admin@corpvs.com.br',
    role: 'ADMIN',
    can_access_gestao_solar: true
  };

  let capturedData = null;
  const targetUserId = '11111111-1111-1111-1111-111111111111';
  const mockPrisma = {
    tarefas: {
      create: async ({ data }) => {
        capturedData = data;
        return {
          id: 'b622c836-e822-48fb-9764-a69804e8d89b',
          ...data,
          created_at: new Date()
        };
      }
    }
  };

  const app = createTestApp({ user: adminUser, prisma: mockPrisma });

  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Demanda de Frota',
        atribuido_a: targetUserId
      })
    });

    assert.equal(res.status, 201);
    assert.equal(capturedData.atribuido_a, targetUserId, 'ADM deve ter permissão de definir atribuido_a');
  });
});

test('Tarefas Security - Usuário comum NÃO pode editar nem excluir tarefa de outro usuário', async () => {
  const userA = {
    id: 'user-a',
    email: 'usera@corpvs.com.br',
    role: 'USER',
    can_access_gestao_solar: true
  };

  const existingTaskOfUserB = {
    id: 'task-of-user-b',
    titulo: 'Tarefa do Usuário B',
    descricao: 'Segredo B',
    criado_por: 'user-b',
    status: 'Demandas'
  };

  const mockPrisma = {
    tarefas: {
      findUnique: async () => existingTaskOfUserB,
      update: async () => {},
      delete: async () => {}
    }
  };

  const app = createTestApp({ user: userA, prisma: mockPrisma });

  await withServer(app, async (baseUrl) => {
    // 1. Tentar editar descrição
    const resPut = await fetch(`${baseUrl}/tarefas/${existingTaskOfUserB.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: 'Hack' })
    });
    assert.equal(resPut.status, 403);
    const bodyPut = await resPut.json();
    assert.match(bodyPut.message, /só possui permissão para editar demandas criadas por você/);

    // 2. Tentar mover no Kanban
    const resStatus = await fetch(`${baseUrl}/tarefas/${existingTaskOfUserB.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Concluído' })
    });
    assert.equal(resStatus.status, 403);
    const bodyStatus = await resStatus.json();
    assert.match(bodyStatus.message, /só possui permissão para mover no Kanban demandas criadas por você/);

    // 3. Tentar excluir
    const resDelete = await fetch(`${baseUrl}/tarefas/${existingTaskOfUserB.id}`, {
      method: 'DELETE'
    });
    assert.equal(resDelete.status, 403);
    const bodyDelete = await resDelete.json();
    assert.match(bodyDelete.message, /só possui permissão para excluir demandas criadas por você/);
  });
});

test('Tarefas Security - Usuário comum PODE editar, mover e excluir sua própria tarefa', async () => {
  const userA = {
    id: 'user-a',
    email: 'usera@corpvs.com.br',
    role: 'USER',
    can_access_gestao_solar: true
  };

  const ownTask = {
    id: 'task-of-user-a',
    titulo: 'Minha Tarefa',
    descricao: 'Minha Descrição',
    criado_por: 'user-a',
    status: 'Demandas'
  };

  let updateCalled = false;
  let deleteCalled = false;

  const mockPrisma = {
    tarefas: {
      findUnique: async () => ownTask,
      update: async ({ data }) => {
        updateCalled = true;
        return { ...ownTask, ...data, _count: { comentarios: 0 } };
      },
      delete: async () => {
        deleteCalled = true;
        return ownTask;
      }
    }
  };

  const app = createTestApp({ user: userA, prisma: mockPrisma });

  await withServer(app, async (baseUrl) => {
    // 1. Mover status
    const resStatus = await fetch(`${baseUrl}/tarefas/${ownTask.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Em andamento' })
    });
    assert.equal(resStatus.status, 200);
    assert.equal(updateCalled, true);

    // 2. Excluir tarefa própria
    const resDelete = await fetch(`${baseUrl}/tarefas/${ownTask.id}`, {
      method: 'DELETE'
    });
    assert.equal(resDelete.status, 200);
    assert.equal(deleteCalled, true);
  });
});

test('Tarefas Security - Apenas ADM pode utilizar a rota de reatribuição', async () => {
  const normalUser = {
    id: 'user-normal',
    email: 'user@corpvs.com.br',
    role: 'USER',
    can_access_gestao_solar: true
  };

  const app = createTestApp({ user: normalUser, prisma: {} });

  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/tarefas/any-id/atribuir`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atribuido_a: '00000000-0000-0000-0000-000000000001' })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Você não tem permissão para realizar esta ação/);
  });
});

test('Tarefas - Comentários são liberados para todos com acesso a Gestão Solar', async () => {
  const normalUser = {
    id: 'user-normal-commenter',
    email: 'comentador@corpvs.com.br',
    role: 'USER',
    can_access_gestao_solar: true
  };

  let commentCreated = null;
  const mockPrisma = {
    tarefas: {
      findUnique: async () => ({ id: 'tarefa-123', titulo: 'Tarefa' })
    },
    tarefa_comentarios: {
      create: async ({ data }) => {
        commentCreated = data;
        return { id: 'c-1', ...data, created_at: new Date(), usuario: { id: normalUser.id, email: normalUser.email } };
      }
    }
  };

  const app = createTestApp({ user: normalUser, prisma: mockPrisma });

  await withServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/tarefas/tarefa-123/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: 'Observação técnica do veículo realizada.' })
    });

    assert.equal(res.status, 201);
    assert.equal(commentCreated.tarefa_id, 'tarefa-123');
    assert.equal(commentCreated.usuario_id, normalUser.id);
    assert.equal(commentCreated.comentario, 'Observação técnica do veículo realizada.');
  });
});
