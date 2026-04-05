# Looksmaxing AI

**Live Demo:** https://lookmax-ai.pages.dev

AI-powered appearance analysis app for teens. Analyze photos, get personalized tips, and track your progress.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

## Features

- **Photo Analysis**: Upload photos for AI-powered facial, skin, hair, and fashion analysis
- **AI Chat Advisor**: Get personalized tips and recommendations
- **Progress Tracking**: Track your appearance improvements over time
- **Privacy First**: Browser-based analysis option - your photos never leave your device
- **Zero Cost**: Built on free tiers of Cloudflare and Groq

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **AI Models**:
  - Transformers.js (browser-based, privacy-first)
  - Cloudflare Workers AI (Llama Vision)
  - Groq API (Llama 3.3 70B)
- **Deployment**: Vercel / Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables file:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### Get API Keys

**Groq API** (for chat and advanced analysis):
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Free tier: 14,400 requests/day

**Cloudflare** (for vision AI):
1. Sign up at [cloudflare.com](https://dash.cloudflare.com)
2. Get your Account ID from the dashboard
3. Create an API token with Workers AI permissions
4. Accept Workers AI terms at the AI dashboard

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended - Easiest)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" → Import your GitHub repo
4. Add environment variables:
   - `GROQ_API_KEY`
   - `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
5. Click Deploy!

### Cloudflare Pages

1. Push to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
3. Click "Create a project" → Connect to Git
4. Select your repository
5. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
6. Add environment variables in Settings
7. Deploy!

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────┐   │
│  │  Photo Upload   │───▶│  Transformers.js v4     │   │
│  │                 │    │  (Browser-based AI)     │   │
│  └─────────────────┘    └─────────────────────────┘   │
│                                  │                      │
│                                  ▼                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Quick Score (Face/Skin/Hair)        │   │
│  │              100% Private - No data sent          │   │
│  └──────────────────────────────────────────────────┘   │
│                                  │                      │
│                                  ▼                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Cloudflare Workers AI / Groq            │   │
│  │           (Detailed Analysis + Chat)               │   │
│  │           10K neurons/day free                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                  │                      │
│                                  ▼                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Personalized Recommendations             │   │
│  │         Stored in localStorage                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### AI Analysis Tiers

| Tier | Provider | Models | Daily Limit |
|------|----------|--------|-------------|
| Quick Score | Browser (Transformers.js) | Custom | Unlimited |
| Deep Analysis | Cloudflare Workers AI | Llama 3.2 11B Vision | 10K neurons |
| Advanced Chat | Groq API | Llama 3.3 70B | 14.4K requests |

## Project Structure

```
looksmaxing-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── analyze/[id]/     # Analysis results page
│   ├── components/
│   │   ├── ui/                # Radix UI components
│   │   ├── PhotoUploader.tsx  # Drag & drop upload
│   │   ├── AnalysisCard.tsx   # Results display
│   │   ├── ChatInterface.tsx  # AI chat UI
│   │   ├── ProgressTracker.tsx # Before/after tracking
│   │   └── ScoreGauge.tsx     # Visual scores
│   └── lib/
│       ├── ai/
│       │   ├── browser-vision.ts  # Transformers.js
│       │   ├── cloudflare.ts       # CF Workers AI
│       │   ├── groq.ts            # Groq API
│       │   └── analyze.ts         # Analysis orchestration
│       ├── storage.ts            # localStorage
│       ├── types.ts              # TypeScript types
│       └── utils.ts              # Utilities
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Features Roadmap

- [x] Photo upload with drag & drop
- [x] Browser-based quick analysis
- [x] AI-powered detailed analysis
- [x] Chat advisor
- [x] Progress tracking
- [x] Before/after comparison
- [ ] Shareable analysis results
- [ ] Personalized improvement plan
- [ ] Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Disclaimer

This app provides appearance analysis for self-improvement purposes. Results are AI-generated and should not be considered professional advice. Always consult experts for medical or professional guidance.
