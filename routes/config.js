'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    googleCalendarClientId: process.env.GOOGLE_CALENDAR_CLIENT_ID
  });
});

module.exports = router;
