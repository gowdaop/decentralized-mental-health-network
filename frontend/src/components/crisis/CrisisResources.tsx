import React, { useState } from 'react';

const CrisisResources: React.FC = () => {
  const [showSafetyPlan, setShowSafetyPlan] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Crisis hotlines - primarily Indian with international options
  const emergencyContacts = [
    {
      name: "National Emergency",
      number: "112",
      description: "All-in-one emergency number for police, fire, medical",
      available: "24/7",
      type: "emergency"
    },
    {
      name: "iCall Psychosocial Helpline",
      number: "9152987821",
      description: "Professional counseling and crisis intervention",
      available: "Mon-Sat, 8 AM - 10 PM",
      type: "mental-health"
    },
    {
      name: "AASRA Suicide Prevention",
      number: "9820466726",
      description: "Suicide prevention and emotional support",
      available: "24/7",
      type: "suicide-prevention"
    },
    {
      name: "Vandrevala Foundation",
      number: "18602662345",
      description: "Free mental health support and crisis counseling",
      available: "24/7",
      type: "mental-health"
    },
    {
      name: "Sneha India",
      number: "044-24640050",
      description: "Suicide prevention helpline",
      available: "24/7",
      type: "suicide-prevention"
    },
    {
      name: "International Crisis Text Line",
      number: "Text HOME to 741741",
      description: "Crisis support via text message",
      available: "24/7 Worldwide",
      type: "text"
    }
  ];

  const copingStrategies = [
    {
      title: "5-4-3-2-1 Grounding Technique",
      description: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste",
      icon: "👁️"
    },
    {
      title: "Deep Breathing",
      description: "Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 3-4 times",
      icon: "🫁"
    },
    {
      title: "Cold Water Technique",
      description: "Splash cold water on your face or hold ice cubes to reset your nervous system",
      icon: "❄️"
    },
    {
      title: "Safe Space Visualization",
      description: "Close your eyes and imagine a place where you feel completely safe and calm",
      icon: "🧘"
    }
  ];

  const safetyPlanSteps = [
    "Identify your personal warning signs",
    "List internal coping strategies that help you",
    "Identify people and social settings that provide distraction",
    "List people you can ask for help",
    "List professionals or agencies you can contact during crisis",
    "Identify ways to make your environment safe"
  ];

  const callNumber = (number: string) => {
    if (number.includes('Text')) {
      // Handle text instructions
      alert(`To use Crisis Text Line: ${number}`);
    } else {
      window.location.href = `tel:${number.replace(/\s+/g, '')}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Crisis Support Resources</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          If you're in crisis or having thoughts of self-harm, you're not alone. 
          Help is available immediately and confidentially.
        </p>
      </div>

      {/* Emergency Alert */}
      <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Immediate Emergency</h3>
            <p className="text-red-700">
              If you are in immediate danger, call <strong>112</strong> (National Emergency) or go to your nearest emergency room.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Emergency Contacts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              Crisis Helplines
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyContacts.map((contact, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    contact.type === 'emergency' 
                      ? 'border-red-200 bg-red-50' 
                      : contact.type === 'suicide-prevention'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                  onClick={() => callNumber(contact.number)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      contact.type === 'emergency' 
                        ? 'bg-red-200 text-red-800'
                        : contact.type === 'suicide-prevention'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {contact.type.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {contact.number}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {contact.description}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Available: {contact.available}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Coping Strategies */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              Immediate Coping Strategies
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {copingStrategies.map((strategy, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{strategy.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{strategy.title}</h3>
                      <p className="text-sm text-gray-600">{strategy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Safety Plan */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Safety Plan
            </h3>
            
            {!showSafetyPlan ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Create a personalized safety plan to help during difficult moments.
                </p>
                <button 
                  onClick={() => setShowSafetyPlan(true)}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Safety Plan
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Step {currentStep + 1} of {safetyPlanSteps.length}</span>
                    <button 
                      onClick={() => setShowSafetyPlan(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${((currentStep + 1) / safetyPlanSteps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {safetyPlanSteps[currentStep]}
                  </h4>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                    placeholder="Write your thoughts here..."
                  />
                </div>
                
                <div className="flex justify-between">
                  <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentStep(Math.min(safetyPlanSteps.length - 1, currentStep + 1))}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {currentStep === safetyPlanSteps.length - 1 ? 'Complete' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Anonymous Crisis Chat */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              Anonymous Chat
            </h3>
            
            <p className="text-gray-600 mb-4">
              Connect with trained volunteers anonymously through our secure chat system.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">End-to-end encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">No personal info required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">24/7 availability</span>
              </div>
            </div>
            
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4">
              Start Anonymous Chat
            </button>
          </div>

          {/* Professional Help */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              Find Professional Help
            </h3>
            
            <p className="text-gray-600 mb-4">
              Connect with mental health professionals in your area.
            </p>
            
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium text-gray-800">Find Therapists Nearby</div>
                <div className="text-sm text-gray-600">Search by location and specialty</div>
              </button>
              
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium text-gray-800">Online Therapy Options</div>
                <div className="text-sm text-gray-600">Connect remotely with professionals</div>
              </button>
              
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium text-gray-800">Support Groups</div>
                <div className="text-sm text-gray-600">Find local and online support groups</div>
              </button>
            </div>
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
            <p className="text-blue-700 text-sm">
              All interactions through Sahāya liṅk Network are anonymous and encrypted. 
              Crisis support resources maintain the same privacy standards as the rest of our platform. 
              Your safety and confidentiality are our top priorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisResources;
