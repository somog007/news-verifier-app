// Header.jsx - Application top bar & theme switcher
import React from 'react';
import { ShieldCheck, MessageSquare, Activity, Layers, Search } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Header({ postCount, activeTab, setActiveTab, themeMode, onThemeChange, effectiveTheme }) {
  return (
    <header className="brand-header">
      <div className="header-container">
        <div className="brand-logo-group">
          <div className="logo-badge">
            <ShieldCheck className="logo-icon" />
          </div>
          <div>
            <div className="brand-title">
              Verifi<span>News</span> <span className="beta-tag">AI VERIFIER</span>
            </div>
            <p className="brand-subtitle">Social Media Source Origin & Fake News Verification System</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="header-nav">
          <button 
            className={`nav-btn ${activeTab === 'verifier' ? 'active' : ''}`}
            onClick={() => setActiveTab('verifier')}
          >
            <Search size={16} /> Fact-Check Studio
          </button>
          <button 
            className={`nav-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <MessageSquare size={16} /> Tracked Threads ({postCount})
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={16} /> Intelligence & Trends
          </button>
          <button 
            className={`nav-btn ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
          >
            <Layers size={16} /> Trusted Wires
          </button>
        </nav>

        {/* Theme Selector */}
        <div className="header-actions">
          <ThemeSelector 
            themeMode={themeMode} 
            onThemeChange={onThemeChange} 
            effectiveTheme={effectiveTheme} 
          />
        </div>
      </div>
    </header>
  );
}
