# Setup guide: API keys and the server

VerifiNews works without any keys. Keys add more sources. This guide explains what each one does, what it costs, and where to put it.

## At a glance

| What | Needed for | Cost | Key? |
|---|---|---|---|
| Google News (headlines + news search) | Newsfeed, news coverage of a claim | Free | No key |
| Wikipedia | Background information | Free | No key |
| **Google Fact Check Tools API** | Published fact-checks (Africa Check, Dubawa, PesaCheck, AFP…) | **Free** | Yes, a Google Cloud API key |
| **Anthropic (Claude) API** | AI research: reads the web and explains its verdict | **Paid**, pay as you go | Yes, an Anthropic API key |
| A host for `server/` | Live site on GitHub Pages | Free or low-cost tiers exist | No key, but an account with the host |

**Recommended order:** run the server locally (no keys), then add the free Google key. Add the Anthropic key only if you want AI research and are happy to pay for usage.

---

## 1. Google Fact Check Tools API key (free)

This key lets the app find claims that professional fact-checkers have already rated. When a fact-check is found, it decides the verdict, so it is the most valuable key.

**Cost:** Google does not charge for this API. You need a Google account, and you may be asked to accept the Google Cloud terms. You don't need to enable billing for this API. If Google ever asks for billing details, stop and check the [API's page](https://developers.google.com/fact-check/tools/api) before adding a card.

**Steps**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and sign in with a Google account.
2. Create a project: click the project picker at the top → **New project**, name it, for example `verifinews` → **Create**. Make sure the new project is selected.
3. Enable the API: open **APIs & Services → Library**, search for **Fact Check Tools API**, open it and click **Enable**.
4. Create the key: open **APIs & Services → Credentials** → **Create credentials → API key**. Copy the key.
5. Restrict the key (important):
   - Click the key → **API restrictions** → **Restrict key** → choose only **Fact Check Tools API**.
   - If the key will be used **in the browser** (option B below), also set **Application restrictions → Websites** and add `https://somog007.github.io/*` and `http://localhost:5173/*`.
   - Click **Save**.

**Where to put it**

- **Option A, recommended (server):** in `server/.env`:
  ```
  GOOGLE_FACTCHECK_API_KEY=your-key-here
  ```
  Restart the server. Its startup message should say `news + fact-checks`.
- **Option B (no server):** in `.env.local` in the project root:
  ```
  VITE_FACTCHECK_API_KEY=your-key-here
  ```
  This key ends up in the website's code where anyone can read it, which is why step 5's website restriction matters. For the live site, add it in GitHub under **Settings → Secrets and variables → Actions → Secrets** as `VITE_FACTCHECK_API_KEY`.

---

## 2. Anthropic API key (paid, optional)

This key lets Claude research each claim with live web search, read submitted links, and write a short explanation of its verdict. Without it, the app still uses fact-checks, news and Wikipedia.

**Cost: paid.** The Claude API is billed separately from a Claude.ai Pro or Max subscription; a subscription does **not** include API access. You buy prepaid credits and pay per use: per token of text the model reads and writes, plus a fee per web search. One claim check uses several searches and some reading, so it costs noticeably more than a plain chat message. See current prices at [claude.com/pricing](https://claude.com/pricing) (API section).

**Keeping costs under control**

- Set a **monthly spend limit** in the Console (**Settings → Limits**).
- The server limits each visitor to 10 AI checks per minute, and repeat checks of the same claim reuse the saved result.
- To use a cheaper model, set for example `CLAUDE_MODEL=claude-sonnet-5-5` in `server/.env`. The default is `claude-opus-5-5`, which is the most capable and the most expensive.

**Steps**

1. Go to the [Claude Console](https://platform.claude.com/) and create an account (email or Google sign-in). Verify your email and phone if asked.
2. Add credits: **Settings → Billing** → add a payment method and buy credits.
3. Create the key: **Settings → API keys** → **Create key**, name it `verifinews`, copy it. It is shown **only once**.
4. Put it in `server/.env`, **never** in `.env.local` or anywhere in the website's code:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
5. In `.env.local` (project root), turn the feature on:
   ```
   VITE_VERIFY_API_URL=/api/verify
   ```
6. Restart the server and `npm run dev`. The server's startup message should say `AI research (claude-...)`.

If a key ever leaks (for example it is pushed to GitHub), delete it in the Console straight away and create a new one.

---

## 3. Running the server locally (no keys needed)

```bash
cd server
cp .env.example .env
npm install
npm start
```

Then make sure the project root has `.env.local` containing:

```
VITE_EVIDENCE_API_URL=/api/evidence
```

Run `npm run dev` in the project root. The newsfeed, news search and offline headline saving now work.

## 4. Putting it online (the live GitHub Pages site)

GitHub Pages can only host the website, not `server/`. Deploy `server/` to a Node.js host such as Render, Railway or Fly.io; several have free or low-cost tiers. Then:

1. On the host, set the environment variables: `ALLOWED_ORIGIN=https://somog007.github.io`, plus any keys from sections 1 and 2.
2. In GitHub → **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_EVIDENCE_API_URL` = `https://your-server.example.com/api/evidence`
   - `VITE_VERIFY_API_URL` = `https://your-server.example.com/api/verify` (only if you set an Anthropic key)
3. Push to `main`. The workflow rebuilds and redeploys the site.

The newsfeed uses `/api/headlines` on the same server automatically; set `VITE_HEADLINES_API_URL` only if it lives elsewhere.

## Safety checklist

- `.env`, `.env.local` and `server/.env` are git-ignored. Never commit them.
- Only `VITE_…` values reach the browser. Never put the Anthropic key in a `VITE_` variable.
- Restrict the Google key to the Fact Check Tools API (and to your website if used in the browser).
- Set a spend limit on the Anthropic account.
