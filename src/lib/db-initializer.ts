import { initializeDatabase } from './db-init';

// Global flag to track if we're using mock data
export let usingMockData = false;

// This file should only be imported in server components
// Use a named export to prevent accidental client-side imports
export const initDb = () => {
  // Only run on the server
  if (typeof window !== 'undefined') {
    console.warn('Database initialization should not be called on the client side');
    return Promise.resolve(false);
  }
  
  // Initialize database connection on the server side
  return initializeDatabase()
    .then((success) => {
      if (success) {
        console.log('Database initialized successfully');
        usingMockData = false;
        return success;
      } else {
        console.error('Failed to initialize database, falling back to mock data');
        usingMockData = true;
        return true; // Return true so the app continues to function with mock data
      }
    })
    .catch((error) => {
      console.error('Error initializing database, falling back to mock data:', error);
      usingMockData = true;
      return true; // Return true so the app continues to function with mock data
    });
};

// Initialize the database when this module is imported on the server
if (typeof window === 'undefined') {
  initDb();
}