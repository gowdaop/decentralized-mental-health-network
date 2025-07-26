import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MH</span>
            </div>
            <span className="font-semibold text-primary-900">Mental Health Network</span>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Anonymous User Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Anonymous User</span>
            </div>
            
            {/* Reputation */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Reputation:</span>
              <span className="font-medium text-primary-900">{user?.reputation || 100}</span>
            </div>
            
            {/* Logout */}
            <button
              onClick={logout}
              className="text-gray-500 hover:text-primary-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
