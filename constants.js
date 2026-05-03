/**
 * constants.js
 *
 * Application-wide constants for UdaanAI.
 * All magic numbers and string literals are defined here.
 * Import in routes and middleware — never hardcode inline.
 *
 * @module constants
 */

'use strict';

module.exports = {
  // ── Server ────────────────────────────────────────────────────────
  /** Default port if PORT env var is not set */
  DEFAULT_PORT: 8080,

  // ── Input Validation ──────────────────────────────────────────────
  /** Maximum characters allowed in a user question */
  MAX_QUESTION_LENGTH: 500,

  /** Maximum characters allowed in a TTS request */
  MAX_TTS_LENGTH: 1000,

  /** Maximum characters allowed in a translation request */
  MAX_TRANSLATE_LENGTH: 2000,

  // ── Caching ───────────────────────────────────────────────────────
  /** Gemini response cache TTL in seconds (5 minutes) */
  CACHE_TTL_SECONDS: 300,

  // ── Rate Limits (requests per minute per IP) ──────────────────────
  RATE_LIMIT_ASK: 10,
  RATE_LIMIT_TTS: 20,
  RATE_LIMIT_TRANSLATE: 30,
  RATE_LIMIT_BOOTH: 20,
  RATE_LIMIT_CALENDAR: 10,
  RATE_LIMIT_AUTH: 20,

  /** Window duration for rate limiting in milliseconds (1 minute) */
  RATE_LIMIT_WINDOW_MS: 60 * 1000,

  // ── Supported Languages ───────────────────────────────────────────
  /**
   * BCP-47 language codes supported by UdaanAI.
   * Maps to Google Cloud Translation / TTS language codes.
   */
  SUPPORTED_LANGUAGES: ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'en'],

  /**
   * Display names for supported languages shown in the UI.
   * Keys match SUPPORTED_LANGUAGES values.
   */
  LANGUAGE_DISPLAY_NAMES: {
    hi: 'हिन्दी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    bn: 'বাংলা',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    pa: 'ਪੰਜਾਬੀ',
    en: 'English',
  },

  // ── Gemini ────────────────────────────────────────────────────────
  /**
   * Gemini model identifier. The -preview suffix is required.
   * gemini-1.5-flash is discontinued. gemini-2.0-flash shuts down June 2026.
   */
  GEMINI_MODEL: 'gemini-3.1-flash-lite-preview',

  // ── Gemini Action Types ───────────────────────────────────────────
  /** Valid action strings returned by Gemini in structured response */
  GEMINI_ACTIONS: {
    SHOW_CHECKLIST: 'show_checklist',
    SHOW_BOOTH: 'show_booth',
    SHOW_CALENDAR: 'show_calendar',
    NONE: 'none',
  },

  // ── Journey Phases ────────────────────────────────────────────────
  /** Valid journey phase identifiers used across context and UI */
  JOURNEY_PHASES: {
    REGISTRATION: 'registration',
    ELECTION_DAY: 'election_day',
    AFTER_VOTING: 'after_voting',
  },

  // ── Input Validation Patterns ─────────────────────────────────────
  /** EPIC number format: 3 uppercase letters followed by 7 digits */
  EPIC_REGEX: /^[A-Z]{3}[0-9]{7}$/,

  /** Indian pincode: 6-digit number, first digit 1–9 */
  PINCODE_REGEX: /^[1-9][0-9]{5}$/,

  /** ISO 8601 date format for calendar events */
  ISO_DATE_REGEX: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,

  // ── Topic Guard ───────────────────────────────────────────────────
  /**
   * Keywords that indicate an election-related query.
   * Used in Layer 1 pre-check before calling Gemini.
   * Covers English, Hindi, Tamil keywords.
   */
  ELECTION_KEYWORDS: [
    // English
    'vote', 'voting', 'election', 'voter', 'booth', 'evm', 'vvpat',
    'register', 'registration', 'candidate', 'constituency', 'ballot',
    'polling', 'eci', 'nota', 'mp', 'mla', 'party', 'result', 'count',
    'electoral', 'roll', 'democracy', 'nomination', 'aadhaar', 'epic',
    'campaign', 'manifesto', 'returning officer', 'matdar',
    'id card', 'identity', 'eligible', 'eligibility', 'age', 'enroll',
    'ready', 'status', 'check', 'form', 'document', 'photo',
    // Hindi (Devanagari)
    'वोट', 'वोटर', 'चुनाव', 'मतदान', 'मतदाता', 'निर्वाचन', 'पंजीकरण',
    'प्रत्याशी', 'उम्मीदवार', 'बूथ', 'ईवीएम', 'नोटा', 'दल', 'पार्टी',
    'लोकसभा', 'विधानसभा', 'फॉर्म', 'आधार', 'पहचान', 'पत्र',
    'राजनीति', 'जनप्रतिनिधि', 'सांसद', 'विधायक', 'मतपत्र',
    'नामांकन', 'परिणाम', 'गिनती', 'लोकतंत्र', 'अधिकार',
    'पोलिंग', 'स्टेशन', 'कार्ड', 'सूची', 'नाम', 'जांच',
    'तारीख', 'रजिस्टर', 'रजिस्ट्रेशन', 'कैसे', 'बताओ', 'भरे',
    'कहाँ', 'कब', 'क्या', 'कौन', 'योग्य', 'उम्र', 'दस्तावेज़',
    // Hindi (transliterated)
    'chunav', 'matdan', 'matdata', 'rajniti', 'pratyashi', 'umeedwar',
    'panjikaran', 'booth', 'nirvachan', 'lok sabha', 'vidhan sabha',
    'sansad', 'vidhayak', 'form', 'pehchan', 'patra', 'adhikar',
    'voter id', 'naam', 'suchi', 'jaanch',
    // Tamil (native script)
    'வாக்கு', 'தேர்தல்', 'வாக்காளர்', 'பதிவு', 'வேட்பாளர்',
    'தொகுதி', 'மாவட்டம்', 'இ.வி.எம்', 'நோட்டா', 'கட்சி',
    'சட்டமன்றம்', 'நாடாளுமன்றம்', 'படிவம்', 'ஆதார்',
    'அடையாள', 'அட்டை', 'பட்டியல்',
    // Tamil (transliterated)
    'vakkali', 'therthal', 'vaakkalar', 'vetpallar',
    // Telugu (native script)
    'ఓటు', 'ఎన్నిక', 'ఓటరు', 'నమోదు', 'అభ్యర్థి', 'నియోజకవర్గం',
    'బూత్', 'ఇవిఎం', 'నోటా', 'పార్టీ', 'శాసనసభ', 'లోక్‌సభ',
    'ఫారం', 'ఆధార్', 'గుర్తింపు', 'కార్డు', 'జాబితా',
    // Kannada (native script)
    'ಮತ', 'ಚುನಾವಣೆ', 'ಮತದಾರ', 'ನೋಂದಣಿ', 'ಅಭ್ಯರ್ಥಿ',
    'ಕ್ಷೇತ್ರ', 'ಬೂತ್', 'ನೋಟಾ', 'ಪಕ್ಷ',
    // Greetings & conversational (let these pass to Gemini for a friendly response)
    'hi', 'hello', 'namaste', 'namaskar', 'help', 'guide',
    'नमस्ते', 'नमस्कार', 'मदद', 'सहायता', 'शुरू',
  ],

  // ── Security ──────────────────────────────────────────────────────
  /** Maximum length for any string input to prevent DoS */
  MAX_GENERIC_INPUT_LENGTH: 5000,

  // ── HTTP Status Codes ─────────────────────────────────────────────
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },
};
