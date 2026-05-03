'use strict';

const request = require('supertest');
const express = require('express');

// Mock @google-cloud/translate
jest.mock('@google-cloud/translate', () => ({
  v2: {
    Translate: jest.fn().mockImplementation(() => ({
      translate: jest.fn().mockResolvedValue([['नमस्ते', 'मतदान']]),
    })),
  },
}));

const translateRouter = require('../routes/translate');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/translate', translateRouter);
  return app;
}

describe('POST /api/translate', () => {
  it('returns 400 when texts is missing', async () => {
    const app = createApp();
    const res = await request(app).post('/api/translate').send({ targetLanguage: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when targetLanguage is missing', async () => {
    const app = createApp();
    const res = await request(app).post('/api/translate').send({ texts: ['Hello'] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns original texts for English target', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: ['Hello', 'Vote'], targetLanguage: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.translations).toEqual(['Hello', 'Vote']);
  });

  it('translates texts to target language', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: ['Hello', 'Vote'], targetLanguage: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.translations).toHaveLength(2);
  });
});
