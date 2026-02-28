import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { recipeRoutes } from './routes/recipes';

// ── Env validation ────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['ANTHROPIC_API_KEY'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required env variable: ${key}`);
    process.exit(1);
  }
}

if (!process.env.DATABASE_URL) {
  console.warn('[WARN] DATABASE_URL not set — recipe history persistence disabled.');
}

const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_PROD = process.env.NODE_ENV === 'production';

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet());

// CORS — strict origin whitelist
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl in dev)
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-Session-Id'],
  credentials: false,
}));

// Body parsing — 100kb max (recipes don't need more)
app.use(express.json({ limit: '100kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────

// Global limiter: 60 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de requêtes, réessayez dans une minute.' },
});

// Strict limiter on Claude endpoints (expensive API calls): 10 req/min per IP
const claudeLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Limite de génération atteinte, réessayez dans une minute.' },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/recipes', claudeLimiter, recipeRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log full error server-side only
  console.error('[ERROR]', err.message);
  // Never expose internal details to client in production
  res.status(500).json({
    success: false,
    error: IS_PROD ? 'Une erreur interne est survenue.' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🍽️  Recipe Planner API running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`);
});

export default app;
