
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Sun, Moon } from 'lucide-react';

interface PublicNavbarProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onSignIn, onGetStarted, darkMode, toggleDarkMode }) => {
  const handleAction = (action?: () => void) => {
      if (action) {
          action();
      } else {
          window.location.hash = '/'; // Default to home to trigger sign in modal if on landing
      }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-12 w-auto flex items-center justify-center">
            <img src="https://i.imgur.com/Bt9CDPn.png" alt="Gitta Job" className="h-full w-auto object-contain" />
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link to="/features" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Features</Link>
          <Link to="/pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Pricing</Link>
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Resources</a>
        </div>

        <div className="flex items-center gap-4">
          {toggleDarkMode && (
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => handleAction(onSignIn)} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hidden md:block transition-colors">
            Sign In
          </button>
          <Button onClick={() => handleAction(onGetStarted)} className="shadow-xl shadow-teal-500/20 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white border-transparent">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};
