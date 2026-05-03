/**
 * routes/tts.js
 *
 * Handles POST /api/tts
 * Proxies Google Cloud Text-to-Speech API using WaveNet voices.
 * Returns base64-encoded audio the browser plays directly — no file writes.
 *
 * Request:  { text, language }
 * Response: { audioBase64 }
 *
 * Rate limit: 20 req/min per IP (middleware/rateLimit.js)
 * Auth required: No
 *
 * @module routes/tts
 */

'use strict';

const express      = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');

const { createRateLimiter } = require('../middleware/rateLimit');
const { validateTtsInput }  = require('../middleware/validate');
const { RATE_LIMIT_TTS, HTTP_STATUS } = require('../constants');

const router    = express.Router();
const ttsClient = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_TTS_API_KEY,
});

router.use(createRateLimiter(RATE_LIMIT_TTS));

/**
 * Maps a BCP-47 language code to a Google Cloud TTS WaveNet voice name.
 * WaveNet voices provide the most natural-sounding Indian language audio.
 *
 * @param {string} languageCode - BCP-47 code (e.g. 'hi', 'ta')
 * @returns {{ languageCode: string, name: string }} - TTS voice config object
 */
function resolveVoiceConfig(languageCode) {
  const voiceMap = {
    hi: { languageCode: 'hi-IN',  name: 'hi-IN-Wavenet-D'  },
    ta: { languageCode: 'ta-IN',  name: 'ta-IN-Wavenet-D'  },
    te: { languageCode: 'te-IN',  name: 'te-IN-Wavenet-D'  },
    kn: { languageCode: 'kn-IN',  name: 'kn-IN-Wavenet-D'  },
    ml: { languageCode: 'ml-IN',  name: 'ml-IN-Wavenet-D'  },
    bn: { languageCode: 'bn-IN',  name: 'bn-IN-Wavenet-D'  },
    mr: { languageCode: 'mr-IN',  name: 'mr-IN-Wavenet-C'  },
    gu: { languageCode: 'gu-IN',  name: 'gu-IN-Wavenet-D'  },
    pa: { languageCode: 'pa-IN',  name: 'pa-IN-Wavenet-D'  },
    en: { languageCode: 'en-IN',  name: 'en-IN-Wavenet-D'  },
  };
  return voiceMap[languageCode] || voiceMap.en;
}

/**
 * Calls Google Cloud TTS API and returns base64-encoded MP3 audio.
 *
 * @param {string} text         - Text to synthesise
 * @param {string} languageCode - BCP-47 language code
 * @returns {Promise<string>}   - Base64-encoded MP3 audio string
 * @throws {Error}              - If TTS API call fails
 */
async function synthesiseSpeech(text, languageCode) {
  const voice = resolveVoiceConfig(languageCode);

  const [response] = await ttsClient.synthesizeSpeech({
    input:       { text },
    voice:       { languageCode: voice.languageCode, name: voice.name },
    audioConfig: { audioEncoding: 'MP3' },
  });

  return response.audioContent.toString('base64');
}

/**
 * POST /api/tts
 * Converts text to speech and returns base64 audio for browser playback.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleTts(req, res) {
  try {
    const input      = validateTtsInput(req.body);
    const audioBase64 = await synthesiseSpeech(input.text, input.language);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      audioBase64,
    });

  } catch (error) {
    // PRD §15.4: always log with console.error, never expose internals
    console.error('[tts] Error:', error.message);
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
      success: false,
      message: statusCode < 500 ? error.message : 'Text-to-speech failed. Please try again.',
    });
  }
}

router.post('/', handleTts);

module.exports = router;
