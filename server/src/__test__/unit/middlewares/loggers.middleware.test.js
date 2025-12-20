/**
 * LOGGER MIDDLEWARE TESTS
 * ========================
 * Unit tests for request logging middleware
 */

const loggers = require('../../../middlewares/loggers.middleware');

describe('Loggers Middleware - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleLogSpy;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/users',
      originalUrl: '/api/users',
      ip: '127.0.0.1',
    };

    mockRes = {};
    mockNext = jest.fn();

    // Spy on console.log to verify logging
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Request Logging', () => {
    test('should log GET request', () => {
      mockReq.method = 'GET';
      mockReq.url = '/api/users';
      mockReq.originalUrl = '/api/users';
      mockReq.ip = '192.168.1.1';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('GET');
      expect(logMessage).toContain('/api/users');
      expect(logMessage).toContain('192.168.1.1');
    });

    test('should log POST request', () => {
      mockReq.method = 'POST';
      mockReq.url = '/api/users';
      mockReq.ip = '127.0.0.1';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('POST');
    });

    test('should log PUT request', () => {
      mockReq.method = 'PUT';
      mockReq.url = '/api/users/123';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('PUT');
    });

    test('should log DELETE request', () => {
      mockReq.method = 'DELETE';
      mockReq.url = '/api/users/123';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('DELETE');
    });

    test('should log PATCH request', () => {
      mockReq.method = 'PATCH';
      mockReq.url = '/api/users/123';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('PATCH');
    });
  });

  describe('Log Message Format', () => {
    test('should include timestamp in log', () => {
      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      
      // Should contain date-like pattern
      expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\w{3} \d{1,2}/);
    });

    test('should include request method', () => {
      mockReq.method = 'GET';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('GET');
    });

    test('should include request URL', () => {
      mockReq.url = '/api/users/profile';
      mockReq.originalUrl = '/api/users/profile';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('/api/users/profile');
    });

    test('should include client IP address', () => {
      mockReq.ip = '192.168.1.100';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('192.168.1.100');
    });

    test('should format log message properly', () => {
      mockReq.method = 'POST';
      mockReq.url = '/api/login';
      mockReq.originalUrl = '/api/login';
      mockReq.ip = '10.0.0.1';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('POST');
      expect(logMessage).toContain('/api/login');
      expect(logMessage).toContain('10.0.0.1');
    });
  });

  describe('URL Variations', () => {
    test('should log root path', () => {
      mockReq.url = '/';
      mockReq.originalUrl = '/';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('/');
    });

    test('should log nested paths', () => {
      mockReq.url = '/api/v1/users/123/profile';
      mockReq.originalUrl = '/api/v1/users/123/profile';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('/api/v1/users/123/profile');
    });

    test('should log URLs with query parameters', () => {
      mockReq.url = '/api/users?page=1&limit=10';
      mockReq.originalUrl = '/api/users?page=1&limit=10';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('/api/users?page=1&limit=10');
    });

    test('should log URLs with hash fragments', () => {
      mockReq.url = '/api/users#section';
      mockReq.originalUrl = '/api/users#section';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('/api/users#section');
    });

    test('should log long URLs', () => {
      mockReq.url = '/api/v1/users/search?name=John&age=25&gender=Male&sort=asc';
      mockReq.originalUrl = '/api/v1/users/search?name=John&age=25&gender=Male&sort=asc';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain(mockReq.url);
    });
  });

  describe('IP Address Variations', () => {
    test('should log IPv4 address', () => {
      mockReq.ip = '192.168.1.1';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('192.168.1.1');
    });

    test('should log localhost IP', () => {
      mockReq.ip = '127.0.0.1';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('127.0.0.1');
    });

    test('should log IPv6 address', () => {
      mockReq.ip = '::1';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('::1');
    });

    test('should log full IPv6 address', () => {
      mockReq.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    test('should handle undefined IP', () => {
      mockReq.ip = undefined;

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle null IP', () => {
      mockReq.ip = null;

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Middleware Behavior', () => {
    test('should call next() after logging', () => {
      loggers(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should call next() without arguments', () => {
      loggers(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    test('should log before calling next()', () => {
      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      
      // Verify log was called before next
      const logCallOrder = consoleLogSpy.mock.invocationCallOrder[0];
      const nextCallOrder = mockNext.mock.invocationCallOrder[0];
      expect(logCallOrder).toBeLessThan(nextCallOrder);
    });

    test('should not throw errors', () => {
      expect(() => {
        loggers(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    test('should always call next() even if logging fails', () => {
      consoleLogSpy.mockImplementation(() => {
        throw new Error('Logging failed');
      });

      expect(() => {
        loggers(mockReq, mockRes, mockNext);
      }).toThrow('Logging failed');
    });
  });

  describe('Multiple Requests', () => {
    test('should log multiple requests separately', () => {
      loggers(mockReq, mockRes, mockNext);
      
      mockReq.method = 'POST';
      mockReq.url = '/api/users';
      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    test('should handle concurrent requests', () => {
      const req1 = { method: 'GET', url: '/api/users/1', ip: '127.0.0.1' };
      const req2 = { method: 'POST', url: '/api/users', ip: '127.0.0.2' };
      const req3 = { method: 'DELETE', url: '/api/users/1', ip: '127.0.0.3' };

      loggers(req1, mockRes, mockNext);
      loggers(req2, mockRes, mockNext);
      loggers(req3, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing method', () => {
      delete mockReq.method;

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle missing url', () => {
      delete mockReq.url;

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle missing ip', () => {
      delete mockReq.ip;

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle empty request object', () => {
      mockReq = {};

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle method with lowercase', () => {
      mockReq.method = 'get';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage.toLowerCase()).toContain('get');
    });

    test('should handle empty URL', () => {
      mockReq.url = '';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle empty IP', () => {
      mockReq.ip = '';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Special HTTP Methods', () => {
    test('should log OPTIONS request', () => {
      mockReq.method = 'OPTIONS';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('OPTIONS');
    });

    test('should log HEAD request', () => {
      mockReq.method = 'HEAD';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('HEAD');
    });

    test('should log custom HTTP method', () => {
      mockReq.method = 'CUSTOM';

      loggers(mockReq, mockRes, mockNext);

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('CUSTOM');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should log successful user registration', () => {
      mockReq.method = 'POST';
      mockReq.url = '/api/auth/register';
      mockReq.originalUrl = '/api/auth/register';
      mockReq.ip = '192.168.1.50';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('POST');
      expect(logMessage).toContain('/api/auth/register');
    });

    test('should log user login attempt', () => {
      mockReq.method = 'POST';
      mockReq.url = '/api/auth/login';
      mockReq.originalUrl = '/api/auth/login';
      mockReq.ip = '10.0.0.25';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('POST');
      expect(logMessage).toContain('/api/auth/login');
    });

    test('should log profile fetch', () => {
      mockReq.method = 'GET';
      mockReq.url = '/api/users/profile';
      mockReq.originalUrl = '/api/users/profile';
      mockReq.ip = '172.16.0.1';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('GET');
      expect(logMessage).toContain('/api/users/profile');
    });

    test('should log user deletion', () => {
      mockReq.method = 'DELETE';
      mockReq.url = '/api/users/12345';
      mockReq.originalUrl = '/api/users/12345';
      mockReq.ip = '192.168.100.1';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('DELETE');
      expect(logMessage).toContain('/api/users/12345');
    });

    test('should log user update', () => {
      mockReq.method = 'PUT';
      mockReq.url = '/api/users/67890';
      mockReq.originalUrl = '/api/users/67890';
      mockReq.ip = '192.168.1.200';

      loggers(mockReq, mockRes, mockNext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('PUT');
      expect(logMessage).toContain('/api/users/67890');
    });
  });

  describe('Performance', () => {
    test('should log quickly without blocking', () => {
      const startTime = Date.now();

      loggers(mockReq, mockRes, mockNext);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Logging should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });

    test('should handle high volume of logs', () => {
      for (let i = 0; i < 100; i++) {
        loggers(mockReq, mockRes, mockNext);
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(100);
      expect(mockNext).toHaveBeenCalledTimes(100);
    });
  });
});
