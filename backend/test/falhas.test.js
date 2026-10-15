import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import createFalhasRouter from '../routes/falhas.js';

const mockUserSolar = {
  id: 'user-solar',
  email: 'solar@corpvs.com.br',
  name: 'Solar Operator',
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

  const protect = (req, res, next) => {
    req.user = user;
    next();
  };

  app.use('/api/gestao-solar', createFalhasRouter(prisma, protect));

  app.use((err, req, res, next) => {
    if (err.name === 'ZodError') {
      return res.status(400).json({ status: 'error', errors: err.errors });
    }
    res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
  });

  return app;
};

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

test('Falhas Security - Usuário sem permissão Gestão Solar recebe 403', async () => {
  const prisma = {};
  const app = createMockApp(prisma, mockUserNoSolar);
  const res = await makeRequest(app, 'GET', '/api/gestao-solar/falhas');
  assert.equal(res.status, 403);
});

test('Falhas - Retorno inicial vazio quando não há lotes importados', async () => {
  const prisma = {
    falhas_lotes: {
      findFirst: async () => null,
      findMany: async () => []
    }
  };
  const app = createMockApp(prisma, mockUserSolar);
  const res = await makeRequest(app, 'GET', '/api/gestao-solar/falhas');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'success');
  assert.equal(res.data.data.lote, null);
  assert.equal(res.data.data.registros.length, 0);
  assert.equal(res.data.data.kpis.total, 0);
});

test('Falhas Importação - Classifica Nova Falha vs Falha Recorrente com base no lote anterior', async () => {
  let lotCreated = null;
  let recordsInserted = [];

  const prisma = {
    instalacoes: {
      findMany: async () => [
        {
          placa: 'ABC1234',
          unidades_clientes: { nome_unidade: 'Fortaleza', uf: 'CE' },
          modelos_rastreadores: { tipo_veiculo: 'CAMINHAO' }
        }
      ]
    },
    falhas_lotes: {
      findFirst: async ({ where }) => {
        // Lote anterior tem apenas 'lt', sem 'gte'
        if (where?.data_extracao?.lt && !where?.data_extracao?.gte) {
          return {
            id: 'lote-anterior-id',
            data_extracao: new Date('2026-10-07T00:00:00.000Z'),
            total_veiculos: 2,
            registros: [
              { placa: 'ABC1234' }, // Esta placa já existia na semana passada
              { placa: 'XYZ9999' }
            ]
          };
        }
        // Simula verificação se já existe hoje
        return null;
      }
    },
    $transaction: async (callback) => {
      const tx = {
        falhas_registros: {
          deleteMany: async () => {},
          createMany: async ({ data }) => {
            recordsInserted = data;
          }
        },
        instalacoes: {
      findMany: async () => [
        {
          placa: 'ABC1234',
          unidades_clientes: { nome_unidade: 'Fortaleza', uf: 'CE' },
          modelos_rastreadores: { tipo_veiculo: 'CAMINHAO' }
        }
      ]
    },
    falhas_lotes: {
          create: async ({ data }) => {
            lotCreated = { id: 'novo-lote-id', ...data };
            return lotCreated;
          },
          update: async ({ data }) => {
            lotCreated = { id: 'novo-lote-id', ...data };
            return lotCreated;
          },
          findMany: async () => [{ id: 'novo-lote-id', data_extracao: new Date() }],
          deleteMany: async () => {},
          findUnique: async () => lotCreated
        }
      };
      return callback(tx);
    }
  };

  const app = createMockApp(prisma, mockUserSolar);

  const payload = {
    data_extracao: '2026-10-15',
    descricao: 'Extração teste 15/10',
    registros: [
      { placa: 'ABC1234', unidade: 'Fortaleza', uf: 'CE', tipo_veiculo: 'CAMINHAO' }, // Deve ser RECORRENTE
      { placa: 'NEW5555', unidade: 'Maracanaú', uf: 'CE', tipo_veiculo: 'MOTO' }       // Deve ser NOVA FALHA
    ]
  };

  const res = await makeRequest(app, 'POST', '/api/gestao-solar/falhas/importar', payload);
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'success');
  assert.equal(res.data.data.resumo.falhas_recorrentes, 1);
  assert.equal(res.data.data.resumo.novas_falhas, 1);

  const regRecorrente = recordsInserted.find(r => r.placa === 'ABC1234');
  const regNova = recordsInserted.find(r => r.placa === 'NEW5555');

  assert.equal(regRecorrente.tipo_falha, 'FALHA RECORRENTE');
  assert.equal(regNova.tipo_falha, 'NOVA FALHA');
});

