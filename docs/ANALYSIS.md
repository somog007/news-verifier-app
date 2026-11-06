# VerifiNews: Project Analysis & Restructure (31 Oct 2026)

A full copy of the project as it was before these changes is in `Documents\news-verifier-app-backup-2026-10-31` (git history included).

## 1. Product assessment

**Value proposition:** "Check before you share" for African social media users, with regional fact-checkers (Dubawa, Africa Check, PesaCheck) and wires (NAN, GNA, SABC). The niche is real and underserved, and the regional focus sets it apart.

**What undermined trust in the product before the restructure:**

| # | Problem | Impact |
|---|---|---|
| P1 | Any claim with no keywords scored 62 and was labelled **VERIFIED, "SAFE TO SHARE"** | A misinformation tool told users to share unverified claims. This was the most serious issue. |
| P2 | Keyword matching used substrings: "ai" matched "s**ai**d", "un" matched "**un**der", "who" matched "**who**le" | Random sentences were marked VERIFIED |
| P3 | Scores used `Math.random()`, and the studio ran the engine twice per check | The same claim gave different scores, and the saved thread disagreed with the result shown |
| P4 | Invented data shown as fact: fake UTC timeline times, fake share/like counts ("1.2K shares"), a hard-coded "Bot Network Activity Detected" banner, invented article URLs in seed data | Users could be misled, and the product's credibility suffered |
| P5 | Two separate claim inputs (top bar and studio) with different verdict vocabularies; satire was reported as "False" | The UX was confusing and verdicts contradicted each other |
| P6 | "Recent checks" were mostly lost on reload, and tracked threads were not persisted | The "check back on" promise didn't work |

## 2. Engineering assessment

| # | Problem | Severity |
|---|---|---|
| E1 | `VITE_ANTHROPIC_API_KEY` was read in the browser. Any key set at build time would be published in the JS bundle. | **Security, critical** |
| E2 | The AI path could never work: a direct browser call to the API without the CORS opt-in header always fails, and the model and web-search tool versions were outdated | Dead feature |
| E3 | Two GitHub Pages workflows ran on every push. The Jekyll one deployed the **unbuilt** source and raced the Vite deploy. | The live site could break at random |
| E4 | `NewsVerifier.jsx` was 835 lines with about 340 lines of inline CSS and a duplicate Google Fonts import | Hard to maintain |
| E5 | Verdict metadata was duplicated in 5 components, and satire/unverified CSS classes were missing | Inconsistent UI |
| E6 | Dead code: `SIMULATED_STREAM_POOL`, `canvas-confetti`, template assets, unused imports (11 lint warnings) | Clutter |
| E7 | No tests, CI didn't lint or test, Node 20 in CI was at the edge of Vite 8's supported range | No safety net |
| E8 | Modal had no Escape key, no `role="dialog"`, no focus management; buttons had no visible focus | Accessibility |

## 3. What was changed

**Architecture**
- `services/verificationService.js` is now the **single** verification entry point. It uses AI research when a proxy is configured and falls back to the offline engine otherwise. Both return one report shape.
- `server/verify-proxy.mjs` is a new server-side proxy using the Anthropic SDK (`claude-opus-5-5`, `web_search_20260209`, server-side refusal fallback, input validation, CORS allow-list, rate limit). The API key stays on the server (fixes E1, E2).
- `constants/verdicts.js` is the single source of truth for verdict labels, colours and share advice (fixes E5).
- New `hooks/` (`useTheme`, `useTrackedThreads` with localStorage persistence) and `lib/` (word-boundary matching, relative time, safe storage).
- The duplicate top input bar was removed, and its sample claims moved into the studio (fixes P5).

**Engine (`services/verifierEngine.js`)**
- Deterministic results, whole-word matching, and a lookalike-domain check (`reuters.com.fake.biz` is not Reuters).
- The default verdict is now **UNVERIFIED**, never VERIFIED. Sensational framing (caps, "BREAKING", "!!") maps to MISLEADING. Satire stays SATIRE.
- No fabricated times, metrics or "deepfake detected" signals. The timeline describes what was actually checked.
- Source links now go to fact-checker **search pages** for the claim, not invented article URLs.

