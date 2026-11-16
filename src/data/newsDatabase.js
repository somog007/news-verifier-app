// newsDatabase.js - Curated example threads and the trusted news-wire / fact-checker registry

export const INITIAL_POSTS = [
  {
    id: "post-101",
    author: {
      name: "Dubawa Verification Desk",
      handle: "@DubawaNG",
      avatar: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&auto=format&fit=crop&q=80",
      verified: true,
      platform: "twitter"
    },
    sourceDomain: "dubawa.org",
    region: "West Africa",
    country: "Nigeria",
    content: "FACT CHECK: Central Bank of Nigeria (CBN) refutes viral WhatsApp message claiming old ₦500 and ₦1000 banknotes will cease being legal tender by end of the month.",
    curated: true,
    rawTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    metrics: { shares: "12.4K", likes: "34.1K", comments: "1.8K" },
    verdict: "FAKE",
    trustScore: 8,
    topic: "Finance & Economy",
    summary: "CBN confirmed no deadline has been set for invalidating banknotes. Legal tender status remains indefinitely active per Supreme Court ruling and official CBN press releases.",
    originTrace: {
      firstSeen: "2026-09-02 18:00:00 UTC",
      originalPublisher: "Viral WhatsApp Broadcast Audio",
      originalUrl: "https://dubawa.org/?s=CBN+banknotes",
      timeline: [
        { time: "18:00 UTC", event: "Audio clip claiming banknote expiration circulated on WhatsApp", type: "fake_origin", source: "WhatsApp Audio" },
        { time: "19:30 UTC", event: "Cross-posted to X and Facebook community groups", type: "social", source: "Social Feeds" },
        { time: "21:00 UTC", event: "CBN Corporate Communications issues official refutation", type: "primary", source: "CBN Press Desk" },
        { time: "22:00 UTC", event: "Dubawa & NAN publish debunk report", type: "debunk", source: "Dubawa Fact Check" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "18:00 UTC (Early Detection)",
      initialNode: "WhatsApp Broadcast Audio",
      nodeType: "Messaging Audio Clip",
      viralStage: "Spreading (Pre-Peak Virality)",
      viralRiskScore: 92,
      preShareRecommendation: "🛑 DO NOT SHARE — Misinformation origin detected. CBN has officially refuted banknote deadline claims.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "WhatsApp Group Audio", note: "First surfaced as unverified voice note", velocity: "Low (0-15m)" },
        { stage: "2. Amplification Vector", location: "Facebook & X Broadcasts", note: "Re-shared across regional community forums", velocity: "Accelerating (15-60m)" },
        { stage: "3. Fact-Check Response", location: "Dubawa & NAN Wires", note: "CBN official refutation issued before viral peak", velocity: "Verified Active" }
      ]
    },
    corroboratingSources: [
      { name: "Dubawa West Africa Fact Check", url: "https://dubawa.org/?s=CBN+banknotes", credibility: 98, type: "African Fact Checker", status: "DEBUNKED" },
      { name: "News Agency of Nigeria (NAN)", url: "https://nannews.ng/?s=CBN+banknotes", credibility: 96, type: "National News Wire", status: "OFFICIAL RELEASE" },
      { name: "Central Bank of Nigeria Official", url: "https://www.cbn.gov.ng", credibility: 99, type: "Central Bank", status: "CONFIRMED" }
    ],
    signals: {
      domainAuthority: 97,
      crossConsensus: "Refuted by CBN & Dubawa",
      manipulatedMedia: true,
      clickbaitScore: 94
    }
  },
  {
    id: "post-102",
    author: {
      name: "PesaCheck East Africa",
      handle: "@PesaCheck",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      verified: true,
      platform: "twitter"
    },
    sourceDomain: "pesacheck.org",
    region: "East Africa",
    country: "Kenya",
    content: "ALERT: Viral Facebook post claiming Kenya Ministry of Education is giving free solar laptops to all secondary school students is FAKE. Link leads to phishing scam.",
    curated: true,
    rawTimestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    metrics: { shares: "6.2K", likes: "15.8K", comments: "920" },
    verdict: "FAKE",
    trustScore: 5,
    topic: "Education & Tech",
    summary: "Ministry of Education spokesperson confirmed no laptop giveaway campaign exists. The registration link harvests user mobile numbers and personal data.",
    originTrace: {
      firstSeen: "2026-09-02 14:00:00 UTC",
      originalPublisher: "Phishing Site (free-laptop-gov.ke-promo.xyz)",
      originalUrl: "https://pesacheck.org/search?q=laptop",
      timeline: [
        { time: "14:00 UTC", event: "Phishing site created on suspicious domain", type: "fake_origin", source: "Phishing Node" },
        { time: "15:30 UTC", event: "Shared across Facebook groups and Telegram channels", type: "social", source: "Social Groups" },
        { time: "17:00 UTC", event: "PesaCheck & Nation Africa publish fraud alert", type: "debunk", source: "PesaCheck Desk" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "14:00 UTC (Early Detection)",
      initialNode: "Phishing Domain",
      nodeType: "Fraudulent Link Node",
      viralStage: "Pre-Viral Phishing Attempt",
      viralRiskScore: 89,
      preShareRecommendation: "🛑 DO NOT SHARE — Phishing link detected. Do not submit personal data.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "Suspicious Domain Node", note: "Registered on anonymous domain registrar", velocity: "Low (0-15m)" },
        { stage: "2. Amplification Vector", location: "Facebook Groups", note: "Promoted via fake comments and share incentives", velocity: "Accelerating (15-60m)" },
        { stage: "3. Fact-Check Response", location: "PesaCheck Bureau", note: "Warning issued before widespread financial harm", velocity: "Verified Active" }
      ]
    },
    corroboratingSources: [
      { name: "PesaCheck East Africa", url: "https://pesacheck.org/search?q=laptop", credibility: 98, type: "African Fact Checker", status: "PHISHING WARNED" },
      { name: "Nation Africa News", url: "https://nation.africa/kenya", credibility: 96, type: "Regional News Wire", status: "CORROBORATED" }
    ],
    signals: {
      domainAuthority: 2,
      crossConsensus: "Confirmed Fraud",
      manipulatedMedia: true,
      clickbaitScore: 98
    }
  },
  {
    id: "post-103",
    author: {
      name: "SABC News Desk",
      handle: "@SABCNews",
      avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
      verified: true,
      platform: "twitter"
    },
    sourceDomain: "sabcnews.com",
    region: "Southern Africa",
    country: "South Africa",
    content: "BREAKING: South African Reserve Bank (SARB) keeps benchmark repo rate unchanged at 8.25% as CPI inflation moderates to 4.6%.",
    curated: true,
    rawTimestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    metrics: { shares: "14.1K", likes: "42.0K", comments: "1.1K" },
    verdict: "VERIFIED",
    trustScore: 97,
    topic: "Finance & Economy",
    summary: "SARB Monetary Policy Committee announced unanimous vote to maintain repo rate, citing stabilizing inflation expectations within 3-6% target range.",
    originTrace: {
      firstSeen: "2026-09-03 13:00:00 UTC",
      originalPublisher: "SARB MPC Live Press Conference, Pretoria",
      originalUrl: "https://www.sabcnews.com/sabcnews/?s=repo+rate",
      timeline: [
        { time: "13:00 UTC", event: "SARB Governor delivers live MPC statement", type: "primary", source: "SARB Press Desk" },
        { time: "13:10 UTC", event: "SABC News & Reuters issue direct wire report", type: "wire", source: "SABC / Reuters" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "13:00 UTC (Official Release)",
      initialNode: "SARB Press Desk, Pretoria",
      nodeType: "Central Bank Official Bulletin",
      viralStage: "Official Wire Release",
      viralRiskScore: 10,
      preShareRecommendation: "✅ SAFE TO SHARE — Official central bank release corroborated by SABC & Reuters.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "SARB MPC Briefing", note: "Live official broadcast", velocity: "Official (0-10m)" },
        { stage: "2. Wire Distribution", location: "SABC News & Reuters", note: "Global and regional wire distribution", velocity: "Standard Wire" }
      ]
    },
    corroboratingSources: [
      { name: "SABC News Official", url: "https://www.sabcnews.com/sabcnews/?s=repo+rate", credibility: 97, type: "Public Broadcaster", status: "VERIFIED" },
      { name: "South African Reserve Bank", url: "https://www.resbank.co.za", credibility: 99, type: "Central Bank", status: "OFFICIAL RELEASE" },
      { name: "Reuters Financial Wire", url: "https://www.reuters.com/markets/", credibility: 98, type: "Global Wire", status: "CORROBORATED" }
    ],
    signals: {
      domainAuthority: 98,
      crossConsensus: "Verified by SARB & SABC",
      manipulatedMedia: false,
      clickbaitScore: 10
    }
  }
];

export const TRUSTED_DOMAINS = [
  // African Fact-Check Registries & News Wires
  { domain: "dubawa.org", name: "Dubawa Fact Check", region: "West Africa", countries: ["Nigeria", "Ghana", "Sierra Leone"], score: 97, type: "African Fact Checker" },
  { domain: "africacheck.org", name: "Africa Check", region: "Pan-Africa", countries: ["South Africa", "Kenya", "Nigeria"], score: 98, type: "African Fact Checker" },
  { domain: "pesacheck.org", name: "PesaCheck", region: "East Africa", countries: ["Kenya", "Uganda", "Tanzania"], score: 96, type: "African Fact Checker" },
  { domain: "nannews.ng", name: "News Agency of Nigeria (NAN)", region: "West Africa", countries: ["Nigeria"], score: 95, type: "National News Wire" },
  { domain: "gna.org.gh", name: "Ghana News Agency (GNA)", region: "West Africa", countries: ["Ghana"], score: 94, type: "National News Wire" },
  { domain: "sabcnews.com", name: "SABC News", region: "Southern Africa", countries: ["South Africa"], score: 96, type: "Public Broadcaster" },
  { domain: "news24.com", name: "News24", region: "Southern Africa", countries: ["South Africa"], score: 95, type: "Regional News" },
  { domain: "nation.africa", name: "Nation Africa", region: "East Africa", countries: ["Kenya", "Uganda"], score: 95, type: "Regional News Wire" },
  { domain: "standardmedia.co.ke", name: "Standard Media Group", region: "East Africa", countries: ["Kenya"], score: 94, type: "Regional News" },
  { domain: "premiumtimesng.com", name: "Premium Times", region: "West Africa", countries: ["Nigeria"], score: 95, type: "Investigative Outlet" },
  { domain: "channelstv.com", name: "Channels Television", region: "West Africa", countries: ["Nigeria"], score: 96, type: "Broadcasting Agency" },

  // Global Wires & Fact Checkers
  { domain: "reuters.com", name: "Reuters News Agency", region: "Global", countries: ["Global"], score: 98, type: "Global Wire" },
  { domain: "apnews.com", name: "Associated Press", region: "Global", countries: ["Global"], score: 99, type: "Global Wire" },
  { domain: "bbc.com", name: "BBC News World", region: "Global", countries: ["Global", "UK"], score: 96, type: "Public Broadcaster" },
  { domain: "bloomberg.com", name: "Bloomberg News", region: "Global", countries: ["Global"], score: 95, type: "Financial Wire" },
  { domain: "snopes.com", name: "Snopes Fact Check", region: "Global", countries: ["Global"], score: 96, type: "Global Fact Checker" },
  { domain: "factcheck.org", name: "FactCheck.org", region: "Global", countries: ["Global"], score: 95, type: "Global Fact Checker" },
  { domain: "fullfact.org", name: "Full Fact", region: "Global", countries: ["UK", "Global"], score: 95, type: "Fact Checker" },

  // Health & Scientific Bodies
  { domain: "who.int", name: "World Health Organization", region: "Global", countries: ["Global"], score: 97, type: "International Body" },
  { domain: "nasa.gov", name: "NASA Official Portal", region: "Global", countries: ["Global", "US"], score: 99, type: "Government Agency" },
  { domain: "nature.com", name: "Nature Publishing", region: "Global", countries: ["Global"], score: 99, type: "Academic Journal" }
];
