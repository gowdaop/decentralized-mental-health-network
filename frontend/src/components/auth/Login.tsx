import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CommitmentUtils } from '../../utils/storage';

const Login: React.FC = () => {
  const [commitment, setCommitment] = useState('');
  const [randomness, setRandomness] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error, clearError, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commitment.trim() || !randomness.trim()) {
      return;
    }

    // Validate commitment format
    if (!CommitmentUtils.isValidCommitment(commitment.trim())) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      console.log('Login attempt with:', { commitment: commitment.trim(), randomness: randomness.trim() });
      
      const result = await login(commitment.trim(), randomness.trim());
      
      if (result.success && result.user) {
        console.log('Login successful, navigating to:', from);
        navigate(from, { replace: true });
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommitmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommitment(value);
    if (error) {
      clearError();
    }
  };

  const handleRandomnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRandomness(value);
    if (error) {
      clearError();
    }
  };

  const generateRandomness = () => {
    const randomValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setRandomness(randomValue);
    if (error) {
      clearError();
    }
  };

  const isValidFormat = commitment.length === 0 || CommitmentUtils.isValidCommitment(commitment);
  const isFormValid = commitment.trim() && randomness.trim() && isValidFormat;

  return (
    <div className="auth-container">
      {/* Left Panel - Branding */}
      <div className="auth-left-panel">
        <div className="auth-branding">
          <h1>Sahāya liṅk</h1>
          <p>
            Your privacy-first mental health companion. Anonymous, secure, and powered by blockchain technology.
          </p>
        </div>
        
        <div className="auth-features">
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span>Complete Privacy Protection</span>
          </div>
          
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <span>AI-Powered Crisis Detection</span>
          </div>
          
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span>Supportive Community Network</span>
          </div>
          
          <div className="auth-feature-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>Advanced Mood Analytics</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Welcome Back</h2>
            <p>Access your secure mental health dashboard</p>
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
            {/* Commitment Hash Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Commitment Hash *
              </label>
              <input
                type="text"
                value={commitment}
                onChange={handleCommitmentChange}
                className={`auth-form-input font-mono text-sm ${
                  !isValidFormat ? 'border-red-300 bg-red-50' : ''
                }`}
                placeholder="Enter your 64-character commitment hash"
                required
                maxLength={64}
              />
              {commitment.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  {isValidFormat ? (
                    <span className="auth-success">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Valid format
                    </span>
                  ) : (
                    <span className="auth-error">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Invalid format (must be 64 hex characters)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Randomness Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Randomness *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={randomness}
                  onChange={handleRandomnessChange}
                  className="auth-form-input"
                  style={{ paddingRight: '3rem' }}
                  placeholder="Enter randomness or generate one"
                  required
                />
                <button
                  type="button"
                  onClick={generateRandomness}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.25rem',
                    background: 'var(--color-gray-100)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--color-gray-500)',
                    transition: 'color 0.2s ease'
                  }}
                  title="Generate random value"
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-gray-700)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-gray-500)'}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                This should be the same randomness used during registration, or click the refresh button to generate a new one.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading || !isFormValid}
              className="auth-submit-button"
            >
              {isSubmitting ? (
                <div className="auth-loading">
                  <div className="auth-loading-spinner"></div>
                  Authenticating...
                </div>
              ) : (
                'Login Securely'
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>
              Don't have a commitment hash?{' '}
              <Link to="/register">
                Register anonymously
              </Link>
            </p>
          </div>

          {/* Security Notice */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <div>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--color-primary-800)',
                marginBottom: '0.25rem'
              }}>
                Secure Access
              </h4>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-primary-700)',
                lineHeight: '1.5'
              }}>
                Your commitment hash and randomness are your private keys. Keep them secure and never share them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
