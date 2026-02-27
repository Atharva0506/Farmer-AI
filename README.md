# 🌿 KrishiMitra — AI-Powered Agriculture Assistant

KrishiMitra (कृषि मित्र) is an advanced voice-first, multilingual AI assistant designed to empower Indian farmers. Built with **Next.js 16**, **AI SDK**, **Google Gemini 2.5 Flash**, and **PostgreSQL**, it delivers real-time agricultural intelligence through Voice + Text + Image.

---

## 🧠 13 AI-Powered Tools

The conversational AI automatically detects farmer intent and invokes the right tool:

| # | Tool | What It Does |
|---|------|-------------|
| 1 | 🌾 **Crop Guidance** | Planting, fertilizers, pest management advice |
| 2 | 🐛 **Disease Detection** | Photo/symptom-based diagnosis with treatment plans |
| 3 | 📋 **Scheme Finder** | Google-grounded search for government subsidies |
| 4 | 💰 **Sell Produce** | Lists harvest for sale directly from chat |
| 5 | 👥 **Find Buyers** | Queries marketplace for matching produce buyers |
| 6 | ☀️ **Weather Advisory** | Real-time Open-Meteo forecasts + farming advice |
| 7 | 📊 **Market Prices** | Live mandi rates from platform listings |
| 8 | 🧪 **Soil Analysis** | AI-powered soil health, pH, and nutrient assessment |
| 9 | 📈 **Yield & Revenue Forecast** | Predicted yield (min/expected/max) with revenue in ₹ |
| 10 | 📅 **Farming Calendar** | Week-by-week AI farming plan with growth phases |
| 11 | 🤝 **Price Negotiation** | Compares prices from DB + suggests optimal price |
| 12 | ✅ **Scheme Auto-Apply** | Document checklist + pre-filled application data |
| 13 | ⛈️ **Weather Calendar Alerts** | Micro-climate alerts with 5-day farming task planner |

---

## 🚀 Key Features

### 🗣️ Voice-First AI Assistant
- Speak naturally in **Hindi, Marathi, or English**
- Auto language detection — AI replies in your language
- Text-to-speech for hands-free field use
- Real-time tool call visualization (see what the AI is doing)

### 🧬 Crop Health Timeline (`/crop-health`)
- Visual disease progression tracking per crop
- Severity trend indicators (Improving / Worsening / Stable)
- Timeline with treatment history

### 📅 AI Farming Calendar (`/crop-calendar`)
- Enter crop + sowing date → full AI-generated calendar
- Growth phase progress bar with color-coded phases
- Week-by-week tasks by category (irrigation, fertilizer, pest control)
- Current week highlighted with upcoming critical alerts

### 📋 Smart Scheme Auto-Apply (`/scheme-apply`)
- Visual document checklist (✅ available / ⭕ missing)
- Pre-filled farmer info from profile
- Step-by-step application with online/offline badges
- Deadline warnings + nearest office suggestion
- Popular scheme shortcuts (PM-KISAN, PMFBY, KCC, etc.)

### 🗺️ Nearby Disease Alerts (Dashboard)
- Community-aggregated disease reports from all users
- Relevance scoring: same state + same crops = higher priority
- Tags: `📍 Your State` and `🌾 Your Crop`
- Network effect: more users → better alerts

### 🌦️ Micro-Climate Weather Alerts
- Real weather from Open-Meteo + Gemini AI analysis
- 5-day farming task planner (best activity + what to avoid)
- Irrigation advice (should irrigate? when next?)
- Crop-specific alerts (frost, heavy rain, heat stress, etc.)

### 🤖 Telegram Bot Gateway
- All AI tools accessible via Telegram — no app install needed
- `/start` and `/help` commands
- Hindi/English language detection
- Zero npm dependencies — uses raw Telegram Bot API

### 👨‍🌾 Personalized Experience
- Farmer onboarding with crop selection (12+ Indian crops)
- Dynamic dashboard with real marketplace data
- AI responses personalized using farmer profile (crops, land size, state)

### 🏪 Marketplace
- List and browse produce with prices
- Direct farmer-to-buyer connection
- Quality grades and location data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **AI Engine** | Vercel AI SDK + Google Gemini 2.5 Flash |
| **Database** | PostgreSQL + Prisma ORM |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Auth** | NextAuth.js (Phone/OTP) |
| **Weather** | Open-Meteo API (free, no key required) |
| **Voice** | Web Speech API (Recognition & Synthesis) |
| **Bot** | Telegram Bot API (raw fetch) |
| **Caching** | PostgreSQL-based with configurable TTL |

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google AI Studio API Key

### Installation

```bash
# 1. Clone
git clone https://github.com/your-username/farmer-helper.git
cd farmer-helper

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Fill in: DATABASE_URL, AUTH_SECRET, GOOGLE_GENERATIVE_AI_API_KEY

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Run development server
pnpm dev
```

### Telegram Bot Setup (Optional)
```bash
# 1. Create bot via @BotFather on Telegram
# 2. Add to .env:
TELEGRAM_BOT_TOKEN=your_bot_token

# 3. After deployment, register webhook:
# GET /api/telegram/setup?url=https://your-domain.com

# 4. Send /start to your bot on Telegram
```

---

## 📁 Project Structure

```
app/
├── api/
│   ├── chat/              # Main AI chat endpoint (13 tools)
│   ├── farming-calendar/  # AI farming calendar generation
│   ├── weather-alerts/    # Micro-climate weather alerts
│   ├── scheme-apply/      # Smart scheme application guide
│   ├── nearby-alerts/     # Community disease alerts
│   ├── telegram/          # Telegram bot (webhook + setup)
│   ├── dashboard-data/    # Dynamic farmer dashboard
│   ├── disease-history/   # Crop disease history
│   └── profile/           # Farmer profile management
├── (protected)/
│   ├── assistant/         # AI chat interface
│   ├── crop-health/       # Disease progression timeline
│   ├── crop-calendar/     # AI farming calendar
│   ├── scheme-apply/      # Scheme application page
│   ├── dashboard/         # Farmer & buyer dashboards
│   └── marketplace/       # Produce listings
lib/
├── farming-calendar.ts    # Calendar generation with Gemini
├── yield-forecast.ts      # Yield prediction with Gemini
├── weather-alerts.ts      # Weather + farming alerts
├── crop-disease.ts        # Disease analysis
├── soil-analysis.ts       # Soil health analysis
├── telegram-bot.ts        # Telegram bot handler
├── schemes.ts             # Scheme search with Google Search
├── cache.ts               # PostgreSQL caching
└── i18n.ts                # Multilingual translations (mr/hi/en)
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
