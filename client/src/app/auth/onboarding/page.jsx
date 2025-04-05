'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import Link from 'next/link';

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