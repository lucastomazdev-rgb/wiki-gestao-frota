import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authenticateToken,
  createProtect,
  JWT_AUDIENCE,
  JWT_ISSUER,
  readRequestToken,
  restrictTo
} from './middleware/auth.js';
import createGestaoSolarRouter from './routes/gestaoSolar.js';
import createTecnicosTerceirizadosRouter from './routes/tecnicosTerceirizados.js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-fallback-secret-key-change-in-production');
const JWT_EXPIRES_IN = '12h';
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-only-password-value', 12);
const protect = createProtect(prisma);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE_MS
};

const signSessionToken = (user) => jwt.sign(
  { sessionVersion: user.sessionVersion },
  JWT_SECRET,
  {
    algorithm: 'HS256',
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    subject: user.id,
    expiresIn: JWT_EXPIRES_IN
  }
);

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('ERRO CRÍTICO: JWT_SECRET não configurado em ambiente de produção!');
  process.exit(1);
}

app.disable('x-powered-by');

// 🛡️ Security Middleware - Helmet HTTP Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 🌐 Suporte a Proxy Reverso (Render / Vercel / Cloudflare) para rate-limit e cookies seguros
app.set('trust proxy', 1);

// 🔒 SEO Privado - Forçar cabeçalho X-Robots-Tag em todas as respostas da API
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  next();
});

// Validação de segurança para chave secreta JWT
if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET || JWT_SECRET === 'dev-fallback-secret-key-change-in-production' || JWT_SECRET.length < 32) {
    console.error('ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET ausente ou vulnerável em ambiente de produção! Defina uma chave secreta com ao menos 32 caracteres.');
    process.exit(1);
  }
}

// ⚡ Rate Limiter Global para rotas da API (Proteção contra DoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // adequado para ~7 usuários atrás do mesmo IP corporativo
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas requisições enviadas por este IP. Por favor, tente novamente em alguns instantes.'
  }
});
app.use('/api', apiLimiter);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// ⚡ Rate Limiting estrito para Login e Rotas de Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de login/registro a partir deste IP. Por favor, tente novamente após 15 minutos.'
  }
});

// Middleware de CORS com validação estrita de origens
const configuredClientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(u => u.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...configuredClientUrls
];
const allowedOriginSet = new Set(allowedOrigins.map(origin => origin.replace(/\/+$/, '')));

app.use(cors({
  origin: (origin, callback) => {
    // Permitir chamadas sem cabeçalho Origin (curl, server-to-server, health-checks)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Verificar correspondência exata com origens permitidas
    if (allowedOriginSet.has(normalizedOrigin)) {
      return callback(null, true);
    }

    // Permitir padrão regex configurado via variável de ambiente (se fornecido, ex: preview Vercel)
    if (process.env.ALLOWED_ORIGIN_REGEX) {
      try {
        if (new RegExp(process.env.ALLOWED_ORIGIN_REGEX).test(normalizedOrigin)) {
          return callback(null, true);
        }
      } catch (regexErr) {
        console.error('ALLOWED_ORIGIN_REGEX inválido:', regexErr.message);
      }
    }

    const error = new Error('Origem não permitida pela política CORS.');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Setup-Token']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const origin = req.get('origin')?.replace(/\/+$/, '');
  if (origin && allowedOriginSet.has(origin)) return next();
  if (origin && process.env.ALLOWED_ORIGIN_REGEX) {
    try {
      if (new RegExp(process.env.ALLOWED_ORIGIN_REGEX).test(origin)) return next();
    } catch {}
  }
  if (!origin && (
    req.get('x-requested-with') === 'XMLHttpRequest'
    || req.get('authorization')?.startsWith('Bearer ')
  )) return next();

  return res.status(403).json({
    status: 'error',
    message: 'Requisição bloqueada pela proteção contra CSRF.'
  });
});
app.use('/images', express.static('public/images'));
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Slug Generator Helper
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Zod Validation Schemas
const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(12, 'A senha deve ter no mínimo 12 caracteres').max(128),
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres').max(120),
  role: z.enum(['USER', 'ADMIN']).optional(),
  can_access_gestao_solar: z.boolean().optional()
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória').max(128)
});

const categorySchema = z.object({
  name: z.string().min(2, 'O nome da categoria deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  iconName: z.string().default('BookOpen')
});

const httpsOrLocalUrl = z.string().trim().refine((value) => {
  if (value === '' || value.startsWith('/')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}, 'Use uma URL HTTPS válida ou um caminho interno.');

const youtubeUrl = httpsOrLocalUrl.refine((value) => {
  if (value === '') return true;
  try {
    return ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(new URL(value).hostname);
  } catch {
    return false;
  }
}, 'O vídeo deve ser hospedado no YouTube.');

const articleSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  contentMarkdown: z.string().min(10, 'O conteúdo deve ter no mínimo 10 caracteres'),
  categoryId: z.string().uuid('ID de categoria inválido'),
  videoUrl: youtubeUrl.optional(),
  fileDownloadUrl: httpsOrLocalUrl.optional()
});

