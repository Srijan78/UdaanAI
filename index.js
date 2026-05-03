/**
 * index.js
 *
 * UdaanAI — Express entry point.
 * Mounts security middleware, rate limiting, API routes, and static files.
 * Single container: serves public/ frontend AND all /api/* routes.
 *
 * Architecture:
 *   Browser → /api/ask   → routes/ask.js  → Gemini API
 *   Browser → /api/tts   → routes/tts.js  → Cloud TTS
 *   Browser → /          → public/        → index.html
 *
 * @module index
 */

'use strict';

const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
require('dotenv').config();

const { DEFAULT_PORT } = require('./constants');

// ── Route imports ─────────────────────────────────────────────────────
const askRoute       = require('./routes/ask');
const ttsRoute       = require('./routes/tts');
const boothRoute     = require('./routes/booth');
const calendarRoute  = require('./routes/calendar');

const app  = express();
const PORT = process.env.PORT || DEFAULT_PORT;

// Trust the first proxy (Cloud Run load balancer) so req.ip is the actual user's IP
// Critical for express-rate-limit to function correctly in production.
app.set('trust proxy', 1);

// ── Security Headers (helmet) ─────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", 'https://accounts.google.com', 'https://maps.googleapis.com', "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc:    ["'self'", 'https://fonts.googleapis.com', 'https://accounts.google.com', "'unsafe-inline'"],
        fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:      ["'self'", 'data:', 'https://maps.googleapis.com', 'https://maps.gstatic.com'],
        mediaSrc:    ["'self'", 'data:', 'blob:'],
        connectSrc:  ["'self'", 'https://accounts.google.com'],
        frameSrc:    ['https://accounts.google.com'],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────
const allowedOrigin = process.env.ALLOWED_ORIGIN || `http://localhost:${PORT}`;
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/ask',       askRoute);
app.use('/api/tts',       ttsRoute);
app.use('/api/booth',     boothRoute);
app.use('/api/calendar',  calendarRoute);

// ── Health Check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'udaanai', timestamp: new Date().toISOString() });
});

// ── Static Files (Frontend) ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────────────────
app.use((error, _req, res, _next) => {
  console.error('[server] Unhandled error:', error.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
  });
});

// ── Start Server ──────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] UdaanAI running on port ${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[server] Static files: ${path.join(__dirname, 'public')}`);
  });
}

module.exports = app;
