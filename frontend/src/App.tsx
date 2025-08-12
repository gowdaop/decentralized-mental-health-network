import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Registration from './components/auth/Registration';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/globals.css';
import './styles/themes.css';
import './styles/components.css';
// ✅ Create a dedicated MoodPage component
const MoodPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mood Tracking</h1>
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Your existing MoodTracker component */}
        <div>Mood Tracker will go here</div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router 
        future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true 
        }}
      >
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Layout - ✅ Remove children prop */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* ✅ Nested routes using index and path */}
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="mood" element={<MoodPage />} />
              <Route path="analytics" element={<div>Analytics Coming Soon</div>} />
              <Route path="peers" element={<div>Peer Support Coming Soon</div>} />
              <Route path="community" element={<div>Community Coming Soon</div>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
