import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { authenticateToken, JWT_AUDIENCE, JWT_ISSUER } from '../middleware/auth.js';
import { validateIdentityDocument, validateTutorialFile } from '../services/storage.js';

process.env.JWT_SECRET = 'test-secret-that-is-definitely-longer-than-32-chars';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'User',
  role: 'USER',
  can_access_gestao_solar: true,
  sessionVersion: 2
};

const sign = (sessionVersion = 2) => jwt.sign(
  { sessionVersion },
  process.env.JWT_SECRET,
  { algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE, subject: user.id, expiresIn: '5m' }
);

test('authentication loads current permissions from the database', async () => {
  const prisma = { user: { findUnique: async () => user } };
  const authenticated = await authenticateToken(prisma, sign());
  assert.equal(authenticated.id, user.id);
  assert.equal(authenticated.can_access_gestao_solar, true);
});

test('authentication rejects a revoked session version', async () => {
  const prisma = { user: { findUnique: async () => user } };
  await assert.rejects(() => authenticateToken(prisma, sign(1)), /revogada/);
});

test('identity uploads validate file signatures, not only MIME', () => {
  assert.equal(validateIdentityDocument({ mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.7') }), 'pdf');
  assert.throws(
    () => validateIdentityDocument({ mimetype: 'application/pdf', buffer: Buffer.from('<script>') }),
    /Documento inválido/
  );
});

test('tutorial uploads reject executable extensions', () => {
  assert.equal(validateTutorialFile({ originalname: 'perfil.xvm', buffer: Buffer.from('safe') }), 'xvm');
  assert.throws(() => validateTutorialFile({ originalname: 'malware.exe', buffer: Buffer.from('MZ') }), /não permitido/);
});
