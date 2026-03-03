import { prisma } from '../lib/prisma';
import type { Role, User, RecipeHistory, AdminLog as PrismaAdminLog } from '@prisma/client';

// ── Stats ──────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const now = new Date();
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers7,
    newUsers30,
    usersByRole,
    totalRecipes,
    recipesLast7,
    recipesLast30,
    authRecipes,
    anonRecipes,
    topCategoriesRaw,
    dailyActivityRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: ago7 } } }),
    prisma.user.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.recipeHistory.count(),
    prisma.recipeHistory.count({ where: { createdAt: { gte: ago7 } } }),
    prisma.recipeHistory.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.recipeHistory.count({ where: { userId: { not: null } } }),
    prisma.recipeHistory.count({ where: { userId: null } }),
    prisma.recipeHistory.groupBy({
      by: ['category'],
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS count
      FROM "RecipeHistory"
      WHERE "createdAt" >= ${ago30}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `,
  ]);

  // Active sessions = distinct sessionIds last 7 days
  const activeSessionsResult = await prisma.recipeHistory.findMany({
    where: { createdAt: { gte: ago7 }, sessionId: { not: null } },
    select: { sessionId: true },
    distinct: ['sessionId'],
  });

  const roleMap: Record<string, number> = {};
  for (const r of usersByRole) roleMap[r.role] = r._count._all;

  return {
    totalUsers,
    newUsersLast7Days: newUsers7,
    newUsersLast30Days: newUsers30,
    usersByRole: { USER: roleMap['USER'] ?? 0, ADMIN: roleMap['ADMIN'] ?? 0 },
    totalRecipesGenerated: totalRecipes,
    recipesLast7Days: recipesLast7,
    recipesLast30Days: recipesLast30,
    activeSessionsLast7Days: activeSessionsResult.length,
    authenticatedVsAnonymous: { authenticated: authRecipes, anonymous: anonRecipes },
    topCategories: topCategoriesRaw.map((r: { category: string; _count: { _all: number } }) => ({ category: r.category, count: r._count._all })),
    dailyActivity: dailyActivityRaw.map((r: { date: string; count: bigint }) => ({ date: r.date, count: Number(r.count) })),
  };
}

// ── Users ──────────────────────────────────────────────────────────────────────
interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: Role | '';
}

type UserWithCount = Pick<User, 'id' | 'username' | 'email' | 'avatarUrl' | 'role' | 'createdAt' | 'googleId'> & {
  _count: { recipeHistory: number };
};

export async function getAdminUsers({ page, limit, search, role }: GetUsersParams) {
  const where = {
    ...(search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(role ? { role: role as Role } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        googleId: true,
        _count: { select: { recipeHistory: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u: UserWithCount) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt,
      hasGoogleAccount: !!u.googleId,
      _count: u._count,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

// ── Change role ────────────────────────────────────────────────────────────────
export async function changeUserRole(adminId: string, userId: string, newRole: Role) {
  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: newRole } }),
    prisma.adminLog.create({
      data: { adminId, action: 'ROLE_CHANGE', targetId: userId, meta: { newRole } },
    }),
  ]);
  return user;
}

// ── Activity ───────────────────────────────────────────────────────────────────
interface GetActivityParams {
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
}

type RecipeHistoryRow = Pick<RecipeHistory, 'id' | 'name' | 'category' | 'userId' | 'sessionId' | 'createdAt'>;

export async function getAdminActivity({ page, limit, from, to }: GetActivityParams) {
  const dateFilter = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
  const hasDateFilter = from !== undefined || to !== undefined;

  const [recipes, adminLogs, totalRecipes, totalAdminLogs] = await Promise.all([
    prisma.recipeHistory.findMany({
      where: hasDateFilter ? { createdAt: dateFilter } : {},
      select: { id: true, name: true, category: true, userId: true, sessionId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminLog.findMany({
      where: hasDateFilter ? { createdAt: dateFilter } : {},
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.recipeHistory.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
    prisma.adminLog.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
  ]);

  // Fetch usernames for recipe entries with userId
  const userIds = [...new Set(recipes.filter((r: RecipeHistoryRow) => r.userId).map((r: RecipeHistoryRow) => r.userId!))];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } })
    : [];
  const userMap = Object.fromEntries(users.map((u: { id: string; username: string }) => [u.id, u.username]));

  // Fetch usernames for admin logs
  const adminIds = [...new Set(adminLogs.map((l: PrismaAdminLog) => l.adminId))];
  const admins = adminIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, username: true } })
    : [];
  const adminMap = Object.fromEntries(admins.map((u: { id: string; username: string }) => [u.id, u.username]));

  const recipeEvents = recipes.map((r: RecipeHistoryRow) => ({
    id: r.id,
    type: 'RECIPE_GENERATED' as const,
    description: `Recette générée : ${r.name} (${r.category})`,
    userId: r.userId ?? undefined,
    username: r.userId ? userMap[r.userId] : undefined,
    sessionId: r.sessionId ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));

  const adminEvents = adminLogs.map((l: PrismaAdminLog) => ({
    id: l.id,
    type: 'ADMIN_ACTION' as const,
    description: `Action admin : ${l.action}`,
    userId: l.adminId,
    username: adminMap[l.adminId],
    meta: l.meta as Record<string, unknown> | undefined,
    createdAt: l.createdAt.toISOString(),
  }));

  const merged = [...recipeEvents, ...adminEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    logs: merged,
    total: totalRecipes + totalAdminLogs,
    page,
    pages: Math.ceil((totalRecipes + totalAdminLogs) / limit),
  };
}

// ── Admin logs only ────────────────────────────────────────────────────────────
export async function getAdminLogs({ page, limit }: { page: number; limit: number }) {
  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminLog.count(),
  ]);

  const adminIds = [...new Set(logs.map((l: PrismaAdminLog) => l.adminId))];
  const admins = adminIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, username: true } })
    : [];
  const adminMap = Object.fromEntries(admins.map((u: { id: string; username: string }) => [u.id, u.username]));

  return {
    logs: logs.map((l: PrismaAdminLog) => ({
      ...l,
      adminUsername: adminMap[l.adminId] ?? 'Inconnu',
      meta: l.meta as Record<string, unknown> | null,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
