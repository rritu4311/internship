// This is a server component that initializes the database
// It's imported in the root layout to ensure database connection

import { initDb } from '@/lib/db-initializer';

export default async function DbInitializer() {
  // Initialize the database on the server
  await initDb();
  
  // This component doesn't render anything
  return null;
}