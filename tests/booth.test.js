/**
 * tests/booth.test.js
 *
 * Integration tests for GET /api/booth.
 * Covers: valid EPIC number, valid personal details,
 * invalid EPIC format, missing parameters.
 *
 * PRD §10 test requirements.
 *
 * @module tests/booth.test
 */

'use strict';

const request = require('supertest');
const app     = require('../index');

describe('GET /api/booth', () => {

  // ── Happy Paths ──────────────────────────────────────────────────────

  test('should return 200 with ECI URL for valid EPIC number', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({ epicNumber: 'ABC1234567' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.eciUrl).toBeDefined();
    // Must be the official ECI electoral search portal
    expect(res.body.eciUrl).toContain('electoralsearch.eci.gov.in');
    // Must pre-fill the EPIC number
    expect(res.body.eciUrl).toContain('ABC1234567');
  });

  test('should return 200 with ECI URL for valid name + dob + state', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({
        name:  'Priya Sharma',
        dob:   '1995-04-15',
        state: 'Maharashtra',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.eciUrl).toBeDefined();
    expect(res.body.eciUrl).toContain('electoralsearch.eci.gov.in');
  });

  // ── Failure Paths ────────────────────────────────────────────────────

  test('should return 400 for invalid EPIC format (lowercase)', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({ epicNumber: 'abc1234567' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for invalid EPIC format (wrong structure)', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({ epicNumber: '12ABC34567' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for EPIC that is too short', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({ epicNumber: 'AB123456' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when no parameters are provided', async () => {
    const res = await request(app)
      .get('/api/booth');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when only name is provided (dob + state missing)', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({ name: 'Priya Sharma' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for invalid dob format (not YYYY-MM-DD)', async () => {
    const res = await request(app)
      .get('/api/booth')
      .query({
        name:  'Priya Sharma',
        dob:   '15-04-1995',
        state: 'Maharashtra',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});
