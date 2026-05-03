/**
 * routes/calendar.js
 *
 * Handles POST /api/calendar
 * Generates a Google Calendar web link for the user to manually add the event.
 *
 * Request:  { title, date, description }
 * Response: { calendarUrl }
 *
 * Rate limit: 10 req/min per IP (middleware/rateLimit.js)
 *
 * @module routes/calendar
 */

'use strict';

const express = require('express');

const { createRateLimiter }     = require('../middleware/rateLimit');
const { validateCalendarInput } = require('../middleware/validate');
const { RATE_LIMIT_CALENDAR, HTTP_STATUS } = require('../constants');

const router = express.Router();

router.use(createRateLimiter(RATE_LIMIT_CALENDAR));

/**
 * POST /api/calendar
 * Generates a Google Calendar link for the event.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleCalendar(req, res) {
  try {
    const input = validateCalendarInput(req.body);

    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = encodeURIComponent(input.title);
    
    // Format dates for Google Calendar URL (YYYYMMDD)
    const formattedDate = input.date.replace(/-/g, '').slice(0, 8);
    // Setting an all day event for the specific date
    const dates = encodeURIComponent(`${formattedDate}/${formattedDate}`);
    
    const details = encodeURIComponent(input.description);

    const calendarUrl = `${baseUrl}&text=${text}&dates=${dates}&details=${details}`;

    return res.status(HTTP_STATUS.OK).json({ calendarUrl });
  } catch (error) {
    console.error('[calendar] Error:', error.message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Could not generate calendar link. Please try again.',
    });
  }
}

router.post('/', handleCalendar);

module.exports = router;
