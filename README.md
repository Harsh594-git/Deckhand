# Deckhand

An AI-generated flashcard study app. Static frontend (`index.html`) + one
serverless function (`api/generate.js`) that calls the Anthropic API so your
key never reaches the browser.

## 1. Get an API key (skip if you already have one)

1. Go to https://console.anthropic.com and sign up or log in.
2. Open **API Keys** and create a new key.
3. Add a small amount of credit under **Billing** — the API is pay-as-you-go
   and separate from any claude.ai subscription.

## 2. Run it locally

```bash
npm install -g vercel   # one-time
vercel dev
```

When prompted, it'll ask you to link or create a Vercel project — either is
fine for local dev. Then create a `.env` file (copy `.env.example`) and add
your key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Visit the local URL it prints (usually `http://localhost:3000`).

## 3. Deploy it for real

```bash
vercel
```

Follow the prompts to create/link a project, then set the environment
variable so it's available in production:

```bash
vercel env add ANTHROPIC_API_KEY
```

Paste your key when asked, choose "Production" (and "Preview"/"Development"
too if you want them to work as well), then deploy:

```bash
vercel --prod
```

Vercel will give you a live URL — that's your app.

### No command line? Use the dashboard instead
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Before the first deploy, expand **Environment Variables** and add
   `ANTHROPIC_API_KEY` with your key.
4. Click **Deploy**.

## How it works

- `index.html` is the whole frontend — no build step, no framework.
- `api/generate.js` is a Vercel serverless function. It receives
  `{ notes, count }`, calls Claude with a system prompt asking for strict
  JSON flashcards, parses the response, and returns `{ cards: [...] }`.
- Your API key lives only in the `ANTHROPIC_API_KEY` environment variable on
  Vercel's servers — it's never sent to the browser.

## Costs

Each deck generation is one API call (a few hundred input tokens, up to
~1500 output tokens). At current Claude Sonnet pricing that's a small
fraction of a cent per deck — check current rates at
https://docs.claude.com if you want exact numbers.
