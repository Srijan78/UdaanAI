/**
 * tests/ask.test.js
 *
 * Integration tests for /api/ask route.
 * Mocks Gemini API to test route logic and topic guard.
 */

'use strict';

const request = require('supertest');
const app = require('../index');

// Mock Gemini API
jest.mock('@google/generative-ai', () => {
  const sendMessageMock = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        message: 'Mock response about voting.',
        action: 'none'
      })
    }
  });

  const startChatMock = jest.fn().mockReturnValue({
    sendMessage: sendMessageMock
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        startChat: startChatMock
      }))
    }))
  };
});

describe('POST /api/ask', () => {

  test('should return 200 for valid election question', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: 'How do I register to vote in Maharashtra?',
        language: 'hi'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
  });

  test('should return 200 with guide message for off-topic question (PRD §14.1 Layer 1 Guard)', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: 'How to make a pizza?',
        language: 'hi'
      });

    // PRD §14.1: off-topic returns 200 — Gemini is never called, quota preserved
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.action).toBe('none');
  });

  test('should return 400 for empty question', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: '',
        language: 'hi'
      });
    
    expect(res.statusCode).toBe(400);
  });

  test('should return 400 for question exceeding 500 characters', async () => {
    const longQuestion = 'a'.repeat(501);
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: longQuestion,
        language: 'en'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for unsupported language code', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: 'How do I vote?',
        language: 'zz'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for missing question field', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        language: 'hi'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for XSS payload in question', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: '<script>alert("xss")</script>',
        language: 'en'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});
