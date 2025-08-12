import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-blue-900 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Sahāya liṅk
        </h1>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          ) : (
            <span className="text-blue-200">Anonymous User</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
