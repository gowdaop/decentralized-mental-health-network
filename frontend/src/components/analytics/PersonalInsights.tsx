import React from 'react';

const PersonalInsights: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Personal Insights</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Mood Trend</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">Improving ↗</div>
          <p className="text-sm text-gray-600">7-day average: 6.2/10</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Risk Level</h3>
          <div className="text-3xl font-bold text-yellow-600 mb-2">Low ⚠</div>
          <p className="text-sm text-gray-600">AI assessment: Stable patterns</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Engagement</h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">Active 💪</div>
          <p className="text-sm text-gray-600">5 mood entries this week</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">AI-Generated Recommendations</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            Continue current positive practices - your mood trend is improving
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Consider engaging with peer support community
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Maintain regular mood tracking for best AI insights
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PersonalInsights;
