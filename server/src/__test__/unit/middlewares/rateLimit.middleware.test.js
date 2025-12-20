/**
 * RATE LIMIT MIDDLEWARE TESTS
 * =============================
 * Unit tests for rate limiting and speed limiting middleware
 * Note: Testing middleware exports and functionality (not internal express-rate-limit config)
 */

const { limiter, speedLimiter } = require('../../../middlewares/rateLimit.middleware');

describe('Rate Limit Middleware - Unit Tests', () => {
  describe('Exports', () => {
    test('should export limiter middleware', () => {
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    test('should export speedLimiter middleware', () => {
      expect(speedLimiter).toBeDefined();
      expect(typeof speedLimiter).toBe('function');
    });

    test('both limiters should be middleware functions', () => {
      expect(typeof limiter).toBe('function');
      expect(typeof speedLimiter).toBe('function');
    });

    test('should not be null or undefined', () => {
      expect(limiter).not.toBeNull();
      expect(limiter).not.toBeUndefined();
      expect(speedLimiter).not.toBeNull();
      expect(speedLimiter).not.toBeUndefined();
    });
  });

  describe('Middleware Type', () => {
    test('limiter should be callable', () => {
      expect(typeof limiter).toBe('function');
    });

    test('speedLimiter should be callable', () => {
      expect(typeof speedLimiter).toBe('function');
    });

    test('should be valid Express middleware', () => {
      // Express middleware should be functions
      expect(limiter).toBeInstanceOf(Function);
      expect(speedLimiter).toBeInstanceOf(Function);
    });
  });

  describe('Module Structure', () => {
    test('should export object with both limiters', () => {
      const rateLimit = require('../../../middlewares/rateLimit.middleware');
      expect(rateLimit).toHaveProperty('limiter');
      expect(rateLimit).toHaveProperty('speedLimiter');
    });

    test('exports should be functions', () => {
      const rateLimit = require('../../../middlewares/rateLimit.middleware');
      expect(typeof rateLimit.limiter).toBe('function');
      expect(typeof rateLimit.speedLimiter).toBe('function');
    });
  });

  describe('Integration Ready', () => {
    test('limiter can be used as middleware', () => {
      // Verify it's a function that can be used in Express app
      expect(limiter).toBeInstanceOf(Function);
    });

    test('speedLimiter can be used as middleware', () => {
      // Verify it's a function that can be used in Express app
      expect(speedLimiter).toBeInstanceOf(Function);
    });

    test('both middlewares are distinct', () => {
      expect(limiter).not.toBe(speedLimiter);
    });
  });

  describe('Real-world Scenario', () => {
    test('should be ready for use in Express routes', () => {
      // Simulate Express route usage
      expect(() => {
        const mockApp = {
          use: (middleware) => middleware,
        };
        mockApp.use(limiter);
        mockApp.use(speedLimiter);
      }).not.toThrow();
    });
  });
});
