/**
 * BUSINESS CONTROLLER UNIT TESTS
 * ================================
 * Tests for business account management:
 * - Business registration
 * - API key generation and management
 * - Business verification (admin)
 */

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-jwt-token"),
}));

// Mock User model
jest.mock("../../../models/user.model", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

// Mock APIKey model
jest.mock("../../../models/apiKey.model", () => ({
  createKey: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
}));

// Mock card generator
jest.mock("../../../utils/cardGenerator", () => ({
  maskCardNumber: jest.fn((num) => `****${num.slice(-4)}`),
}));

const User = require("../../../models/user.model");
const APIKey = require("../../../models/apiKey.model");
const {
  registerBusiness,
  generateAPIKey,
  listAPIKeys,
  revokeAPIKey,
  getBusinessProfile,
  verifyBusiness,
  getPendingBusinesses,
  getVerifiedBusinesses,
} = require("../../../controllers/business.controller");

describe("Business Controller", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("registerBusiness", () => {
    test("should register a new business successfully", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        fullName: { firstName: "Business", lastName: "Owner" },
        email: "business@smu.edu.ph",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          businessType: "retail",
          isVerified: false,
        },
        wallet: { balance: { toString: () => "0" } },
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      mockReq.body = {
        fullName: { firstName: "Business", lastName: "Owner" },
        email: "business@smu.edu.ph",
        password: "SecurePass123!",
        businessInfo: {
          businessName: "Test Store",
          businessType: "retail",
          businessAddress: {
            street: "123 Business St",
            city: "Manila",
            state: "Metro Manila",
            country: "Philippines",
            postalCode: "1000",
          },
          businessPhone: "+639123456789",
        },
      };

      await registerBusiness(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("registered"),
        })
      );
    });

    test("should reject registration if email already exists", async () => {
      User.findOne.mockResolvedValue({ email: "business@smu.edu.ph" });

      mockReq.body = {
        fullName: { firstName: "Business", lastName: "Owner" },
        email: "business@smu.edu.ph",
        password: "SecurePass123!",
        businessInfo: {
          businessName: "Test Store",
        },
      };

      await registerBusiness(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("already exists"),
        })
      );
    });
  });

  describe("generateAPIKey", () => {
    test("should generate API key for verified business", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          isVerified: true,
        },
      };

      const mockAPIKey = {
        _id: "507f1f77bcf86cd799439012",
        keyPrefix: "scb_live_abc123",
        name: "Production Key",
        permissions: ["charge", "refund"],
        isActive: true,
        createdAt: new Date(),
      };

      mockReq.user = { id: mockUser._id };
      mockReq.body = {
        name: "Production Key",
        permissions: ["charge", "refund"],
      };

      User.findById.mockResolvedValue(mockUser);
      APIKey.countDocuments.mockResolvedValue(2);
      APIKey.createKey.mockResolvedValue({
        apiKey: mockAPIKey,
        plainKey: "scb_live_test123456789",
      });

      await generateAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            key: "scb_live_test123456789",
          }),
        })
      );
    });

    test("should reject API key generation for unverified business", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          isVerified: false,
        },
      };

      mockReq.user = { id: mockUser._id };
      mockReq.body = { name: "Test Key" };

      User.findById.mockResolvedValue(mockUser);

      await generateAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("verified"),
        })
      );
    });

    test("should reject API key generation for non-business account", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "personal",
      };

      mockReq.user = { id: mockUser._id };
      mockReq.body = { name: "Test Key" };

      User.findById.mockResolvedValue(mockUser);

      await generateAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("business accounts"),
        })
      );
    });

    test("should enforce maximum API key limit (5)", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          isVerified: true,
        },
      };

      mockReq.user = { id: mockUser._id };
      mockReq.body = { name: "Test Key" };

      User.findById.mockResolvedValue(mockUser);
      APIKey.countDocuments.mockResolvedValue(5);

      await generateAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Maximum"),
        })
      );
    });

    test("should reject if key name is too short", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          isVerified: true,
        },
      };

      mockReq.user = { id: mockUser._id };
      mockReq.body = { name: "AB" };

      User.findById.mockResolvedValue(mockUser);
      APIKey.countDocuments.mockResolvedValue(2);

      await generateAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("at least 3 characters"),
        })
      );
    });

    test("should return 404 if user not found", async () => {
      mockReq.user = { id: "nonexistent" };
      mockReq.body = { name: "Test Key" };

      User.findById.mockResolvedValue(null);

      await generateAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("listAPIKeys", () => {
    test("should list all API keys for business", async () => {
      const mockKeys = [
        {
          _id: "key1",
          keyPrefix: "scb_live_abc",
          name: "Production Key",
          permissions: ["charge"],
          isActive: true,
          createdAt: new Date(),
          usage: { totalRequests: 100, lastUsed: new Date() },
          revokedAt: null,
        },
        {
          _id: "key2",
          keyPrefix: "scb_live_def",
          name: "Test Key",
          permissions: ["charge", "refund"],
          isActive: false,
          createdAt: new Date(),
          usage: { totalRequests: 50, lastUsed: new Date() },
          revokedAt: new Date(),
        },
      ];

      mockReq.user = { id: "507f1f77bcf86cd799439011" };

      APIKey.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockKeys),
        }),
      });

      await listAPIKeys(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: expect.arrayContaining([
            expect.objectContaining({
              name: "Production Key",
            }),
          ]),
        })
      );
    });
  });

  describe("revokeAPIKey", () => {
    test("should revoke API key successfully", async () => {
      const mockAPIKey = {
        _id: "507f1f77bcf86cd799439012",
        business: "507f1f77bcf86cd799439011",
        keyPrefix: "scb_live_abc",
        name: "Test Key",
        isActive: true,
        revokedAt: null,
        revoke: jest.fn().mockImplementation(function () {
          this.isActive = false;
          this.revokedAt = new Date();
          return Promise.resolve(this);
        }),
      };

      mockReq.user = { id: "507f1f77bcf86cd799439011" };
      mockReq.params = { keyId: mockAPIKey._id };
      mockReq.body = { reason: "No longer needed" };

      APIKey.findOne.mockResolvedValue(mockAPIKey);

      await revokeAPIKey(mockReq, mockRes, mockNext);

      expect(mockAPIKey.revoke).toHaveBeenCalledWith("No longer needed");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("revoked"),
        })
      );
    });

    test("should return 404 for non-existent API key", async () => {
      mockReq.user = { id: "507f1f77bcf86cd799439011" };
      mockReq.params = { keyId: "nonexistent123456789012" };

      APIKey.findOne.mockResolvedValue(null);

      await revokeAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("not found"),
        })
      );
    });

    test("should reject if API key is already revoked", async () => {
      const mockAPIKey = {
        _id: "507f1f77bcf86cd799439012",
        business: "507f1f77bcf86cd799439011",
        isActive: false,
        revokedAt: new Date(),
      };

      mockReq.user = { id: "507f1f77bcf86cd799439011" };
      mockReq.params = { keyId: mockAPIKey._id };

      APIKey.findOne.mockResolvedValue(mockAPIKey);

      await revokeAPIKey(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("already revoked"),
        })
      );
    });
  });

  describe("getBusinessProfile", () => {
    test("should return business profile with API key count", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        fullName: { firstName: "Business", lastName: "Owner" },
        email: "business@smu.edu.ph",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          businessType: "retail",
          isVerified: true,
          verifiedAt: new Date(),
        },
        wallet: {
          balance: { toString: () => "5000.00" },
          currency: "PHP",
        },
        createdAt: new Date(),
      };

      mockReq.user = { id: mockUser._id };

      User.findById.mockResolvedValue(mockUser);
      APIKey.countDocuments.mockResolvedValue(3);

      await getBusinessProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            businessInfo: expect.objectContaining({
              businessName: "Test Store",
            }),
            apiKeyCount: 3,
          }),
        })
      );
    });

    test("should return 404 if user not found", async () => {
      mockReq.user = { id: "nonexistent" };

      User.findById.mockResolvedValue(null);

      await getBusinessProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("verifyBusiness (Admin)", () => {
    test("should verify business successfully", async () => {
      const mockBusiness = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          isVerified: false,
        },
        save: jest.fn().mockResolvedValue(true),
      };

      mockReq.params = { businessId: mockBusiness._id };
      mockReq.user = { id: "adminId", role: "admin" };

      User.findOne.mockResolvedValue(mockBusiness);

      await verifyBusiness(mockReq, mockRes, mockNext);

      expect(mockBusiness.businessInfo.isVerified).toBe(true);
      expect(mockBusiness.businessInfo.verifiedAt).toBeDefined();
      expect(mockBusiness.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("verified"),
        })
      );
    });

    test("should return 404 for non-existent business", async () => {
      mockReq.params = { businessId: "nonexistent" };

      User.findOne.mockResolvedValue(null);

      await verifyBusiness(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("not found"),
        })
      );
    });

    test("should reject if business already verified", async () => {
      const mockBusiness = {
        _id: "507f1f77bcf86cd799439011",
        accountType: "business",
        businessInfo: {
          businessName: "Test Store",
          isVerified: true,
          verifiedAt: new Date(),
        },
      };

      mockReq.params = { businessId: mockBusiness._id };

      User.findOne.mockResolvedValue(mockBusiness);

      await verifyBusiness(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("already verified"),
        })
      );
    });
  });

  describe("getPendingBusinesses (Admin)", () => {
    test("should return list of pending businesses", async () => {
      const mockBusinesses = [
        {
          _id: "business1",
          fullName: { firstName: "Owner", lastName: "One" },
          email: "owner1@smu.edu.ph",
          businessInfo: {
            businessName: "Store One",
            businessType: "retail",
            isVerified: false,
          },
          createdAt: new Date(),
        },
        {
          _id: "business2",
          fullName: { firstName: "Owner", lastName: "Two" },
          email: "owner2@smu.edu.ph",
          businessInfo: {
            businessName: "Store Two",
            businessType: "food",
            isVerified: false,
          },
          createdAt: new Date(),
        },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockBusinesses),
      });

      await getPendingBusinesses(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: expect.arrayContaining([
            expect.objectContaining({
              email: "owner1@smu.edu.ph",
            }),
          ]),
        })
      );
    });
  });

  describe("getVerifiedBusinesses (Admin)", () => {
    test("should return list of verified businesses", async () => {
      const mockBusinesses = [
        {
          _id: "business1",
          fullName: { firstName: "Verified", lastName: "Owner" },
          email: "verified@smu.edu.ph",
          businessInfo: {
            businessName: "Verified Store",
            isVerified: true,
            verifiedAt: new Date(),
          },
          wallet: {
            balance: { toString: () => "1000.00" },
          },
          createdAt: new Date(),
        },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockBusinesses),
      });

      await getVerifiedBusinesses(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          data: expect.arrayContaining([
            expect.objectContaining({
              email: "verified@smu.edu.ph",
              balance: 1000,
            }),
          ]),
        })
      );
    });
  });
});
