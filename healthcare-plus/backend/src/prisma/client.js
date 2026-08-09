/**
 * prisma/client.js — Singleton PrismaClient instance.
 *
 * Guards against creating multiple PrismaClient instances during
 * hot-reload in development (Next.js / nodemon pattern).
 */

import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

// Use globalThis to preserve instance across hot-reloads in dev
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
