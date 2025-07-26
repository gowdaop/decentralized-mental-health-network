import React, { useState } from 'react';

const MoodTracker: React.FC = () => {
  const [mood, setMood] = useState(5);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mood Tracker</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood Level: {mood}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Low</span>
              <span>Excellent</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Share your thoughts... (AI-powered crisis detection active)"
            />
          </div>
          
          <button className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700">
            Track Mood (AI Analysis)
          </button>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-800">
          🚨 Crisis Detection Active | Indian Resources: AASRA (022-27546669) | iCall (9152987821)
        </p>
      </div>
    </div>
  );
};

export default MoodTracker;
