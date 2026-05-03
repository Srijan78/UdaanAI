/**
 * routes/calendar.js
 *
 * Handles POST /api/calendar
 * Creates a Google Calendar event for the authenticated user.
 * Protected by authGuard middleware — Firebase token required.
 *
 * Request:  { title, date, description }
 * Response: { eventId, eventUrl }
 *
 * Rate limit: 10 req/min per IP (middleware/rateLimit.js)
 * Auth required: Yes — Bearer token via authGuard
 *
 * @module routes/calendar
 */

'use strict';

const express = require('express');
const { google } = require('googleapis');

const { createRateLimiter }     = require('../middleware/rateLimit');
const { validateCalendarInput } = require('../middleware/validate');
const { RATE_LIMIT_CALENDAR, HTTP_STATUS } = require('../constants');

const router = express.Router();

router.use(createRateLimiter(RATE_LIMIT_CALENDAR));

/**
 * Builds a Google Calendar API client authenticated with the user's OAuth token.
 *
 * @param {string} accessToken - User's Google OAuth access token
 * @returns {import('googleapis').calendar_v3.Calendar} - Authenticated Calendar client
 */
function buildCalendarClient(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Creates a Google Calendar event on the user's primary calendar.
 *
 * @param {string} accessToken - User's Google OAuth access token
 * @param {string} title       - Event title/summary
 * @param {string} date        - ISO 8601 date string
 * @param {string} description - Event description body
 * @returns {Promise<{ eventId: string, eventUrl: string }>}
 * @throws {Error} - If Google Calendar API call fails
 */
async function createCalendarEvent(accessToken, title, date, description) {
  const calendarClient = buildCalendarClient(accessToken);

  const event = {
    summary:     title,
    description: description,
    start: { date: date.slice(0, 10), timeZone: 'Asia/Kolkata' },
    end:   { date: date.slice(0, 10), timeZone: 'Asia/Kolkata' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  const response = await calendarClient.events.insert({
    calendarId:  'primary',
    requestBody: event,
  });

  return { eventId: response.data.id, eventUrl: response.data.htmlLink };
}

/**
 * POST /api/calendar
 * Creates a Google Calendar reminder for the authenticated user.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleCalendar(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Google OAuth Access Token is required.',
      });
    }
    const accessToken = authHeader.slice('Bearer '.length).trim();

    const input               = validateCalendarInput(req.body);
    const { eventId, eventUrl } = await createCalendarEvent(
      accessToken, input.title, input.date, input.description
    );
    return res.status(HTTP_STATUS.OK).json({ eventId, eventUrl });
  } catch (error) {
    console.error('[calendar] Error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Could not add to calendar. Please try again.',
    });
  }
}

router.post('/', handleCalendar);

module.exports = router;
