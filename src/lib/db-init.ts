import { MongoClient } from 'mongodb';
import { prisma, connectToDatabase, disconnectFromDatabase } from './db';

/**
 * Initialize the database connection and perform any necessary setup
 * This function should be called when the application starts
 */
export async function initializeDatabase() {
  try {
    // Check if MongoDB is available
    try {
      // First try to connect using Prisma
      await connectToDatabase();
      
      // Check if we have a valid DATABASE_URL
      if (!process.env.DATABASE_URL) {
        console.warn('No DATABASE_URL found, using mock data mode');
        return true;
      }
      
      // Then connect to the database using MongoDB driver directly for collection setup
      const mongoUrl = process.env.DATABASE_URL;
      const client = new MongoClient(mongoUrl);
      await client.connect();
      
      // Get the database name from the connection string
      const dbName = mongoUrl.split('/').pop()?.split('?')[0] || 'onlyinternship';
      const db = client.db(dbName);
      
      // Create collections if they don't exist
      const collections = [
        'User',
        'Profile',
        'Company',
        'Internship',
        'Application',
        'Account',
        'Session',
        'VerificationToken'
      ];
      
      for (const collection of collections) {
        const exists = await db.listCollections({ name: collection }).hasNext();
        if (!exists) {
          await db.createCollection(collection);
          console.log(`Created collection: ${collection}`);
        }
      }
      
      // Close the MongoDB client connection
      await client.close();
      
      // Set up event listeners for graceful shutdown
      process.on('SIGINT', handleShutdown);
      process.on('SIGTERM', handleShutdown);
      process.on('exit', handleShutdown);
      
      console.log('Database initialized successfully');
      return true;
    } catch (dbError) {
      console.warn('MongoDB connection failed, falling back to mock data:', dbError);
      return true; // Return true so the app continues to function with mock data
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return true; // Return true to allow app to continue with mock data
  }
}

// Handle graceful shutdown
async function handleShutdown() {
  console.log('Shutting down database connection...');
  try {
    await disconnectFromDatabase();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Main function to run when this script is executed directly
async function main() {
  const success = await initializeDatabase();
  process.exit(success ? 0 : 1);
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}