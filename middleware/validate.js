/**
 * middleware/validate.js
 *
 * Input validation and sanitisation middleware for all API routes.
 * Runs before every route handler. Rejects malformed input with 400.
 * Strips XSS payloads via sanitize-html. Rejects SQL injection patterns.
 *
 * Exported validators (one per route):
 *   validateAskInput(body)       → parsed + validated ask fields
 *   validateTranslateInput(body) → parsed translate fields
 *   validateTtsInput(body)       → parsed TTS fields
 *   validateBoothInput(query)    → parsed booth query fields
 *   validateCalendarInput(body)  → parsed calendar fields
 *
 * @module middleware/validate
 */

'use strict';

const sanitizeHtml = require('sanitize-html');
const {
  MAX_QUESTION_LENGTH,
  MAX_TTS_LENGTH,
  MAX_TRANSLATE_LENGTH,
  SUPPORTED_LANGUAGES,
  EPIC_REGEX,
  ISO_DATE_REGEX,
  HTTP_STATUS,
} = require('../constants');

// ── SQL Injection Pattern ─────────────────────────────────────────────
// Detects common SQL injection attack strings
const SQL_INJECTION_REGEX = /(\bSELECT\b|\bINSERT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|\bUNION\b|--|;--|\/\*)/i;

/**
 * Creates a validation error with a 400 status code attached.
 *
 * @param {string} message - Human-readable error message
 * @returns {Error}        - Error with statusCode: 400
 */
function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = HTTP_STATUS.BAD_REQUEST;
  return error;
}

/**
 * Strips HTML/XSS payloads from a string using sanitize-html.
 * All tags and attributes are stripped — plain text only.
 *
 * @param {string} input - Raw string input from user
 * @returns {string}     - Sanitised plain text string
 */
function sanitiseString(input) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
}

/**
 * Checks whether a string contains SQL injection patterns.
 *
 * @param {string} input - String to check
 * @returns {boolean}    - true if SQL injection detected
 */
function hasSqlInjection(input) {
  return SQL_INJECTION_REGEX.test(input);
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param {*}      value     - Value to check
 * @param {string} fieldName - Field name for error messages
 * @throws {Error} - If value is missing or not a string
 */
function requireString(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw createValidationError(`${fieldName} is required.`);
  }
  if (typeof value !== 'string') {
    throw createValidationError(`${fieldName} must be a string.`);
  }
}

/**
 * Validates language code is in the supported allowlist.
 *
 * @param {string} language - Language code to validate
 * @throws {Error} - If language is not supported
 */
function requireSupportedLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw createValidationError(
      `Unsupported language '${language}'. Supported: ${SUPPORTED_LANGUAGES.join(', ')}.`
    );
  }
}

/**
 * Validates and sanitises the request body for POST /api/ask.
 *
 * @param {Object} body                - Raw request body
 * @param {string} body.question       - User question (required, max 500 chars)
 * @param {Array}  [body.history]      - Conversation history (optional)
 * @param {string} [body.language]     - BCP-47 language code (default: 'en')
 * @param {string} [body.state]        - Indian state name (default: 'India')
 * @param {string} [body.phase]        - Journey phase (default: 'registration')
 * @param {boolean}[body.isFirstTime]  - First-time voter flag (default: false)
 * @returns {{ question, history, language, state, phase, isFirstTime }}
 * @throws {Error} - If validation fails
 */
function validateAskInput(body) {
  const { question, history, language, state, phase, isFirstTime } = body || {};

  requireString(question, 'question');

  const sanitisedQuestion = sanitiseString(question);

  if (!sanitisedQuestion) {
    throw createValidationError('question cannot be empty after sanitisation.');
  }
  if (sanitisedQuestion.length > MAX_QUESTION_LENGTH) {
    throw createValidationError(
      `question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters.`
    );
  }
  if (hasSqlInjection(sanitisedQuestion)) {
    throw createValidationError('question contains invalid characters.');
  }

  const resolvedLanguage = language || 'en';
  requireSupportedLanguage(resolvedLanguage);

  return {
    question:    sanitisedQuestion,
    history:     Array.isArray(history) ? history : [],
    language:    resolvedLanguage,
    state:       sanitiseString(state || 'India'),
    phase:       sanitiseString(phase || 'registration'),
    isFirstTime: Boolean(isFirstTime),
  };
}

