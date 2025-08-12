import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

// Updated interfaces to match your API schema
interface SessionCreateRequest {
  topic: string;
  max_participants: number;
  session_type: 'group' | 'individual' | 'workshop';
  preferences: {
    [key: string]: any;
  };
}

interface Session {
  id: string;
  topic: string;
  max_participants: number;
  session_type: string;
  current_participants: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  host_id: string;
  preferences: any;
}

const SessionCreator: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Updated form data to match your API
  const [formData, setFormData] = useState<SessionCreateRequest>({
    topic: '',
    max_participants: 4,
    session_type: 'group',
    preferences: {}
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Topic options matching mental health categories
  const topicOptions = [
    'Anxiety Support',
    'Depression Discussion', 
    'Stress Management',
    'Relationship Issues',
    'Work-Life Balance',
    'Grief Support',
    'Addiction Recovery',
    'Self-Care',
    'Crisis Support',
    'General Wellness'
  ];

  const sessionTypeOptions = [
    { value: 'group', label: 'Group Session (3-8 people)' },
    { value: 'individual', label: 'One-on-One Session' },
    { value: 'workshop', label: 'Workshop/Educational' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      fetchMySessions();
    }
  }, [isAuthenticated]);

  const fetchSessions = async () => {
    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/v1/sessions/available`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMySessions = async () => {
    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/v1/sessions/my-sessions`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setMySessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching my sessions:', error);
    }
  };

  const createSession = async () => {
    if (!formData.topic) {
      setError('Please select a topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = authService.getAuthHeaders();
      
      // Create request body matching your API schema exactly
      const requestBody: SessionCreateRequest = {
        topic: formData.topic,
        max_participants: formData.max_participants,
        session_type: formData.session_type,
        preferences: formData.preferences
      };

      console.log('Creating session with:', requestBody); // Debug log

      const response = await fetch(`${API_URL}/api/v1/sessions/create`, {
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
        throw new Error(errorData.detail || 'Failed to create session');
      }

      // Reset form and refresh
      setFormData({
        topic: '',
        max_participants: 4,
        session_type: 'group',
        preferences: {}
      });
      
      setShowForm(false);
      fetchSessions();
      fetchMySessions();
      
      alert('Session created successfully!');
    } catch (error) {
      console.error('Error creating session:', error);
      setError(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle preferences as key-value pairs
  const updatePreference = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const removePreference = (key: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: Object.fromEntries(
        Object.entries(prev.preferences).filter(([k]) => k !== key)
      )
    }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Session Creator</h1>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-blue-700 mb-4">Please log in to create and manage support sessions.</p>
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Sessions</h1>
          <p className="text-gray-600">Create anonymous peer support sessions</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({
              topic: '',
              max_participants: 4,
              session_type: 'group',
              preferences: {}
            });
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {showForm ? 'Cancel' : 'Create Session'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Session Creation Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Create New Support Session</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic *
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a topic</option>
                {topicOptions.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type *
              </label>
              <select
                value={formData.session_type}
                onChange={(e) => setFormData(prev => ({ ...prev, session_type: e.target.value as any }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {sessionTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 4 }))}
                min="2"
                max="20"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Preferences
              </label>
              <div className="space-y-2">
                {Object.entries(formData.preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={key}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updatePreference(key, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removePreference(key)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const key = prompt('Enter preference key:');
                    if (key) updatePreference(key, '');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Preference
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createSession}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>
      )}

      {/* Sessions Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Available Sessions ({sessions.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sessions available</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{session.topic}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Type: {session.session_type} | 
                    Participants: {session.current_participants}/{session.max_participants}
                  </p>
                  <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm">
                    Join Session
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Sessions ({mySessions.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mySessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">You haven't created any sessions yet</p>
            ) : (
              mySessions.map((session) => (
                <div key={session.id} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{session.topic}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    👑 Hosting | {session.session_type} | 
                    {session.current_participants}/{session.max_participants} participants
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCreator;
