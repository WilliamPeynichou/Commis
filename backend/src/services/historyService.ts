import { prisma } from '../lib/prisma';

const DB_ENABLED = !!process.env.DATABASE_URL;
const HISTORY_LIMIT = 100;

/**
 * Returns up to HISTORY_LIMIT recipe names previously generated for this
 * session, ordered newest-first. Returns [] silently if DB is unavailable.
 */
export async function getSessionHistory(sessionId: string): Promise<string[]> {
  if (!DB_ENABLED) return [];
  try {
    const rows = await prisma.recipeHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { name: true },
    });
    return rows.map((r) => r.name);
  } catch (err) {
    console.warn('[historyService] getSessionHistory failed:', err);
    return [];
  }
}

/**
 * Persists a batch of generated recipe names for the given session.
 * Uses skipDuplicates to honour the @@unique([name, sessionId]) constraint.
 * Fails silently so a DB outage never breaks recipe generation.
 */
export async function saveToHistory(
  entries: { name: string; category: string }[],
  sessionId: string
): Promise<void> {
  if (!DB_ENABLED || entries.length === 0) return;
  try {
    await prisma.recipeHistory.createMany({
      data: entries.map((e) => ({
        name: e.name,
        category: e.category,
        sessionId,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.warn('[historyService] saveToHistory failed:', err);
  }
}
