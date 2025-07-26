import React from 'react';

const PeerMatching: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Peer Matching</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Find Compatible Peers</h2>
          <p className="text-gray-600 mb-4">
            AI-powered matching based on anonymous preference vectors
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Topics</label>
              <input 
                type="text" 
                placeholder="anxiety, depression, stress..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Severity Level</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option>Mild</option>
                <option>Moderate</option>
                <option>Severe</option>
              </select>
            </div>
            
            <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800">
              Find Matches (AI-Powered)
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Compatible Peers</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium">Anonymous User #1</span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">85% Match</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Similar topics: anxiety, workplace stress</p>
            </div>
            
            <div className="p-3 border border-gray-200 rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium">Anonymous User #2</span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">78% Match</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Similar topics: depression, social anxiety</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerMatching;
