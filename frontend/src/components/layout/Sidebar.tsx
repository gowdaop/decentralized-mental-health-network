import React from 'react';

interface SidebarProps {
  activeComponent: string;
  setActiveComponent: (component: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeComponent, setActiveComponent }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', category: 'Main' },
    { id: 'mood-tracker', label: 'Mood Tracker', category: 'Tracking' },
    { id: 'mood-chart', label: 'Mood Analytics', category: 'Tracking' },
    { id: 'reputation', label: 'Reputation Score', category: 'Profile' },
    { id: 'peer-matching', label: 'Find Peers', category: 'Community' },
    { id: 'session-creator', label: 'Create Session', category: 'Community' },
    { id: 'crisis-resources', label: 'Crisis Support', category: 'Support' },
    { id: 'analytics', label: 'Personal Insights', category: 'Analytics' },
    { id: 'community-trends', label: 'Community Trends', category: 'Analytics' }
  ];

  const categories = ['Main', 'Tracking', 'Profile', 'Community', 'Support', 'Analytics'];

  return (
    <aside className="bg-gray-900 text-white w-80 min-h-screen shadow-xl border-r border-gray-700">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-2">Navigation</h2>
        <p className="text-gray-400 text-sm">Mental Health Platform</p>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        {categories.map((category) => (
          <div key={category} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              {category}
            </h3>
            <ul className="space-y-1">
              {menuItems
                .filter(item => item.category === category)
                .map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveComponent(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                        activeComponent === item.id
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        activeComponent === item.id ? 'bg-white' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Status */}
      {/* Fixed Bottom Status - Non-blocking */}
      <div className="p-4 mt-6 mx-4 mb-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <p className="text-sm font-medium text-white">System Active</p>
            <p className="text-xs text-gray-400">All services running</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
