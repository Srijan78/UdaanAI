/**
 * tests/tts.test.js
 *
 * Integration tests for /api/tts route.
 * Mocks Google Cloud TTS to test route validation logic.
 */

'use strict';

const request = require('supertest');
const app = require('../index');

// Mock Google Cloud TTS
jest.mock('@google-cloud/text-to-speech', () => {
  return {
    TextToSpeechClient: jest.fn().mockImplementation(() => ({
      synthesizeSpeech: jest.fn().mockResolvedValue([
        { audioContent: Buffer.from('mock-audio-data').toString('base64') }
      ])
    }))
  };
});

describe('POST /api/tts', () => {

  test('should return 400 for empty text', async () => {
    const res = await request(app)
      .post('/api/tts')
      .send({
        text: '',
        language: 'en'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for text over 1000 characters', async () => {
    const longText = 'a'.repeat(1001);
    const res = await request(app)
      .post('/api/tts')
      .send({
        text: longText,
        language: 'en'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for unsupported language', async () => {
    const res = await request(app)
      .post('/api/tts')
      .send({
        text: 'Hello, how are you?',
        language: 'zz'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});
