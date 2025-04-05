'use client';

import { useContext, useCallback } from 'react';
import { AuthContext } from '@/context/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Enhanced hook for authentication functionality
 * Extends the base AuthContext with navigation helpers and protected route checks
 */
export function useAuth() {
  const context = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Navigate to login page with return URL
  const navigateToLogin = useCallback(() => {
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/auth/login?returnUrl=${returnUrl}`);
  }, [router, pathname]);
  
  // Navigate to onboarding if needed
  const checkAndNavigateToOnboarding = useCallback(() => {
    if (context.isAuthenticated && context.user && !context.user.role) {
      router.push('/auth/onboarding');
      return true;
    }
    return false;
  }, [context.isAuthenticated, context.user, router]);
  
  // Check if user can access admin routes
  const isAdmin = useCallback(() => {
    return context.user?.role === 'admin';
  }, [context.user?.role]);
  
  // Combine the original context with our enhanced functions
  return {
    ...context,
    navigateToLogin,
    checkAndNavigateToOnboarding,
    isAdmin
  };
}

export default useAuth;