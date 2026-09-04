import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeRowsToCsv } from '../src/utils/exportCsv.js';

test('CSV export escapes delimiters, quotes and spreadsheet formulas', () => {
  const csv = serializeRowsToCsv([{ Nome: 'A; B', Valor: '=2+2', Texto: 'ele disse "oi"' }]);
  assert.match(csv, /"A; B"/);
  assert.match(csv, /"'=2\+2"/);
  assert.match(csv, /"ele disse ""oi"""/);
});
