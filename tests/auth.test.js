'use strict';

const request = require('supertest');
const express = require('express');

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  const mockVerifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
    _mockVerifyIdToken: mockVerifyIdToken,
  };
});

const { _mockVerifyIdToken } = require('google-auth-library');

const authRouter = require('../routes/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/verify', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when credential is missing', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/verify').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing credential');
  });

  it('returns user data on valid token', async () => {
    _mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        name: 'Srijan',
        email: 'srijan@example.com',
        picture: 'https://example.com/photo.jpg',
      }),
    });

    const app = createApp();
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ credential: 'valid-token-123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Srijan');
    expect(res.body.user.email).toBe('srijan@example.com');
  });

  it('returns 401 on invalid token', async () => {
    _mockVerifyIdToken.mockRejectedValue(new Error('Token invalid'));

    const app = createApp();
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ credential: 'bad-token' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
