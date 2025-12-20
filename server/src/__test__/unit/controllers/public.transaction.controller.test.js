/**
 * PUBLIC TRANSACTION CONTROLLER TESTS
 * ====================================
 * Unit tests for public API transaction controller functions
 */

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));

jest.mock("../../../models/user.model");
jest.mock("../../../models/transaction.model");
jest.mock("../../../utils/cardGenerator");

const mongoose = require("mongoose");

// Mock mongoose session
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const originalStartSession = mongoose.startSession;
mongoose.startSession = jest.fn(() => Promise.resolve(mockSession));

const originalDecimal128 = mongoose.Types.Decimal128;
mongoose.Types.Decimal128.fromString = jest.fn((val) => ({
  toString: () => val,
}));

const {
  chargeCard,
  refundTransaction,
  getTransaction,
  getBusinessTransactions,
  getBusinessBalance,
  verifyCard,
} = require("../../../controllers/public.transaction.controller");

const User = require("../../../models/user.model");
const Transaction = require("../../../models/transaction.model");
const { validateCardFormat, validateCVVFormat } = require("../../../utils/cardGenerator");

describe("Public Transaction Controller - Unit Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      business: {
        _id: "business123",
        businessInfo: {
          businessName: "Test Business",
          isVerified: true, // Business must be verified to process transactions
        },
      },
      apiKey: {
        _id: "apikey123",
        recordTransaction: jest.fn(),
        save: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("chargeCard", () => {
    beforeEach(() => {
      req.body = {
        cardNumber: "4111111111111111",
        cvv: "123",
        amount: 100,
        description: "Test purchase",
      };
    });

    test("should return 403 if business is not verified", async () => {
      // Override business to be unverified
      req.business = {
        _id: "business123",
        businessInfo: {
          businessName: "Unverified Business",
          isVerified: false,
        },
      };

      await chargeCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "BUSINESS_NOT_VERIFIED",
          message: "Business must be verified before processing transactions.",
        },
      });
    });

    test("should return 404 if card not found", async () => {
      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(null),
        }),
      });

      await chargeCard(req, res, next);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CARD_NOT_FOUND",
          message: "Card not found or invalid.",
        },
      });
    });

    test("should return 400 if card is inactive", async () => {
      const mockCustomer = {
        virtualCard: {
          isActive: false,
        },
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      await chargeCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CARD_INACTIVE",
          message: "This card is not active.",
        },
      });
    });

    test("should return 400 if card is expired", async () => {
      const mockCustomer = {
        virtualCard: {
          isActive: true,
        },
        isCardExpired: jest.fn().mockReturnValue(true),
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      await chargeCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CARD_EXPIRED",
          message: "This card has expired.",
        },
      });
    });

    test("should return 400 if CVV is invalid", async () => {
      const mockCustomer = {
        virtualCard: {
          isActive: true,
        },
        isCardExpired: jest.fn().mockReturnValue(false),
        compareCVV: jest.fn().mockResolvedValue(false),
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      await chargeCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_CVV",
          message: "Invalid CVV.",
        },
      });
    });

    test("should return 400 if daily limit exceeded", async () => {
      const mockCustomer = {
        virtualCard: {
          isActive: true,
        },
        isCardExpired: jest.fn().mockReturnValue(false),
        compareCVV: jest.fn().mockResolvedValue(true),
        canSpend: jest.fn().mockReturnValue(false),
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      await chargeCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "DAILY_LIMIT_EXCEEDED",
          message: "Daily spending limit exceeded.",
        },
      });
    });

    test("should return 400 if insufficient funds", async () => {
      const mockCustomer = {
        _id: "customer123",
        virtualCard: {
          isActive: true,
        },
        wallet: {
          balance: { toString: () => "50" },
        },
        isCardExpired: jest.fn().mockReturnValue(false),
        compareCVV: jest.fn().mockResolvedValue(true),
        canSpend: jest.fn().mockReturnValue(true),
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      await chargeCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Insufficient funds in card.",
        },
      });
    });

    test("should charge card successfully", async () => {
      const mockCustomer = {
        _id: "customer123",
        virtualCard: {
          isActive: true,
        },
        wallet: {
          balance: { toString: () => "500" },
        },
        isCardExpired: jest.fn().mockReturnValue(false),
        compareCVV: jest.fn().mockResolvedValue(true),
        canSpend: jest.fn().mockReturnValue(true),
        recordSpending: jest.fn(),
        save: jest.fn(),
      };

      const mockBusiness = {
        _id: "business123",
        wallet: {
          balance: { toString: () => "1000" },
        },
        save: jest.fn(),
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockCustomer),
        }),
      });

      User.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockBusiness),
      });

      const mockTransactionSave = jest.fn();
      Transaction.mockImplementation(() => ({
        save: mockTransactionSave,
        reference: "mock-uuid-1234",
        amount: 100,
        status: "completed",
        cardUsed: { last4: "1111" },
        description: "Test purchase",
        createdAt: new Date(),
      }));

      await chargeCard(req, res, next);

      expect(mockCustomer.recordSpending).toHaveBeenCalledWith(100);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            transactionId: expect.any(String),
            amount: 100,
            currency: "PHP",
            status: "completed",
          }),
        })
      );
    });
  });

  describe("getTransaction", () => {
    test("should return 404 if transaction not found", async () => {
      req.params.reference = "nonexistent-ref";

      Transaction.findOne = jest.fn().mockResolvedValue(null);

      await getTransaction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found.",
        },
      });
    });

    test("should return transaction successfully", async () => {
      req.params.reference = "valid-ref-123";

      const mockTransaction = {
        reference: "valid-ref-123",
        type: "payment",
        amount: 150,
        status: "completed",
        cardUsed: { last4: "1234" },
        description: "Test payment",
        externalReference: "ext-123",
        createdAt: new Date(),
      };

      Transaction.findOne = jest.fn().mockResolvedValue(mockTransaction);

      await getTransaction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          transactionId: "valid-ref-123",
          type: "payment",
          amount: 150,
          status: "completed",
        }),
      });
    });
  });

  describe("getBusinessTransactions", () => {
    test("should return paginated transactions", async () => {
      req.query = { page: 1, limit: 10 };

      const mockTransactions = [
        {
          reference: "ref-1",
          type: "payment",
          amount: 100,
          status: "completed",
          cardUsed: { last4: "1111" },
          description: "Payment 1",
          createdAt: new Date(),
        },
        {
          reference: "ref-2",
          type: "refund",
          amount: 50,
          status: "completed",
          cardUsed: { last4: "2222" },
          description: "Refund 1",
          createdAt: new Date(),
        },
      ];

      Transaction.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      });

      Transaction.countDocuments = jest.fn().mockResolvedValue(2);

      await getBusinessTransactions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transactions: expect.arrayContaining([
            expect.objectContaining({ transactionId: "ref-1" }),
            expect.objectContaining({ transactionId: "ref-2" }),
          ]),
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      });
    });
  });

  describe("getBusinessBalance", () => {
    test("should return 404 if business not found", async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      await getBusinessBalance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should return business balance", async () => {
      const mockBusinessAccount = {
        wallet: {
          balance: { toString: () => "5000" },
          currency: "PHP",
        },
        businessInfo: {
          businessName: "Test Business",
        },
      };

      User.findById = jest.fn().mockResolvedValue(mockBusinessAccount);

      await getBusinessBalance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          balance: 5000,
          currency: "PHP",
          businessName: "Test Business",
        },
      });
    });
  });

  describe("verifyCard", () => {
    test("should return 400 for invalid card format", async () => {
      req.body = { cardNumber: "invalid", cvv: "123" };

      validateCardFormat.mockReturnValue({
        isValid: false,
        error: "Invalid card number",
      });

      await verifyCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_CARD_FORMAT",
          message: "Invalid card number",
        },
      });
    });

    test("should return 404 if card not found", async () => {
      req.body = { cardNumber: "4111111111111111", cvv: "123" };

      validateCardFormat.mockReturnValue({ isValid: true, error: null });
      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await verifyCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should verify card successfully", async () => {
      req.body = { cardNumber: "4111111111111111", cvv: "123" };

      validateCardFormat.mockReturnValue({ isValid: true, error: null });

      const mockCustomer = {
        virtualCard: {
          isActive: true,
          expiryDate: new Date("2030-01-01"),
        },
        compareCVV: jest.fn().mockResolvedValue(true),
        isCardExpired: jest.fn().mockReturnValue(false),
      };

      User.findByCardNumber = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCustomer),
      });

      await verifyCard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          valid: true,
          cardLast4: "1111",
          isActive: true,
          isExpired: false,
          expiryDate: mockCustomer.virtualCard.expiryDate,
        },
      });
    });
  });
});
