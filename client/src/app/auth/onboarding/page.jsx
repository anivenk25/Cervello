'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';

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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Q&A Assistant!</h1>
        <p className="text-gray-600 mb-8 text-center">
          Please select your role to personalize your experience
        </p>
        
        <RoleSelector 
          selectedRole={selectedRole} 
          onChange={setSelectedRole} 
        />
        
        <button
          onClick={handleContinue}
          disabled={!selectedRole || isSubmitting}
          className="w-full mt-8 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}