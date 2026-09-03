// newsDatabase.js - Initial social posts feed, African & global news wires, and simulated stream pool

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
    timestamp: "3 mins ago",
    rawTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    metrics: { shares: "12.4K", likes: "34.1K", comments: "1.8K" },
    verdict: "FAKE",
    trustScore: 8,
    topic: "Finance & Economy",
    summary: "CBN confirmed no deadline has been set for invalidating banknotes. Legal tender status remains indefinitely active per Supreme Court ruling and official CBN press releases.",
    originTrace: {
      firstSeen: "2026-09-02 18:00:00 UTC",
      originalPublisher: "Viral WhatsApp Broadcast Audio",
      originalUrl: "https://dubawa.org/fact-check-cbn-banknote-deadline",
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
      { name: "Dubawa West Africa Fact Check", url: "https://dubawa.org/fact-check-cbn-banknotes", credibility: 98, type: "African Fact Checker", status: "DEBUNKED" },
      { name: "News Agency of Nigeria (NAN)", url: "https://nannews.ng/cbn-banknotes-statement", credibility: 96, type: "National News Wire", status: "OFFICIAL RELEASE" },
      { name: "Central Bank of Nigeria Official", url: "https://cbn.gov.ng", credibility: 99, type: "Central Bank", status: "CONFIRMED" }
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
    timestamp: "12 mins ago",
    rawTimestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    metrics: { shares: "6.2K", likes: "15.8K", comments: "920" },
    verdict: "FAKE",
    trustScore: 5,
    topic: "Education & Tech",
    summary: "Ministry of Education spokesperson confirmed no laptop giveaway campaign exists. The registration link harvests user mobile numbers and personal data.",
    originTrace: {
      firstSeen: "2026-09-02 14:00:00 UTC",
      originalPublisher: "Phishing Site (free-laptop-gov.ke-promo.xyz)",
      originalUrl: "https://pesacheck.org/fake-kenya-laptop-giveaway",
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
      { name: "PesaCheck East Africa", url: "https://pesacheck.org/fake-laptop-giveaway", credibility: 98, type: "African Fact Checker", status: "PHISHING WARNED" },
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
    timestamp: "25 mins ago",
    rawTimestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    metrics: { shares: "14.1K", likes: "42.0K", comments: "1.1K" },
    verdict: "VERIFIED",
    trustScore: 97,
    topic: "Finance & Economy",
    summary: "SARB Monetary Policy Committee announced unanimous vote to maintain repo rate, citing stabilizing inflation expectations within 3-6% target range.",
    originTrace: {
      firstSeen: "2026-09-03 13:00:00 UTC",
      originalPublisher: "SARB MPC Live Press Conference, Pretoria",
      originalUrl: "https://sabcnews.com/sarb-repo-rate-decision-2026",
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
      { name: "SABC News Official", url: "https://sabcnews.com/sarb-repo-rate", credibility: 97, type: "Public Broadcaster", status: "VERIFIED" },
      { name: "South African Reserve Bank", url: "https://resbank.co.za", credibility: 99, type: "Central Bank", status: "OFFICIAL RELEASE" },
      { name: "Reuters Financial Wire", url: "https://reuters.com/markets", credibility: 98, type: "Global Wire", status: "CORROBORATED" }
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

export const SIMULATED_STREAM_POOL = [
  {
    author: { name: "Dubawa West Africa", handle: "@DubawaNG", avatar: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&auto=format&fit=crop&q=80", verified: true, platform: "twitter" },
    sourceDomain: "dubawa.org",
    region: "West Africa",
    country: "Nigeria",
    content: "FACT CHECK: Nigeria Federal Ministry of Finance confirms no 10% instant tax has been imposed on mobile money transfers.",
    topic: "Finance & Economy",
    verdict: "FAKE",
    trustScore: 12,
    summary: "Ministry of Finance official release confirms viral posts misquoted standard withholding tax framework. Mobile money transfers remain exempt.",
    originTrace: {
      firstSeen: "Just now",
      originalPublisher: "Viral X post by unverified account @TaxAlertsNG",
      originalUrl: "https://dubawa.org/mobile-money-tax-fact-check",
      timeline: [
        { time: "Just now", event: "Misleading tweet posted by @TaxAlertsNG", type: "fake_origin", source: "Social Post" },
        { time: "2 mins ago", event: "Dubawa issues official debunk report", type: "debunk", source: "Dubawa Wire" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "Just now",
      initialNode: "Social Post (@TaxAlertsNG)",
      nodeType: "Unverified Account",
      viralStage: "Early Stage (Pre-Viral)",
      viralRiskScore: 84,
      preShareRecommendation: "🛑 DO NOT SHARE — Misinformation origin flagged by Dubawa West Africa.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "X Account @TaxAlertsNG", note: "First posted with misleading tax headline", velocity: "Low (0-10m)" },
        { stage: "2. Fact-Check Interception", location: "Dubawa West Africa Desk", note: "Official refutation published before viral surge", velocity: "Verified Active" }
      ]
    },
    corroboratingSources: [
      { name: "Dubawa West Africa Desk", url: "https://dubawa.org", credibility: 98, type: "African Fact Checker", status: "REFUTED" },
      { name: "News Agency of Nigeria (NAN)", url: "https://nannews.ng", credibility: 96, type: "National News Wire", status: "OFFICIAL STATEMENT" }
    ],
    signals: { domainAuthority: 97, crossConsensus: "Refuted by Dubawa", manipulatedMedia: true, clickbaitScore: 88 }
  },
  {
    author: { name: "Ghana News Agency (GNA)", handle: "@GNA_Ghana", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", verified: true, platform: "twitter" },
    sourceDomain: "gna.org.gh",
    region: "West Africa",
    country: "Ghana",
    content: "Bank of Ghana expands eCedi retail digital currency pilot to over 1,500 merchants in Accra and Kumasi.",
    topic: "Finance & Economy",
    verdict: "VERIFIED",
    trustScore: 96,
    summary: "Bank of Ghana Governor confirmed phase two expansion of eCedi offline and online merchant payments in partnership with Fintech Association.",
    originTrace: {
      firstSeen: "5 mins ago",
      originalPublisher: "Bank of Ghana Press Release, Accra",
      originalUrl: "https://gna.org.gh/bank-of-ghana-ecedi-pilot",
      timeline: [
        { time: "5 mins ago", event: "Press release issued at Fintech Summit in Accra", type: "primary", source: "Bank of Ghana" },
        { time: "3 mins ago", event: "GNA Wire publishes full statement", type: "wire", source: "GNA Desk" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "5 mins ago",
      initialNode: "Bank of Ghana Press Office",
      nodeType: "Central Bank Official Bulletin",
      viralStage: "Official Wire Publication",
      viralRiskScore: 12,
      preShareRecommendation: "✅ SAFE TO SHARE — Corroborated official release from Bank of Ghana & GNA.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "Accra Fintech Summit", note: "Governor speech & official release", velocity: "Official Wire" },
        { stage: "2. National Distribution", location: "Ghana News Agency (GNA)", note: "Syndicated across West African media", velocity: "National Wire" }
      ]
    },
    corroboratingSources: [
      { name: "Ghana News Agency (GNA)", url: "https://gna.org.gh", credibility: 95, type: "National News Wire", status: "VERIFIED" },
      { name: "Bank of Ghana Portal", url: "https://bog.gov.gh", credibility: 99, type: "Central Bank", status: "PRIMARY SOURCE" }
    ],
    signals: { domainAuthority: 96, crossConsensus: "Verified by BOG & GNA", manipulatedMedia: false, clickbaitScore: 12 }
  },
  {
    author: { name: "Africa Check Pan-Africa", handle: "@AfricaCheck", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", verified: true, platform: "twitter" },
    sourceDomain: "africacheck.org",
    region: "Pan-Africa",
    country: "South Africa",
    content: "NO, South African Department of Health is not hiring 50,000 community health workers via viral Facebook job link. Post is a scam.",
    topic: "Health & Governance",
    verdict: "FAKE",
    trustScore: 6,
    summary: "Health Department confirmed job recruitment post is fraudulent. Authentic vacancies are published exclusively on dpsa.gov.za and official provincial portals.",
    originTrace: {
      firstSeen: "8 mins ago",
      originalPublisher: "Facebook Page 'SA Health Jobs 2026'",
      originalUrl: "https://africacheck.org/sa-health-jobs-scam",
      timeline: [
        { time: "8 mins ago", event: "Fake job post shared across 40 Facebook groups", type: "fake_origin", source: "Facebook Group" },
        { time: "4 mins ago", event: "Africa Check & SABC issue fraud warning", type: "debunk", source: "Africa Check Desk" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "8 mins ago",
      initialNode: "Fake Facebook Page",
      nodeType: "Recruitment Fraud Node",
      viralStage: "Early Stage (Pre-Viral)",
      viralRiskScore: 91,
      preShareRecommendation: "🛑 DO NOT SHARE — Fraudulent recruitment scam flagged by Africa Check.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "Unverified Facebook Page", note: "Job scam harvesting applicant data", velocity: "Low (0-15m)" },
        { stage: "2. Interception", location: "Africa Check South Africa", note: "Verification response active before viral peak", velocity: "Verified Active" }
      ]
    },
    corroboratingSources: [
      { name: "Africa Check Bureau", url: "https://africacheck.org", credibility: 98, type: "African Fact Checker", status: "FRAUD WARNED" },
      { name: "SABC News SA", url: "https://sabcnews.com", credibility: 96, type: "Public Broadcaster", status: "CORROBORATED" }
    ],
    signals: { domainAuthority: 98, crossConsensus: "Confirmed Recruitment Scam", manipulatedMedia: true, clickbaitScore: 96 }
  },
  {
    author: { name: "Associated Press Wire", handle: "@AP", avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80", verified: true, platform: "twitter" },
    sourceDomain: "apnews.com",
    region: "Global",
    country: "Global",
    content: "AP WIRE: World Health Organization issues global guidance on AI diagnostic integration in clinical triage procedures.",
    topic: "Health & Technology",
    verdict: "VERIFIED",
    trustScore: 98,
    summary: "WHO published new global framework establishing clinical trial and algorithmic safety standards for AI-assisted diagnostic software.",
    originTrace: {
      firstSeen: "10 mins ago",
      originalPublisher: "WHO Headquarters, Geneva",
      originalUrl: "https://apnews.com/who-ai-clinical-guidance",
      timeline: [
        { time: "10 mins ago", event: "Press briefing at WHO Geneva", type: "primary", source: "WHO Media Desk" },
        { time: "7 mins ago", event: "AP & Reuters syndicate global wire release", type: "wire", source: "AP Wire" }
      ]
    },
    originRadar: {
      firstSeenTimestamp: "10 mins ago",
      initialNode: "WHO Press Desk, Geneva",
      nodeType: "International Organization Release",
      viralStage: "Global Wire Syndicate",
      viralRiskScore: 8,
      preShareRecommendation: "✅ SAFE TO SHARE — Official WHO press release syndicated via AP Wire.",
      propagationPath: [
        { stage: "1. Initial Origin Node", location: "WHO Geneva Briefing", note: "Official international release", velocity: "Global Wire" }
      ]
    },
    corroboratingSources: [
      { name: "Associated Press Wire", url: "https://apnews.com", credibility: 99, type: "Global Wire", status: "VERIFIED" },
      { name: "World Health Organization", url: "https://who.int", credibility: 97, type: "International Body", status: "PRIMARY SOURCE" }
    ],
    signals: { domainAuthority: 99, crossConsensus: "Verified by WHO & AP", manipulatedMedia: false, clickbaitScore: 8 }
  }
];
