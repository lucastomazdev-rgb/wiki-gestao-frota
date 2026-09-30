import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import createAgendamentosRouter from '../routes/agendamentos.js';

const mockUserSolar = {
  id: 'user-solar',
  email: 'solar@corpvs.com.br',
  name: 'Solar Manager',
  role: 'USER',
  can_access_gestao_solar: true
};

const mockUserNoSolar = {
  id: 'user-nosolar',
  email: 'nosolar@corpvs.com.br',
  name: 'Regular User',
  role: 'USER',
  can_access_gestao_solar: false
};

const createMockApp = (prisma, user = mockUserSolar) => {
  const app = express();
  app.use(express.json());

  // Protect middleware mock
  const protect = (req, res, next) => {
    req.user = user;
    next();
  };

  app.use('/api/gestao-solar', createAgendamentosRouter(prisma, protect));

  // Error handler
  app.use((err, req, res, next) => {
    if (err.name === 'ZodError') {
      return res.status(400).json({ status: 'error', errors: err.errors });
    }
    res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
  });

  return app;
};

// Helper for native fetch in tests
const makeRequest = async (app, method, url, body = null) => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`http://127.0.0.1:${port}${url}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } finally {
    server.close();
  }
};

test('Agendamentos Security - Usuário sem Gestão Solar deve receber 403', async () => {
  const prisma = {};
  const app = createMockApp(prisma, mockUserNoSolar);
  const res = await makeRequest(app, 'GET', '/api/gestao-solar/agendamentos');
  assert.equal(res.status, 403);
});

test('Agendamentos Validation - Validação Zod rejeita placa ou contato inválidos', async () => {
  const prisma = {};
  const app = createMockApp(prisma, mockUserSolar);
  
  // Placa curta demais
  const res1 = await makeRequest(app, 'POST', '/api/gestao-solar/agendamentos', {
    placa: 'A',
    nome_responsavel: 'Carlos',
    contato_responsavel: '(85) 9 9999-9999',
    servico: 'Manutenção',
    tipo_tecnico: 'CORPVS',
    tecnico_id: '11111111-1111-1111-1111-111111111111'
  });
  assert.equal(res1.status, 400);

  // Contato curto demais
  const res2 = await makeRequest(app, 'POST', '/api/gestao-solar/agendamentos', {
    placa: 'ABC1234',
    nome_responsavel: 'Carlos',
    contato_responsavel: '123',
    servico: 'Manutenção',
    tipo_tecnico: 'CORPVS',
    tecnico_id: '11111111-1111-1111-1111-111111111111'
  });
  assert.equal(res2.status, 400);
});

test('Agendamentos CRUD - Criação e consulta de Técnico CORPVS', async () => {
  const tecnicosDb = [];
  const prisma = {
    tecnicos_corpvs: {
      findMany: async () => tecnicosDb.filter(t => t.ativo),
      findFirst: async ({ where }) => tecnicosDb.find(t => t.nome.toLowerCase() === where.nome.equals.toLowerCase()),
      create: async ({ data }) => {
        const item = { id: 'tec-uuid-1', ...data };
        tecnicosDb.push(item);
        return item;
      }
    }
  };

  const app = createMockApp(prisma, mockUserSolar);

  // Criar técnico Corpvs
  const resPost = await makeRequest(app, 'POST', '/api/gestao-solar/tecnicos-corpvs', {
    nome: 'João da Silva'
  });
  assert.equal(resPost.status, 201);
  assert.equal(resPost.data.data.tecnico.nome, 'João da Silva');

  // Listar técnicos
  const resGet = await makeRequest(app, 'GET', '/api/gestao-solar/tecnicos-corpvs');
  assert.equal(resGet.status, 200);
  assert.equal(resGet.data.data.tecnicos.length, 1);
});

test('Agendamentos KPIs - Contagem agrupada correta de status', async () => {
  const prisma = {
    agendamentos: {
      count: async (query) => {
        if (!query) return 10; // Total
        if (query.where?.status === 'Realizado') return 4;
        if (query.where?.status === 'Agendado') return 3;
        if (query.where?.status === 'Aguardando Data') return 1;
        if (query.where?.status === 'Aguardando Técnico') return 1;
        if (query.where?.status === 'Frustrado') return 1;
        return 0;
      }
    }
  };

  const app = createMockApp(prisma, mockUserSolar);
  const res = await makeRequest(app, 'GET', '/api/gestao-solar/agendamentos/kpis');
  assert.equal(res.status, 200);
  assert.equal(res.data.data.total, 10);
  assert.equal(res.data.data.realizados, 4);
  assert.equal(res.data.data.pendentes, 5); // 3 + 1 + 1
  assert.equal(res.data.data.frustrados, 1);
});