test('Falhas Retenção - Mantém no máximo 4 datas e descarta a mais antiga', async () => {
  let lotesDeletados = [];

  const prisma = {
    instalacoes: {
      findMany: async () => [
        {
          placa: 'ABC1234',
          unidades_clientes: { nome_unidade: 'Fortaleza', uf: 'CE' },
          modelos_rastreadores: { tipo_veiculo: 'CAMINHAO' }
        }
      ]
    },
    falhas_lotes: {
      findFirst: async () => null
    },
    $transaction: async (callback) => {
      const tx = {
        falhas_registros: {
          createMany: async () => {}
        },
        instalacoes: {
      findMany: async () => [
        {
          placa: 'ABC1234',
          unidades_clientes: { nome_unidade: 'Fortaleza', uf: 'CE' },
          modelos_rastreadores: { tipo_veiculo: 'CAMINHAO' }
        }
      ]
    },
    falhas_lotes: {
          create: async ({ data }) => ({ id: 'lote-5', ...data }),
          findMany: async () => [
            { id: 'lote-5', data_extracao: new Date('2026-10-15') },
            { id: 'lote-4', data_extracao: new Date('2026-10-07') },
            { id: 'lote-3', data_extracao: new Date('2026-09-30') },
            { id: 'lote-2', data_extracao: new Date('2026-09-23') },
            { id: 'lote-1', data_extracao: new Date('2026-09-16') } // 5º lote -> mais antigo
          ],
          deleteMany: async ({ where }) => {
            lotesDeletados = where.id.in;
          },
          findUnique: async () => ({ id: 'lote-5' })
        }
      };
      return callback(tx);
    }
  };

  const app = createMockApp(prisma, mockUserSolar);

  const payload = {
    data_extracao: '2026-10-15',
    registros: [{ placa: 'ABC1234' }]
  };

  const res = await makeRequest(app, 'POST', '/api/gestao-solar/falhas/importar', payload);
  assert.equal(res.status, 200);
  assert.deepEqual(lotesDeletados, ['lote-1']); // Excluiu a 5ª data mais antiga
});

