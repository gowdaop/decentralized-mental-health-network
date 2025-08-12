import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

interface ReputationData {
  user_commitment: string;
  current_reputation: number;
  reputation_level: string;
  next_milestone: {
    next_level: string;
    points_needed: number;
    current_progress: number;
  };
}

interface ReputationBreakdown {
  reputation_breakdown: {
    factors: {
      mood_consistency: number;
      data_quality: number;
      peer_support: number;
      crisis_recovery: number;
      community_engagement: number;
      platform_longevity: number;
    };
    weights: {
      [key: string]: number;
    };
  };
  improvement_suggestions: string[];
}

interface LeaderboardEntry {
  rank: number;
  anonymous_id: string;
  reputation_score: number;
  reputation_level: string;
  joined: string;
}

const ReputationDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [breakdown, setBreakdown] = useState<ReputationBreakdown | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'leaderboard'>('overview');

  useEffect(() => {
    if (isAuthenticated) {
      fetchReputationData();
    }
  }, [isAuthenticated]);

  const fetchReputationData = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = authService.getAuthHeaders();

      // Fetch reputation score
      const reputationResponse = await fetch('/api/v1/reputation/score', {
        method: 'GET',
        headers
      });

      if (!reputationResponse.ok) {
        throw new Error('Failed to fetch reputation data');
      }

      const reputationResult = await reputationResponse.json();
      setReputationData(reputationResult);

      // Fetch breakdown
      const breakdownResponse = await fetch('/api/v1/reputation/breakdown', {
        method: 'GET',
        headers
      });

      if (breakdownResponse.ok) {
        const breakdownResult = await breakdownResponse.json();
        setBreakdown(breakdownResult);
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/v1/reputation/leaderboard', {
        method: 'GET',
        headers
      });

      if (leaderboardResponse.ok) {
        const leaderboardResult = await leaderboardResponse.json();
        setLeaderboard(leaderboardResult.leaderboard);
      }

    } catch (error) {
      console.error('Error fetching reputation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load reputation data');
    } finally {
      setLoading(false);
    }
  };

  const updateReputation = async () => {
    setUpdating(true);
    setError('');

    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch('/api/v1/reputation/update', {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to update reputation');
      }

      const result = await response.json();
      
      // Refresh data
      await fetchReputationData();
      
      // Show success message briefly
      setTimeout(() => {
        // You could add a success toast here
      }, 2000);

    } catch (error) {
      console.error('Error updating reputation:', error);
      setError(error instanceof Error ? error.message : 'Failed to update reputation');
    } finally {
      setUpdating(false);
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'Guardian': return 'text-purple-600 bg-purple-100';
      case 'Mentor': return 'text-blue-600 bg-blue-100';
      case 'Supporter': return 'text-green-600 bg-green-100';
      case 'Member': return 'text-yellow-600 bg-yellow-100';
      case 'Newcomer': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 fade-in">
        <div className="dashboard-card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your reputation dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 fade-in">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner w-16 h-16"></div>
          <span className="ml-4 text-lg">Loading reputation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-theme-primary mb-3">Reputation Dashboard</h1>
        <p className="text-xl text-theme-secondary">Track your community standing and contribution to mental health support</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={fetchReputationData}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-card">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['overview', 'breakdown', 'leaderboard'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'breakdown' && '🔍 Breakdown'}
              {tab === 'leaderboard' && '🏆 Leaderboard'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && reputationData && (
        <div className="space-y-6">
          {/* Main Reputation Card */}
          <div className="dashboard-card text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {reputationData.current_reputation.toFixed(1)}
              </div>
              <div className={`inline-flex px-4 py-2 rounded-full text-lg font-bold ${getLevelColor(reputationData.reputation_level)}`}>
                {reputationData.reputation_level}
              </div>
            </div>

            <button
              onClick={updateReputation}
              disabled={updating}
              className="btn btn-primary mb-4"
            >
              {updating ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                '🔄 Update Reputation'
              )}
            </button>

            {/* Progress to Next Level */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress to {reputationData.next_milestone.next_level}</span>
                <span>{reputationData.next_milestone.points_needed.toFixed(1)} points needed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${reputationData.next_milestone.current_progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && breakdown && (
        <div className="space-y-6">
          <div className="dashboard-card">
            <h3 className="text-xl font-bold text-theme-primary mb-6">Reputation Factors</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(breakdown.reputation_breakdown.factors).map(([factor, score]) => (
                <div key={factor} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">
                      {factor.replace('_', ' ')}
                    </span>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-blue-500' :
                        score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Weight: {(breakdown.reputation_breakdown.weights[factor] * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Improvement Suggestions */}
            <div>
              <h4 className="font-bold text-theme-secondary mb-4">💡 Improvement Suggestions</h4>
              <div className="space-y-2">
                {breakdown.improvement_suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="dashboard-card">
          <h3 className="text-xl font-bold text-theme-primary mb-6">🏆 Community Leaderboard</h3>
          
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-medium">{entry.anonymous_id}</div>
                    <div className="text-sm text-gray-500">Joined {entry.joined}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-blue-600">{entry.reputation_score.toFixed(1)}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getLevelColor(entry.reputation_level)}`}>
                    {entry.reputation_level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>🔒</span>
          <span>Reputation scores are calculated using encrypted data and zero-knowledge algorithms. All leaderboard entries are anonymized to protect user privacy.</span>
        </div>
      </div>
    </div>
  );
};

export default ReputationDashboard;