// --- AUTHENTICATION ROUTES ---

// Status de configuração inicial (informa se o sistema precisa de setup inicial de admin)
app.get('/api/auth/setup-status', async (req, res, next) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({
      status: 'success',
      data: {
        requiresSetup: userCount === 0,
        setupTokenConfigured: Boolean(process.env.INITIAL_SETUP_TOKEN)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Register (Protegido: Apenas ADMINs podem cadastrar novos alunos/usuários, exceto na criação inicial do primeiro usuário)
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const userCount = await prisma.user.count();
    let isRequestFromAdmin = false;

    if (userCount > 0) {
      const token = readRequestToken(req);
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Cadastro público desativado. Apenas administradores autenticados podem cadastrar usuários.'
        });
      }

      try {
        const requestingUser = await authenticateToken(prisma, token);
        if (requestingUser.role !== 'ADMIN') {
          return res.status(403).json({ status: 'error', message: 'Apenas administradores podem cadastrar usuários.' });
        }
        isRequestFromAdmin = true;
      } catch {
        return res.status(401).json({ status: 'error', message: 'Sessão inválida ou expirada.' });
      }
    } else {
      const configuredSetupToken = process.env.INITIAL_SETUP_TOKEN;
      if (!configuredSetupToken || configuredSetupToken.length < 32 || req.get('x-setup-token') !== configuredSetupToken) {
        return res.status(403).json({
          status: 'error',
          message: 'Configuração inicial bloqueada. Informe um INITIAL_SETUP_TOKEN seguro no servidor.'
        });
      }
    }

    const userExists = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'Este e-mail já está em uso.' });
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Se for o primeiro usuário da base, torna-o ADMIN por padrão; caso contrário, respeita a atribuição do ADMIN ou o padrão USER
    const assignedRole = userCount === 0 ? 'ADMIN' : (validatedData.role || 'USER');
    const canAccessSolar = assignedRole === 'ADMIN' || Boolean(validatedData.can_access_gestao_solar);

    const userData = {
      email: validatedData.email,
      passwordHash,
      name: validatedData.name,
      role: assignedRole,
      can_access_gestao_solar: canAccessSolar
    };

    const user = userCount === 0
      ? await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(741852963)`;
        if (await tx.user.count()) {
          const error = new Error('A configuração inicial já foi concluída.');
          error.statusCode = 409;
          throw error;
        }
        return tx.user.create({ data: userData });
      })
      : await prisma.user.create({ data: userData });

    let token = null;
    // Se a requisição NÃO veio de um Admin já logado (ex: primeiro cadastro), define o cookie de login
    if (!isRequestFromAdmin) {
      token = signSessionToken(user);
      res.cookie('token', token, cookieOptions);
    }

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          can_access_gestao_solar: canAccessSolar
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    const passwordMatches = await bcrypt.compare(validatedData.password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) {
      return res.status(401).json({ status: 'error', message: 'E-mail ou senha incorretos.' });
    }

    const canAccessSolar = user.role === 'ADMIN' || Boolean(user.can_access_gestao_solar);

    const token = signSessionToken(user);
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          can_access_gestao_solar: canAccessSolar
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
app.post('/api/auth/logout', protect, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { sessionVersion: { increment: 1 } }
    });
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
  });
    res.status(200).json({ status: 'success', message: 'Logout realizado com sucesso.' });
  } catch (error) {
    next(error);
  }
});

// Get current session
app.get('/api/auth/me', protect, async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          can_access_gestao_solar: req.user.can_access_gestao_solar
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// --- USER MANAGEMENT ROUTES (ADMIN ONLY) ---

// List all users
app.get('/api/users', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        can_access_gestao_solar: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    next(error);
  }
});

// Toggle Gestão Solar permission for a user (ADMIN)
app.patch('/api/users/:id/gestao-solar', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { can_access_gestao_solar } = z.object({
      can_access_gestao_solar: z.boolean()
    }).strict().parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        can_access_gestao_solar,
        sessionVersion: { increment: 1 }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        can_access_gestao_solar: true
      }
    });

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
});

// Update user details (ADMIN)
app.put('/api/users/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, can_access_gestao_solar } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuário não encontrado.' });
    }

    const dataToUpdate = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ status: 'error', message: 'O nome deve ter no mínimo 2 caracteres.' });
      }
      dataToUpdate.name = name.trim();
    }

    if (email !== undefined) {
      const emailNormalized = email.trim().toLowerCase();
      if (!emailNormalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
        return res.status(400).json({ status: 'error', message: 'E-mail inválido.' });
      }
      if (emailNormalized !== user.email.toLowerCase()) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email: emailNormalized,
            NOT: { id }
          }
        });
        if (emailExists) {
          return res.status(400).json({ status: 'error', message: 'Este e-mail já está cadastrado para outro usuário.' });
        }
      }
      dataToUpdate.email = emailNormalized;
    }

    if (role !== undefined) {
      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ status: 'error', message: 'Nível de acesso inválido.' });
      }
      // Se estiver alterando o próprio usuário para não-ADMIN, verificar se restam outros admins
      if (id === req.user.id && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return res.status(400).json({ status: 'error', message: 'Você não pode remover privilégios de administrador da sua conta pois é o único administrador.' });
        }
      }
      dataToUpdate.role = role;
    }

    if (can_access_gestao_solar !== undefined) {
      if (typeof can_access_gestao_solar !== 'boolean') {
        return res.status(400).json({ status: 'error', message: 'Permissão Gestão Solar inválida.' });
      }
      dataToUpdate.can_access_gestao_solar = can_access_gestao_solar;
    }

    if (password && password.trim().length > 0) {
      if (password.length < 12 || password.length > 128) {
        return res.status(400).json({ status: 'error', message: 'A nova senha deve ter entre 12 e 128 caracteres.' });
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(dataToUpdate).length > 0) {
      dataToUpdate.sessionVersion = { increment: 1 };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        can_access_gestao_solar: true,
        createdAt: true
      }
    });

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
});



// Delete a user
app.delete('/api/users/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ status: 'error', message: 'Você não pode excluir sua própria conta enquanto estiver conectado.' });
    }
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});


// --- CATEGORIES ROUTES ---

// Get all categories
app.get('/api/categories', protect, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    next(error);
  }
});

// Create Category (ADMIN)
app.post('/api/categories', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const validatedData = categorySchema.parse(req.body);
    const slug = generateSlug(validatedData.name);

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        iconName: validatedData.iconName
      }
    });

    res.status(201).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
});

// Update Category (ADMIN)
app.put('/api/categories/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = categorySchema.parse(req.body);
    const slug = generateSlug(validatedData.name);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        iconName: validatedData.iconName
      }
    });

    res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
});

// Delete Category (ADMIN)
app.delete('/api/categories/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});


// --- ARTICLES ROUTES ---

app.get('/api/documents/guia-operacional-ccr', protect, (req, res, next) => {
  const filePath = path.join(serverDirectory, 'private', 'documents', 'guia-operacional-ccr.pdf');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', 'inline; filename="guia-operacional-ccr.pdf"');
  res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) next(error);
  });
});

// Get all articles (with text search & category filter)
app.get('/api/articles', protect, async (req, res, next) => {
  try {
    const { search, categoryId } = req.query;

    const where = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { contentMarkdown: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        categoryId: true,
        videoUrl: true,
        fileDownloadUrl: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { articles } });
  } catch (error) {
    next(error);
  }
});

// Get single article by slug
app.get('/api/articles/slug/:slug', protect, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ status: 'error', message: 'Artigo não encontrado.' });
    }

    // Increment view count asynchronously
    await prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } }
    });

    res.status(200).json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
});

// Create Article (ADMIN)
app.post('/api/articles', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const validatedData = articleSchema.parse(req.body);
    const slug = generateSlug(validatedData.title);

    // Ensure slug is unique
    let uniqueSlug = slug;
    let index = 1;
    while (await prisma.article.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${index}`;
      index++;
    }

    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        slug: uniqueSlug,
        contentMarkdown: validatedData.contentMarkdown,
        categoryId: validatedData.categoryId,
        videoUrl: validatedData.videoUrl || null,
        fileDownloadUrl: validatedData.fileDownloadUrl || null
      }
    });

    res.status(201).json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
});

