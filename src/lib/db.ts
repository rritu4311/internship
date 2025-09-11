import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a real Prisma client
let prismaInstance: PrismaClient;

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('No DATABASE_URL found, using mock data mode');
  // Create a minimal mock Prisma client that won't throw errors
  prismaInstance = {} as PrismaClient;
} else {
  prismaInstance = globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;

/**
 * Connect to the database
 */
export async function connectToDatabase() {
  if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
    console.log('Skipping database connection in test/mock mode');
    return;
  }

  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectFromDatabase() {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.DATABASE_URL) {
      await prisma.$disconnect();
      console.log('Disconnected from the database');
    }
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
    // Don't throw the error, just log it
  }
}

export default prisma;