import React from 'react';
import MoodChart from './MoodChart';
import ReputationCard from './ReputationCard';
import CrisisAlert from '../crisis/CrisisAlert';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-light text-primary-900 mb-4">
          Welcome to Your Safe Space
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Your anonymous mental health journey, powered by AI and secured by blockchain.
          Track your mood, connect with peers, and grow in a privacy-first environment.
        </p>
      </div>
      
      {/* Crisis Alert (if needed) */}
      <CrisisAlert />
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mood Overview */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-primary-900 mb-6">Mood Overview</h2>
            <MoodChart />
          </div>
        </div>
        
        {/* Reputation & Quick Actions */}
        <div className="space-y-6">
          <ReputationCard />
          
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary text-left">
                Record Mood Entry
              </button>
              <button className="w-full btn-ghost text-left">
                Find Peer Support
              </button>
              <button className="w-full btn-ghost text-left">
                View Insights
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-light text-primary-900 mb-2">1,247</div>
          <div className="text-gray-600">Active Users</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-light text-primary-900 mb-2">8,439</div>
          <div className="text-gray-600">Mood Entries</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-light text-primary-900 mb-2">452</div>
          <div className="text-gray-600">Peer Sessions</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
