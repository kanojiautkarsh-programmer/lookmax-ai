# LookMax AI

Privacy-first face analysis powered by Transformers.js and Cloudflare Workers AI.

![Deploy](https://github.com/YOUR_USERNAME/lookmax-ai/workflows/Deploy%20to%20Cloudflare%20Pages/badge.svg)

## Features

- **100% Private** - Quick analysis runs entirely in your browser
- **AI-Powered** - Deep analysis via Cloudflare Workers AI (Llama Vision)
- **Zero Server Costs** - Free tier on Cloudflare Pages + Workers
- **Beautiful UI** - Premium dark theme with electric gold accents

## Deploy to Cloudflare Pages

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lookmax-ai.git
git push -u origin main
```

### 2. Get Cloudflare Credentials

1. **API Token**: [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens → Create Token (Edit Cloudflare Workers template)
2. **Account ID**: [Cloudflare Dashboard](https://dash.cloudflare.com) → Copy Account ID

### 3. Add GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |

### 4. Enable Workers AI

Go to [Cloudflare AI Dashboard](https://dash.cloudflare.com/) → Workers AI → Accept terms

### 5. Done!

Push to `main` branch - automatic deployment starts!

## Local Development

```bash
# Install wrangler
npm install -g wrangler

# Deploy manually
npm run deploy

# Deploy worker
npm run deploy:worker
```

## Architecture

```
Cloudflare Edge
├── Pages (Static) - Frontend (HTML/CSS/JS)
└── Workers AI - Llama Vision (10K neurons/day free)
```

## Tech Stack

- **Frontend**: Vanilla JS + CSS (no build step)
- **ML**: Transformers.js v4 (browser-based)
- **AI**: Cloudflare Workers AI
- **Hosting**: Cloudflare Pages (free, unlimited)

## Privacy

- **Quick Analysis**: 100% local - image never leaves browser
- **AI Analysis**: Image processed on Cloudflare edge, not stored

## License

MIT
