# UdaanAI — Know your vote. Rise together.

UdaanAI is a smart, voice-first, multilingual AI assistant designed to make the Indian voting process accessible, personalized, and simple. It guides citizens through their specific election journey (Registration → Election Day → After Voting) in their native language.

---

## 1. Chosen Vertical: Civic Tech / GovTech
Millions of eligible Indians fail to vote simply because the electoral process feels overly complex, bureaucratic, or is not explained in a language they are comfortable with. UdaanAI addresses this civic challenge by providing a proactive decision-making engine that acts as a personalized election guide. 

---

## 2. Approach and Logic
We made several deliberate architectural and product decisions to ensure the application is reliable, secure, and zero-cost:

*   **Decision Engine, Not a Chatbot**: Rather than just answering questions, UdaanAI actively drives the UI. Every Gemini API call receives the user's full state (age, location, phase) and returns a structured JSON payload that tells the frontend whether to show a checklist, render the Booth Finder, or offer a Google Calendar reminder.
*   **Static Data Layer over Scraping**: The Election Commission of India (ECI) does not provide a public API. Instead of building fragile web scrapers that might break during deployment, we hardcoded the official 2024 General Election schedule into static JSON files (`data/`). This guarantees 100% uptime, instant responses, and zero API costs.
*   **Two-Layer Topic Guard**: To protect our API quota and enforce responsible AI, we implemented a strict scope restriction:
    *   *Layer 1 (Backend)*: A zero-cost keyword pre-check. If a user asks about sports or movies, the backend instantly intercepts the request and returns a polite refusal without ever calling the LLM.
    *   *Layer 2 (LLM)*: A rigid system prompt injected into Gemini that instructs it to stay in character and resist prompt injection ("ignore all previous instructions").
*   **Single Container Deployment**: To simplify hosting, the Express backend serves the static HTML/CSS/JS frontend files while simultaneously handling `/api/*` routes. This avoids complex CORS issues and allows the entire app to be deployed as a single Google Cloud Run container.

---

## 3. How the Solution Works

### Architecture & Data Flow
1.  **User Input**: The user speaks (via Web Speech API) or types a question. The frontend sends this, along with the user's language, state, and conversation history, to `/api/ask`.
2.  **Middleware Defense**: The request passes through `validate.js` (stripping XSS/SQL injection) and `rateLimit.js` (preventing spam).
3.  **LLM Processing**: The backend checks the `node-cache`. If there's a cache miss, it securely calls **Gemini 3.1 Flash Lite Preview** using the API key stored in `.env`.
4.  **Actionable Response**: Gemini returns a JSON object. The backend caches the result and sends it back to the frontend.
5.  **UI Update & Voice**: The frontend renders the response, updates the Journey Tracker if the phase changed, and plays the audio via **Google Cloud TTS**.

### Google Services Utilized & Why
*   **Gemini API (`gemini-3.1-flash-lite-preview`)**: Chosen for its high speed, low cost (free tier), and excellent ability to adhere to strict JSON schema outputs, which is vital for driving our UI state.
*   **Google Cloud Text-to-Speech (WaveNet)**: Provides natural-sounding, high-quality voice playback in regional languages, making the app accessible to illiterate or visually impaired users.
*   **Google Calendar Integrations**: Dynamically generates intelligent Google Calendar links to let users add one-click polling day reminders directly to their personal calendars without complex OAuth flows.
*   **Google Maps JS SDK**: Lazy-loaded to provide visual navigation once a user successfully finds their polling booth address.
*   **Google OAuth & Firestore**: Implemented in the codebase (`middleware/authGuard.js`) but disabled in the demo deployment for a frictionless guest experience. The complete implementation supporting user persistence and cross-device progress syncing is available in the repository.

---

## 4. Assumptions Made
1.  Election data is based on the 2024 Indian General Election schedule. The architecture is built to easily swap to a live ECI API if one is ever released.
2.  Google Maps Places API does not have authoritative Indian polling booth data (verified April 2026). Therefore, the authoritative ECI portal (`electoralsearch.eci.gov.in`) is used for the booth deep-link.
3.  The Web Speech API for voice input works reliably on Chrome and Chromium-based browsers only. The microphone button degrades gracefully (hides) on unsupported browsers.
4.  The Google Cloud Run always-free tier applies to specific regions (e.g., `us-central1`). Deploying to the Mumbai region would consume GCP credits.
5.  The exact Gemini model string is `gemini-3.1-flash-lite-preview` — the `-preview` suffix is required in all API calls.
6.  Gemini 1.5 Flash is discontinued, and 2.0 Flash shuts down June 2026, so neither is used.
7.  The free tier limits (1000 RPD for Gemini, 1M chars for TTS) are sufficient for demonstration purposes.
8.  Users on mobile devices are assumed to grant microphone permissions. The app handles denial gracefully by falling back to text input.