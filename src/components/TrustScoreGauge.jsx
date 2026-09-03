// TrustScoreGauge.jsx - Circular score gauge visualization component
import React from 'react';

export default function TrustScoreGauge({ score, verdict }) {
  // Map score 0-100 to stroke offset
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = "#10b981"; // green
  if (score < 30) strokeColor = "#ef4444"; // red
  else if (score < 70) strokeColor = "#f59e0b"; // amber

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" width="96" height="96" viewBox="0 0 96 96">
        <circle
          className="gauge-bg"
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="8"
        />
        <circle
          className="gauge-progress"
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="8"
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="gauge-text">
        <span className="score-num" style={{ color: strokeColor }}>{score}%</span>
        <span className="score-label">Trust Index</span>
      </div>
    </div>
  );
}
