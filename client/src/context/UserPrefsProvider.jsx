'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { toast } from 'react-hot-toast';

// Default preferences
const DEFAULT_PREFERENCES = {
  theme: 'system',
  notifications: true,
  showSources: true,
  codeSnippets: false,
  technicalTerms: false,
  simplifiedExplanations: false,
  educationalResources: false,
};

// Create context
const UserPrefsContext = createContext({});

export const UserPrefsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Fetch user preferences from API
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!isAuthenticated || !user?.id) {
        // If not authenticated, use defaults but don't show loading state
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/auth/preferences');
        
        if (response.ok) {
          const data = await response.json();
          // Merge with defaults to ensure all properties exist
          setPreferences({ ...DEFAULT_PREFERENCES, ...data });
        } else {
          // If error, fallback to defaults
          console.error('Error fetching preferences:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [isAuthenticated, user?.id]);

  // Update preferences
  const updatePreferences = async (newPrefs) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to save preferences');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Update locally first for immediate feedback
      setPreferences((prev) => ({ ...prev, ...newPrefs }));

      // Then send to server
      const response = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrefs),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update preferences');
      }

      toast.success('Preferences updated');
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to save preferences');
      return { success: false, error: error.message };
    }
  };

  // Apply theme preference
  useEffect(() => {
    const applyTheme = () => {
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (preferences.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        };
        
        // Initial check
        handleChange(mediaQuery);
        
        // Listen for changes
        mediaQuery.addEventListener('change', handleChange);
        
        // Cleanup
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    };
    
    applyTheme();
  }, [preferences.theme]);

  // Set up role-based default preferences when role changes
  useEffect(() => {
    if (user?.role && isAuthenticated && !loading) {
      // Only set defaults if they haven't been customized yet
      const roleDefaults = {};
      
      if (user.role === 'developer') {
        roleDefaults.codeSnippets = true;
        roleDefaults.technicalTerms = true;
      } else if (user.role === 'teacher') {
        roleDefaults.simplifiedExplanations = true;
        roleDefaults.educationalResources = true;
      } else if (user.role === 'business') {
        roleDefaults.simplifiedExplanations = true;
      } else if (user.role === 'researcher') {
        roleDefaults.technicalTerms = true;
        roleDefaults.showSources = true;
      }
      
      // Update server only with the role-based defaults
      updatePreferences(roleDefaults);
    }
  }, [user?.role, isAuthenticated, loading]);

  // Reset preferences to defaults
  const resetPreferences = async () => {
    try {
      await updatePreferences(DEFAULT_PREFERENCES);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    preferences,
    updatePreferences,
    resetPreferences,
    loading,
  };

  return <UserPrefsContext.Provider value={value}>{children}</UserPrefsContext.Provider>;
};

// Custom hook for using user preferences context
export const useUserPreferences = () => {
  const context = useContext(UserPrefsContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPrefsProvider');
  }
  return context;
};

export default UserPrefsProvider;