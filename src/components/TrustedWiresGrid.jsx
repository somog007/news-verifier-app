// TrustedWiresGrid.jsx - Registry of reference wires and fact-checkers
import { TRUSTED_DOMAINS } from "../data/newsDatabase";

export default function TrustedWiresGrid() {
  return (
    <div className="wire-grid">
      {TRUSTED_DOMAINS.map((domain) => (
        <a
          key={domain.domain}
          className="wire-card"
          href={`https://${domain.domain}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="wire-header">
            <span className="wire-name">{domain.name}</span>
            <span className="wire-score">{domain.score}% Trust</span>
          </div>
          <div className="wire-sub">
            <span>{domain.domain}</span> • <span className="wire-type">{domain.type}</span> • <span>{domain.region}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
