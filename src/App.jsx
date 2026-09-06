// App.jsx - Main Application entry point & state orchestrator
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ClaimInputBar from './components/ClaimInputBar';
import LiveFeed from './components/LiveFeed';
import SourceTraceModal from './components/SourceTraceModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NewsVerifier from './components/NewsVerifier';
import { INITIAL_POSTS, TRUSTED_DOMAINS } from './data/newsDatabase';
import { analyzeClaim } from './services/verifierEngine';
import './App.css';

export default function App() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState('verifier'); // 'verifier' | 'feed' | 'analytics' | 'sources'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [verifierClaim, setVerifierClaim] = useState('');

  // User Source & Region Selection State
  const [selectedSources, setSelectedSources] = useState(['ALL']);
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // Theme Management State (system | light | dark)
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('verifinews-theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  // Handle system color scheme media query and dynamic theme application
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const resolveAndApplyTheme = () => {
      let resolved = themeMode;
      if (themeMode === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      }
      setEffectiveTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    resolveAndApplyTheme();

    const handleSystemChange = () => {
      if (themeMode === 'system') {
        resolveAndApplyTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, [themeMode]);

  const handleThemeChange = (newMode) => {
    setThemeMode(newMode);
    try {
      localStorage.setItem('verifinews-theme', newMode);
    } catch {
      // best-effort
    }
  };

  // Add searched news or claim thread to tracked threads list
  const handleAddThread = (newPost) => {
    if (!newPost) return;
    setPosts(prev => {
      const exists = prev.some(p => p.content.trim().toLowerCase() === newPost.content.trim().toLowerCase());
      if (exists) {
        return prev.map(p => p.content.trim().toLowerCase() === newPost.content.trim().toLowerCase() ? newPost : p);
      }
      return [newPost, ...prev];
    });
  };

  // Handle manual user claim / URL verification
  const handleVerifyClaim = (claimText) => {
    setIsScanning(true);
    setVerifierClaim(claimText);
    
    // Simulate real-time wire scanning delay
    setTimeout(() => {
      const result = analyzeClaim(claimText);
      if (result) {
        handleAddThread(result);
        setSelectedPost(result); // Auto open trace modal for inspected claim!
      }
      setIsScanning(false);
    }, 900);
  };

  return (
    <div className="app-layout">
      {/* Top Header Navigation */}
      <Header 
        postCount={posts.length} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeMode={themeMode}
        onThemeChange={handleThemeChange}
        effectiveTheme={effectiveTheme}
      />

      <main className="main-content-container">
        {/* Real-time claim search & URL verifier bar */}
        <ClaimInputBar 
          onVerifyClaim={handleVerifyClaim} 
          isScanning={isScanning} 
        />

        {/* Tab 0: Editorial Fact-Check Studio (NewsVerifier) */}
        {activeTab === 'verifier' && (
          <NewsVerifier initialClaim={verifierClaim} onAddPost={handleAddThread} />
        )}

        {/* Tab 1: Tracked Threads Feed */}
        {activeTab === 'feed' && (
          <LiveFeed 
            posts={posts} 
            onSelectPost={setSelectedPost} 
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            selectedSources={selectedSources}
            setSelectedSources={setSelectedSources}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        )}

        {/* Tab 2: Analytics & Trends */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard posts={posts} />
        )}

        {/* Tab 3: Trusted Wires Registry */}
        {activeTab === 'sources' && (
          <div className="panel-card full-width" style={{ marginTop: '1.5rem' }}>
            <h3 className="section-title">Verified News Wire Outlets & Fact-Check Registries</h3>
            <p className="section-desc">These primary international wires and African fact-checking institutions form the baseline reference engine for VerifiNews source tracking.</p>
            
            <div className="wire-grid" style={{ marginTop: '1.5rem' }}>
              {TRUSTED_DOMAINS.map((domain, i) => (
                <div key={i} className="wire-card">
                  <div className="wire-header">
                    <span className="wire-name">{domain.name}</span>
                    <span className="wire-score">{domain.score}% Trust</span>
                  </div>
                  <div className="wire-sub">
                    <span>{domain.domain}</span> • <span className="wire-type">{domain.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Source Trace & Provenance Modal Drawer */}
      {selectedPost && (
        <SourceTraceModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>VerifiNews Engine • Social Media Fake News Detection & Source Provenance System</p>
      </footer>
    </div>
  );
}
