# VerifiNews

**Check a claim before you share it.** VerifiNews helps people in Africa (and anywhere) sanity-check a headline, social post or link before forwarding it. It works out what kind of content it is, searches live online sources, points you to the right regional fact-checkers, and keeps a history of what you've checked.

Live demo: https://somog007.github.io/news-verifier-app

## How a check works

1. **Classify the content.** Every input is labelled as one of:
   - **Factual claim**: a specific statement that can be checked.
   - **Likely fabricated**: chain-message phrasing ("as received", "share widely"), unnamed insiders, miracle cures, scam hooks, or a link impersonating a trusted outlet.
   - **Satire / parody**: satire outlets (The Onion, Babylon Bee, Punocracy…) or self-declared parody.
   - **Opinion / rhetoric**: value judgements, rhetorical questions, slogans and exaggeration with nothing checkable in them. Opinionated text that *does* contain a fact stays a factual claim, and the rhetoric is pointed out.
   - **Link**: a URL on its own. The publisher is assessed as trusted, satire, social post, shortened link, impersonation (e.g. `reuters-news.xyz`), suspicious (IP address, punycode, throwaway TLD, no https) or unknown. Links inside text are assessed too.
2. **Search live online sources** (when connected):
   - **Published fact-checks** from Google Fact Check Tools (ClaimReview from Africa Check, Dubawa, PesaCheck, AFP, Reuters and others). A fact-checker's rating outweighs every other signal.
   - **News coverage** from Google News (via the server) or GDELT. Two or more trusted outlets reporting it → Verified. Big claims nobody reports are flagged.
   - **Background** from Wikipedia.
   - **AI research** (optional): Claude with web search and page fetching, via the server.
3. **Explain the result**: verdict, confidence, how it was checked, sources found, and whether it is safe to share.

### Newsfeed (works offline too)

The studio shows **Latest headlines** for the selected country: beside the checker on wide screens, below it on phones and narrow windows, with a "Latest headlines ↓" shortcut at the top. Headlines refresh every 15 minutes while online and are **saved on the device** (the last 7 days, up to 400 per country). You can filter them, open them, or press **Check** to verify one.

When offline, claims are compared against the saved headlines: a match from two trusted outlets can still confirm a claim, while no match only means "not in the saved feed", never "false". Offline results are always marked as such.

### Internet connection

Correct results need live sources, so the app watches the connection:
- When offline, a banner asks the user to connect, and pressing **Check** asks for confirmation before running a limited offline check.
- Offline results are marked "Checked without internet". Once the connection returns, the user is told and can **re-check with live sources** in one click. Re-submitting the claim online re-checks it automatically.
- If the device reports being online but no source can be reached, the user is asked to check their connection.

## Setup

> **Getting API keys:** see [docs/SETUP_API_KEYS.md](docs/SETUP_API_KEYS.md) for step-by-step instructions, what is free (Google Fact Check) and what is paid (Anthropic).

```bash
npm install
npm run dev          # http://localhost:5173/news-verifier-app/
```

With no configuration, checks use Wikipedia plus best-effort GDELT news search directly from the browser. For reliable live sources, run the server.

### Live evidence & AI server (recommended)

API keys must never be shipped to the browser, so they live in `server/`:

```bash
cd server
cp .env.example .env   # all keys optional; see below
npm install
npm start              # http://localhost:8787
```

| Server endpoint | Needs | Provides |
| --- | --- | --- |
| `GET /api/headlines` | nothing | Latest headlines for the newsfeed |
| `GET /api/evidence` | nothing (`GOOGLE_FACTCHECK_API_KEY` adds fact-checks) | Google News coverage + published fact-checks |
| `POST /api/verify` | `ANTHROPIC_API_KEY` | Claude research with web search |

Then create `.env.local` in the project root:

```
VITE_EVIDENCE_API_URL=/api/evidence
VITE_VERIFY_API_URL=/api/verify      # only if ANTHROPIC_API_KEY is set
```

In development Vite proxies `/api` to the server. In production, deploy `server/` to any Node host, set `ALLOWED_ORIGIN` to your site, and set the repository variables `VITE_EVIDENCE_API_URL` / `VITE_VERIFY_API_URL` to its full URLs.

Without a server you can still enable fact-checks with `VITE_FACTCHECK_API_KEY` (a free Google Cloud key). It is visible in the browser, so restrict it to your site's referrer.

Other scripts: `npm test` (Vitest), `npm run lint` (Oxlint), `npm run build`, `npm run preview`.

## Project structure

```
src/
  App.jsx                    App shell: tabs, verification flow, connection state
  components/                UI (NewsVerifier, ConnectionBanner, LiveFeed, SourceTraceModal, …)
  constants/                 verdicts.js (labels, share advice), contentTypes.js
  data/newsDatabase.js       Curated example threads + trusted wire registry
  hooks/                     useTheme, useTrackedThreads, useOnlineStatus, useNewsFeed
  lib/                       text matching, relative time, safe storage helpers
  services/
    verifierEngine.js        Content classification, link analysis, pattern screening
    onlineSources.js         Live fact-checks, news, Wikipedia + merging evidence
    newsFeed.js              Newsfeed headlines, saved on the device for offline checks
    verificationService.js   The pipeline: classify -> research -> evidence
server/verify-proxy.mjs      /api/headlines, /api/evidence, /api/verify (keeps keys server-side)
```

## Deployment

On every push to `main`, `.github/workflows/deploy.yml` runs lint, tests and the build, then publishes `dist/` to GitHub Pages. In repository Settings → Pages, set the source to **GitHub Actions**.

## Limitations

Classification and pattern checks are heuristics, and news matching is keyword-based. A false claim can avoid every red flag, and coverage of a topic is not proof of a specific claim. Results are guidance: open the sources to confirm.
