import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback: Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Você não está autenticado. Por favor, faça login para acessar.'
      });
    }

    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-fallback-secret-key-change-in-production');
    if (!secret) {
      throw new Error('JWT_SECRET não está configurado nas variáveis de ambiente.');
    }

    // Verify token
    const decoded = jwt.verify(token, secret);

    // Attach user payload to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      can_access_gestao_solar: decoded.can_access_gestao_solar
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido ou expirado. Por favor, faça login novamente.'
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para realizar esta ação.'
      });
    }
    next();
  };
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
