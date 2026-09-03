// Header.jsx - Application top bar with live connection indicator & theme switcher
import React from 'react';
import { ShieldCheck, Radio, Activity, Layers, Search } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Header({ isLive, setIsLive, postCount, activeTab, setActiveTab, themeMode, onThemeChange, effectiveTheme }) {
  return (
    <header className="brand-header">
      <div className="header-container">
        <div className="brand-logo-group">
          <div className="logo-badge">
            <ShieldCheck className="logo-icon" />
          </div>
          <div>
            <div className="brand-title">
              Verifi<span>News</span> <span className="beta-tag">AI REAL-TIME</span>
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
            <Radio size={16} /> Live Stream ({postCount})
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

        {/* Live Stream Controller Indicator & Theme Selector */}
        <div className="header-actions">
          <ThemeSelector 
            themeMode={themeMode} 
            onThemeChange={onThemeChange} 
            effectiveTheme={effectiveTheme} 
          />

          <button 
            className={`live-toggle-btn ${isLive ? 'live-active' : 'live-paused'}`}
            onClick={() => setIsLive(!isLive)}
            title={isLive ? "Pause real-time stream" : "Resume real-time stream"}
          >
            <span className={`pulse-dot ${isLive ? 'active' : ''}`}></span>
            {isLive ? "MONITORING LIVE" : "STREAM PAUSED"}
          </button>
        </div>
      </div>
    </header>
  );
}
