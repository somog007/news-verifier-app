// ClaimInputBar.jsx - Instant claim & URL verification search bar
import React, { useState } from 'react';
import { Search, Sparkles, Link as LinkIcon, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ClaimInputBar({ onVerifyClaim, isScanning }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isScanning) return;
    onVerifyClaim(query);
  };

  const handleSampleClick = (sampleText) => {
    setQuery(sampleText);
    onVerifyClaim(sampleText);
  };

  return (
    <div className="claim-verifier-box">
      <div className="verifier-header">
        <div className="verifier-title">
          <Sparkles className="sparkle-icon" size={20} />
          <span>Pre-Virality Origin Radar & Claim Verifier</span>
        </div>
        <span className="verifier-badge">⚡ Trace Origin & Track Thread</span>
      </div>

      <form onSubmit={handleSubmit} className="claim-form">
        <div className="input-wrapper">
          <Search className="input-icon" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste tweet text, news headline, or post URL (e.g. 'Central bank banning cash next week')..."
            className="claim-input"
            disabled={isScanning}
          />
          <button type="submit" className="verify-submit-btn" disabled={!query.trim() || isScanning}>
            {isScanning ? (
              <>
                <span className="spinner"></span> Scanning Wires...
              </>
            ) : (
              <>
                Verify & Track Thread <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset sample claim tags for quick user testing */}
      <div className="sample-claims">
        <span className="sample-label">Try testing:</span>
        <button 
          className="sample-chip fake-chip" 
          onClick={() => handleSampleClick("URGENT: Central Bank secretly preparing to ban physical cash next Monday")}
        >
          <AlertCircle size={12} /> Fake News Rumor
        </button>
        <button 
          className="sample-chip verified-chip" 
          onClick={() => handleSampleClick("NASA confirms James Webb space telescope water vapor discovery on exoplanet K2-18b")}
        >
          <CheckCircle2 size={12} /> Verified Science Claim
        </button>
        <button 
          className="sample-chip link-chip" 
          onClick={() => handleSampleClick("https://reuters.com/world/europe/ecb-rate-cut-signals")}
        >
          <LinkIcon size={12} /> Test News Link
        </button>
      </div>
    </div>
  );
}
