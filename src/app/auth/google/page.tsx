'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function GoogleAuth() {
  const router = useRouter();

  useEffect(() => {
    // Automatically trigger Google sign in
    const initiateSignIn = async () => {
      try {
        await signIn('google', { callbackUrl: '/dashboard' });
      } catch (error) {
        console.error('Authentication error:', error);
        // If there's an error, redirect to the sign-in page
        router.push('/auth/signin');
      }
    };
    
    initiateSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          <Image src="/google.svg" alt="Google" width={60} height={60} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            Signing in with Google
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Please wait while we redirect you to Google for authentication...
          </p>
          <div className="w-full mt-4">
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                <div
                  className="animate-pulse shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}