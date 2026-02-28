import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { recipeRoutes } from './routes/recipes';
import { authRoutes } from './routes/auth';
import { extractUser } from './middleware/authenticate';
import { prisma } from './lib/prisma';

// ── Env validation ────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'JWT_SECRET'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required env variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET!.length < 32) {
  console.error('[FATAL] JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.warn('[WARN] DATABASE_URL not set — recipe history persistence disabled.');
}

const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_PROD = process.env.NODE_ENV === 'production';

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());

// CORS — credentials: true required for HttpOnly cookie auth
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Session-Id', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Attach req.user from JWT on every request (non-blocking)
app.use(extractUser);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de requêtes, réessayez dans une minute.' },
});

const claudeLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Limite de génération atteinte, réessayez dans une minute.' },
});

// Strict limiter on auth routes — prevents brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de tentatives, réessayez dans 15 minutes.' },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/recipes', claudeLimiter, recipeRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    error: IS_PROD ? 'Une erreur interne est survenue.' : err.message,
  });
});

// ── Admin seed ────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || 'admin';
  if (!email || !password) return;
  try {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return;
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { username, email, password: hash, role: 'ADMIN' } });
    console.log(`[SEED] Admin account created: ${email}`);
  } catch (err) {
    console.warn('[SEED] Could not create admin account:', err);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🍽️  Recipe Planner API running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`);
  if (process.env.DATABASE_URL) await seedAdmin();
});

export default app;
