import React from 'react';

const ReputationCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Reputation</h3>
        <div className="text-2xl">⛓️</div>
      </div>
      
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-2">100</div>
        <div className="text-sm text-gray-600 mb-4">Blockchain Score</div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Community Trust</span>
            <span className="font-medium text-green-600">High</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Peer Support</span>
            <span className="font-medium text-blue-600">Active</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Privacy Level</span>
            <span className="font-medium text-purple-600">Anonymous</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          🔒 Stored securely on blockchain
        </p>
      </div>
    </div>
  );
};

export default ReputationCard;
