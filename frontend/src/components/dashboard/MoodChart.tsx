import React from 'react';

const MoodChart: React.FC = () => {
  return (
    <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mood Trends</h3>
        <p className="text-gray-600">7-day average: 6.8/10</p>
        <div className="mt-4 flex justify-center space-x-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">This Week</div>
            <div className="text-lg font-semibold text-green-600">↗ Improving</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Entries</div>
            <div className="text-lg font-semibold text-blue-600">12</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodChart;
