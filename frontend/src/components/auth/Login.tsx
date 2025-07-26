import React from 'react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Anonymous Login</h2>
        <p className="text-gray-600 text-center mb-4">
          Access your secure mental health dashboard
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Commitment Hash</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Enter your anonymous commitment hash"
            />
          </div>
          <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800">
            Login Securely
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
