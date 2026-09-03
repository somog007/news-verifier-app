// LiveFeed.jsx - Customizable Social & Wire Stream Monitor
import React, { useState } from 'react';
import { Filter, Radio, RefreshCw, ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, Globe, Sliders, Check } from 'lucide-react';
import PostCard from './PostCard';
import { TRUSTED_DOMAINS } from '../data/newsDatabase';

export default function LiveFeed({ 
  posts, 
  onSelectPost, 
  filterCategory, 
  setFilterCategory,
  selectedSources = [],
  setSelectedSources,
  selectedRegion = 'ALL',
  setSelectedRegion
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSourceCustomizer, setShowSourceCustomizer] = useState(false);

  const REGIONS = [
    { id: 'ALL', label: 'All Regions' },
    { id: 'West Africa', label: '🇳🇬 🇬🇭 West Africa' },
    { id: 'East Africa', label: '🇰🇪 🇺🇬 East Africa' },
    { id: 'Southern Africa', label: '🇿🇦 Southern Africa' },
    { id: 'Global', label: '🌐 Global Wires' }
  ];

  const QUICK_PRESETS = [
    { label: '🌍 All Wires', sources: ['ALL'], region: 'ALL' },
    { label: '🇳🇬 Nigeria & West Africa', sources: ['dubawa.org', 'nannews.ng', 'premiumtimesng.com', 'channelstv.com'], region: 'West Africa' },
    { label: '🇬🇭 Ghana Wires', sources: ['gna.org.gh', 'dubawa.org'], region: 'West Africa' },
    { label: '🇰🇪 Kenya & East Africa', sources: ['pesacheck.org', 'nation.africa', 'standardmedia.co.ke'], region: 'East Africa' },
    { label: '🇿🇦 South Africa & SADC', sources: ['sabcnews.com', 'news24.com', 'africacheck.org'], region: 'Southern Africa' },
    { label: '🌐 Global Wires (AP, Reuters)', sources: ['apnews.com', 'reuters.com', 'bbc.com'], region: 'Global' }
  ];

  const handleToggleSource = (domain) => {
    if (!setSelectedSources) return;

    if (domain === 'ALL') {
      setSelectedSources(['ALL']);
      return;
    }

    let current = selectedSources.filter(s => s !== 'ALL');
    if (current.includes(domain)) {
      current = current.filter(s => s !== domain);
    } else {
      current = [...current, domain];
    }

    if (current.length === 0) {
      setSelectedSources(['ALL']);
    } else {
      setSelectedSources(current);
    }
  };

  const handleApplyPreset = (preset) => {
    if (setSelectedSources) setSelectedSources(preset.sources);
    if (setSelectedRegion) setSelectedRegion(preset.region);
  };

  const filteredPosts = posts.filter(post => {
    // Verdict filter
    const matchesVerdict = filterCategory === 'ALL' || post.verdict === filterCategory;
    
    // Search keyword filter
    const matchesSearch = !searchTerm || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.topic.toLowerCase().includes(searchTerm.toLowerCase());

    // User selected source filter
    const matchesSource = selectedSources.length === 0 || 
      selectedSources.includes('ALL') || 
      (post.sourceDomain && selectedSources.includes(post.sourceDomain));

    // User selected region filter
    const matchesRegion = selectedRegion === 'ALL' || 
      post.region === selectedRegion || 
      post.country === selectedRegion;

    return matchesVerdict && matchesSearch && matchesSource && matchesRegion;
  });

  const activeSourcesCount = selectedSources.includes('ALL') || selectedSources.length === 0 
    ? TRUSTED_DOMAINS.length 
    : selectedSources.length;

  return (
    <div className="live-feed-section">
      {/* Stream Customizer Panel */}
      <div className="feed-controls-card">
        <div className="controls-header">
          <div className="controls-title">
            <Radio className="pulse-icon" size={18} />
            <span>Social & Wire Stream Monitor ({filteredPosts.length})</span>
          </div>

          <div className="stream-customizer-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className={`filter-chip ${showSourceCustomizer ? 'active' : ''}`}
              onClick={() => setShowSourceCustomizer(!showSourceCustomizer)}
            >
              <Sliders size={14} /> Customize Sources ({activeSourcesCount})
            </button>

            <input 
              type="text" 
              placeholder="Search feed by keyword, topic, or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="feed-search-input"
            />
          </div>
        </div>

        {/* Source Stream Customizer Drawer */}
        {showSourceCustomizer && (
          <div className="source-stream-drawer" style={{ background: 'var(--bg-dark)', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> Quick Region & Wire Presets:
            </div>
            <div className="preset-chips-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {QUICK_PRESETS.map((p, idx) => (
                <button 
                  key={idx} 
                  className="filter-chip"
                  style={{ fontSize: '11.5px', padding: '3px 8px' }}
                  onClick={() => handleApplyPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Select Regional & Global Wire Channels to Track:
            </div>
            <div className="wire-toggle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
              {TRUSTED_DOMAINS.map((domain) => {
                const isSelected = selectedSources.includes('ALL') || selectedSources.includes(domain.domain);
                return (
                  <button
                    key={domain.domain}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    style={{ fontSize: '12px', justifyContent: 'space-between', padding: '5px 8px' }}
                    onClick={() => handleToggleSource(domain.domain)}
                  >
                    <span>{domain.name}</span>
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Categories */}
        <div className="filter-chips">
          <span className="filter-label"><Filter size={14} /> Verdict Filter:</span>
          
          <button 
            className={`filter-chip ${filterCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterCategory('ALL')}
          >
            All Posts ({posts.length})
          </button>

          <button 
            className={`filter-chip verified-chip ${filterCategory === 'VERIFIED' ? 'active' : ''}`}
            onClick={() => setFilterCategory('VERIFIED')}
          >
            <ShieldCheck size={14} /> Verified Real ({posts.filter(p => p.verdict === 'VERIFIED').length})
          </button>

          <button 
            className={`filter-chip fake-chip ${filterCategory === 'FAKE' ? 'active' : ''}`}
            onClick={() => setFilterCategory('FAKE')}
          >
            <ShieldAlert size={14} /> Flagged Fake ({posts.filter(p => p.verdict === 'FAKE').length})
          </button>

          <button 
            className={`filter-chip misleading-chip ${filterCategory === 'MISLEADING' ? 'active' : ''}`}
            onClick={() => setFilterCategory('MISLEADING')}
          >
            <AlertTriangle size={14} /> Misleading ({posts.filter(p => p.verdict === 'MISLEADING').length})
          </button>

          <button 
            className={`filter-chip satire-chip ${filterCategory === 'SATIRE' ? 'active' : ''}`}
            onClick={() => setFilterCategory('SATIRE')}
          >
            <Sparkles size={14} /> Satire ({posts.filter(p => p.verdict === 'SATIRE').length})
          </button>
        </div>
      </div>

      {/* Stream Active Status Badge */}
      <div className="stream-status-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', padding: '0 4px' }}>
        <span className="pulse-dot active" style={{ display: 'inline-block' }}></span>
        <span>Tracking Live News Stream: <strong>{activeSourcesCount} Wire Channels</strong> across <strong>{selectedRegion}</strong></span>
      </div>

      {/* Feed Posts Grid */}
      <div className="feed-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onSelectPost={onSelectPost} />
          ))
        ) : (
          <div className="empty-feed-card" style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <RefreshCw className="empty-icon" size={32} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No social posts match your active wire channel and region selections.</p>
            <button 
              className="filter-chip" 
              style={{ margin: '1rem auto 0', display: 'inline-flex' }}
              onClick={() => {
                if (setSelectedSources) setSelectedSources(['ALL']);
                if (setSelectedRegion) setSelectedRegion('ALL');
                setFilterCategory('ALL');
              }}
            >
              Reset All Stream Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
