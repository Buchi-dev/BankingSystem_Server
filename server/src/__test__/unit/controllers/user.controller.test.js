/**
 * USER CONTROLLER TESTS
 * =====================
 * Unit tests for user controller functions (Auth + CRUD)
 */

const {
  register,
  login,
  getProfile,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  deleteAllUsers,
} = require('../../../controllers/user.controller');
const User = require('../../../models/user.model');
const jwt = require('jsonwebtoken');

jest.mock('../../../models/user.model');
jest.mock('jsonwebtoken');

describe('User Controller - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      req.body = {
        fullName: {
          firstName: 'John',
          lastName: 'Doe',
          middleInitial: 'A',
        },
        email: 'john.doe@smu.edu.ph',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        fullName: req.body.fullName,
        email: req.body.email,
        role: 'user',
      });
      jwt.sign.mockReturnValue('mock-token');

      await register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(User.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: expect.objectContaining({
            token: 'mock-token',
          }),
        })
      );
    });

    test('should return 400 if user already exists', async () => {
      req.body = {
        fullName: { firstName: 'Jane', lastName: 'Doe' },
        email: 'existing@smu.edu.ph',
        password: 'password123',
      };

      User.findOne.mockResolvedValue({ email: 'existing@smu.edu.ph' });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    test('should set default role to "user" if not specified', async () => {
      req.body = {
        fullName: { firstName: 'Test', lastName: 'User' },
        email: 'test@smu.edu.ph',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        fullName: req.body.fullName,
        email: req.body.email,
        role: 'user',
      });
      jwt.sign.mockReturnValue('token');

      await register(req, res, next);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
    });

    test('should handle errors and call next', async () => {
      req.body = {
        fullName: { firstName: 'Test', lastName: 'User' },
        email: 'test@smu.edu.ph',
        password: 'password123',
      };

      const error = new Error('Database error');
      User.findOne.mockRejectedValue(error);

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    test('should login user with valid credentials', async () => {
      req.body = {
        email: 'john@smu.edu.ph',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        email: 'john@smu.edu.ph',
        role: 'user',
        accountType: 'personal',
        fullName: {
          firstName: 'John',
          lastName: 'Doe',
        },
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      jwt.sign.mockReturnValue('login-token');

      await login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
        })
      );
    });

    test('should return 400 if email is missing', async () => {
      req.body = { password: 'password123' };

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required',
      });
    });

    test('should return 400 if password is missing', async () => {
      req.body = { email: 'john@smu.edu.ph' };

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required',
      });
    });

    test('should return 401 if user not found', async () => {
      req.body = {
        email: 'nonexistent@smu.edu.ph',
        password: 'password123',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    test('should return 401 if password is invalid', async () => {
      req.body = {
        email: 'john@smu.edu.ph',
        password: 'wrongpassword',
      };

      const mockUser = {
        _id: 'user123',
        email: 'john@smu.edu.ph',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    test('should handle errors and call next', async () => {
      req.body = {
        email: 'john@smu.edu.ph',
        password: 'password123',
      };

      const error = new Error('Database error');
      User.findOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfile', () => {
    test('should return user profile', async () => {
      req.user = { id: 'user123' };

      const mockUser = {
        _id: 'user123',
        fullName: { firstName: 'John', lastName: 'Doe' },
        email: 'john@smu.edu.ph',
        role: 'user',
      };

      User.findById.mockResolvedValue(mockUser);

      await getProfile(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test('should return 404 if user not found', async () => {
      req.user = { id: 'nonexistent' };

      User.findById.mockResolvedValue(null);

      await getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    test('should handle errors and call next', async () => {
      req.user = { id: 'user123' };
      const error = new Error('Database error');
      User.findById.mockRejectedValue(error);

      await getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllUsers', () => {
    test('should return all users', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@smu.edu.ph' },
        { _id: '2', email: 'user2@smu.edu.ph' },
      ];

      User.find.mockResolvedValue(mockUsers);

      await getAllUsers(req, res, next);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockUsers,
      });
    });

    test('should return 404 if no users found', async () => {
      User.find.mockResolvedValue(null);

      await getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Users Not Found',
      });
    });

    test('should handle errors and call next', async () => {
      const error = new Error('Database error');
      User.find.mockRejectedValue(error);

      await getAllUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserById', () => {
    test('should return user by id', async () => {
      req.params.id = 'user123';
      const mockUser = { _id: 'user123', email: 'john@smu.edu.ph' };

      User.findById.mockResolvedValue(mockUser);

      await getUserById(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test('should return 404 if user not found', async () => {
      req.params.id = 'nonexistent';

      User.findById.mockResolvedValue(null);

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User Not Found',
      });
    });

    test('should handle errors and call next', async () => {
      req.params.id = 'user123';
      const error = new Error('Database error');
      User.findById.mockRejectedValue(error);

      await getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createUser', () => {
    test('should create a new user', async () => {
      req.body = {
        fullName: { firstName: 'Jane', lastName: 'Doe' },
        email: 'jane@smu.edu.ph',
        password: 'password123',
      };

      const mockUser = { ...req.body, _id: 'newuser123' };
      User.create.mockResolvedValue(mockUser);

      await createUser(req, res, next);

      expect(User.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test('should handle errors and call next', async () => {
      req.body = { email: 'test@smu.edu.ph' };
      const error = new Error('Validation error');
      User.create.mockRejectedValue(error);

      await createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      req.params.id = 'user123';
      req.user = { id: 'admin456' };
      req.body = { fullName: { firstName: 'Updated' } };

      const mockUpdatedUser = {
        _id: 'user123',
        fullName: { firstName: 'Updated' },
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      await updateUser(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        req.body,
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
      });
    });

    test('should prevent user from changing own role', async () => {
      req.params.id = 'user123';
      req.user = { id: 'user123' };
      req.body = { role: 'admin' };

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You cannot change your own role',
      });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should return 404 if user not found', async () => {
      req.params.id = 'nonexistent';
      req.user = { id: 'admin123' };
      req.body = { fullName: { firstName: 'Test' } };

      User.findByIdAndUpdate.mockResolvedValue(null);

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User Not Found',
      });
    });

    test('should handle errors and call next', async () => {
      req.params.id = 'user123';
      req.user = { id: 'admin456' };
      req.body = { fullName: { firstName: 'Updated' } };

      const error = new Error('Database error');
      User.findByIdAndUpdate.mockRejectedValue(error);

      await updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      req.params.id = 'user123';
      req.user = { id: 'admin456' };

      const mockDeletedUser = { _id: 'user123', email: 'deleted@smu.edu.ph' };
      User.findByIdAndDelete.mockResolvedValue(mockDeletedUser);

      await deleteUser(req, res, next);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted',
        data: mockDeletedUser,
      });
    });

    test('should prevent user from deleting own profile', async () => {
      req.params.id = 'user123';
      req.user = { id: 'user123' };

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You cannot delete your own profile',
      });
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('should return 404 if user not found', async () => {
      req.params.id = 'nonexistent';
      req.user = { id: 'admin456' };

      User.findByIdAndDelete.mockResolvedValue(null);

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    test('should handle errors and call next', async () => {
      req.params.id = 'user123';
      req.user = { id: 'admin456' };

      const error = new Error('Database error');
      User.findByIdAndDelete.mockRejectedValue(error);

      await deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteAllUsers', () => {
    test('should delete all users successfully', async () => {
      User.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await deleteAllUsers(req, res, next);

      expect(User.deleteMany).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '5 users deleted',
      });
    });

    test('should handle zero deletions', async () => {
      User.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await deleteAllUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '0 users deleted',
      });
    });

    test('should handle errors and call next', async () => {
      const error = new Error('Database error');
      User.deleteMany.mockRejectedValue(error);

      await deleteAllUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
