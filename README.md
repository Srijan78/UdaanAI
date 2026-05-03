# UdaanAI — Know your vote. Rise together.

UdaanAI is a smart, voice-first, multilingual AI assistant designed to make the Indian voting process accessible, personalized, and simple. It guides citizens through their specific election journey (Registration → Election Day → After Voting) in their native language.

---

## 1. Chosen Vertical: Civic Tech / GovTech
Millions of eligible Indians fail to vote simply because the electoral process feels overly complex, bureaucratic, or is not explained in a language they are comfortable with. UdaanAI addresses this civic challenge by providing a proactive decision-making engine that acts as a personalized election guide. 

---

## 2. Approach and Logic
We made several deliberate architectural and product decisions to ensure the application is reliable, secure, and user-centric:

*   **Decision Engine, Not a Chatbot**: Rather than just answering questions, UdaanAI actively drives the UI. Every Gemini API call receives the user's full state (age, location, phase) and returns a structured JSON payload that tells the frontend whether to show a checklist, render the Booth Finder, or offer a Google Calendar reminder.
*   **Static Data Layer over Scraping**: The Election Commission of India (ECI) does not provide a public API. Instead of building fragile web scrapers that might break during deployment, we hardcoded the official 2024 General Election schedule into static JSON files (`data/`). This guarantees 100% uptime, instant responses, and zero API costs.
*   **Two-Layer Topic Guard**: To protect our API quota and enforce responsible AI, we implemented a strict scope restriction:
    *   *Layer 1 (Backend)*: A zero-cost keyword pre-check. If a user asks about sports or movies, the backend instantly intercepts the request and returns a polite refusal without ever calling the LLM.
    *   *Layer 2 (LLM)*: A rigid system prompt injected into Gemini that instructs it to stay in character and resist prompt injection ("ignore all previous instructions").
*   **Single Container Deployment**: To simplify hosting, the Express backend serves the static HTML/CSS/JS frontend files while simultaneously handling `/api/*` routes. This avoids complex CORS issues and allows the entire app to be deployed as a single Google Cloud Run container.

---

## 3. How the Solution Works

### Architecture & Data Flow
1.  **User Authentication**: Users can sign in via **Google Identity Services**. The frontend receives a JWT, which is verified on the backend (`/api/auth/verify`) to establish a secure user session.
2.  **Dynamic Translation**: When a user selects a language, the frontend calls the **Google Cloud Translation API** (`/api/translate`) to dynamically localize the entire DOM.
3.  **User Input**: The user speaks (via Web Speech API) or types a question. The frontend sends this to `/api/ask`.
4.  **Middleware Defense**: The request passes through `validate.js` (stripping XSS/SQL injection) and `rateLimit.js` (preventing spam).
5.  **LLM Processing**: The backend calls **Gemini 3.1 Flash Lite Preview**.
6.  **Actionable Response**: Gemini returns a JSON object. The frontend renders the response and plays audio via **Google Cloud TTS**.
7.  **Calendar Integration**: If the user wants a reminder, the app uses **Google OAuth2** to get an access token and calls the **Google Calendar API** (`/api/calendar/add`) to insert a real event into the user's calendar.

### Google Services Utilized & Why
*   **Gemini API (`gemini-3.1-flash-lite-preview`)**: Powers the core "Decision Engine." It parses complex civic queries and returns structured JSON that drives our UI states (checklists, phases, and navigation).
*   **Google Cloud Text-to-Speech (WaveNet)**: Provides natural-sounding, high-quality voice synthesis in 10+ regional languages. This ensures the app is accessible to users with low literacy or visual impairments.
*   **Google Cloud Translation API**: Enables true multilingual support. Unlike static mapping, this API dynamically translates the entire application UI (buttons, headings, descriptions) into the user's chosen regional language in real-time.
*   **Google Identity Services (Sign-In)**: Provides a secure, one-tap login experience. We use this to verify user identity and retrieve profile information (name, picture) for a personalized dashboard.
*   **Google Calendar API**: Beyond simple links, we've integrated the full API. Once authenticated, the app programmatically inserts election reminders directly into the user's personal Google Calendar with precise dates based on their voting phase.

---

## 4. Assumptions Made
1.  Election data is based on the 2024 Indian General Election schedule. The architecture is built to easily swap to a live ECI API if one is ever released.
2.  Google Maps Places API does not have authoritative Indian polling booth data (verified April 2026). Therefore, the authoritative ECI portal (`electoralsearch.eci.gov.in`) is used for the booth deep-link.
3.  The Web Speech API for voice input works reliably on Chrome and Chromium-based browsers only. 
4.  The Google Cloud Run always-free tier applies to specific regions (e.g., `us-central1`).
5.  The exact Gemini model string is `gemini-3.1-flash-lite-preview` — the `-preview` suffix is required in all API calls.
6.  Gemini 1.5 Flash is discontinued, and 2.0 Flash shuts down June 2026, so neither is used.
7.  Users on mobile devices are assumed to grant microphone permissions. The app handles denial gracefully by falling back to text input.