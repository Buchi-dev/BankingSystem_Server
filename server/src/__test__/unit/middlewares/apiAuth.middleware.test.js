/**
 * API AUTH MIDDLEWARE TESTS
 * =========================
 * Unit tests for API key authentication middleware
 */

const { apiAuth, requirePermission, checkTransactionLimit } = require("../../../middlewares/apiAuth.middleware");
const APIKey = require("../../../models/apiKey.model");

// Mock the APIKey model
jest.mock("../../../models/apiKey.model");

describe("API Auth Middleware - Unit Tests", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {},
      ip: "127.0.0.1",
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("apiAuth", () => {
    test("should return 401 if no API key provided", async () => {
      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "MISSING_API_KEY",
          message: "API key is required. Provide it in the X-API-Key header.",
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 for invalid API key format", async () => {
      mockReq.headers["x-api-key"] = "invalid_key_format";

      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_API_KEY_FORMAT",
          message: "Invalid API key format.",
        },
      });
    });

    test("should return 401 for non-existent API key", async () => {
      mockReq.headers["x-api-key"] = "scb_live_nonexistent123";
      APIKey.findByKey.mockResolvedValue(null);

      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "Invalid or expired API key.",
        },
      });
    });

    test("should return 403 for unverified business", async () => {
      mockReq.headers["x-api-key"] = "scb_live_valid123";
      
      const mockKeyDoc = {
        business: {
          businessInfo: {
            isVerified: false,
          },
        },
        isIPAllowed: jest.fn().mockReturnValue(true),
        checkRateLimit: jest.fn().mockReturnValue(true),
        recordUsage: jest.fn(),
        save: jest.fn(),
      };
      
      APIKey.findByKey.mockResolvedValue(mockKeyDoc);

      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "BUSINESS_NOT_VERIFIED",
          message: "Business account is not verified. Please complete verification first.",
        },
      });
    });

    test("should return 403 for blocked IP", async () => {
      mockReq.headers["x-api-key"] = "scb_live_valid123";
      
      const mockKeyDoc = {
        business: {
          businessInfo: {
            isVerified: true,
          },
        },
        isIPAllowed: jest.fn().mockReturnValue(false),
      };
      
      APIKey.findByKey.mockResolvedValue(mockKeyDoc);

      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "IP_NOT_ALLOWED",
          message: "Request from this IP address is not allowed.",
        },
      });
    });

    test("should return 429 when rate limit exceeded", async () => {
      mockReq.headers["x-api-key"] = "scb_live_valid123";
      
      const mockKeyDoc = {
        business: {
          businessInfo: {
            isVerified: true,
          },
        },
        isIPAllowed: jest.fn().mockReturnValue(true),
        checkRateLimit: jest.fn().mockReturnValue(false),
      };
      
      APIKey.findByKey.mockResolvedValue(mockKeyDoc);

      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "API rate limit exceeded. Please try again later.",
        },
      });
    });

    test("should authenticate valid API key and call next", async () => {
      mockReq.headers["x-api-key"] = "scb_live_valid123";
      
      const mockBusiness = {
        _id: "business123",
        businessInfo: {
          isVerified: true,
        },
      };
      
      const mockKeyDoc = {
        _id: "key123",
        business: mockBusiness,
        isIPAllowed: jest.fn().mockReturnValue(true),
        checkRateLimit: jest.fn().mockReturnValue(true),
        recordUsage: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      
      APIKey.findByKey.mockResolvedValue(mockKeyDoc);

      await apiAuth(mockReq, mockRes, mockNext);

      expect(mockKeyDoc.recordUsage).toHaveBeenCalled();
      expect(mockKeyDoc.save).toHaveBeenCalled();
      expect(mockReq.apiKey).toBe(mockKeyDoc);
      expect(mockReq.business).toBe(mockBusiness);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requirePermission", () => {
    test("should return 401 if no API key attached", () => {
      const middleware = requirePermission("charge");
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_AUTHENTICATED",
          message: "API authentication required.",
        },
      });
    });

    test("should return 403 if permission not granted", () => {
      mockReq.apiKey = {
        hasPermission: jest.fn().mockReturnValue(false),
      };

      const middleware = requirePermission("refund");
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "PERMISSION_DENIED",
          message: "This API key does not have 'refund' permission.",
        },
      });
    });

    test("should call next if permission granted", () => {
      mockReq.apiKey = {
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const middleware = requirePermission("charge");
      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.apiKey.hasPermission).toHaveBeenCalledWith("charge");
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("checkTransactionLimit", () => {
    test("should return 401 if no API key attached", async () => {
      mockReq.body.amount = 100;

      await checkTransactionLimit(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test("should return 400 for invalid amount", async () => {
      mockReq.apiKey = { canProcessTransaction: jest.fn() };
      mockReq.body.amount = -50;

      await checkTransactionLimit(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_AMOUNT",
          message: "Valid amount is required.",
        },
      });
    });

    test("should return 400 if transaction limit exceeded", async () => {
      mockReq.apiKey = {
        canProcessTransaction: jest.fn().mockReturnValue({
          allowed: false,
          reason: "Daily limit exceeded",
        }),
      };
      mockReq.body.amount = 1000000;

      await checkTransactionLimit(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "TRANSACTION_LIMIT_EXCEEDED",
          message: "Daily limit exceeded",
        },
      });
    });

    test("should call next if within limits", async () => {
      mockReq.apiKey = {
        canProcessTransaction: jest.fn().mockReturnValue({ allowed: true }),
      };
      mockReq.body.amount = 500;

      await checkTransactionLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
