'use client';

import { Suspense } from 'react';
import Link from 'next/link';

function AuthErrorContent() {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Issue',
          message: 'There was a problem creating your account. This usually happens when there\'s a database connection issue or the OAuth provider couldn\'t complete the account setup.',
          solution: 'Please try signing in again. If the problem persists, contact support.'
        };
      case 'OAuthSignin':
        return {
          title: 'Sign In Issue',
          message: 'There was a problem with the OAuth sign-in process.',
          solution: 'Please try signing in again with Google.'
        };
      case 'OAuthCallback':
        return {
          title: 'Authentication Callback Issue',
          message: 'There was a problem processing the authentication response from Google.',
          solution: 'Please try signing in again.'
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This email is already associated with a different account.',
          solution: 'Please use the same authentication method you used when creating your account.'
        };
      case 'EmailSignin':
        return {
          title: 'Email Sign In Issue',
          message: 'There was a problem with email-based authentication.',
          solution: 'Please try using Google OAuth instead.'
        };
      case 'CredentialsSignin':
        return {
          title: 'Credentials Issue',
          message: 'There was a problem with your login credentials.',
          solution: 'Please check your credentials and try again.'
        };
      case 'SessionRequired':
        return {
          title: 'Session Required',
          message: 'You need to be signed in to access this page.',
          solution: 'Please sign in first.'
        };
      case 'Default':
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          solution: 'Please try again or contact support if the problem persists.'
        };
      default:
        return {
          title: 'Unknown Error',
          message: 'An unknown error occurred during the authentication process.',
          solution: 'Please try again or contact support.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            {errorInfo.title}
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {errorInfo.message}
          </p>

          {/* Solution */}
          <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              <strong>Solution:</strong> {errorInfo.solution}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 w-full">
            <Link
              href="/auth/signin"
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </Link>
            
            <Link
              href="/"
              className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go Home
            </Link>
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                <strong>Debug:</strong> Error code: {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex flex-col items-center space-y-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
