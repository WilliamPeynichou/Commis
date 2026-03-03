import { prisma } from '../lib/prisma';

const DB_ENABLED = !!process.env.DATABASE_URL;
const HISTORY_LIMIT = 100;

interface HistoryTarget {
  userId: string | null;
  sessionId: string | null;
}

/**
 * Returns up to 100 recipe names previously generated for this user/session,
 * ordered newest-first. Returns [] silently if DB is unavailable.
 * Authenticated userId takes priority over anonymous sessionId.
 */
export async function getHistory({ userId, sessionId }: HistoryTarget): Promise<string[]> {
  if (!DB_ENABLED) return [];
  if (!userId && !sessionId) return [];
  try {
    const rows = await prisma.recipeHistory.findMany({
      where: userId ? { userId } : { sessionId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { name: true },
    });
    return rows.map((r) => r.name);
  } catch (err) {
    console.warn('[historyService] getHistory failed:', err);
    return [];
  }
}

/**
 * Persists a batch of generated recipe names.
 * Uses skipDuplicates to honour the @@unique constraints.
 * Fails silently so a DB outage never breaks recipe generation.
 */
export async function saveToHistory(
  entries: { name: string; category: string }[],
  { userId, sessionId }: HistoryTarget
): Promise<void> {
  if (!DB_ENABLED || entries.length === 0) return;
  if (!userId && !sessionId) return;
  try {
    await prisma.recipeHistory.createMany({
      data: entries.map((e) => ({
        name: e.name,
        category: e.category,
        userId: userId ?? null,
        sessionId: sessionId ?? null,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.warn('[historyService] saveToHistory failed:', err);
  }
}
