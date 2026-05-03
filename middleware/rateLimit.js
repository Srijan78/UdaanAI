/**
 * middleware/rateLimit.js
 *
 * Per-route rate limiting configuration for all /api/* routes.
 * Uses express-rate-limit with per-IP tracking.
 * Returns 429 with Retry-After header when limit exceeded.
 *
 * Usage: router.use(createRateLimiter(RATE_LIMIT_ASK))
 *
 * @module middleware/rateLimit
 */

'use strict';

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, HTTP_STATUS } = require('../constants');

/**
 * Creates an express-rate-limit middleware for a specific route.
 * Limit is per IP address within a 1-minute sliding window.
 *
 * @param {number} maxRequests     - Maximum requests per minute per IP
 * @param {string} [routeName=''] - Route name for error message context
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
function createRateLimiter(maxRequests, routeName = '') {
  return rateLimit({
    windowMs:         RATE_LIMIT_WINDOW_MS,
    max:              maxRequests,
    standardHeaders:  true,   // Adds RateLimit-* headers to responses
    legacyHeaders:    false,   // Disables deprecated X-RateLimit-* headers
    skipSuccessfulRequests: false,

    /**
     * Custom handler when rate limit is exceeded.
     * Includes Retry-After header and consistent JSON error shape.
     *
     * @param {import('express').Request}  req
     * @param {import('express').Response} res
     */
    handler(req, res) {
      const retryAfterSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: `Too many requests${routeName ? ` to ${routeName}` : ''}. Please wait ${retryAfterSeconds} seconds and try again.`,
      });
    },

    /**
     * Custom key generator — uses IP address for per-client limiting.
     * Falls back to a safe default if IP is not available.
     *
     * @param {import('express').Request} req
     * @returns {string} - Rate limit key
     */
    keyGenerator(req) {
      return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    },
  });
}

module.exports = { createRateLimiter };
