/**
 * ROLE MIDDLEWARE TESTS
 * =====================
 * Unit tests for role-based authorization middleware
 */

const checkRole = require('../../../middlewares/role.middleware');

describe('Role Middleware - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('Single Role Authorization', () => {
    test('should allow access for user with correct role', () => {
      mockReq.user = { id: '123', role: 'admin' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow staff role when staff is required', () => {
      mockReq.user = { id: '456', role: 'staff' };

      const middleware = checkRole('staff');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should deny access for user with wrong role', () => {
      mockReq.user = { id: '123', role: 'staff' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny admin trying to access staff-only resource', () => {
      mockReq.user = { id: '123', role: 'admin' };

      const middleware = checkRole('staff');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Roles Authorization', () => {
    test('should allow access if user has one of multiple allowed roles (admin)', () => {
      mockReq.user = { id: '123', role: 'admin' };

      const middleware = checkRole('admin', 'moderator');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow access if user has one of multiple allowed roles (moderator)', () => {
      mockReq.user = { id: '456', role: 'moderator' };

      const middleware = checkRole('admin', 'moderator');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow staff when multiple roles include staff', () => {
      mockReq.user = { id: '789', role: 'staff' };

      const middleware = checkRole('admin', 'staff', 'moderator');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should deny access if user role not in allowed list', () => {
      mockReq.user = { id: '123', role: 'user' };

      const middleware = checkRole('admin', 'moderator');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle three or more roles', () => {
      mockReq.user = { id: '123', role: 'editor' };

      const middleware = checkRole('admin', 'moderator', 'editor', 'staff');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('No User (Unauthenticated)', () => {
    test('should return 401 if req.user is undefined', () => {
      mockReq.user = undefined;

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Authenticated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if req.user is null', () => {
      mockReq.user = null;

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Authenticated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 if req.user is empty object', () => {
      mockReq.user = {}; // User exists but has no role property

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      // Empty object is truthy, so passes !req.user check
      // But req.user.role is undefined, not in allowedRoles, so returns 403
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 even with multiple allowed roles', () => {
      mockReq.user = undefined;

      const middleware = checkRole('admin', 'moderator', 'staff');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle case-sensitive role comparison', () => {
      mockReq.user = { id: '123', role: 'Admin' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle role with extra whitespace', () => {
      mockReq.user = { id: '123', role: ' admin ' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle empty string as role', () => {
      mockReq.user = { id: '123', role: '' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle null as role', () => {
      mockReq.user = { id: '123', role: null };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle undefined as role', () => {
      mockReq.user = { id: '123', role: undefined };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle numeric role', () => {
      mockReq.user = { id: '123', role: 123 };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow exact match with numeric role', () => {
      mockReq.user = { id: '123', role: 123 };

      const middleware = checkRole(123);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Middleware Function Factory', () => {
    test('should return a function', () => {
      const middleware = checkRole('admin');

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    test('should create independent middleware instances', () => {
      const adminMiddleware = checkRole('admin');
      const staffMiddleware = checkRole('staff');

      expect(adminMiddleware).not.toBe(staffMiddleware);
    });

    test('should handle being called without arguments', () => {
      mockReq.user = { id: '123', role: 'admin' };

      const middleware = checkRole();
      middleware(mockReq, mockRes, mockNext);

      // Should fail since no roles are allowed
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should not call next multiple times', () => {
      mockReq.user = { id: '123', role: 'admin' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-World Scenarios', () => {
    test('admin accessing admin-only resource', () => {
      mockReq.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('staff accessing admin-only resource (should fail)', () => {
      mockReq.user = {
        id: 'staff456',
        email: 'staff@example.com',
        role: 'staff',
      };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('staff or admin accessing shared resource', () => {
      mockReq.user = {
        id: 'staff789',
        email: 'staff@example.com',
        role: 'staff',
      };

      const middleware = checkRole('admin', 'staff');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('unauthenticated user trying to access any resource', () => {
      mockReq.user = undefined;

      const middleware = checkRole('admin', 'staff');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Authenticated',
      });
    });
  });

  describe('Response Format', () => {
    test('should return correct JSON structure for 401', () => {
      mockReq.user = null;

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Authenticated',
      });
    });

    test('should return correct JSON structure for 403', () => {
      mockReq.user = { id: '123', role: 'staff' };

      const middleware = checkRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    });

    test('should return consistent error messages', () => {
      mockReq.user = { id: '123', role: 'user' };

      const middleware1 = checkRole('admin');
      middleware1(mockReq, mockRes, mockNext);

      const errorMessage1 = mockRes.json.mock.calls[0][0].message;

      jest.clearAllMocks();

      const middleware2 = checkRole('moderator');
      middleware2(mockReq, mockRes, mockNext);

      const errorMessage2 = mockRes.json.mock.calls[0][0].message;

      expect(errorMessage1).toBe(errorMessage2);
    });
  });
});
