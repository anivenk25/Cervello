'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Create context and export it
export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Update user state when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser(session.user);
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
    
    setLoading(status === 'loading');
  }, [session, status]);

  // Google login function
  const login = async () => {
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/qa'
      });

      if (result?.error) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      if (!result?.url) {
        return { success: true };
      }

      // If we get a URL back, we need to redirect the user
      router.push(result.url);
      return { success: true };
    } catch (error) {
      toast.error('Failed to sign in with Google');
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update profile');
        return { success: false, error: data.error };
      }

      // Update session
      await update({
        ...session,
        user: {
          ...session.user,
          ...userData,
        },
      });

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      toast.error('Error updating profile');
      return { success: false, error: error.message };
    }
  };

  // Save user role during onboarding
  const saveUserRole = async (role) => {
    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to save role');
        return { success: false, error: data.error };
      }

      // Update session with new role
      await update({
        ...session,
        user: {
          ...session.user,
          role,
        },
      });

      toast.success('Role saved successfully');
      return { success: true, redirectTo: '/qa' };
    } catch (error) {
      toast.error('Error saving role');
      return { success: false, error: error.message };
    }
  };

  // Check if user needs onboarding
  const needsOnboarding = user && !user.role;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    saveUserRole,
    needsOnboarding
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;