'use client';

import React from 'react';

export function RoleSelector({ selectedRole, onChange }) {
  const roles = [
    { 
      id: 'developer', 
      title: 'Developer', 
      description: 'I write code and build applications',
      icon: '💻'
    },
    { 
      id: 'teacher', 
      title: 'Teacher', 
      description: 'I educate and share knowledge with others',
      icon: '📚'
    }
  ];

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div 
          key={role.id}
          onClick={() => onChange(role.id)}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedRole === role.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            <div className="text-2xl mr-3">{role.icon}</div>
            <div>
              <h3 className="font-medium">{role.title}</h3>
              <p className="text-sm text-gray-500">{role.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RoleSelector;