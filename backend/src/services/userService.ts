import { prisma } from '../lib/prisma';
import type { Role } from '@prisma/client';

// Fields safe to return to the client — never include password
const PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
};

/** Finds a user by id and returns only public fields. */
export async function findUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
}

/** Finds a user by email, including the password hash (for login). */
export async function findUserByEmailWithPassword(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { ...PUBLIC_SELECT, password: true },
  });
}

/** Finds a user by googleId. */
export async function findUserByGoogleId(googleId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { googleId }, select: PUBLIC_SELECT });
}

/** Creates a new email/password user. Password must already be hashed. */
export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role?: Role;
}): Promise<PublicUser> {
  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email.toLowerCase(),
      password: data.password,
      role: data.role ?? 'USER',
    },
    select: PUBLIC_SELECT,
  });
}

/** Finds or creates a user from Google OAuth data. */
export async function upsertGoogleUser(data: {
  googleId: string;
  email: string;
  suggestedUsername: string;
  avatarUrl?: string;
}): Promise<PublicUser> {
  // 1. Existing Google user
  const byGoogle = await prisma.user.findUnique({
    where: { googleId: data.googleId },
    select: PUBLIC_SELECT,
  });
  if (byGoogle) return byGoogle;

  // 2. Email already registered → link Google to existing account
  const byEmail = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: data.googleId, avatarUrl: data.avatarUrl ?? byEmail.avatarUrl },
      select: PUBLIC_SELECT,
    });
  }

  // 3. New user — generate a unique username
  const username = await makeUniqueUsername(data.suggestedUsername);
  return prisma.user.create({
    data: {
      username,
      email: data.email.toLowerCase(),
      googleId: data.googleId,
      avatarUrl: data.avatarUrl,
    },
    select: PUBLIC_SELECT,
  });
}

/** Checks whether a username already exists. */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  return !!user;
}

/** Checks whether an email already exists. */
export async function isEmailTaken(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return !!user;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Sanitises a Google display name into a valid username. */
function sanitiseUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 28) || 'user';
}

/** Appends a numeric suffix until the username is unique. */
async function makeUniqueUsername(raw: string): Promise<string> {
  const base = sanitiseUsername(raw);
  if (!(await isUsernameTaken(base))) return base;
  for (let i = 2; i <= 9999; i++) {
    const candidate = `${base}_${i}`;
    if (!(await isUsernameTaken(candidate))) return candidate;
  }
  return `${base}_${Date.now()}`;
}
