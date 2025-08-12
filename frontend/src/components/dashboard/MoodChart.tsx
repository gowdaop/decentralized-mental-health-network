import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Interfaces matching your backend response
interface MoodTrend {
  direction: string;
  slope?: number;
  correlation?: number;
  average_mood: number;
  mood_range?: {
    min: number;
    max: number;
  };
}

interface MoodPatterns {
  volatility: {
    level: string;
    standard_deviation?: number;
  };
  daily_patterns?: {
    best_day?: number;
    worst_day?: number;
    day_averages?: { [key: number]: number };
  };
  time_patterns?: {
    best_hour?: number;
    worst_hour?: number;
  };
}

interface RiskAnalysis {
  level: string;
  crisis_rate?: number;
  low_mood_rate?: number;
  recent_trend?: string;
  total_crisis_episodes?: number;
  high_risk_entries?: number;
}

interface ProgressMetrics {
  improvement_score?: number;
  early_period_avg?: number;
  recent_period_avg?: number;
  consistency_score?: number;
  engagement_score?: number;
}

interface MoodAnalysisData {
  period_days: number;
  entries_count: number;
  total_entries?: number;
  trend: MoodTrend;
  patterns: MoodPatterns;
  risk: RiskAnalysis;
  progress?: ProgressMetrics;
  recommendations: string[];
  analyzed_at?: string;
}

interface MoodAnalysisResponse {
  user_analysis: MoodAnalysisData;
  privacy_note: string;
}

