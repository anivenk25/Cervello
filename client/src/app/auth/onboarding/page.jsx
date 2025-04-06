'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import Link from 'next/link';

// Inline RoleSelector component
const RoleSelector = ({ selectedRole, onChange }) => {
  const roles = [
    {
      id: 'consumer',
      title: 'General User',
      description: 'I want simple, clear answers without technical jargon.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'developer',
      title: 'Developer',
      description: 'I prefer technical details and code examples.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      id: 'academic',
      title: 'Researcher',
      description: 'I need in-depth information with citations and sources.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <div
          key={role.id}
          className={`flex items-start p-3 cursor-pointer rounded-lg transition-colors ${
            selectedRole === role.id
              ? 'bg-[#1e3a8a] border border-[#3b82f6]'
              : 'border border-[#2d3748] hover:bg-[#1e293b]'
          }`}
          onClick={() => onChange(role.id)}
        >
          <div className={`flex-shrink-0 p-2 rounded-md ${
            selectedRole === role.id ? 'text-[#3b82f6]' : 'text-white/70'
          }`}>
            {role.icon}
          </div>
          <div className="ml-3">
            <h3 className={`font-medium ${
              selectedRole === role.id ? 'text-white' : 'text-white/90'
            }`}>
              {role.title}
            </h3>
            <p className={`text-sm mt-1 ${
              selectedRole === role.id ? 'text-white/80' : 'text-white/60'
            }`}>
              {role.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const { handleRoleSelection, isSubmitting } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState(null);

  // Redirect to dashboard if user already has a role
  useEffect(() => {
    if (status === 'authenticated' && user?.role) {
      router.push('/qa');
    }
  }, [status, user, router]);

  // Handle role selection submission
  const handleContinue = async () => {
    if (!selectedRole || isSubmitting) return;
    
    await handleRoleSelection(selectedRole);
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0e17]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0a0e17] font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-[#0a0e17] to-[#111827]">
      <div className="w-full max-w-md p-8 bg-[#111827] rounded-xl shadow-lg shadow-[#3b82f6]/10 border border-[#2d3748]">
        <h1 className="text-2xl font-bold text-center mb-4 text-white">Welcome to <span className="text-[#3b82f6]">Q&A Assistant</span>!</h1>
        
        <div className="h-1 w-20 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] mx-auto mb-6 rounded-full"></div>
        
        <p className="text-white/70 mb-8 text-center">
          Please select your role to personalize your experience
        </p>
        
        <div className="bg-[#0a0e17] p-6 rounded-lg border border-[#2d3748]">
          <RoleSelector 
            selectedRole={selectedRole} 
            onChange={setSelectedRole} 
          />
        </div>
        
        <button
          onClick={handleContinue}
          disabled={!selectedRole || isSubmitting}
          className="w-full mt-8 py-3 px-4 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:bg-[#3b82f6]/30 disabled:text-white/50 transition-colors font-medium"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Continue'
          )}
        </button>
        
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-[#3b82f6] hover:text-[#60a5fa] text-sm transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-white/40 text-sm text-center max-w-md">
        Your role selection helps us tailor the Q&A experience to your specific needs and interests.
      </div>
    </div>
  );
}