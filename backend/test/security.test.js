import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { authenticateToken, invalidateSessionCache, JWT_AUDIENCE, JWT_ISSUER } from '../middleware/auth.js';
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

test('session caching prevents duplicate database hits and respects invalidation', async () => {
  let dbHits = 0;
  const mockUser = { ...user, id: 'cached-user-test-id' };
  const mockToken = jwt.sign(
    { sessionVersion: 2 },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE, subject: mockUser.id, expiresIn: '5m' }
  );

  const prisma = {
    user: {
      findUnique: async () => {
        dbHits++;
        return mockUser;
      }
    }
  };

  // Primeira chamada: busca no banco
  const auth1 = await authenticateToken(prisma, mockToken);
  assert.equal(auth1.id, mockUser.id);
  assert.equal(dbHits, 1);

  // Segunda chamada: vem do cache em memória (dbHits continua 1)
  const auth2 = await authenticateToken(prisma, mockToken);
  assert.equal(auth2.id, mockUser.id);
  assert.equal(dbHits, 1);

  // Invalida o cache
  invalidateSessionCache(mockUser.id);

  // Terceira chamada: deve buscar no banco novamente (dbHits incrementa para 2)
  const auth3 = await authenticateToken(prisma, mockToken);
  assert.equal(auth3.id, mockUser.id);
  assert.equal(dbHits, 2);
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