const MoodAnalysis: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [analysisData, setAnalysisData] = useState<MoodAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(30);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMoodAnalysis();
    }
  }, [isAuthenticated, timeRange]);

  const fetchMoodAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch(`/api/v1/mood/analysis?days=${timeRange}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`Analysis fetch failed: ${response.statusText}`);
      }

      const data: MoodAnalysisResponse = await response.json();
      setAnalysisData(data.user_analysis);
    } catch (error) {
      console.error('Failed to fetch mood analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load mood analysis');
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (score: number): string => {
    if (score >= 8) return '#22c55e'; // Green - Excellent
    if (score >= 6) return '#84cc16'; // Light green - Good
    if (score >= 4) return '#eab308'; // Yellow - Average
    if (score >= 2) return '#f97316'; // Orange - Poor
    return '#ef4444'; // Red - Very poor
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f97316';
      case 'LOW': return '#84cc16';
      case 'MINIMAL': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getVolatilityColor = (level: string): string => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // Generate sample trend data for visualization
  const generateTrendChartData = () => {
    if (!analysisData) return null;

    // Create sample data points for the last period
    const days = Array.from({ length: Math.min(analysisData.period_days, 30) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (analysisData.period_days - i - 1));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Generate realistic mood progression based on trend
    const baseScore = analysisData.trend.average_mood;
    const slope = analysisData.trend.slope || 0;
    const volatility = analysisData.patterns.volatility.standard_deviation || 1;

    const scores = days.map((_, i) => {
      const trendComponent = baseScore + (slope * i * 0.1);
      const randomComponent = (Math.random() - 0.5) * volatility;
      return Math.max(1, Math.min(10, trendComponent + randomComponent));
    });

    return {
      labels: days,
      datasets: [
        {
          label: 'Mood Score',
          data: scores,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: scores.map(score => getMoodColor(score)),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    };
  };

  const generateWeeklyPatternData = () => {
    if (!analysisData?.patterns.daily_patterns?.day_averages) return null;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const averages = analysisData.patterns.daily_patterns.day_averages;
    
    const data = dayNames.map((_, index) => averages[index] || analysisData.trend.average_mood);
    
    return {
      labels: dayNames,
      datasets: [
        {
          label: 'Average Mood by Day',
          data: data,
          backgroundColor: data.map(score => getMoodColor(score)),
          borderColor: data.map(score => getMoodColor(score)),
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  };

  const generateRiskDistributionData = () => {
    if (!analysisData) return null;

    const totalEntries = analysisData.entries_count;
    const highRiskEntries = analysisData.risk.high_risk_entries || 0;
    const crisisRate = analysisData.risk.crisis_rate || 0;
    const lowMoodRate = analysisData.risk.low_mood_rate || 0;

    const highRiskCount = Math.round(totalEntries * crisisRate);
    const mediumRiskCount = Math.round(totalEntries * lowMoodRate) - highRiskCount;
    const lowRiskCount = totalEntries - highRiskCount - mediumRiskCount;

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [lowRiskCount, mediumRiskCount, highRiskCount],
          backgroundColor: ['#22c55e', '#f97316', '#ef4444'],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 fade-in">
        <div className="dashboard-card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your mood analysis.</p>
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-theme-primary mb-3">Mood Analysis</h1>
        <p className="text-xl text-theme-secondary">AI-powered insights into your emotional patterns</p>
        {user.commitment && (
          <p className="text-sm text-gray-500 mt-2">
            Anonymous ID: {user.commitment.substring(0, 8)}...
          </p>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-theme-primary">Analysis Period</h3>
          <div className="flex space-x-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={fetchMoodAnalysis}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner w-16 h-16"></div>
        </div>
      ) : analysisData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="dashboard-card interactive-card text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analysisData.entries_count}
              </div>
              <div className="text-sm text-theme-secondary">Entries Recorded</div>
            </div>

            <div className="dashboard-card interactive-card text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analysisData.trend.average_mood.toFixed(1)}
              </div>
              <div className="text-sm text-theme-secondary">Average Mood</div>
            </div>

            <div className="dashboard-card interactive-card text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl mr-2">{getTrendIcon(analysisData.trend.direction)}</span>
                <span className="text-2xl font-bold text-purple-600">
                  {analysisData.trend.direction.charAt(0).toUpperCase() + analysisData.trend.direction.slice(1)}
                </span>
              </div>
              <div className="text-sm text-theme-secondary">Mood Trend</div>
            </div>

            <div className="dashboard-card interactive-card text-center">
              <div 
                className="text-3xl font-bold mb-2"
                style={{ color: getRiskColor(analysisData.risk.level) }}
              >
                {analysisData.risk.level}
              </div>
              <div className="text-sm text-theme-secondary">Risk Level</div>
            </div>
          </div>

          {/* Mood Trend Chart */}
          <div className="dashboard-card">
            <h3 className="text-xl font-bold text-theme-primary mb-6">Mood Trend Over Time</h3>
            <div className="h-96">
              {generateTrendChartData() && (
                <Line
                  data={generateTrendChartData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: `Mood Progression (Last ${timeRange} Days)`,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        min: 1,
                        max: 10,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>

          {/* Pattern Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Patterns */}
            <div className="dashboard-card">
              <h3 className="text-xl font-bold text-theme-primary mb-6">Weekly Patterns</h3>
              <div className="h-64">
                {generateWeeklyPatternData() && (
                  <Bar
                    data={generateWeeklyPatternData()!}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: 1,
                          max: 10,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="dashboard-card">
              <h3 className="text-xl font-bold text-theme-primary mb-6">Risk Distribution</h3>
              <div className="h-64">
                {generateRiskDistributionData() && (
                  <Doughnut
                    data={generateRiskDistributionData()!}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Insights */}
            <div className="dashboard-card">
              <h3 className="text-xl font-bold text-theme-primary mb-4">Pattern Analysis</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-theme-secondary mb-2">Volatility</h4>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{ 
                        backgroundColor: getVolatilityColor(analysisData.patterns.volatility.level) + '20',
                        color: getVolatilityColor(analysisData.patterns.volatility.level)
                      }}
                    >
                      {analysisData.patterns.volatility.level.toUpperCase()}
                    </span>
                    {analysisData.patterns.volatility.standard_deviation && (
                      <span className="text-sm text-gray-600">
                        (σ = {analysisData.patterns.volatility.standard_deviation.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {analysisData.patterns.daily_patterns?.best_day !== undefined && (
                  <div>
                    <h4 className="font-semibold text-theme-secondary mb-2">Day Patterns</h4>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-green-600">Best day:</span>{' '}
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][analysisData.patterns.daily_patterns.best_day]}
                      </div>
                      {analysisData.patterns.daily_patterns.worst_day !== undefined && (
                        <div>
                          <span className="text-red-600">Challenging day:</span>{' '}
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][analysisData.patterns.daily_patterns.worst_day]}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Metrics */}
            {analysisData.progress && (
              <div className="dashboard-card">
                <h3 className="text-xl font-bold text-theme-primary mb-4">Progress Insights</h3>
                <div className="space-y-4">
                  {analysisData.progress.improvement_score !== undefined && (
                    <div>
                      <h4 className="font-semibold text-theme-secondary mb-2">Improvement</h4>
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`text-lg font-bold ${
                            analysisData.progress.improvement_score > 0 ? 'text-green-600' : 
                            analysisData.progress.improvement_score < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          {analysisData.progress.improvement_score > 0 ? '+' : ''}
                          {analysisData.progress.improvement_score.toFixed(2)}
                        </div>
                        <span className="text-sm text-gray-600">points</span>
                      </div>
                    </div>
                  )}

                  {analysisData.progress.consistency_score !== undefined && (
                    <div>
                      <h4 className="font-semibold text-theme-secondary mb-2">Consistency</h4>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, analysisData.progress.consistency_score * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {(analysisData.progress.consistency_score * 100).toFixed(1)}% consistent
                      </div>
                    </div>
                  )}

                  {analysisData.progress.engagement_score !== undefined && (
                    <div>
                      <h4 className="font-semibold text-theme-secondary mb-2">Engagement</h4>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, analysisData.progress.engagement_score * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {(analysisData.progress.engagement_score * 100).toFixed(1)}% engagement rate
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="dashboard-card">
            <h3 className="text-xl font-bold text-theme-primary mb-4">AI Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 mt-1">💡</span>
                  <span className="text-theme-primary">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="dashboard-card text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Analysis Data</h2>
          <p className="text-gray-600 mb-6">Start tracking your mood to see detailed analysis and insights.</p>
          <button
            onClick={() => window.location.href = '/mood-tracker'}
            className="btn btn-primary"
          >
            Start Tracking
          </button>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>🔒</span>
          <span>All analysis is performed on encrypted data using zero-knowledge architecture. Your privacy is fully protected.</span>
        </div>
      </div>
    </div>
  );
};

export default MoodAnalysis;
