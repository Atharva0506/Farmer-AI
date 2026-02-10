# 🌾 KrushiAI (Working Name)

> An AI-powered, voice-first agriculture assistant & marketplace built for Indian farmers.

KrushiAI is not a traditional dashboard-heavy app.  
It is an **AI-first farming companion** that helps farmers **talk, click a photo, and earn more** — with minimal reading or typing.

---

## 🧠 Core Philosophy

### Farmers talk. Apps should listen.
Most Indian farmers are:
- Semi-literate or illiterate
- Comfortable with voice, not text
- Using low-end Android phones
- Distrustful of complex apps

So KrushiAI is built with:
- **Voice-first interaction**
- **Minimal text**
- **Large icons**
- **Local languages**
- **Trust-driven UX**

---

## 🎯 What Problem Are We Solving?

### 1. Crop & Disease Confusion
Farmers:
- Can’t identify diseases early
- Get conflicting advice
- Lose yield & money

### 2. Market Access
Farmers:
- Depend on middlemen
- Don’t know real demand or prices
- Sell below market value

### 3. Information Overload
Government & private schemes exist, but:
- Eligibility is unclear
- Forms are complex
- Language is a barrier

---

## 🚀 MVP Scope (Current Focus)

We are **NOT building everything at once**.

### ✅ MVP User Journey

Onboarding
↓
AI Chat (Voice + Image)
↓
Marketplace (Buyers ↔ Farmers)



This MVP validates:
- Trust in AI
- Voice usability
- Image-based crop help
- Willingness to sell/buy via app

---

## 🧩 Features (MVP)

### 1️⃣ Onboarding
- Language selection (Marathi / Hindi / English)
- Voice instructions
- Microphone & camera permissions
- No forced login

---

### 2️⃣ AI Assistant (Core Feature)

**Primary Interface**
- WhatsApp-style chat UI
- Large floating microphone button
- Voice waveform animation
- Image upload (crop photo)

**Capabilities**
- Farmer speaks → AI understands intent
- Farmer uploads crop image → AI gives guidance
- AI responds in:
  - Text (minimal)
  - Voice (important)
  - Visual cards (actions)

**Examples**
- “माझ्या पिकावर डाग आलेत”
- “This leaf is turning yellow”
- Upload photo of crop disease

---

### 3️⃣ Marketplace (Hybrid Access)

#### Without Login
- Browse crops for sale
- Browse buyer requirements
- View approximate location & price

#### With Login
- Post crop listings
- Post buyer requirements
- Contact via call/chat
- Build trust score over time

**Why hybrid?**
- Zero friction discovery
- Authentication only when money/contact is involved

---

## 🗣️ Languages & Localization

### Supported
- Marathi (default)
- Hindi
- English

### Important Note
Language switching is **not just translation**:
- Crop names change
- Terminology changes
- Scheme names change
- Tone changes

AI responses must adapt culturally.

---

## 🎙️ Voice-First UX Rules

Every major screen must have:
- 🎤 Voice input button
- 🔊 Speak / read aloud button
- Minimal text
- Large touch targets

Text is secondary.  
Voice is primary.

---

## 🧱 Tech Stack (Frontend)

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- Mobile-first responsive design
- Dark / Light mode
- Accessibility-focused

---

## 📱 Responsive Design Rules

### Mobile (Primary)
- Bottom navigation
- Floating mic button
- Single-column layout

### Tablet
- Card grids
- Context panels

### Desktop
- Sidebar navigation
- Dashboard layout (for buyers/admins)

---

## 🧩 Key UI Components

- `FloatingMicButton`
- `VoiceWaveform`
- `AIChatBubble`
- `ImageUploadCard`
- `CropAdviceCard`
- `MarketplaceListingCard`
- `LanguageSwitcher`
- `BottomNav`
- `SidebarNav`

---

## 🤖 AI Interaction Model (Important)

### ❌ What we do NOT do
- No raw prompt writing by farmers
- No exposing AI internals

### ✅ What we do
- Voice / text → intent detection
- Intent → UI actions
- AI guides user step-by-step

**Example**
User says:
> “I want to sell wheat”

Internally becomes:
```json
{
  "intent": "sell_crop",
  "crop": "wheat"
}
