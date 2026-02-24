# KrishiMitra (Farmer Helper) - Conversational AI Assistant

KrishiMitra is an advanced, voice-first AI assistant designed to empower Indian farmers with real-time agricultural intelligence. Built with **Next.js 16**, **AI SDK**, and **Google Gemini 2.5 Flash**, it offers a seamless multimodal experience (Voice + Text + Image) to solve day-to-day farming challenges.

![KrishiMitra AI](https://placehold.co/1200x600?text=KrishiMitra+AI+Dashboard)

## Ì∫Ä Key Features

### ÌæôÔ∏è Conversational Voice AI
- **Voice-First Interface**: Speak naturally in **Hindi, Marathi, or English**.
- **Auto-Language Detection**: The AI replies in your spoken language.
- **Hands-Free Mode**: Perfect for use in the field.
- **Interactive**: Listens, thinks, and speaks back with farming advice.

### Ì∑† Intelligent Tools (Auto-Detected Intents)
The AI automatically understands your intent and calls the right tool:

1.  **Ìºø Crop Assistance**: Guidance on planting, fertilizers, and pest management.
2.  **Ì¥ç Disease Detection**: 
    - Upload photos of affected crops.
    - AI analyzes symptoms and suggests chemical/organic remedies.
3.  **Ì≥ã Scheme Finder**: Finds government subsidies (PM-KISAN, etc.) matching your profile.
4.  **Ì≤∞ Sell Produce**: 
    - List your harvest for sale directly from the chat.
    - Connects with local buyers.
5.  **‚õÖ Weather Advisory**: Real-time forecasts + farming activity recommendations (e.g., "Is it safe to spray today?").
6.  **Ì≥ä Market Prices**: Live mandi rates (APMC) for your crops.
7.  **Ì∑™ Soil Analysis**: Upload soil reports or describe soil conditions for fertilizer advice.
8.  **Ì¥ù Find Buyers**: Locate active buyers for your specific crop.

### Ì≥± User Experience
- **Floating Chat Widget**: Accessible anywhere in the app.
- **Offline Support**: PWA capabilities (coming soon).
- **Localized UI**: All buttons and text available in regional languages.

## Ìª†Ô∏è Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **AI Engine**: [Vercel AI SDK](https://sdk.vercel.ai/docs) + Google Gemini 2.5 Flash
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: NextAuth.js (Phone/OTP)
- **Maps**: OpenStreetMap / Google Maps (optional)
- **Voice**: Web Speech API (Speech Recognition & Synthesis)

## ‚ö° Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google AI Studio API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/farmer-helper.git
    cd farmer-helper
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    
    Required variables:
    - `DATABASE_URL`: Your Postgres connection string.
    - `AUTH_SECRET`: Generate with `openssl rand -base64 32`.
    - `GOOGLE_GENERATIVE_AI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/).

4.  **Initialize Database:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

6.  **Open in Browser:**
    Visit `http://localhost:3000`.

## Ì¥ù Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Ì≥Ñ License

This project is licensed under the MIT License.
