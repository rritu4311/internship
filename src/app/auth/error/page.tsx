'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AuthErrorContent() {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden border-2 border-border/20 backdrop-blur-sm p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-red-100 mb-6 shadow-inner">
            <svg 
              className="h-10 w-10 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {errorInfo.title}
          </h1>

          {/* Error Message */}
          <p className="text-secondary-foreground mb-6 text-lg">
            {errorInfo.message}
          </p>

          {/* Solution */}
          <div className="mb-8 rounded-xl bg-secondary/50 p-5 text-left border border-border/50">
            <p className="text-primary">
              <span className="font-bold text-primary">Solution:</span> {errorInfo.solution}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="block w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:bg-primary-600"
            >
              Try Again
            </Link>
            
            <Link
              href="/"
              className="block w-full py-3 px-6 rounded-xl bg-card text-primary font-semibold border-2 border-border hover:border-primary shadow-md hover:shadow-lg transition-all duration-200"
            >
              Go to Homepage
            </Link>
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-sm text-primary">
                <span className="font-bold text-primary">Debug:</span> Error code: {error}
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-primary font-medium">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
