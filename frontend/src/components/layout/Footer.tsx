import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-8 border-t border-gray-700">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          
          {/* Platform Features */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform Features</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">🔐 Anonymous Identity</span>
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">🤖 AI Mood Analysis</span>
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">🚨 Crisis Detection</span>
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">🤝 Peer Matching</span>
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">⛓️ Blockchain Security</span>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact & Connect</h4>
            <div className="flex flex-col space-y-3 text-sm">
              <a 
                href="mailto:contact@sahayalink.network" 
                className="text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-2"
              >
                <span>📧</span>
                <span>vigneshks2003@gmail.com</span>
              </a>
              
              <a 
                href="https://linkedin.com/in/gowdwaop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-2"
              >
                <span>💼</span>
                <span>LinkedIn Profile</span>
              </a>
              
              <a 
                href="https://github.com/gowdaop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-2"
              >
                <span>💻</span>
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>

          {/* Mission Statement */}
          <div>
            <h4 className="text-white font-semibold mb-4">Our Mission</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering mental health through privacy-first technology, AI-powered support, 
              and decentralized community care.
            </p>
            
            {/* Crisis Resources */}
            <div className="mt-4">
              <p className="text-red-400 text-xs font-medium">🆘 Need immediate help?</p>
              <p className="text-gray-500 text-xs">
                India: iCall 9152987821 | AASRA 91-9820466726
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-400 text-center md:text-left">
              <span>© 2025 Sahāya liṅk Network. All rights reserved.</span>
              <br className="md:hidden" />
              <span className="text-xs text-gray-500 ml-0 md:ml-2">
                Privacy-First Mental Health Platform
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">Follow & Support:</span>
              
              <a 
                href="https://x.com/GowdaOP" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                "X"
              </a>
              
              <a 
                href="https://github.com/gowdaop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                💻
              </a>
              
              <a 
                href="https://linkedin.com/in/gowdwaop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="LinkedIn"
              >
                💼
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
