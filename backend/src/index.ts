import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { recipeRoutes } from './routes/recipes';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { dietRoutes } from './routes/diets';
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

// Trust Railway's reverse proxy so express-rate-limit can read the real client IP
app.set('trust proxy', 1);

app.use(helmet());

// CORS — credentials: true required for HttpOnly cookie auth
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
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

const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Limite admin atteinte, réessayez dans une minute.' },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/recipes', claudeLimiter, recipeRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/diets', dietRoutes);

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

// ── Diets seed ────────────────────────────────────────────────────────────────
const DIETS_DATA = [
  {
    name: 'Végétarien',
    emoji: '🥦',
    description: 'Exclut la viande et le poisson. Inclut les œufs, les produits laitiers et le miel.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lapin', 'canard', 'dinde', 'gibier', 'lardons', 'jambon', 'chorizo', 'saucisse', 'merguez', 'poisson', 'saumon', 'thon', 'cabillaud', 'sardine', 'crevettes', 'fruits de mer', 'moules', 'huîtres', 'calamars'],
  },
  {
    name: 'Végétalien (vegan)',
    emoji: '🌿',
    description: 'Exclut tous les produits d\'origine animale : viande, poisson, œufs, produits laitiers, miel.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lardons', 'jambon', 'saucisse', 'poisson', 'saumon', 'thon', 'crevettes', 'fruits de mer', 'moules', 'huîtres', 'œufs', 'lait', 'crème', 'beurre', 'fromage', 'yaourt', 'miel', 'gélatine', 'produits laitiers'],
  },
  {
    name: 'Ovo-lacto-végétarien',
    emoji: '🥛',
    description: 'Exclut viande et poisson. Inclut les œufs et les produits laitiers.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lardons', 'jambon', 'saucisse', 'poisson', 'saumon', 'thon', 'crevettes', 'fruits de mer', 'moules', 'huîtres'],
  },
  {
    name: 'Ovo-végétarien',
    emoji: '🥚',
    description: 'Exclut viande, poisson et produits laitiers. Inclut les œufs.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lardons', 'jambon', 'saucisse', 'poisson', 'saumon', 'thon', 'crevettes', 'fruits de mer', 'lait', 'crème', 'beurre', 'fromage', 'yaourt', 'produits laitiers'],
  },
  {
    name: 'Lacto-végétarien',
    emoji: '🧀',
    description: 'Exclut viande, poisson et œufs. Inclut les produits laitiers.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lardons', 'jambon', 'saucisse', 'poisson', 'saumon', 'thon', 'crevettes', 'fruits de mer', 'œufs'],
  },
  {
    name: 'Pescétarien',
    emoji: '🌊',
    description: 'Exclut la viande rouge et la volaille. Inclut le poisson et les fruits de mer.',
    forbiddenIngredients: ['viande rouge', 'bœuf', 'porc', 'veau', 'agneau', 'lardons', 'jambon', 'chorizo', 'saucisse', 'merguez', 'poulet', 'dinde', 'canard', 'volaille'],
  },
  {
    name: 'Flexitarien',
    emoji: '🌱',
    description: 'Principalement végétarien. Utiliser très peu de viande ou poisson, privilégier les protéines végétales, légumineuses et légumes.',
    forbiddenIngredients: [],
  },
  {
    name: 'Crudivore',
    emoji: '🥕',
    description: 'Aliments consommés crus uniquement. Aucune cuisson. Exclut tout aliment cuit, transformé, pasteurisé.',
    forbiddenIngredients: ['viande', 'poisson', 'lait pasteurisé', 'fromage pasteurisé', 'pain', 'pâtes', 'riz cuit', 'légumes cuits', 'produits transformés', 'conserves', 'surgelés'],
  },
  {
    name: 'Halal',
    emoji: '☪️',
    description: 'Conforme aux prescriptions islamiques. Interdit le porc et l\'alcool. La viande doit être issue d\'un abattage halal.',
    forbiddenIngredients: ['porc', 'cochon', 'jambon', 'lardons', 'bacon', 'saucisson', 'charcuterie porcine', 'boudin', 'rillettes', 'alcool', 'vin', 'bière', 'rhum', 'cognac', 'gélatine porcine'],
  },
  {
    name: 'Casher',
    emoji: '✡️',
    description: 'Suit les règles de la cacherout. Interdit le porc, les fruits de mer, et le mélange viande/lait.',
    forbiddenIngredients: ['porc', 'cochon', 'jambon', 'lardons', 'bacon', 'saucisson', 'crevettes', 'homard', 'huîtres', 'moules', 'crabe', 'fruits de mer', 'anguille', 'requin', 'beurre avec viande', 'fromage avec viande', 'crème avec viande'],
  },
  {
    name: 'Catholique',
    emoji: '✝️',
    description: 'Abstinence de viande le vendredi (notamment pendant le Carême). Privilégier le poisson les vendredis.',
    forbiddenIngredients: ['bœuf', 'porc', 'poulet', 'agneau', 'veau', 'viande rouge'],
  },
  {
    name: 'Orthodoxe',
    emoji: '✝️',
    description: 'Nombreuses périodes de jeûne avec abstinence de viande et souvent de produits laitiers selon le calendrier liturgique.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lardons', 'jambon', 'lait', 'crème', 'beurre', 'fromage', 'yaourt', 'œufs'],
  },
  {
    name: 'Hindou',
    emoji: '🕉️',
    description: 'Souvent végétarien. La vache est sacrée — le bœuf est strictement interdit. Certaines communautés évitent ail et oignon.',
    forbiddenIngredients: ['bœuf', 'veau', 'viande de vache', 'porc'],
  },
  {
    name: 'Bouddhiste',
    emoji: '☸️',
    description: 'Souvent végétarien ou végétalien selon l\'école. Recherche de non-violence envers les êtres vivants.',
    forbiddenIngredients: ['viande', 'bœuf', 'porc', 'poulet', 'veau', 'agneau', 'lardons', 'jambon', 'poisson', 'saumon', 'thon', 'crevettes', 'fruits de mer'],
  },
];

async function seedDiets() {
  try {
    for (const diet of DIETS_DATA) {
      await prisma.diet.upsert({
        where: { name: diet.name },
        create: { ...diet, forbiddenIngredients: diet.forbiddenIngredients },
        update: { emoji: diet.emoji, description: diet.description, forbiddenIngredients: diet.forbiddenIngredients },
      });
    }
    console.log(`[SEED] ${DIETS_DATA.length} régimes alimentaires chargés.`);
  } catch (err) {
    console.warn('[SEED] Could not seed diets:', err);
  }
}

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
  if (process.env.DATABASE_URL) {
    await seedAdmin();
    await seedDiets();
  }
});

export default app;
