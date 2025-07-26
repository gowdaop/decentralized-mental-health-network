import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Registration from './components/auth/Registration';
import Login from './components/auth/Login';
import MoodTracker from './components/dashboard/MoodTracker';
import PeerMatching from './components/peers/PeerMatching';
import PersonalInsights from './components/analytics/PersonalInsights';
import CommunityTrends from './components/analytics/CommunityTrends';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/mood" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <MoodTracker />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/peers" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PeerMatching />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/insights" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PersonalInsights />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/community" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <CommunityTrends />
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
