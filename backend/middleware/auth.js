import jwt from 'jsonwebtoken';

export const JWT_ISSUER = 'wiki-gestao-frota-api';
export const JWT_AUDIENCE = 'wiki-gestao-frota-web';

const getJwtSecret = () => process.env.JWT_SECRET
  || (process.env.NODE_ENV === 'production' ? null : 'dev-fallback-secret-key-change-in-production');

export const readRequestToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;

  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  return null;
};

export const authenticateToken = async (prisma, token) => {
  const secret = getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET não está configurado.');

  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });

  if (!decoded.sub) throw new Error('Token sem identificador de usuário.');

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      can_access_gestao_solar: true,
      sessionVersion: true
    }
  });

  if (!user || user.sessionVersion !== decoded.sessionVersion) {
    throw new Error('Sessão revogada.');
  }

  return {
    ...user,
    can_access_gestao_solar: user.role === 'ADMIN' || Boolean(user.can_access_gestao_solar)
  };
};

export const createProtect = (prisma) => async (req, res, next) => {
  try {
    const token = readRequestToken(req);
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Você não está autenticado. Faça login para acessar.'
      });
    }

    req.user = await authenticateToken(prisma, token);
    return next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Sessão inválida, expirada ou revogada. Faça login novamente.'
    });
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Você não tem permissão para realizar esta ação.'
    });
  }
  return next();
};

export const restrictToGestaoSolar = (req, res, next) => {
  if (req.user?.role === 'ADMIN' || req.user?.can_access_gestao_solar) {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    message: 'Acesso negado. Seu usuário não tem permissão para acessar o módulo Gestão Solar.'
  });
};
