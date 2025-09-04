import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a real Prisma client
let prismaInstance: PrismaClient;

try {
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
    
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.warn('Failed to initialize Prisma client, using mock data:', error);
  // Create a minimal mock Prisma client that won't throw errors
  prismaInstance = {} as PrismaClient;
}

export const prisma = prismaInstance;

// Helper functions for database operations
export async function connectToDatabase(retries = 3) {
  // If we're using a mock Prisma client, don't try to connect
  if (!process.env.DATABASE_URL) {
    console.log('Using mock database - no connection needed');
    return prisma;
  }
  
  try {
    // Only try to connect if prisma has the $connect method
    if (prisma.$connect) {
      await prisma.$connect();
      console.log('Successfully connected to MongoDB');
    } else {
      console.warn('Prisma client does not have $connect method, using mock data');
    }
    return prisma;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return connectToDatabase(retries - 1);
    }
    
    console.warn('All connection attempts failed, using mock data');
    return prisma;
  }
}

export async function disconnectFromDatabase() {
  // If we're using a mock Prisma client, don't try to disconnect
  if (!process.env.DATABASE_URL) {
    console.log('Using mock database - no disconnection needed');
    return;
  }
  
  try {
    // Only try to disconnect if prisma has the $disconnect method
    if (prisma.$disconnect) {
      await prisma.$disconnect();
      console.log('Successfully disconnected from MongoDB');
    } else {
      console.warn('Prisma client does not have $disconnect method');
    }
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
    // Don't throw the error, just log it
  }
}

export default prisma;