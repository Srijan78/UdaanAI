/**
 * tests/translate.test.js
 *
 * Integration tests for POST /api/translate.
 * Covers: all 9 supported languages, English skip optimisation,
 * unsupported language rejection, empty text rejection.
 *
 * PRD §10 test requirements.
 *
 * @module tests/translate.test
 */

'use strict';

const request = require('supertest');
const app     = require('../index');

// Mock Google Cloud Translate — avoids live API calls in tests
jest.mock('@google-cloud/translate', () => ({
  v2: {
    Translate: jest.fn().mockImplementation(() => ({
      translate: jest.fn().mockResolvedValue(['अनुवादित पाठ', {}]),
    })),
  },
}));

describe('POST /api/translate', () => {

  // ── Happy Paths ──────────────────────────────────────────────────────

  test('should return 200 for Hindi (hi)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'How do I vote?', targetLanguage: 'hi' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.translatedText).toBeDefined();
  });

  test('should return 200 for Tamil (ta)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Voting process', targetLanguage: 'ta' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should return 200 for Telugu (te)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Polling booth', targetLanguage: 'te' });

    expect(res.statusCode).toBe(200);
  });

  test('should return 200 for Kannada (kn)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Voter ID', targetLanguage: 'kn' });

    expect(res.statusCode).toBe(200);
  });

  test('should return 200 for Malayalam (ml)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Election', targetLanguage: 'ml' });

    expect(res.statusCode).toBe(200);
  });

  test('should return 200 for Bengali (bn)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Registration', targetLanguage: 'bn' });

    expect(res.statusCode).toBe(200);
  });

  test('should return 200 for Marathi (mr)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Candidate', targetLanguage: 'mr' });

    expect(res.statusCode).toBe(200);
  });

  test('should return 200 for Gujarati (gu)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'EVM', targetLanguage: 'gu' });

    expect(res.statusCode).toBe(200);
  });

  test('should return 200 for Punjabi (pa)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'NOTA', targetLanguage: 'pa' });

    expect(res.statusCode).toBe(200);
  });

  // ── English Skip Optimisation (PRD §7 translate route) ───────────────

  test('should skip API call and return original text for English (en)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'How do I vote?', targetLanguage: 'en' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // Must return the exact original text — no API call was made
    expect(res.body.translatedText).toBe('How do I vote?');
  });

  // ── Failure Paths ────────────────────────────────────────────────────

  test('should return 400 for unsupported language code', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Vote', targetLanguage: 'fr' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for missing text', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ targetLanguage: 'hi' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for empty text', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: '', targetLanguage: 'hi' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for missing targetLanguage', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ text: 'Vote' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});
