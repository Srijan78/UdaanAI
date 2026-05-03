'use strict';

const request = require('supertest');
const express = require('express');

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    calendar: jest.fn().mockReturnValue({
      events: {
        insert: jest.fn().mockResolvedValue({
          data: { htmlLink: 'https://calendar.google.com/event/abc123' },
        }),
      },
    }),
  },
}));

const calendarRouter = require('../routes/calendar');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/calendar', calendarRouter);
  return app;
}

describe('POST /api/calendar/add', () => {
  it('returns 401 when accessToken is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/calendar/add')
      .send({ state: 'Tamil Nadu', phase: 1 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing access token');
  });

  it('creates calendar event successfully', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/calendar/add')
      .send({ accessToken: 'valid-token', state: 'Tamil Nadu', phase: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.eventLink).toContain('calendar.google.com');
  });

  it('includes state and phase in event summary', async () => {
    const { google } = require('googleapis');
    const mockInsert = google.calendar().events.insert;
    mockInsert.mockClear();

    const app = createApp();
    await request(app)
      .post('/api/calendar/add')
      .send({ accessToken: 'valid-token', state: 'Maharashtra', phase: 2 });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'primary',
        resource: expect.objectContaining({
          summary: 'Election Day: Maharashtra (Phase 2)',
        }),
      })
    );
  });
});
