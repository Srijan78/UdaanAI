/**
 * calendar.js
 * 
 * Interacts with Google Calendar API.
 * Uses an OAuth access token to insert election reminders into the user's personal calendar.
 * 
 * @module routes/calendar
 */

'use strict';

const express = require('express');
const { google } = require('googleapis');
const { HTTP_STATUS } = require('../constants');

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { accessToken, state, phase } = req.body;
    
    if (!accessToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Missing access token' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Try to find the exact phase date (mocking date logic or getting from constant)
    // For demo, we just create a generic event for tomorrow
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 1);
    const startDate = eventDate.toISOString().split('T')[0];

    const event = {
      summary: `Election Day: ${state} (Phase ${phase})`,
      description: `UdaanAI Reminder to vote in the upcoming election for ${state}. Remember to carry your voter ID!`,
      start: {
        date: startDate,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        date: startDate,
        timeZone: 'Asia/Kolkata',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, eventLink: response.data.htmlLink });
  } catch (error) {
    console.error('[calendar] Error inserting event:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message || 'Failed to add calendar event' 
    });
  }
});

module.exports = router;
