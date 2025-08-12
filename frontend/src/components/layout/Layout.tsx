import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

// Import components
import Dashboard from '../dashboard/Dashboard';
import MoodTracker from '../dashboard/MoodTracker';
import MoodChart from '../dashboard/MoodChart';
import ReputationCard from '../dashboard/ReputationCard';
import PeerMatching from '../peers/PeerMatching';
import SessionCreator from '../peers/SessionCreator';
import CrisisResources from '../crisis/CrisisResources';
import PersonalInsights from '../analytics/PersonalInsights';
import CommunityTrends from '../analytics/CommunityTrends';

const Layout: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState('dashboard');

  const renderMainContent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard />;
      case 'mood-tracker':
        return <MoodTracker />;
      case 'mood-chart':
        return <MoodChart />;
      case 'reputation':
        return <ReputationCard />;
      case 'peer-matching':
        return <PeerMatching />;
      case 'session-creator':
        return <SessionCreator />;
      case 'crisis-resources':
        return <CrisisResources />;
      case 'analytics':
        return <PersonalInsights />;
      case 'community-trends':
        return <CommunityTrends />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <Header />
      
      {/* Main Layout Container */}
      <div className="flex">
        {/* Sidebar - Fixed width, full height */}
        <Sidebar 
          activeComponent={activeComponent} 
          setActiveComponent={setActiveComponent} 
        />
        
        {/* Main Content Area */}
        <main className="flex-1 min-h-screen p-8">
          <div className="max-w-full">
            {renderMainContent()}
          </div>
        </main>
      </div>
      
      {/* Fixed Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
