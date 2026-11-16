// Header.jsx - Application top bar & theme switcher
import { ShieldCheck, MessageSquare, Activity, Layers, Search, Download } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Header({ postCount, activeTab, setActiveTab, themeMode, onThemeChange, effectiveTheme, canInstall, onInstall }) {
  return (
    <header className="brand-header">
      <div className="header-container">
        <div className="brand-logo-group">
          <div className="logo-badge">
            <ShieldCheck className="logo-icon" />
          </div>
          <div>
            <div className="brand-title">
              Verifi<span>News</span> <span className="beta-tag">BETA</span>
            </div>
            <p className="brand-subtitle">Check claims before you share them</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="header-nav">
          <button 
            className={`nav-btn ${activeTab === 'verifier' ? 'active' : ''}`}
            aria-current={activeTab === 'verifier' ? 'page' : undefined}
            onClick={() => setActiveTab('verifier')}
          >
            <Search size={16} /> Fact-Check Studio
          </button>
          <button 
            className={`nav-btn ${activeTab === 'feed' ? 'active' : ''}`}
            aria-current={activeTab === 'feed' ? 'page' : undefined}
            onClick={() => setActiveTab('feed')}
          >
            <MessageSquare size={16} /> Tracked Threads ({postCount})
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={16} /> Intelligence & Trends
          </button>
          <button 
            className={`nav-btn ${activeTab === 'sources' ? 'active' : ''}`}
            aria-current={activeTab === 'sources' ? 'page' : undefined}
            onClick={() => setActiveTab('sources')}
          >
            <Layers size={16} /> Trusted Wires
          </button>
        </nav>

        {/* Theme Selector */}
        <div className="header-actions">
          {canInstall && (
            <button type="button" className="install-btn" onClick={onInstall} title="Add VerifiNews to your home screen or desktop. It opens without internet.">
              <Download size={14} /> Install app
            </button>
          )}
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
