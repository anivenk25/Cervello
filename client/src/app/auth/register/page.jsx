'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  // Check if there's a redirect parameter
  const returnUrl = searchParams.get('returnUrl') || '/auth/onboarding';

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(returnUrl);
    }
  }, [status, router, returnUrl]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: returnUrl });
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error('Failed to sign in with Google');
    }
  };

  // If currently checking authentication status, show loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-black/[.06] dark:border-white/[.08]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center">
              <div className="relative h-10 w-10 mr-2">
                <Image 
                  src="/logo.svg" 
                  alt="Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold">Pathway RAG</h1>
            </div>
          </Link>
          <h2 className="text-xl font-semibold mt-8 mb-2">Create an Account</h2>
          <p className="text-gray-500 dark:text-gray-400">Join us to get personalized answers</p>
        </div>
        
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-lg border border-black/[.08] dark:border-white/[.08] transition-colors flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 font-medium h-12 px-6"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Sign up with Google
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}