**UX**
- An "Offline screening mode" notice tells users when results are heuristic. Each result shows its method and confidence.
- History persists across visits, a repeat check reuses the saved result, and a "Check again" button forces a fresh check.
- Analytics now computes the alert level from real data, includes all five verdicts, and shows top topics. The platform matrix is labelled as editorial guidance.
- Accessibility: dialog semantics, Escape to close, focus return, `aria-current` on tabs, visible focus rings, labelled textarea.

**Tooling**
- Jekyll workflow removed. CI now uses Node 22 and runs lint, tests and build. `VITE_VERIFY_API_URL` can be set as a repository variable.
- Vitest added (15 engine and normaliser tests). Removed `canvas-confetti` and `gh-pages` (deploys go through GitHub Actions only).
- README rewritten, plus `.env.example` files.

**Verification:** lint clean, 15/15 tests pass, production build succeeds. The Studio, report dialog, Tracked Threads, Trends, and persistence after reload were checked in the browser with no console errors. The proxy has passed a syntax check only; it was not run against the live API (that needs an API key).

## 4. Recommended roadmap

1. **Deploy the proxy** (Render, Fly.io, Cloudflare Workers or similar) and set `VITE_VERIFY_API_URL`. This turns the product from "screening" into real research.
2. **Integrate the Google Fact Check Tools API** (free, ClaimReview data) as a middle tier, so existing debunks from Dubawa and Africa Check are matched directly.
3. **WhatsApp/Telegram share-in flow**, since that is where most African misinformation spreads: a PWA share target, or a WhatsApp bot backed by the same proxy.
4. **Local languages** (Hausa, Yoruba, Igbo, Swahili, Pidgin) for the UI and screening patterns.
5. **Feedback loop**: "Was this helpful / report wrong verdict", to build an evaluation set.
6. **Image and screenshot checks**, since many viral claims are images.
7. Optional: migrate to TypeScript for the report shape, and add component tests (React Testing Library).

## 5. Update: live online verification & content classification

- **Content classification** (`verifierEngine.js`, `constants/contentTypes.js`): every check is labelled as factual claim, likely fabricated, satire, opinion/rhetoric, or link. There is a new **RHETORIC** verdict. Links are analysed as trusted, satire site, social post, shortened, impersonation (`reuters-breaking-news.xyz`), suspicious or unknown, including links embedded in text.
- **Live sources** (`onlineSources.js`): published fact-checks (Google Fact Check Tools; a fact-checker's rating decides the verdict), news coverage (Google News via `/api/evidence`, or GDELT as a fallback), and Wikipedia background. Results are filtered for relevance and trusted outlets are ranked first. A claim that only name-drops an institution ("NASA confirms…") is downgraded when no outlet reports it.
- **Connectivity**: a connection banner, an "are you sure?" prompt when checking offline, results marked "Checked without internet", and one-click re-checking once back online. Old pattern-only results are re-checked automatically when online.
- **Server**: new `GET /api/evidence` endpoint that works without any AI key. The AI schema now returns `content_type`, and the AI can fetch submitted links.
- **Verified**: 35 tests pass. In the browser, a real claim was verified from BBC, Africa Check and Premium Times coverage. Rhetoric, satire and impersonation-link examples were classified correctly. Going offline, checking anyway, reconnecting and re-checking all worked. Not verified: Google Fact Check results (needs a key) and AI research (needs an Anthropic key).

## 6. Update: newsfeed and offline checks

- **Newsfeed** (`NewsFeedPanel`, `useNewsFeed`, `services/newsFeed.js`): latest headlines for the selected country, shown in a sticky sidebar at 1100px and wider and below the studio on smaller screens, with a jump link. Filter by text or section; "Check" sends a headline to the studio.
- **Server**: new `GET /api/headlines` (Google News top stories plus Nation, World, Business, Health and Science; cached for 10 minutes per country). Without a server, the app falls back to GDELT.
- **Offline**: headlines are saved on the device (7 days, 400 per country). Offline checks match the claim against them. Two trusted matches → Verified (confidence capped at medium). No match is never treated as evidence of falsehood. A pattern-only "Verified" is downgraded to Unverified while offline.
- **Setup guide**: `docs/SETUP_API_KEYS.md` explains how to get each key, what it costs, and where to put it.
- **Verified**: 40 tests pass. In the browser, the feed loaded 169 Nigeria headlines across six sections. Offline, a paraphrased claim matched a saved headline, and a Reuters/BBC headline came back Verified (medium) from the saved feed. The phone layout has no horizontal overflow.
