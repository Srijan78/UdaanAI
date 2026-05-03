/**
 * translate.js
 * 
 * Interacts with Google Cloud Translation API.
 * Dynamically translates UI text elements based on user language preferences.
 * 
 * @module routes/translate
 */

'use strict';

const express = require('express');
const { Translate } = require('@google-cloud/translate').v2;
const { HTTP_STATUS } = require('../constants');

const router = express.Router();
const translate = new Translate({ key: process.env.GOOGLE_TTS_API_KEY }); 

router.post('/', async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Invalid input' });
    }

    if (targetLanguage === 'en') {
      return res.status(HTTP_STATUS.OK).json({ success: true, translations: texts });
    }

    // Call Google Cloud Translation API
    const [translations] = await translate.translate(texts, targetLanguage);
    
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      translations: Array.isArray(translations) ? translations : [translations],
    });
  } catch (error) {
    console.error('[translate] Error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Translation failed' });
  }
});

module.exports = router;
