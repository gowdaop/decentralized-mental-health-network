import React from 'react';

const CommunityTrends: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Community Trends</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">1,247</div>
          <div className="text-gray-600">Active Users</div>
          <div className="text-sm text-green-600 mt-1">↗ +12% this week</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">8,439</div>
          <div className="text-gray-600">Mood Entries</div>
          <div className="text-sm text-blue-600 mt-1">📊 AI-analyzed</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">452</div>
          <div className="text-gray-600">Peer Sessions</div>
          <div className="text-sm text-purple-600 mt-1">🤝 AI-matched</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Community Mood Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Average Community Mood</span>
              <span className="text-sm font-medium">6.8/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: '68%'}}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-green-600">Low Crisis Rate</div>
              <div className="text-sm text-gray-600">2.3% (AI-detected)</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-blue-600">High Engagement</div>
              <div className="text-sm text-gray-600">Active community support</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-800">
          🔒 All data is anonymized and privacy-preserving. Community insights are generated from encrypted, aggregated data.
        </p>
      </div>
    </div>
  );
};

export default CommunityTrends;
