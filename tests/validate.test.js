/**
 * tests/validate.test.js
 *
 * Unit tests for input validation middleware.
 */

'use strict';

const { 
  validateAskInput, 
  validateBoothInput 
} = require('../middleware/validate');

describe('Input Validation Middleware', () => {

  describe('validateAskInput', () => {
    test('should pass with valid input', () => {
      const input = { question: 'How to vote?', language: 'hi' };
      const result = validateAskInput(input);
      expect(result.question).toBe('How to vote?');
      expect(result.language).toBe('hi');
    });

    test('should throw 400 for empty question', () => {
      expect(() => validateAskInput({ question: '' }))
        .toThrow('question is required.');
    });

    test('should throw 400 for too long question', () => {
      const longQ = 'a'.repeat(501);
      expect(() => validateAskInput({ question: longQ }))
        .toThrow('question exceeds maximum length');
    });

    test('should strip XSS tags', () => {
      const input = { question: '<script>alert(1)</script>Hello' };
      const result = validateAskInput(input);
      expect(result.question).toBe('Hello');
    });
  });

  describe('validateBoothInput', () => {
    test('should pass with valid EPIC', () => {
      const query = { epicNumber: 'ABC1234567' };
      const result = validateBoothInput(query);
      expect(result.epicNumber).toBe('ABC1234567');
    });

    test('should throw for invalid EPIC format', () => {
      expect(() => validateBoothInput({ epicNumber: '123ABC4567' }))
        .toThrow('epicNumber must be 3 uppercase letters followed by 7 digits');
    });
  });

});
