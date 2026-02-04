import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { recipeRoutes } from './routes/recipes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/recipes', recipeRoutes);

app.listen(PORT, () => {
  console.log(`🍽️  Recipe Planner API running on port ${PORT}`);
});

export default app;