// Update Article (ADMIN)
app.put('/api/articles/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = articleSchema.parse(req.body);
    const slug = generateSlug(validatedData.title);

    // Check slug collision excluding current article
    let uniqueSlug = slug;
    let index = 1;
    while (true) {
      const existing = await prisma.article.findUnique({ where: { slug: uniqueSlug } });
      if (!existing || existing.id === id) {
        break;
      }
      uniqueSlug = `${slug}-${index}`;
      index++;
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: validatedData.title,
        slug: uniqueSlug,
        contentMarkdown: validatedData.contentMarkdown,
        categoryId: validatedData.categoryId,
        videoUrl: validatedData.videoUrl || null,
        fileDownloadUrl: validatedData.fileDownloadUrl || null
      }
    });

    res.status(200).json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
});

// Delete Article (ADMIN)
app.delete('/api/articles/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.article.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- ROTAS DO MÓDULO GESTÃO SOLAR ---
app.use('/api', createGestaoSolarRouter(prisma, protect));
app.use('/api/gestao-solar', createTecnicosTerceirizadosRouter(prisma, protect));

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error(err);

  // Zod Validation Error
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação de dados.',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'JSON inválido.' });
  }

  if (String(err?.code || '').startsWith('LIMIT_')) {
    return res.status(413).json({ status: 'error', message: 'Arquivo excede o limite ou a quantidade permitida.' });
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(400).json({
      status: 'error',
      message: 'Um registro com estes dados únicos já existe no banco de dados.'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ status: 'error', message: 'Registro não encontrado.' });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Fallback
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro interno do servidor. Por favor, tente novamente mais tarde.' 
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
