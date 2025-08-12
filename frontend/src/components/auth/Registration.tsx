import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AGE_RANGES, SEVERITY_LEVELS, PREFERRED_TIMES, COMMON_TOPICS } from '../../utils/constants';

interface RegistrationFormData {
  ageRange: string;
  topics: string;
  severityLevel: string;
  preferredTimes: string[];
}

const Registration: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    ageRange: '',
    topics: '',
    severityLevel: '',
    preferredTimes: []
  });
  const [showCommitment, setShowCommitment] = useState(false);
  const [generatedCommitment, setGeneratedCommitment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeSelection = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter(t => t !== time)
        : [...prev.preferredTimes, time]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.ageRange || !formData.topics || !formData.severityLevel || formData.preferredTimes.length === 0) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      console.log('Submitting registration data:', formData);
      
      // Pass the complete form data to the register function
      const result = await register(formData);
      
      if (result.success && result.commitment) {
        setGeneratedCommitment(result.commitment);
        setShowCommitment(true);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCommitment);
      // You can add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isFormValid = formData.ageRange && formData.topics && formData.severityLevel && formData.preferredTimes.length > 0;

  // Success Screen with Split Layout
  if (showCommitment) {
    return (
      <div className="auth-container">
        {/* Left Panel - Success Branding */}
        <div className="auth-left-panel">
          <div className="auth-branding">
            <h1>Welcome to Sahāya liṅk</h1>
            <p>
              Your anonymous identity has been successfully created. You're now part of a secure, privacy-first mental health community.
            </p>
          </div>
          
          <div className="auth-features">
            <div className="auth-feature-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>Identity Secured on Blockchain</span>
            </div>
            
            <div className="auth-feature-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>Zero-Knowledge Privacy</span>
            </div>
            
            <div className="auth-feature-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span>AI Crisis Detection Active</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Success Form */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="auth-form-header">
              <div style={{
                width: '64px',
                height: '64px',
                background: 'var(--color-success-100)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-md)'
              }}>
                <svg style={{ width: '32px', height: '32px', color: 'var(--color-success-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2>Registration Successful!</h2>
              <p>Your anonymous identity has been created</p>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label">
                Your Commitment Hash (Save this securely)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={generatedCommitment}
                  readOnly
                  className="auth-form-input font-mono text-sm"
                  style={{ paddingRight: '3rem', background: 'var(--color-gray-50)' }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.25rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-gray-500)',
                    transition: 'color 0.2s ease'
                  }}
                  title="Copy to clipboard"
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-gray-700)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-gray-500)'}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Security Warning */}
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-warning-50)',
              border: '1px solid var(--color-warning-100)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <svg style={{
                width: '20px',
                height: '20px',
                color: 'var(--color-warning-600)',
                marginRight: 'var(--spacing-sm)',
                marginTop: '2px',
                flexShrink: 0
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--color-warning-800)',
                  marginBottom: '0.25rem'
                }}>
                  Important Security Notice
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-warning-700)',
                  lineHeight: '1.5'
                }}>
                  Save this commitment hash securely. It's your only way to access your anonymous account. We cannot recover it if lost.
                </p>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="auth-submit-button"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form with Split Layout
  return (
    <div className="auth-container">
      {/* Left Panel - Branding */}
      <div className="auth-left-panel">
        <div className="auth-branding">
          <h1>Join Sahāya liṅk</h1>
          <p>
            Create your anonymous identity and join a supportive community focused on mental wellness and privacy protection.
          </p>
        </div>
        
        <div className="auth-features">
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span>Supportive Peer Community</span>
          </div>
          
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>Comprehensive Mood Tracking</span>
          </div>
          
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>Blockchain-Secured Privacy</span>
          </div>
          
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            <span>Reputation-Based Rewards</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Create Your Identity</h2>
            <p>Join your decentralized mental health support network</p>
          </div>

          {error && (
            <div className="auth-error">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Age Range */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Age Range *
              </label>
              <select
                name="ageRange"
                value={formData.ageRange}
                onChange={handleInputChange}
                className="auth-form-select"
                required
              >
                <option value="">Select your age range</option>
                {AGE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Topics */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Topics of Interest *
              </label>
              <textarea
                name="topics"
                value={formData.topics}
                onChange={handleInputChange}
                placeholder="e.g., anxiety,depression,stress,relationships"
                className="auth-form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                required
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Enter topics separated by commas. Examples: anxiety, depression, stress, relationships, work-pressure
              </p>
            </div>

            {/* Severity Level */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Current Severity Level *
              </label>
              <select
                name="severityLevel"
                value={formData.severityLevel}
                onChange={handleInputChange}
                className="auth-form-select"
                required
              >
                <option value="">Select severity level</option>
                {SEVERITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Times */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Preferred Support Times * (Select all that apply)
              </label>
              <div className="auth-checkbox-group" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 'var(--spacing-sm)' 
              }}>
                {PREFERRED_TIMES.map((time) => (
                  <div key={time.value} className="auth-checkbox-item" style={{
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferredTimes.includes(time.value)}
                      onChange={() => handleTimeSelection(time.value)}
                      style={{ marginRight: 'var(--spacing-xs)' }}
                    />
                    <label style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                      {time.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading || !isFormValid}
              className="auth-submit-button"
            >
              {isSubmitting ? (
                <div className="auth-loading">
                  <div className="auth-loading-spinner"></div>
                  Creating Anonymous Identity...
                </div>
              ) : (
                'Register Anonymously'
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>
              Already have a commitment hash?{' '}
              <Link to="/login">
                Login here
              </Link>
            </p>
          </div>

          {/* Privacy Notice */}
          <div style={{
            marginTop: 'var(--spacing-xl)',
            padding: 'var(--spacing-md)',
            background: 'var(--color-primary-50)',
            border: '1px solid var(--color-primary-100)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <svg style={{
              width: '20px',
              height: '20px',
              color: 'var(--color-primary-600)',
              marginRight: 'var(--spacing-sm)',
              marginTop: '2px',
              flexShrink: 0
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--color-primary-800)',
                marginBottom: '0.25rem'
              }}>
                Anonymous & Secure
              </h4>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-primary-700)',
                lineHeight: '1.5'
              }}>
                Your identity remains completely anonymous. We use cryptographic commitments to ensure privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
