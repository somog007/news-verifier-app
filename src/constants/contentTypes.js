// contentTypes.js - What kind of content was submitted (independent of the verdict)

export const CONTENT_TYPES = {
  factual_claim: {
    label: "Factual claim",
    description: "A specific statement about the world that can be checked against evidence.",
  },
  fabricated: {
    label: "Likely fabricated",
    description: "Shows hallmarks of invented content: chain-message phrasing, unnamed 'insiders', miracle claims or scam hooks.",
  },
  satire: {
    label: "Satire / parody",
    description: "Comes from or presents itself as satire. It is meant as humour, not as news.",
  },
  rhetoric: {
    label: "Opinion / rhetoric",
    description: "Expresses a view, a rhetorical question or exaggeration. It cannot be proven true or false as stated.",
  },
  link: {
    label: "Link",
    description: "A web address. We assessed who published it; open it to check what it actually says.",
  },
};

export const LINK_KINDS = {
  trusted: "Trusted publisher",
  satire: "Known satire site",
  social: "Social media post",
  shortener: "Shortened link (destination hidden)",
  impersonation: "Impersonates a trusted outlet",
  suspicious: "Suspicious web address",
  unknown: "Unknown publisher",
};

export function getContentTypeMeta(type) {
  return CONTENT_TYPES[type] || CONTENT_TYPES.factual_claim;
}