test('Falhas KPIs - Contabiliza bateria crítica quando valor < 11V', async () => {
  const registrosSimulados = [
    { id: '1', placa: 'AAA0001', nivel_bateria: '0', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' },
    { id: '2', placa: 'AAA0002', nivel_bateria: '7,4', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' },
    { id: '3', placa: 'AAA0003', nivel_bateria: '10.5', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' },
    { id: '4', placa: 'AAA0004', nivel_bateria: '11', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' },
    { id: '5', placa: 'AAA0005', nivel_bateria: '11,6', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' },
    { id: '6', placa: 'AAA0006', nivel_bateria: '14', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' },
    { id: '7', placa: 'AAA0007', nivel_bateria: 'Crítica', uf: 'CE', unidade: 'Fortaleza', tipo_veiculo: 'CAMINHAO', tipo_falha: 'NOVA FALHA', status_tratativa: 'Pendente de Contato' }
  ];

  const prisma = {
    falhas_lotes: {
      findFirst: async () => ({ id: 'lote-1', data_extracao: new Date('2026-10-15') }),
      findUnique: async () => ({ id: 'lote-1', data_extracao: new Date('2026-10-15') }),
      findMany: async () => [{ id: 'lote-1', data_extracao: new Date('2026-10-15') }]
    },
    falhas_registros: {
      findMany: async () => registrosSimulados,
      count: async () => registrosSimulados.length
    }
  };

  const app = createMockApp(prisma, mockUserSolar);
  const res = await makeRequest(app, 'GET', '/api/gestao-solar/falhas?lote_id=lote-1');

  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'success');
  // '0', '7,4', '10.5', e 'Crítica' são < 11V ou texto crítico -> Total = 4
  assert.equal(res.data.data.kpis.bateria_baixa, 4);
});

test('Falhas Tratativa em Massa - Busca placas por unidade e atualiza múltiplos veículos', async () => {
  let updateDataCapturado = null;
  let updateWhereCapturado = null;

  const prisma = {
    falhas_lotes: {
      findFirst: async () => ({ id: 'lote-1' })
    },
    falhas_registros: {
      findMany: async ({ where }) => {
        if (where?.unidade === 'Maracanaú') {
          return [
            { id: '11111111-1111-1111-1111-111111111111', placa: 'ABC1D23', unidade: 'Maracanaú' },
            { id: '22222222-2222-2222-2222-222222222222', placa: 'XYZ9K87', unidade: 'Maracanaú' }
          ];
        }
        return [];
      },
      updateMany: async ({ where, data }) => {
        updateWhereCapturado = where;
        updateDataCapturado = data;
        return { count: where.id.in.length };
      }
    }
  };

  const app = createMockApp(prisma, mockUserSolar);

  // 1. Busca placas da unidade
  const resGet = await makeRequest(app, 'GET', '/api/gestao-solar/falhas/placas-unidade?unidade=Maracanaú');
  assert.equal(resGet.status, 200);
  assert.equal(resGet.data.data.length, 2);
  assert.equal(resGet.data.data[0].placa, 'ABC1D23');

  // 2. Atualização em massa
  const payloadMassa = {
    ids: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
    status_tratativa: 'Agendado Manutenção',
    data_contato: '2026-10-15'
  };
  const resPut = await makeRequest(app, 'PUT', '/api/gestao-solar/falhas/registros-massa', payloadMassa);
  assert.equal(resPut.status, 200);
  assert.equal(resPut.data.data.count, 2);
  assert.equal(updateDataCapturado.status_tratativa, 'Agendado Manutenção');
  assert.deepEqual(updateWhereCapturado.id.in, payloadMassa.ids);
});

test('Falhas Contato por Unidade - Atualiza apenas Pendentes para Aguardando Retorno e mantém tratativas existentes', async () => {
  const updates = [];
  const prisma = {
    falhas_registros: {
      updateMany: async ({ where, data }) => {
        updates.push({ where, data });
        if (where.status_tratativa === 'Pendente de Contato') {
          return { count: 3 };
        }
        return { count: 2 };
      }
    }
  };

  const app = createMockApp(prisma, mockUserSolar);

  const payload = {
    lote_id: '11111111-1111-1111-1111-111111111111',
    unidade: 'Maracanaú',
    contato_nome: 'Carlos Silva'
  };

  const res = await makeRequest(app, 'POST', '/api/gestao-solar/falhas/contato-unidade', payload);
  assert.equal(res.status, 200);
  assert.equal(res.data.data.pendentes_atualizados, 3);
  assert.equal(res.data.data.tratativas_mantidas, 2);

  // Verifica que o primeiro update focou exclusivamente nos registros 'Pendente de Contato'
  assert.equal(updates[0].where.unidade, 'Maracanaú');
  assert.equal(updates[0].where.status_tratativa, 'Pendente de Contato');
  assert.equal(updates[0].data.status_tratativa, 'Aguardando Retorno');

  // Verifica que o segundo update atuou nos registros com tratativas prévias mantendo o status original
  assert.deepEqual(updates[1].where.status_tratativa, { not: 'Pendente de Contato' });
  assert.equal(updates[1].data.status_tratativa, undefined); // Não altera status
  assert.ok(updates[1].data.data_contato);
});

test('Falhas Importação - Parse de Datas Brasileiras e Serial Excel em ultima_transmissao', async () => {
  let recordsInserted = [];

  const prisma = {
    instalacoes: {
      findMany: async () => []
    },
    falhas_lotes: {
      findFirst: async () => null,
      create: async ({ data }) => ({ id: 'novo-lote-teste', ...data }),
      findMany: async () => [{ id: 'novo-lote-teste', data_extracao: new Date() }],
      deleteMany: async () => {},
      findUnique: async () => ({ id: 'novo-lote-teste' })
    },
    $transaction: async (callback) => {
      const tx = {
        falhas_registros: {
          deleteMany: async () => {},
          createMany: async ({ data }) => {
            recordsInserted = data;
          }
        },
        instalacoes: {
          findMany: async () => []
        },
        falhas_lotes: {
          create: async ({ data }) => ({ id: 'novo-lote-teste', ...data }),
          findMany: async () => [{ id: 'novo-lote-teste', data_extracao: new Date() }],
          deleteMany: async () => {},
          findUnique: async () => ({ id: 'novo-lote-teste' })
        }
      };
      return callback(tx);
    }
  };

  const app = createMockApp(prisma, mockUserSolar);

  const payload = {
    data_extracao: '15/10/2026',
    descricao: 'Teste Datas',
    registros: [
      {
        placa: 'BRA1331',
        ultima_transmissao: '15/10/2026 14:32:00', // Dia >= 13 (anteriormente falhava com Invalid Date -> null)
        nivel_bateria: '12.5V'
      },
      {
        placa: 'BRA0510',
        ultima_transmissao: '05/10/2026 08:00:00', // Dia <= 12 (não deve inverter mês e dia)
        nivel_bateria: '10.8V'
      },
      {
        placa: 'ISO2026',
        ultima_transmissao: '2026-10-15T18:00:00.000Z', // ISO String
        nivel_bateria: '12.1V'
      },
      {
        placa: 'XLS4558',
        ultima_transmissao: 45580.605, // Serial Excel numérico
        nivel_bateria: '11.9V'
      }
    ]
  };

  const res = await makeRequest(app, 'POST', '/api/gestao-solar/falhas/importar', payload);
  assert.equal(res.status, 200);
  assert.equal(recordsInserted.length, 4);

  // 1. Registro com dia 15 (>= 13)
  const regDia15 = recordsInserted.find(r => r.placa === 'BRA1331');
  assert.ok(regDia15.ultima_transmissao instanceof Date, 'Data com dia >= 13 deve ser instanciada como Date');
  assert.equal(regDia15.ultima_transmissao.toISOString(), '2026-10-15T14:32:00.000Z');

  // 2. Registro com dia 05 (<= 12)
  const regDia05 = recordsInserted.find(r => r.placa === 'BRA0510');
  assert.ok(regDia05.ultima_transmissao instanceof Date);
  assert.equal(regDia05.ultima_transmissao.toISOString(), '2026-10-05T08:00:00.000Z');

  // 3. Registro ISO
  const regIso = recordsInserted.find(r => r.placa === 'ISO2026');
  assert.ok(regIso.ultima_transmissao instanceof Date);
  assert.equal(regIso.ultima_transmissao.toISOString(), '2026-10-15T18:00:00.000Z');

  // 4. Registro Serial Excel
  const regXls = recordsInserted.find(r => r.placa === 'XLS4558');
  assert.ok(regXls.ultima_transmissao instanceof Date);
  assert.equal(regXls.ultima_transmissao.getUTCFullYear(), 2024);
  assert.equal(regXls.ultima_transmissao.getUTCMonth(), 9); // Outubro
});

test('Falhas Resumo Contatos - Retorna registros leves com 6 colunas para agrupamento eficiente', async () => {
  let selectCaptured = null;
  const prisma = {
    falhas_lotes: {
      findFirst: async () => ({ id: 'lote-123' })
    },
    falhas_registros: {
      findMany: async ({ where, select }) => {
        selectCaptured = select;
        return [
          { id: '1', placa: 'ABC1234', unidade: 'Fortaleza', uf: 'CE', tipo_veiculo: 'CAMINHAO', status_tratativa: 'Pendente de Contato' }
        ];
      }
    }
  };

  const app = createMockApp(prisma, mockUserSolar);
  const res = await makeRequest(app, 'GET', '/api/gestao-solar/falhas/resumo-contatos?lote_id=lote-123');

  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'success');
  assert.equal(res.data.data.length, 1);
  assert.equal(res.data.data[0].placa, 'ABC1234');
  assert.ok(selectCaptured.placa && selectCaptured.unidade && selectCaptured.status_tratativa);
  assert.equal(selectCaptured.observacao, undefined, 'Não deve carregar campos pesados desnecessários');
});

