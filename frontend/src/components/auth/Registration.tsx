import React from 'react';

const Registration: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Anonymous Registration</h2>
        <p className="text-gray-600 text-center mb-4">
          Join your decentralized mental health support network
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Age Range</label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option>18-25</option>
              <option>25-35</option>
              <option>35-45</option>
              <option>45+</option>
            </select>
          </div>
          <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800">
            Register Anonymously
          </button>
        </div>
      </div>
    </div>
  );
};

export default Registration;
