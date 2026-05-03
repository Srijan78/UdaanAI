/**
 * routes/booth.js
 *
 * Handles GET /api/booth
 * Generates a pre-filled deep link to the ECI Electoral Search portal.
 * Does NOT use Google Maps Places API — it has no Indian polling booth data.
 *
 * Query params (one of two modes):
 *   Mode A: ?epicNumber=ABC1234567
 *   Mode B: ?name=Priya+Sharma&dob=1995-04-15&state=Maharashtra
 *
 * Response: { eciUrl }
 *
 * Rate limit: 20 req/min per IP (middleware/rateLimit.js)
 * Auth required: No
 *
 * @module routes/booth
 */

'use strict';

const express = require('express');

const { createRateLimiter }   = require('../middleware/rateLimit');
const { validateBoothInput }  = require('../middleware/validate');
const { RATE_LIMIT_BOOTH, HTTP_STATUS } = require('../constants');

const router = express.Router();

router.use(createRateLimiter(RATE_LIMIT_BOOTH));

/** Base URL for the ECI Electoral Search portal */
const ECI_SEARCH_BASE_URL = 'https://electoralsearch.eci.gov.in';

/**
 * Builds a pre-filled ECI Electoral Search URL using EPIC number.
 *
 * @param {string} epicNumber - Voter ID in format ABC1234567
 * @returns {string}          - Pre-filled ECI portal URL
 */
function buildEciUrlFromEpic(epicNumber) {
  const params = new URLSearchParams({ epic: epicNumber });
  return `${ECI_SEARCH_BASE_URL}/?${params.toString()}`;
}

/**
 * Builds a pre-filled ECI Electoral Search URL using name, DOB, and state.
 *
 * @param {string} name  - Voter's full name
 * @param {string} dob   - Date of birth in YYYY-MM-DD format
 * @param {string} state - Indian state name
 * @returns {string}     - Pre-filled ECI portal URL
 */
function buildEciUrlFromDetails(name, dob, state) {
  const params = new URLSearchParams({ name, dob, state });
  return `${ECI_SEARCH_BASE_URL}/?${params.toString()}`;
}

/**
 * GET /api/booth
 * Returns a pre-filled ECI portal deep link the frontend opens in a new tab.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function handleBooth(req, res) {
  try {
    const input = validateBoothInput(req.query);

    const eciUrl = input.epicNumber
      ? buildEciUrlFromEpic(input.epicNumber)
      : buildEciUrlFromDetails(input.name, input.dob, input.state);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      eciUrl,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // PRD §15.4: always log with console.error, never expose internals
    console.error('[booth] Error:', error.message);
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
      success: false,
      message: statusCode < 500 ? error.message : 'Booth lookup failed. Please try again.',
    });
  }
}

router.get('/', handleBooth);

module.exports = router;
