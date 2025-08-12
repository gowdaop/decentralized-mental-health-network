import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

// Backend-aligned interfaces
interface MoodRecord {
  score: number;
  description: string;
  triggers?: string;
  notes?: string;
}

interface CrisisAnalysis {
  risk_level: string;
  needs_intervention: boolean;
  recommendations: string[];
  sentiment?: any;
  keywords?: any;
}

interface MoodEntryResponse {
  message: string;
  mood_entry_id: number;
  crisis_analysis: CrisisAnalysis;
  crisis_resources?: string[];
}

interface MoodAnalysisResponse {
  user_analysis: {
    period_days: number;
    entries_count: number;
    trend: {
      direction: string;
      average_mood: number;
    };
    patterns: {
      volatility: { level: string };
    };
    risk: {
      level: string;
      high_risk_entries?: number;
    };
    recommendations: string[];
  };
  privacy_note: string;
}

const MoodTracker: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [moodScore, setMoodScore] = useState<number>(5);
  const [description, setDescription] = useState<string>('');
  const [triggers, setTriggers] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crisisAnalysis, setCrisisAnalysis] = useState<CrisisAnalysis | null>(null);
  const [crisisResources, setCrisisResources] = useState<string[]>([]);
  const [recentAnalysis, setRecentAnalysis] = useState<MoodAnalysisResponse | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentAnalysis();
    }
  }, [isAuthenticated]);

  // Color gradient function from dark red (1) to green (10)
  const getMoodColor = (score: number): string => {
    // Normalize score to 0-1 range
    const normalized = Math.max(0, Math.min(1, (score - 1) / 9));
    
    if (normalized <= 0.5) {
      // Red to Yellow transition (scores 1-5)
      const ratio = normalized * 2; // 0 to 1
      const red = 220;
      const green = Math.round(50 + (200 * ratio)); // 50 to 250
      const blue = 50;
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Yellow to Green transition (scores 6-10)
      const ratio = (normalized - 0.5) * 2; // 0 to 1
      const red = Math.round(220 * (1 - ratio)); // 220 to 0
      const green = 250;
      const blue = 50;
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  const getMoodLabel = (score: number): string => {
    if (score <= 2) return 'Very Poor';
    if (score <= 4) return 'Poor';
    if (score <= 5) return 'Below Average';
    if (score <= 6) return 'Average';
    if (score <= 7) return 'Good';
    if (score <= 8) return 'Very Good';
    return 'Excellent';
  };

  const fetchRecentAnalysis = async () => {
    if (!isAuthenticated) return;
    
    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch('/api/v1/mood/analysis?days=7', {
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
      setRecentAnalysis(data);
      setError('');
    } catch (error) {
      console.error('Failed to fetch mood analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recent analysis');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const moodData: MoodRecord = {
        score: moodScore,
        description: description.trim()
      };

      if (triggers.trim()) {
        moodData.triggers = triggers.trim();
      }
      if (notes.trim()) {
        moodData.notes = notes.trim();
      }

      const headers = authService.getAuthHeaders();
      const response = await fetch('/api/v1/mood/record', {
        method: 'POST',
        headers,
        body: JSON.stringify(moodData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to record mood');
      }

      const result: MoodEntryResponse = await response.json();
      
      setCrisisAnalysis(result.crisis_analysis);
      setCrisisResources(result.crisis_resources || []);
      setShowSuccess(true);
      setError('');

      if (result.crisis_analysis.needs_intervention) {
        setShowCrisisAlert(true);
      }

      await fetchRecentAnalysis();
      
      setDescription('');
      setTriggers('');
      setNotes('');
      setMoodScore(5);

      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error) {
      console.error('Failed to submit mood data:', error);
      setError(error instanceof Error ? error.message : 'Failed to record mood');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MINIMAL': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 fade-in">
        <div className="dashboard-card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to track your mood and access AI analysis.</p>
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
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-theme-primary mb-3">Mood Tracker</h1>
        <p className="text-xl text-theme-secondary">AI-powered mood tracking with crisis detection</p>
        {user.commitment && (
          <p className="text-sm text-gray-500 mt-2">
            Anonymous ID: {user.commitment.substring(0, 8)}...
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            {error.includes('Authentication') && (
              <button
                onClick={() => window.location.href = '/login'}
                className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Re-login
              </button>
            )}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span>Mood recorded successfully! AI analysis complete.</span>
          </div>
        </div>
      )}

      {showCrisisAlert && crisisAnalysis?.needs_intervention && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🚨</span>
            <h3 className="text-xl font-bold text-red-800">CRISIS SUPPORT REQUIRED</h3>
          </div>
          <p className="text-red-700 mb-4">
            <strong>Our AI detected {crisisAnalysis.risk_level} RISK and immediate intervention is needed.</strong> Please reach out for support right now - you're not alone.
          </p>
          
          {crisisResources.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="font-bold text-red-800">🆘 IMMEDIATE SUPPORT AVAILABLE:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {crisisResources.map((resource, index) => (
                  <div key={index} className="text-sm bg-white p-3 rounded border border-red-200">
                    {resource}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button 
              onClick={() => window.open('tel:+919152987821', '_self')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
            >
              📞 Call iCall Now
            </button>
            <button 
              onClick={() => setShowCrisisAlert(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              I understand
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        <h2 className="text-2xl font-bold text-theme-primary mb-6">How are you feeling today?</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-4">
              Mood Level (1-10 scale)
            </label>
            
            <div className="mb-4 h-6 rounded-lg bg-gradient-to-r from-red-600 via-yellow-500 to-green-500"></div>
            
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setMoodScore(score)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2 min-h-[80px] ${
                    moodScore === score
                      ? 'scale-110 shadow-lg border-gray-800 ring-2 ring-gray-400'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: getMoodColor(score),
                    color: score <= 5 ? '#ffffff' : '#000000'
                  }}
                >
                  <span className="text-2xl font-bold mb-1">{score}</span>
                </button>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-lg font-semibold text-theme-primary mb-2">
                Current: {moodScore}/10 - {getMoodLabel(moodScore)}
              </p>
              <div 
                className="inline-block px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: getMoodColor(moodScore) }}
              >
                Selected Mood Color
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-theme-secondary mb-2">
              How are you feeling? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your current mood and feelings..."
            />
          </div>

          <div>
            <label htmlFor="triggers" className="block text-sm font-medium text-theme-secondary mb-2">
              Triggers (Optional)
            </label>
            <input
              id="triggers"
              type="text"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What triggered these feelings?"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-theme-secondary mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional thoughts or context..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="btn btn-primary w-full py-4 text-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner w-5 h-5"></div>
                <span>Analyzing with AI...</span>
              </div>
            ) : (
              'Record Mood & Analyze'
            )}
          </button>
        </form>
      </div>

      {crisisAnalysis && (
        <div className="dashboard-card">
          <h3 className="text-xl font-bold text-theme-primary mb-4">AI Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-theme-secondary mb-2">Risk Assessment</h4>
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border ${getRiskColor(crisisAnalysis.risk_level)}`}>
                {crisisAnalysis.risk_level} RISK
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-theme-secondary mb-2">Intervention Status</h4>
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${
                crisisAnalysis.needs_intervention 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {crisisAnalysis.needs_intervention ? 'SUPPORT RECOMMENDED' : 'STABLE'}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-theme-secondary mb-3">AI Recommendations</h4>
            <ul className="space-y-2">
              {crisisAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-theme-primary">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {recentAnalysis && (
        <div className="dashboard-card">
          <h3 className="text-xl font-bold text-theme-primary mb-4">Recent Trends (Last 7 Days)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {recentAnalysis.user_analysis.entries_count}
              </div>
              <div className="text-sm text-theme-secondary">Entries Recorded</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {recentAnalysis.user_analysis.trend?.average_mood?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-theme-secondary">Average Mood</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getRiskColor(recentAnalysis.user_analysis.risk?.level || 'UNKNOWN').split(' ')[1]}`}>
                {recentAnalysis.user_analysis.risk?.level || 'UNKNOWN'}
              </div>
              <div className="text-sm text-theme-secondary">Risk Level</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Trend:</span>
              <span className={`font-bold ${
                recentAnalysis.user_analysis.trend?.direction === 'improving' ? 'text-green-600' :
                recentAnalysis.user_analysis.trend?.direction === 'declining' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {recentAnalysis.user_analysis.trend?.direction?.toUpperCase() || 'ANALYZING'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>🔒</span>
          <span>All data is encrypted and analyzed anonymously. Your privacy is protected with zero-knowledge architecture.</span>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
