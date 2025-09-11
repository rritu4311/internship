import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Initialize the database and perform any necessary setup
 * This function should be called when the application starts
 */
export async function initializeDatabase() {
  try {
    // Check if we have a valid DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.warn('No DATABASE_URL found, using mock data mode');
      return true;
    }

    // Test the database connection
    await prisma.$connect();
    
    // Check if the database is accessible by querying a simple table
    await prisma.user.findFirst();
    
    console.log('Database connection and setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

/**
 * Handle graceful shutdown
 */
async function handleShutdown() {
  // Close database connection
  await prisma.$disconnect().catch(console.error);
  
  // Add any other cleanup tasks here
  process.exit(0);
}

// Handle process termination
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

/**
 * Main function to run when this script is executed directly
 */
async function main() {
  const success = await initializeDatabase();
  await prisma.$disconnect();
  process.exit(success ? 0 : 1);
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}