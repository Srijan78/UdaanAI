/**
 * tests/auth.test.js
 *
 * Integration tests for POST /api/auth/verify.
 * Covers: valid token returns user + progress, expired token 401,
 * malformed token 401, missing token 400.
 *
 * Firebase Admin is fully mocked — no live credentials required.
 * PRD §10 test requirements.
 *
 * @module tests/auth.test
 */

'use strict';

const request = require('supertest');

// ── Mock firebase-admin before app loads ─────────────────────────────────
// This prevents lazy init from trying to contact Firebase with no credentials
jest.mock('firebase-admin', () => {
  const mockFieldValue = { serverTimestamp: jest.fn().mockReturnValue('SERVER_TIMESTAMP') };
  const mockFirestore  = jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get:  jest.fn().mockResolvedValue({ exists: false }),
        set:  jest.fn().mockResolvedValue(undefined),
      }),
    }),
  });
  mockFirestore.FieldValue = mockFieldValue;

  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn().mockReturnValue({}),
    },
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockImplementation((token) => {
        if (token === 'valid-token') {
          return Promise.resolve({ uid: 'user123', email: 'test@example.com', name: 'Test User' });
        }
        if (token === 'expired-token') {
          const error = new Error('Token has expired');
          error.code  = 'auth/id-token-expired';
          return Promise.reject(error);
        }
        const error = new Error('Invalid token');
        error.code  = 'auth/invalid-id-token';
        return Promise.reject(error);
      }),
    }),
    firestore: mockFirestore,
  };
});

const app = require('../index');

describe('POST /api/auth/verify', () => {

  // ── Happy Path ───────────────────────────────────────────────────────

  test('should return 200 with user + progress for valid token', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ idToken: 'valid-token' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.uid).toBe('user123');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.progress).toBeDefined();
  });

  // ── Failure Paths ────────────────────────────────────────────────────

  test('should return 401 for expired token', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ idToken: 'expired-token' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired token');
  });

  test('should return 401 for malformed token', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ idToken: 'malformed-token-xyz' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for missing idToken', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('idToken is required');
  });

  test('should return 400 for non-string idToken', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ idToken: 12345 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});
