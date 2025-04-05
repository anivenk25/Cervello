'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing the onboarding process
 * @returns {Object} Onboarding state and handlers
 */
export function useOnboarding() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const { user, saveUserRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define available roles
  const availableRoles = [
    { id: 'developer', label: 'Developer', description: 'Access to code snippets and technical documentation' },
    { id: 'business', label: 'Business User', description: 'Simplified explanations focused on business value' },
    { id: 'researcher', label: 'Researcher', description: 'Detailed information with source references' },
    { id: 'teacher', label: 'Teacher', description: 'Educational resources and simplified explanations' }
  ];

  // Check if user needs onboarding
  const needsOnboarding = user && !user.role;

  // Update role selection
  const selectRole = useCallback((role) => {
    setSelectedRole(role);
  }, []);

  // Save user role
  const handleRoleSelection = async (role) => {
    if (!role && !selectedRole) {
      toast.error('Please select a role');
      return false;
    }

    const roleToSave = role || selectedRole;
    
    try {
      setIsSubmitting(true);
      
      const result = await saveUserRole(roleToSave);
      
      if (result.success) {
        toast.success(`Welcome! You're now set up as a ${availableRoles.find(r => r.id === roleToSave)?.label || roleToSave}`);
        
        // Redirect to the specified URL or default to /qa
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.push('/qa');
        }
        return true;
      } else {
        toast.error(result.error || 'Failed to save role');
        console.error('Error saving role:', result.error);
        return false;
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Onboarding error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to onboarding if needed
  const checkAndRedirect = useCallback(() => {
    if (!authLoading && needsOnboarding && pathname !== '/auth/onboarding') {
      router.push('/auth/onboarding');
      return true;
    }
    return false;
  }, [authLoading, needsOnboarding, pathname, router]);

  // Check for onboarding need on initial load
  useEffect(() => {
    // Only check if auth is loaded and we're not already on the onboarding page
    if (!authLoading && pathname !== '/auth/onboarding') {
      checkAndRedirect();
    }
  }, [authLoading, pathname, checkAndRedirect]);

  // Skip onboarding for specific roles (e.g., admin roles set by backend)
  const skipOnboarding = useCallback(async () => {
    if (needsOnboarding) {
      // This is an escape hatch for special cases
      router.push('/qa');
    }
  }, [needsOnboarding, router]);

  return {
    needsOnboarding,
    isSubmitting,
    selectedRole,
    availableRoles,
    selectRole,
    handleRoleSelection,
    checkAndRedirect,
    skipOnboarding
  };
}

export default useOnboarding;