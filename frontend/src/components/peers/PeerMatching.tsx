import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

// Updated interface to match your API schema
interface PeerMatchingRequest {
  topics: string;  // Note: string, not array
  severity_level: string;
  preferred_times: string[];
  age_range: string;
}

interface PeerMatch {
  id: string;
  anonymous_id: string;
  match_score: number;
  common_topics: string[];
  last_active: string;
  reputation_level: string;
  is_online: boolean;
}

const PeerMatching: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [matches, setMatches] = useState<PeerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Updated form data to match your API
  const [formData, setFormData] = useState<PeerMatchingRequest>({
    topics: '',
    severity_level: '',
    preferred_times: [],
    age_range: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Options for form inputs
  const severityOptions = ['mild', 'moderate', 'severe'];
  const ageRangeOptions = ['18-25', '26-35', '36-45', '46-55', '55+'];
  const timeOptions = ['morning', 'afternoon', 'evening', 'night', 'weekend'];

  const findMatches = async () => {
    if (!formData.topics || !formData.severity_level || !formData.age_range) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = authService.getAuthHeaders();
      
      // Create request body matching your API schema exactly
      const requestBody: PeerMatchingRequest = {
        topics: formData.topics,  // Single string, comma-separated if multiple
        severity_level: formData.severity_level,
        preferred_times: formData.preferred_times,
        age_range: formData.age_range
      };

      console.log('Finding matches with:', requestBody); // Debug log

      const response = await fetch(`${API_URL}/api/v1/peer-matching/find`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        setError('Session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to find matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error finding matches:', error);
      setError(`Failed to find matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_times: prev.preferred_times.includes(time)
        ? prev.preferred_times.filter(t => t !== time)
        : [...prev.preferred_times, time]
    }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Peer Matching</h1>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-blue-700 mb-4">Please log in to find supportive peers.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Support Peers</h1>
        <p className="text-gray-600">Connect anonymously with others who understand your journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Matching Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Find Compatible Peers</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Topics - Single string input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topics of Interest *
              </label>
              <input
                type="text"
                value={formData.topics}
                onChange={(e) => setFormData(prev => ({ ...prev, topics: e.target.value }))}
                placeholder="e.g., anxiety, depression, stress (comma-separated)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter topics separated by commas (e.g., "anxiety, stress, work-life balance")
              </p>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level *
              </label>
              <select
                value={formData.severity_level}
                onChange={(e) => setFormData(prev => ({ ...prev, severity_level: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select severity level</option>
                {severityOptions.map(option => (
                  <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range *
              </label>
              <select
                value={formData.age_range}
                onChange={(e) => setFormData(prev => ({ ...prev, age_range: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select age range</option>
                {ageRangeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Preferred Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Support Times
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeOptions.map(time => (
                  <label key={time} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferred_times.includes(time)}
                      onChange={() => handleTimeChange(time)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{time}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={findMatches}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Finding Matches...
                </div>
              ) : (
                'Find Peer Matches'
              )}
            </button>
          </div>
        </div>

        {/* Match Results */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Compatible Peers ({matches.length})</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p className="text-gray-600">
                  {loading ? 'Searching for compatible peers...' : 'No matches found. Try adjusting your criteria.'}
                </p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <span className="text-gray-600 font-semibold">
                          {match.anonymous_id.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{match.anonymous_id}</h3>
                        <p className="text-sm text-gray-600">
                          {match.reputation_level} • {match.is_online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {match.match_score}% Match
                      </div>
                      <div className="text-xs text-gray-500">
                        Last active: {match.last_active}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Common topics:</strong> {match.common_topics.join(', ')}
                    </p>
                  </div>

                  <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                    Connect with Peer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Your Privacy is Protected</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              All peer connections are anonymous and encrypted. Matching is based on compatibility 
              algorithms while preserving complete privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerMatching;
