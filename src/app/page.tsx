'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page by default
      router.push('/auth/signin');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-secondary-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
