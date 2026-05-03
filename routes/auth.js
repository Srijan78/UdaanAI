/**
 * routes/auth.js
 *
 * Handles POST /api/auth/verify
 * Verifies Firebase ID token server-side using firebase-admin.
 * On first login: creates Firestore user document.
 * On returning: reads and returns existing journey progress.
 *
 * Request:  { idToken }
 * Response: { user: { uid, email, name }, progress: { state, language, journeyProgress } }
 *
 * Rate limit: 20 req/min per IP (middleware/rateLimit.js)
 * Auth required: No (this IS the auth endpoint)
 *
 * @module routes/auth
 */

'use strict';

const express = require('express');
const admin = require('firebase-admin');

const { createRateLimiter } = require('../middleware/rateLimit');
const { RATE_LIMIT_AUTH, HTTP_STATUS } = require('../constants');

const router = express.Router();

router.use(createRateLimiter(RATE_LIMIT_AUTH));

/** @type {import('firebase-admin').firestore.Firestore | null} */
let firestore = null;

/**
 * Lazily initialises Firebase Admin SDK and returns a Firestore instance.
 * Initialises only once — safe to call on every request.
 *
 * @returns {import('firebase-admin').firestore.Firestore}
 */
function getFirestore() {
  if (!firestore) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines from Cloud Run env var format
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined,
        }),
      });
    }
    firestore = admin.firestore();
  }
  return firestore;
}

/** Firestore collection name for user journey progress */
const USERS_COLLECTION = 'users';

/**
 * Default Firestore document structure for a new user.
 * Stores minimal data — no sensitive information beyond Google profile.
 */
const DEFAULT_USER_PROGRESS = {
  state: null,
  language: null,
  journeyProgress: {},
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

/**
 * Reads a user's journey progress from Firestore.
 * Returns default progress object if no document exists yet.
 *
 * @param {string} uid              - Firebase user UID
 * @returns {Promise<Object>}       - User progress object
 * @throws {Error}                  - If Firestore read fails
 */
async function readUserProgress(uid) {
  const docRef = getFirestore().collection(USERS_COLLECTION).doc(uid);
  const docSnap = await docRef.get();
  return docSnap.exists ? docSnap.data() : null;
}

/**
 * Creates a new user document in Firestore on first login.
 *
 * @param {string} uid        - Firebase user UID
 * @returns {Promise<Object>} - Default progress object
 * @throws {Error}            - If Firestore write fails
 */
async function createUserDocument(uid) {
  const docRef = getFirestore().collection(USERS_COLLECTION).doc(uid);
  await docRef.set(DEFAULT_USER_PROGRESS);
  return DEFAULT_USER_PROGRESS;
}

/**
 * POST /api/auth/verify
 * Verifies Firebase ID token and returns user profile + journey progress.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleAuthVerify(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'idToken is required.',
      });
    }
    // Ensure Firebase is initialized before using admin.auth()
    getFirestore();

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    let progress = await readUserProgress(uid);
    if (!progress) {
      progress = await createUserDocument(uid);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      user: { uid, email, name },
      progress: {
        state: progress.state,
        language: progress.language,
        journeyProgress: progress.journeyProgress,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // PRD §15.4: always log with console.error, never expose internals
    console.error('[auth] Error:', error.message);

    const statusCode = (error.code && error.code.startsWith('auth/'))
      ? HTTP_STATUS.UNAUTHORIZED
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
      success: false,
      message: statusCode === HTTP_STATUS.UNAUTHORIZED
        ? 'Invalid or expired token. Please sign in again.'
        : 'Authentication failed. Please try again.',
    });
  }
}

router.post('/verify', handleAuthVerify);

module.exports = router;
