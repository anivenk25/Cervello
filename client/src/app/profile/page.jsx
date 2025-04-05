// src/app/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?returnUrl=/profile');
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/auth/profile')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          toast.error('Failed to load profile data');
          setLoading(false);
        });
    }
  }, [session]);

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header user={session?.user} />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // If not authenticated
  if (status === 'unauthenticated') {
    return null; // We're redirecting, so don't show anything
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={session?.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          {profile ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-4">
                      {profile.image ? (
                        <img 
                          src={profile.image} 
                          alt={profile.name} 
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                          {profile.name ? profile.name[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-medium text-center">{profile.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-center">{profile.email}</p>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Role</h3>
                      <p className="text-lg font-medium">{profile.role || 'Not specified'}</p>
                    </div>
                    
                    <div className="border dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</h3>
                      <p className="text-lg font-medium">
                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="border dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Login Count</h3>
                      <p className="text-lg font-medium">{profile.metadata?.loginCount || 0}</p>
                    </div>
                    
                    <div className="border dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Login</h3>
                      <p className="text-lg font-medium">
                        {profile.metadata?.lastLogin ? new Date(profile.metadata.lastLogin).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 border dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</p>
                        <p>{profile.preferences?.theme || 'System default'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Show Sources</p>
                        <p>{profile.preferences?.showSources ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Code Snippets</p>
                        <p>{profile.preferences?.codeSnippets ? 'Enabled' : 'Disabled'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Technical Terms</p>
                        <p>{profile.preferences?.technicalTerms ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Failed to load profile information. Please try again later.</p>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}