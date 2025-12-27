/**
 * ERROR HANDLER MIDDLEWARE TESTS
 * ===============================
 * Unit tests for centralized error handling middleware
 */

const errorHandler = require('../../../middlewares/errorHandler.middleware');

describe('Error Handler Middleware - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleErrorSpy;

  beforeEach(() => {
    mockReq = {};

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Spy on console.error to suppress output during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Mongoose Validation Errors', () => {
    test('should handle Mongoose ValidationError', () => {
      const err = {
        name: 'ValidationError',
        message: 'User validation failed: email: Path `email` is required.',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User validation failed: email: Path `email` is required.',
      });
    });

    test('should handle ValidationError with multiple fields', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed: email is required, age must be a number',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed: email is required, age must be a number',
      });
    });

    test('should log validation error stack', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        stack: 'ValidationError: Validation failed\n    at Model.save',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
    });
  });

  describe('Mongoose Duplicate Key Errors', () => {
    test('should handle duplicate key error (11000)', () => {
      const err = {
        code: 11000,
        message: 'E11000 duplicate key error collection',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate field value entered',
      });
    });

    test('should handle duplicate email error', () => {
      const err = {
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'duplicate@example.com' },
        message: 'E11000 duplicate key error',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate field value entered',
      });
    });

    test('should log duplicate key error', () => {
      const err = {
        code: 11000,
        message: 'Duplicate key error',
        stack: 'MongoError: E11000 duplicate key',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
    });
  });

  describe('JWT Errors', () => {
    test('should handle JsonWebTokenError', () => {
      const err = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
      });
    });

    test('should handle invalid signature error', () => {
      const err = {
        name: 'JsonWebTokenError',
        message: 'invalid signature',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
      });
    });

    test('should handle jwt expired error', () => {
      const err = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
        expiredAt: new Date(),
        stack: 'Error stack...',
      };

      // Note: Current implementation treats TokenExpiredError as generic error
      // This test documents current behavior
      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'jwt expired',
      });
    });
  });

  describe('Generic Errors', () => {
    test('should handle generic error with status code', () => {
      const err = {
        status: 404,
        message: 'Resource not found',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
      });
    });

    test('should default to 500 for errors without status code', () => {
      const err = {
        message: 'Something went wrong',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
      });
    });

    test('should handle error without message', () => {
      const err = {
        status: 500,
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
      });
    });

    test('should handle error with empty message', () => {
      const err = {
        message: '',
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
      });
    });

    test('should handle custom status codes', () => {
      const err = {
        status: 418,
        message: "I'm a teapot",
        stack: 'Error stack...',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "I'm a teapot",
      });
    });
  });

  describe('Mongoose CastError', () => {
    test('should handle CastError for invalid ObjectId', () => {
      const err = {
        name: 'CastError',
        message: 'Cast to ObjectId failed for value "invalid" at path "_id"',
        kind: 'ObjectId',
        value: 'invalid',
        path: '_id',
        stack: 'Error stack...',
      };

      // Note: Current implementation doesn't have special handling for CastError
      // This test documents current behavior
      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Error Logging', () => {
    test('should always log error stack', () => {
      const err = {
        message: 'Test error',
        stack: 'Error: Test error\n    at Object.<anonymous>',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
    });

    test('should log stack even for validation errors', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        stack: 'ValidationError: Validation failed',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
    });

    test('should log stack even for duplicate key errors', () => {
      const err = {
        code: 11000,
        message: 'Duplicate',
        stack: 'MongoError: E11000',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err.stack);
    });
  });

  describe('Response Format', () => {
    test('should always include success: false', () => {
      const errors = [
        { name: 'ValidationError', message: 'Validation failed', stack: 'stack' },
        { code: 11000, message: 'Duplicate', stack: 'stack' },
        { name: 'JsonWebTokenError', message: 'Invalid', stack: 'stack' },
        { message: 'Generic error', stack: 'stack' },
      ];

      errors.forEach((err) => {
        jest.clearAllMocks();
        errorHandler(err, mockReq, mockRes, mockNext);

        const responseCall = mockRes.json.mock.calls[0][0];
        expect(responseCall).toHaveProperty('success', false);
      });
    });

    test('should always include message in response', () => {
      const errors = [
        { name: 'ValidationError', message: 'Validation failed', stack: 'stack' },
        { code: 11000, message: 'Duplicate', stack: 'stack' },
        { name: 'JsonWebTokenError', message: 'Invalid', stack: 'stack' },
        { message: 'Generic error', stack: 'stack' },
      ];

      errors.forEach((err) => {
        jest.clearAllMocks();
        errorHandler(err, mockReq, mockRes, mockNext);

        const responseCall = mockRes.json.mock.calls[0][0];
        expect(responseCall).toHaveProperty('message');
        expect(typeof responseCall.message).toBe('string');
      });
    });

    test('should not include error stack in response', () => {
      const err = {
        message: 'Error message',
        stack: 'Error: Error message\n    at dangerous code location',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      const responseCall = mockRes.json.mock.calls[0][0];
      expect(responseCall).not.toHaveProperty('stack');
      expect(responseCall.message).not.toContain('at dangerous');
    });
  });

  describe('Edge Cases', () => {
    test('should handle error object without stack', () => {
      const err = {
        message: 'Error without stack',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      // When stack is not available, it should log the message
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error without stack');
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle null error', () => {
      const err = null;

      // Error handler should handle null errors gracefully
      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown error');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unknown error',
      });
    });

    test('should handle undefined error', () => {
      const err = undefined;

      // Error handler should handle undefined errors gracefully
      errorHandler(err, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown error');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unknown error',
      });
    });

    test('should handle error with status 0', () => {
      const err = {
        status: 0,
        message: 'Error with status 0',
        stack: 'stack',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle error with non-numeric status', () => {
      const err = {
        status: 'not a number',
        message: 'Invalid status',
        stack: 'stack',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      // When status is not a valid number, it should default to 500
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle error with multiple properties', () => {
      const err = {
        name: 'ValidationError',
        code: 11000,
        status: 400,
        message: 'Complex error',
        stack: 'stack',
      };

      // ValidationError should take precedence
      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Complex error',
      });
    });
  });

  describe('Priority of Error Types', () => {
    test('ValidationError should be checked before duplicate key', () => {
      const err = {
        name: 'ValidationError',
        code: 11000,
        message: 'Validation error',
        stack: 'stack',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
      });
    });

    test('Duplicate key should be checked before JWT error', () => {
      const err = {
        code: 11000,
        name: 'JsonWebTokenError',
        message: 'Duplicate key',
        stack: 'stack',
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate field value entered',
      });
    });
  });
});
