import React, { useState } from 'react';

const CrisisAlert: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // This would normally be triggered by AI crisis detection
  // For demo purposes, we'll show it conditionally
  
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Crisis Support Available
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>AI has detected you might need immediate support. Help is available 24/7.</p>
          </div>
          <div className="mt-4">
            <div className="flex space-x-4">
              <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                Get Help Now
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-red-600 px-4 py-2 rounded text-sm border border-red-300 hover:bg-red-50"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs text-red-700">
              🇮🇳 Indian Crisis Resources: AASRA (022-27546669) | iCall (9152987821) | Vandrevala Foundation (1860-2662-345)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisAlert;
