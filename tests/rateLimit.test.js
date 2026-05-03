/**
 * tests/rateLimit.test.js
 *
 * Integration tests for rate limiting middleware.
 * Verifies that the 11th request to /api/ask within 1 minute
 * returns 429 with Retry-After header.
 *
 * PRD §10 test requirements.
 *
 * @module tests/rateLimit.test
 */

'use strict';

const request = require('supertest');
const app     = require('../index');

// Mock Gemini so /api/ask responds successfully
jest.mock('@google/generative-ai', () => {
  const sendMessageMock = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        message: 'Mock voting response.',
        action: 'none',
        calendarOffer: false,
        phase: 'registration',
        checklistItems: [],
      }),
    },
  });

  const startChatMock = jest.fn().mockReturnValue({
    sendMessage: sendMessageMock,
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        startChat: startChatMock,
      })),
    })),
  };
});

describe('Rate Limiting (PRD §8.2)', () => {

  test('first 10 requests to /api/ask should pass, 11th should return 429', async () => {
    const validBody = {
      question: 'How do I register to vote in India?',
      language: 'hi',
    };

    // Send 10 requests — all should succeed (200)
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/ask')
        .send(validBody);

      expect(res.statusCode).toBe(200);
    }

    // 11th request — should be rate limited (429)
    const blockedRes = await request(app)
      .post('/api/ask')
      .send(validBody);

    expect(blockedRes.statusCode).toBe(429);
  });

});
