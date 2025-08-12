import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

type Period = 7 | 30 | 90;

interface MoodAnalysis {
  user_analysis?: {
    period_days?: number;
    entries_count?: number;
    trend?: {
      direction?: string;
      average_mood?: number;
    };
    risk?: {
      level?: string;
      high_risk_entries?: number;
    };
    patterns?: {
      volatility?: {
        level?: string;
      };
    };
    recommendations?: string[];
    progress?: {
      improvement_score?: number;
      consistency_score?: number;
      engagement_level?: string;
    };
  };
}

interface ReputationData {
  current_reputation?: number;
  reputation_level?: string;
  next_milestone?: {
    next_level?: string;
    points_needed?: number;
    current_progress?: number;
  };
}

interface MoodStats {
  total_entries?: number;
  this_week_entries?: number;
  this_month_entries?: number;
  streak_days?: number;
  average_mood_last_7_days?: number;
  average_mood_last_30_days?: number;
  crisis_interventions?: number;
}

// Safe number formatting helper - prevents .toFixed() crashes
function safeFixed(value: any, digits = 1): string {
  const num = Number(value);
  return isNaN(num) ? '0'.padEnd(digits + 2, '.0') : num.toFixed(digits);
}

const getMoodTrend = (direction = '') => {
  switch (direction.toLowerCase()) {
    case 'improving':
    case 'positive':
      return { label: 'Improving', icon: '↗', color: 'text-green-600' };
    case 'declining':
    case 'negative':
      return { label: 'Declining', icon: '↘', color: 'text-red-600' };
    case 'stable':
      return { label: 'Stable', icon: '→', color: 'text-blue-600' };
    default:
      return { label: 'Unknown', icon: '❓', color: 'text-gray-600' };
  }
};

const getRiskLevel = (level = '') => {
  switch (level.toUpperCase()) {
    case 'HIGH':
      return { label: 'High', icon: '🚨', color: 'text-red-600' };
    case 'MEDIUM':
      return { label: 'Medium', icon: '⚠️', color: 'text-yellow-600' };
    case 'LOW':
    case 'MINIMAL':
      return { label: 'Low', icon: '✅', color: 'text-green-600' };
    default:
      return { label: 'Unknown', icon: '❓', color: 'text-gray-600' };
  }
};

const getEngagement = (entries = 0) => {
  if (entries >= 7) return { label: 'Excellent', icon: '🔥', color: 'text-green-600' };
  if (entries >= 5) return { label: 'Active', icon: '💪', color: 'text-blue-600' };
  if (entries >= 3) return { label: 'Moderate', icon: '👍', color: 'text-yellow-500' };
  if (entries > 0) return { label: 'Low', icon: '🌱', color: 'text-orange-500' };
  return { label: 'Inactive', icon: '😴', color: 'text-red-600' };
};

const PersonalInsights: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState<Period>(7);

  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchData = async (p: Period, refresh = false) => {
    if (!isAuthenticated || !user) {
      setError('Authentication required. Please login to view your insights.');
      setLoading(false);
      return;
    }

    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const headers = authService.getAuthHeaders();

      // Parallel API calls
      const [moodRes, reputationRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/mood/analysis?days=${p}`, { headers }),
        fetch(`${API_URL}/api/v1/reputation/score`, { headers }),
        fetch(`${API_URL}/api/v1/mood/stats`, { headers }),
      ]);

      // Handle authentication errors
      for (const res of [moodRes, reputationRes, statsRes]) {
        if (res.status === 401) {
          setError('Session expired. Please login again.');
          return;
        }
        if (res.status === 403) {
          setError('Access denied.');
          return;
        }
      }

      if (![moodRes.ok, reputationRes.ok, statsRes.ok].every(Boolean)) {
        setError('Failed to fetch data from server.');
        return;
      }

      // Parse responses safely
      const [moodData, reputationData, statsData] = await Promise.all([
        moodRes.json().catch(() => ({})),
        reputationRes.json().catch(() => ({})),
        statsRes.json().catch(() => ({})),
      ]);

      setMoodAnalysis(moodData);
      setReputationData(reputationData);
      setMoodStats(statsData);
    } catch (e) {
      console.error('Fetch error:', e);
      setError('Error loading data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period, isAuthenticated, user]);

  const handleRefresh = () => fetchData(period, true);
  const handlePeriodChange = (p: Period) => setPeriod(p);

  // Auth check
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl p-8 mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-6">Please login to view your personal insights dashboard.</p>
        <button 
          onClick={() => window.location.href = '/login'} 
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Loading Personal Insights...</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Personal Insights</h1>
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={handleRefresh} 
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get display data with safe fallbacks
  const moodTrend = getMoodTrend(moodAnalysis?.user_analysis?.trend?.direction ?? '');
  const riskLevel = getRiskLevel(moodAnalysis?.user_analysis?.risk?.level ?? '');
  const engagement = getEngagement(moodStats?.this_week_entries ?? 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Personal Insights</h1>
        <div className="flex space-x-2">
          {[7, 30, 90].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p as Period)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                period === p 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {p}d
            </button>
          ))}
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Mood Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Mood Trend</h2>
          <div className={`text-3xl font-bold mb-2 ${moodTrend.color}`}>
            {moodTrend.icon} {moodTrend.label}
          </div>
          <p className="text-gray-600">
            {period}-day average: {safeFixed(moodAnalysis?.user_analysis?.trend?.average_mood)}/10
          </p>
          <p className="text-sm text-gray-500">
            Based on {moodAnalysis?.user_analysis?.entries_count ?? 0} entries
          </p>
        </div>

        {/* Risk Level */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Risk Level</h2>
          <div className={`text-3xl font-bold mb-2 ${riskLevel.color}`}>
            {riskLevel.icon} {riskLevel.label}
          </div>
          <p className="text-gray-600">
            Volatility: {moodAnalysis?.user_analysis?.patterns?.volatility?.level ?? 'Unknown'}
          </p>
          <p className="text-sm text-gray-500">
            High-risk entries: {moodAnalysis?.user_analysis?.risk?.high_risk_entries ?? 0}
          </p>
        </div>

        {/* Engagement */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Engagement</h2>
          <div className={`text-3xl font-bold mb-2 ${engagement.color}`}>
            {engagement.icon} {engagement.label}
          </div>
          <p className="text-gray-600">
            This week: {moodStats?.this_week_entries ?? 0} entries
          </p>
          <p className="text-sm text-gray-500">
            Current streak: {moodStats?.streak_days ?? 0} days
          </p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Recommendations</h2>
        {moodAnalysis?.user_analysis?.recommendations && moodAnalysis.user_analysis.recommendations.length > 0 ? (
          <ul className="space-y-2">
            {moodAnalysis.user_analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">
            No recommendations available yet. Keep tracking your mood to receive personalized AI-powered insights!
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{moodStats?.total_entries ?? 0}</div>
            <div className="text-sm text-gray-600">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{moodStats?.streak_days ?? 0}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {safeFixed(moodStats?.average_mood_last_30_days)}
            </div>
            <div className="text-sm text-gray-600">30-Day Avg</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{moodStats?.crisis_interventions ?? 0}</div>
            <div className="text-sm text-gray-600">Crisis Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInsights;
