/**
 * middleware/authGuard.js
 *
 * Firebase ID token verification middleware.
 * Extracts Bearer token from Authorization header, verifies it
 * server-side using firebase-admin, and attaches decoded user to req.user.
 *
 * Usage: router.use(authGuard)  — protects all routes in that router
 *
 * Returns 401 if token is missing, expired, or malformed.
 *
 * @module middleware/authGuard
 */

'use strict';

const admin = require('firebase-admin');
const { HTTP_STATUS } = require('../constants');

/**
 * Extracts the Bearer token string from an Authorization header value.
 * Returns null if the header is absent or malformed.
 *
 * @param {string | undefined} authorizationHeader - Raw Authorization header value
 * @returns {string | null} - Raw token string, or null if absent/malformed
 */
function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  return authorizationHeader.slice('Bearer '.length).trim() || null;
}

/**
 * Determines whether a Firebase auth error code represents an invalid token.
 *
 * @param {string} errorCode - Firebase error code string
 * @returns {boolean}        - true if error is token-related (not a server error)
 */
function isTokenError(errorCode) {
  const tokenErrorCodes = [
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/argument-error',
    'auth/invalid-id-token',
  ];
  return tokenErrorCodes.includes(errorCode);
}

/**
 * Express middleware that enforces Firebase authentication.
 * Attaches { uid, email, name, accessToken } to req.user on success.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
/**
 * Lazily initialises Firebase Admin SDK if not already initialised.
 * Prevents crashes when module is loaded in a test context without env vars.
 */
function ensureFirebaseInitialised() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      }),
    });
  }
}

async function authGuard(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authorization token is required.',
    });
  }

  try {
    ensureFirebaseInitialised();
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user context for downstream route handlers
    req.user = {
      uid:         decodedToken.uid,
      email:       decodedToken.email,
      name:        decodedToken.name,
      accessToken: token,
    };

    return next();

  } catch (error) {
    console.error('[authGuard] Token verification failed:', error.message);

    const statusCode = isTokenError(error.code)
      ? HTTP_STATUS.UNAUTHORIZED
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
      success: false,
      message: 'Invalid or expired token. Please sign in again.',
    });
  }
}

module.exports = { authGuard };
