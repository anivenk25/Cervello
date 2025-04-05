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
      <div className="min-h-screen bg-[#0a0e17]">
        <Header user={session?.user} />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
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
    <div className="min-h-screen bg-[#0a0e17] font-[family-name:var(--font-geist-sans)]">
      <Header user={session?.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-[#111827] shadow-lg shadow-[#3b82f6]/5 rounded-xl p-6 border border-[#2d3748]">
          <h1 className="text-2xl font-bold mb-2 text-white flex items-center">
            Your Profile
            <div className="h-1 w-16 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] ml-4 rounded-full"></div>
          </h1>
          <p className="text-white/60 mb-6">Manage your account information and preferences</p>
          
          {profile ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="bg-[#0a0e17] rounded-xl p-6 border border-[#2d3748]">
                    <div className="flex items-center justify-center mb-4">
                      {profile.image ? (
                        <img 
                          src={profile.image} 
                          alt={profile.name} 
                          className="h-24 w-24 rounded-full object-cover border-2 border-[#3b82f6]"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-2xl font-bold">
                          {profile.name ? profile.name[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-medium text-center text-white">{profile.name}</h2>
                    <p className="text-white/60 text-center mt-1">{profile.email}</p>
                    
                    <div className="mt-6 pt-6 border-t border-[#2d3748]">
                      <button className="w-full py-2 px-4 rounded-lg bg-[#1e293b] text-white hover:bg-[#1e293b]/80 text-sm font-medium transition-colors flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-[#2d3748] rounded-xl p-4 bg-[#0a0e17] hover:border-[#3b82f6]/30 transition-colors">
                      <h3 className="text-sm font-medium text-white/60 mb-1">Role</h3>
                      <p className="text-lg font-medium text-white">{profile.role || 'Not specified'}</p>
                    </div>
                    
                    <div className="border border-[#2d3748] rounded-xl p-4 bg-[#0a0e17] hover:border-[#3b82f6]/30 transition-colors">
                      <h3 className="text-sm font-medium text-white/60 mb-1">Member Since</h3>
                      <p className="text-lg font-medium text-white">
                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="border border-[#2d3748] rounded-xl p-4 bg-[#0a0e17] hover:border-[#3b82f6]/30 transition-colors">
                      <h3 className="text-sm font-medium text-white/60 mb-1">Login Count</h3>
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e293b] text-[#3b82f6] mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </span>
                        <p className="text-lg font-medium text-white">{profile.metadata?.loginCount || 0}</p>
                      </div>
                    </div>
                    
                    <div className="border border-[#2d3748] rounded-xl p-4 bg-[#0a0e17] hover:border-[#3b82f6]/30 transition-colors">
                      <h3 className="text-sm font-medium text-white/60 mb-1">Last Login</h3>
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e293b] text-[#3b82f6] mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <p className="text-lg font-medium text-white">
                          {profile.metadata?.lastLogin ? new Date(profile.metadata.lastLogin).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 border border-[#2d3748] rounded-xl p-6 bg-[#0a0e17]">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#1e293b] p-4 rounded-lg">
                        <p className="text-sm font-medium text-white/60 mb-2">Theme</p>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-[#3b82f6] mr-2"></div>
                          <p className="text-white">{profile.preferences?.theme || 'System default'}</p>
                        </div>
                      </div>
                      <div className="bg-[#1e293b] p-4 rounded-lg">
                        <p className="text-sm font-medium text-white/60 mb-2">Show Sources</p>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${profile.preferences?.showSources ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                          <p className="text-white">{profile.preferences?.showSources ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      <div className="bg-[#1e293b] p-4 rounded-lg">
                        <p className="text-sm font-medium text-white/60 mb-2">Code Snippets</p>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${profile.preferences?.codeSnippets ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                          <p className="text-white">{profile.preferences?.codeSnippets ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                      <div className="bg-[#1e293b] p-4 rounded-lg">
                        <p className="text-sm font-medium text-white/60 mb-2">Technical Terms</p>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${profile.preferences?.technicalTerms ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                          <p className="text-white">{profile.preferences?.technicalTerms ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button className="mt-6 py-2 px-4 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] text-sm font-medium transition-colors flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Update Preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border border-[#2d3748] rounded-xl bg-[#0a0e17] text-white/60 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[#3b82f6] mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">Failed to load profile information.</p>
              <p className="mt-2">Please try again later or contact support if the issue persists.</p>
              <button className="mt-6 py-2 px-4 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] text-sm font-medium transition-colors">
                Retry
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}