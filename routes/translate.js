/**
 * routes/translate.js
 *
 * Handles POST /api/translate
 * Proxies Google Cloud Translation API v2.
 * Skips API call entirely when target language is English.
 *
 * Request:  { text, targetLanguage }
 * Response: { translatedText }
 *
 * Rate limit: 30 req/min per IP (middleware/rateLimit.js)
 * Auth required: No
 *
 * @module routes/translate
 */

'use strict';

const express = require('express');
const { Translate } = require('@google-cloud/translate').v2;

const { createRateLimiter }      = require('../middleware/rateLimit');
const { validateTranslateInput } = require('../middleware/validate');
const { RATE_LIMIT_TRANSLATE, HTTP_STATUS } = require('../constants');

const router    = express.Router();
const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });

router.use(createRateLimiter(RATE_LIMIT_TRANSLATE));

/**
 * Calls Google Cloud Translation API to translate text.
 *
 * @param {string} text           - Source text to translate
 * @param {string} targetLanguage - BCP-47 target language code
 * @returns {Promise<string>}     - Translated text string
 * @throws {Error}                - If the Translation API call fails
 */
async function translateText(text, targetLanguage) {
  const [translation] = await translate.translate(text, targetLanguage);
  return translation;
}

/**
 * POST /api/translate
 * Translates text to the target language.
 * Returns original text unchanged when targetLanguage is 'en'.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleTranslate(req, res) {
  try {
    const input = validateTranslateInput(req.body);

    // Skip API call for English — return text as-is to conserve quota
    if (input.targetLanguage === 'en') {
      return res.status(HTTP_STATUS.OK).json({ success: true, translatedText: input.text });
    }

    const translatedText = await translateText(input.text, input.targetLanguage);
    return res.status(HTTP_STATUS.OK).json({ success: true, translatedText });

  } catch (error) {
    // PRD §15.4: always log with console.error, never expose internals
    console.error('[translate] Error:', error.message);
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
      success: false,
      message: statusCode < 500 ? error.message : 'Translation failed. Please try again.',
    });
  }
}

router.post('/', handleTranslate);

module.exports = router;
