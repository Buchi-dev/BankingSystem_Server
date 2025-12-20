/**
 * AUTH MIDDLEWARE TESTS
 * =====================
 * Unit tests for JWT authentication middleware
 */

const authMiddleware = require('../../../middlewares/auth.middleware');
const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
    
    // Set default JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('Valid Token', () => {
    test('should authenticate user with valid token', () => {
      const mockDecoded = {
        id: '123abc',
        email: 'john@example.com',
        role: 'staff',
      };

      mockReq.headers.authorization = 'Bearer validtoken123';
      jwt.verify = jest.fn().mockReturnValue(mockDecoded);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken123', 'test-secret');
      expect(mockReq.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should attach decoded user data to request', () => {
      const mockDecoded = {
        id: '456def',
        email: 'admin@example.com',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890,
      };

      mockReq.headers.authorization = 'Bearer validtoken456';
      jwt.verify = jest.fn().mockReturnValue(mockDecoded);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBe(mockDecoded);
      expect(mockReq.user.id).toBe('456def');
      expect(mockReq.user.role).toBe('admin');
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should handle token with extra whitespace', () => {
      const mockDecoded = { id: '123', email: 'test@example.com' };

      // 'Bearer   tokenWithSpaces  '.split(' ') gives ['Bearer', '', '', 'tokenWithSpaces', '', '']
      // [1] gives '' which is falsy, so no token error
      mockReq.headers.authorization = 'Bearer   tokenWithSpaces  ';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('No Token', () => {
    test('should return 401 if no authorization header', () => {
      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header is empty string', () => {
      mockReq.headers.authorization = '';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header has only "Bearer"', () => {
      mockReq.headers.authorization = 'Bearer';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header has "Bearer " with space only', () => {
      mockReq.headers.authorization = 'Bearer ';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
      });
    });
  });

  describe('Invalid Token', () => {
    test('should return 401 for invalid token format', () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for malformed token', () => {
      mockReq.headers.authorization = 'Bearer xyz123';
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for expired token', () => {
      mockReq.headers.authorization = 'Bearer expiredtoken';
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for token with invalid signature', () => {
      mockReq.headers.authorization = 'Bearer tamperedtoken';
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should return 401 if token is not prefixed with "Bearer"', () => {
      mockReq.headers.authorization = 'validtoken123';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle lowercase "bearer" prefix', () => {
      mockReq.headers.authorization = 'bearer validtoken123';
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(mockReq, mockRes, mockNext);

      // split(' ')[1] gives 'validtoken123', but JWT verification will fail
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    test('should not modify request if authentication fails', () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const originalReq = { ...mockReq };

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle null authorization header', () => {
      mockReq.headers.authorization = null;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle undefined authorization header', () => {
      mockReq.headers.authorization = undefined;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle authorization header with multiple spaces', () => {
      mockReq.headers.authorization = 'Bearer    token';
      const mockDecoded = { id: '123', email: 'test@example.com' };
      jwt.verify = jest.fn().mockReturnValue(mockDecoded);

      authMiddleware(mockReq, mockRes, mockNext);

      // split(' ') on 'Bearer    token' gives ['Bearer', '', '', '', 'token']
      // [1] gives empty string '', so token will be falsy
      // This will trigger "No token provided" error
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security', () => {
    test('should verify token with correct secret', () => {
      const mockDecoded = { id: '123', email: 'test@example.com' };
      mockReq.headers.authorization = 'Bearer mytoken';
      jwt.verify = jest.fn().mockReturnValue(mockDecoded);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('mytoken', process.env.JWT_SECRET);
      expect(jwt.verify).toHaveBeenCalledWith('mytoken', 'test-secret');
    });

    test('should not call next() if jwt.verify throws', () => {
      mockReq.headers.authorization = 'Bearer badtoken';
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Verification failed');
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should not expose error details in response', () => {
      mockReq.headers.authorization = 'Bearer badtoken';
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Secret key mismatch: expected xyz but got abc');
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token', // Generic message
      });
      expect(mockRes.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Secret key'),
        })
      );
    });
  });
});
