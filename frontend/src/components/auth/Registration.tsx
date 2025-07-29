import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AGE_RANGES } from '../../utils/constants';

const Registration: React.FC = () => {
  const [ageRange, setAgeRange] = useState('');
  const [showCommitment, setShowCommitment] = useState(false);
  const [generatedCommitment, setGeneratedCommitment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ageRange) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const result = await register(ageRange);
      
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
    navigate('/');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCommitment);
      // You can add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (showCommitment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">Your anonymous identity has been created</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Commitment Hash (Save this securely)
            </label>
            <div className="relative">
              <input
                type="text"
                value={generatedCommitment}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                title="Copy to clipboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Important Security Notice</h4>
                <p className="text-sm text-yellow-700">
                  Save this commitment hash securely. It's your only way to access your anonymous account. 
                  We cannot recover it if lost.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Anonymous Registration</h2>
          <p className="text-gray-600">
            Join your decentralized mental health support network
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range *
            </label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
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

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !ageRange}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Anonymous Identity...
              </div>
            ) : (
              'Register Anonymously'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have a commitment hash?{' '}
            <Link to="/login" className="text-black hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Anonymous & Secure</h4>
              <p className="text-sm text-blue-700">
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
