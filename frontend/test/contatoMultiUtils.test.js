import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizarNome,
  normalizarTelefone,
  telefonesCoincidem,
  formatarTelefoneExibicao,
  agruparResponsaveisMultiUnidade
} from '../src/utils/contatoMultiUtils.js';

test('normalizarNome remove acentos, espaços extras e converte para minúsculas', () => {
  assert.equal(normalizarNome('  Carlos  Eduardo  '), 'carlos eduardo');
  assert.equal(normalizarNome('Álvaro José de Sá'), 'alvaro jose de sa');
  assert.equal(normalizarNome(null), '');
});

test('normalizarTelefone extrai dígitos e sanitiza DDI/zeros', () => {
  assert.equal(normalizarTelefone('(85) 99876-5432'), '85998765432');
  assert.equal(normalizarTelefone('+55 85 99876-5432'), '85998765432');
  assert.equal(normalizarTelefone('085 99876-5432'), '85998765432');
  assert.equal(normalizarTelefone(null), '');
});

test('telefonesCoincidem valida correspondência com tolerância a formatos', () => {
  // Mesmo DDD e número
  assert.equal(telefonesCoincidem('(85) 99876-5432', '85998765432'), true);
  assert.equal(telefonesCoincidem('+5585998765432', '(85) 99876-5432'), true);

  // DDDs diferentes não devem coincidir mesmo com final igual
  assert.equal(telefonesCoincidem('(85) 99876-5432', '(88) 99876-5432'), false);

  // Número inválido ou muito curto (< 8 dígitos) não coincide
  assert.equal(telefonesCoincidem('1234', '1234'), false);
  assert.equal(telefonesCoincidem(null, '85998765432'), false);
});

test('formatarTelefoneExibicao aplica máscara legível', () => {
  assert.equal(formatarTelefoneExibicao('85998765432'), '(85) 99876-5432');
  assert.equal(formatarTelefoneExibicao('8532221234'), '(85) 3222-1234');
});

test('agruparResponsaveisMultiUnidade aplica dupla validação estrita (Nome + Telefone)', () => {
  const unidades = [
    {
      nome_unidade: 'Unidade Fortaleza',
      uf: 'CE',
      contatos: [
        { id: 1, nome: 'Carlos Eduardo', telefone: '(85) 99876-5432', principal: true },
        { id: 2, nome: 'Maria Sem Telefone', telefone: '', principal: false }
      ],
      falhas: [{ placa: 'ABC1234', status_tratativa: 'Pendente de Contato' }]
    },
    {
      nome_unidade: 'Unidade Caucaia',
      uf: 'CE',
      contatos: [
        { id: 3, nome: 'carlos eduardo', telefone: '85998765432', principal: true },
        { id: 4, nome: 'Maria Sem Telefone', telefone: null, principal: false }
      ],
      falhas: [{ placa: 'DEF5678', status_tratativa: 'Oficina' }]
    },
    {
      nome_unidade: 'Unidade Sobral',
      uf: 'CE',
      contatos: [
        // Carlos com DDD diferente (88) não pode agrupar com o Carlos de Fortaleza (85)
        { id: 5, nome: 'Carlos Eduardo', telefone: '(88) 99876-5432', principal: true }
      ],
      falhas: [{ placa: 'GHI9012', status_tratativa: 'Pendente de Contato' }]
    }
  ];

  const resultado = agruparResponsaveisMultiUnidade(unidades);

  // 1. Apenas Carlos Eduardo (85) possui 2 unidades (Fortaleza e Caucaia)
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].nome, 'Carlos Eduardo');
  assert.equal(resultado[0].totalUnidades, 2);
  assert.deepEqual(
    resultado[0].unidades.map((u) => u.nome_unidade),
    ['Unidade Fortaleza', 'Unidade Caucaia']
  );

  // 2. Maria Sem Telefone NÃO foi agrupada (dupla validação estrita protege contra falsos positivos)
  assert.equal(resultado.some((r) => r.nome.includes('Maria')), false);

  // 3. Carlos Eduardo de Sobral (DDD 88) NÃO foi misturado com Carlos de Fortaleza (DDD 85)
  assert.equal(resultado[0].unidades.some((u) => u.nome_unidade === 'Unidade Sobral'), false);
});