/**
 * Validates and sanitises the request body for POST /api/translate.
 *
 * @param {Object} body                - Raw request body
 * @param {string} body.text           - Text to translate (required)
 * @param {string} body.targetLanguage - BCP-47 target language code (required)
 * @returns {{ text, targetLanguage }}
 * @throws {Error} - If validation fails
 */
function validateTranslateInput(body) {
  const { text, targetLanguage } = body || {};

  requireString(text, 'text');
  requireString(targetLanguage, 'targetLanguage');

  const sanitisedText = sanitiseString(text);

  if (!sanitisedText) {
    throw createValidationError('text cannot be empty after sanitisation.');
  }
  if (sanitisedText.length > MAX_TRANSLATE_LENGTH) {
    throw createValidationError(
      `text exceeds maximum length of ${MAX_TRANSLATE_LENGTH} characters.`
    );
  }

  requireSupportedLanguage(targetLanguage);

  return { text: sanitisedText, targetLanguage };
}

/**
 * Validates and sanitises the request body for POST /api/tts.
 *
 * @param {Object} body          - Raw request body
 * @param {string} body.text     - Text to synthesise (required, max 1000 chars)
 * @param {string} body.language - BCP-47 language code (required)
 * @returns {{ text, language }}
 * @throws {Error} - If validation fails
 */
function validateTtsInput(body) {
  const { text, language } = body || {};

  requireString(text, 'text');
  requireString(language, 'language');

  const sanitisedText = sanitiseString(text);

  if (!sanitisedText) {
    throw createValidationError('text cannot be empty after sanitisation.');
  }
  if (sanitisedText.length > MAX_TTS_LENGTH) {
    throw createValidationError(
      `text exceeds maximum length of ${MAX_TTS_LENGTH} characters.`
    );
  }

  requireSupportedLanguage(language);

  return { text: sanitisedText, language };
}

/**
 * Validates query parameters for GET /api/booth.
 * Accepts either epicNumber OR name + dob + state.
 *
 * @param {Object} query              - Raw URL query params
 * @param {string} [query.epicNumber] - EPIC voter ID (format: ABC1234567)
 * @param {string} [query.name]       - Voter full name
 * @param {string} [query.dob]        - Date of birth (YYYY-MM-DD)
 * @param {string} [query.state]      - Indian state name
 * @returns {{ epicNumber?, name?, dob?, state? }}
 * @throws {Error} - If neither mode's params are present or EPIC format is wrong
 */
function validateBoothInput(query) {
  const { epicNumber, name, dob, state } = query || {};

  if (epicNumber) {
    if (!EPIC_REGEX.test(epicNumber)) {
      throw createValidationError(
        'epicNumber must be 3 uppercase letters followed by 7 digits (e.g. ABC1234567).'
      );
    }
    return { epicNumber };
  }

  if (name && dob && state) {
    if (!ISO_DATE_REGEX.test(dob)) {
      throw createValidationError('dob must be in YYYY-MM-DD format.');
    }
    return {
      name:  sanitiseString(name),
      dob:   dob.slice(0, 10),
      state: sanitiseString(state),
    };
  }

  throw createValidationError(
    'Provide epicNumber OR all of: name, dob, state.'
  );
}

/**
 * Validates and sanitises the request body for POST /api/calendar.
 *
 * @param {Object} body             - Raw request body
 * @param {string} body.title       - Event title (required)
 * @param {string} body.date        - ISO 8601 date string (required)
 * @param {string} body.description - Event description (required)
 * @returns {{ title, date, description }}
 * @throws {Error} - If validation fails
 */
function validateCalendarInput(body) {
  const { title, date, description } = body || {};

  requireString(title, 'title');
  requireString(date, 'date');
  requireString(description, 'description');

  if (!ISO_DATE_REGEX.test(date)) {
    throw createValidationError('date must be a valid ISO 8601 date string.');
  }

  return {
    title:       sanitiseString(title),
    date,
    description: sanitiseString(description),
  };
}

module.exports = {
  validateAskInput,
  validateTranslateInput,
  validateTtsInput,
  validateBoothInput,
  validateCalendarInput,
};
