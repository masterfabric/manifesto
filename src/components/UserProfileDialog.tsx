'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    preferred_username?: string;
    user_name?: string;
  };
}

interface UserProfileDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSignManifesto: () => void;
}

export const UserProfileDialog = ({ user, isOpen, onClose, onSignManifesto }: UserProfileDialogProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSignManifesto = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSignManifesto();
      onClose();
    }, 200);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div 
        className={`relative bg-white rounded-lg max-w-md w-full transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-manifesto-gray">
            Welcome!
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info Card */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <img
              src={user.user_metadata?.avatar_url || 'https://avatars.githubusercontent.com/u/0?v=4'}
              alt={user.user_metadata?.full_name || 'User'}
              className="w-16 h-16 rounded-full border-2 border-gray-100 shadow-sm"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-manifesto-gray text-lg">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.user_metadata?.preferred_username ||
                  user.user_metadata?.user_name ||
                  'User'}
              </h3>
              <p className="text-sm text-gray-600">
                @{user.user_metadata?.preferred_username || user.user_metadata?.user_name || 'username'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user.email}
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Ready to join the developer community and sign the manifesto?
            </p>
            <button
              onClick={handleSignManifesto}
              className="w-full bg-white text-blue-800 py-3 px-4 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 transition-all duration-200 font-medium border-2 border-blue-800"
            >
              Sign the Developer Manifesto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
