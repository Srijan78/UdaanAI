/**
 * auth.js
 * 
 * Handles Google Identity Services authentication.
 * Verifies ID tokens sent from the frontend and returns user profile data.
 * 
 * @module routes/auth
 */

'use strict';

const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const { HTTP_STATUS } = require('../constants');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CALENDAR_CLIENT_ID);

router.post('/verify', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Missing credential' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    // Simulate session creation/verification
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      user: {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      }
    });
  } catch (error) {
    console.error('[auth] Error verifying token:', error.message);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Invalid token' });
  }
});

module.exports = router;
