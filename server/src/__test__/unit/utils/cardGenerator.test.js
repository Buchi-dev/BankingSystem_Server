/**
 * CARD GENERATOR UTILITY TESTS
 * ============================
 * Unit tests for card generation and validation utilities
 */

const {
  validateLuhn,
  generateCardNumber,
  calculateLuhnCheckDigit,
  maskCardNumber,
  formatCardNumber,
  validateCardFormat,
  generateCVV,
  hashCVV,
  compareCVV,
  validateCVVFormat,
  generatePIN,
  hashPIN,
  comparePIN,
  generateExpiryDate,
  isCardExpired,
  generateAPIKey,
  hashAPIKey,
} = require("../../../utils/cardGenerator");

describe("Card Generator Utilities", () => {
  describe("Luhn Algorithm", () => {
    test("should validate known valid card numbers", () => {
      // Known valid Luhn numbers
      expect(validateLuhn("4111111111111111")).toBe(true); // Visa test card
      expect(validateLuhn("5500000000000004")).toBe(true); // MasterCard test
      expect(validateLuhn("340000000000009")).toBe(true);  // AmEx test
    });

    test("should reject invalid card numbers", () => {
      expect(validateLuhn("4111111111111112")).toBe(false);
      expect(validateLuhn("1234567890123456")).toBe(false);
      // Note: 0000000000000000 is technically valid Luhn (sum=0)
      // Using a known invalid number instead
      expect(validateLuhn("4111111111111110")).toBe(false);
    });

    test("should reject card numbers with wrong length", () => {
      expect(validateLuhn("411111")).toBe(false);
      expect(validateLuhn("41111111111111111111")).toBe(false);
    });

    test("should handle non-numeric characters", () => {
      // Should strip non-numeric and still validate
      expect(validateLuhn("4111-1111-1111-1111")).toBe(true);
      expect(validateLuhn("4111 1111 1111 1111")).toBe(true);
    });
  });

  describe("Card Number Generation", () => {
    test("should generate valid 16-digit card number", () => {
      const cardNumber = generateCardNumber();
      
      expect(cardNumber).toHaveLength(16);
      expect(/^\d{16}$/.test(cardNumber)).toBe(true);
    });

    test("should generate card number starting with 4", () => {
      const cardNumber = generateCardNumber();
      
      expect(cardNumber[0]).toBe("4");
    });

    test("should generate Luhn-valid card number", () => {
      const cardNumber = generateCardNumber();
      
      expect(validateLuhn(cardNumber)).toBe(true);
    });

    test("should generate unique card numbers", () => {
      const cards = new Set();
      for (let i = 0; i < 100; i++) {
        cards.add(generateCardNumber());
      }
      
      // All 100 should be unique
      expect(cards.size).toBe(100);
    });
  });

  describe("Luhn Check Digit Calculation", () => {
    test("should calculate correct check digit", () => {
      // Known prefix that should result in check digit 1
      const partial = "411111111111111";
      const checkDigit = calculateLuhnCheckDigit(partial);
      const fullNumber = partial + checkDigit;
      
      expect(validateLuhn(fullNumber)).toBe(true);
    });

    test("should work for any partial number", () => {
      const partial = "412345678901234";
      const checkDigit = calculateLuhnCheckDigit(partial);
      const fullNumber = partial + checkDigit;
      
      expect(validateLuhn(fullNumber)).toBe(true);
    });
  });

  describe("Card Formatting", () => {
    test("should mask card number correctly", () => {
      const masked = maskCardNumber("4111111111111111");
      
      expect(masked).toBe("**** **** **** 1111");
    });

    test("should format card number with spaces", () => {
      const formatted = formatCardNumber("4111111111111111");
      
      expect(formatted).toBe("4111 1111 1111 1111");
    });
  });

  describe("Card Format Validation", () => {
    test("should validate correct card format", () => {
      const result = validateCardFormat("4111111111111111");
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test("should reject missing card number", () => {
      const result = validateCardFormat(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Card number is required");
    });

    test("should reject wrong length", () => {
      const result = validateCardFormat("411111");
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Card number must be 16 digits");
    });

    test("should reject wrong issuer prefix", () => {
      const result = validateCardFormat("5111111111111111");
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid card issuer");
    });

    test("should reject invalid Luhn", () => {
      const result = validateCardFormat("4111111111111112");
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid card number");
    });
  });

  describe("CVV Generation and Validation", () => {
    test("should generate 3-digit CVV", () => {
      const cvv = generateCVV();
      
      expect(cvv).toHaveLength(3);
      expect(/^\d{3}$/.test(cvv)).toBe(true);
    });

    test("should hash CVV securely", async () => {
      const cvv = "123";
      const hashed = await hashCVV(cvv);
      
      expect(hashed).not.toBe(cvv);
      expect(hashed.length).toBeGreaterThan(10);
    });

    test("should compare CVV correctly", async () => {
      const cvv = "456";
      const hashed = await hashCVV(cvv);
      
      expect(await compareCVV("456", hashed)).toBe(true);
      expect(await compareCVV("789", hashed)).toBe(false);
    });

    test("should validate CVV format", () => {
      expect(validateCVVFormat("123").isValid).toBe(true);
      expect(validateCVVFormat("12").isValid).toBe(false);
      expect(validateCVVFormat("1234").isValid).toBe(false);
      expect(validateCVVFormat("abc").isValid).toBe(false);
      expect(validateCVVFormat(null).isValid).toBe(false);
    });
  });

  describe("PIN Generation and Validation", () => {
    test("should generate 4-digit PIN", () => {
      const pin = generatePIN();
      
      expect(pin).toHaveLength(4);
      expect(/^\d{4}$/.test(pin)).toBe(true);
    });

    test("should hash PIN securely", async () => {
      const pin = "1234";
      const hashed = await hashPIN(pin);
      
      expect(hashed).not.toBe(pin);
      expect(hashed.length).toBeGreaterThan(10);
    });

    test("should compare PIN correctly", async () => {
      const pin = "5678";
      const hashed = await hashPIN(pin);
      
      expect(await comparePIN("5678", hashed)).toBe(true);
      expect(await comparePIN("1234", hashed)).toBe(false);
    });
  });

  describe("Expiry Date", () => {
    test("should generate expiry date 3 years in future", () => {
      const expiry = generateExpiryDate();
      const now = new Date();
      const threeYearsFromNow = new Date();
      threeYearsFromNow.setFullYear(now.getFullYear() + 3);
      
      // Should be approximately 3 years from now (within a day)
      const diff = Math.abs(expiry.getTime() - threeYearsFromNow.getTime());
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000); // Less than 1 day difference
    });

    test("should correctly identify expired cards", () => {
      const pastDate = new Date("2020-01-01");
      const futureDate = new Date("2099-01-01");
      
      expect(isCardExpired(pastDate)).toBe(true);
      expect(isCardExpired(futureDate)).toBe(false);
    });
  });

  describe("API Key Generation", () => {
    test("should generate API key with correct prefix", () => {
      const key = generateAPIKey();
      
      expect(key.startsWith("scb_live_")).toBe(true);
    });

    test("should generate API key with custom prefix", () => {
      const key = generateAPIKey("scb_test_");
      
      expect(key.startsWith("scb_test_")).toBe(true);
    });

    test("should generate unique API keys", () => {
      const keys = new Set();
      for (let i = 0; i < 50; i++) {
        keys.add(generateAPIKey());
      }
      
      expect(keys.size).toBe(50);
    });

    test("should hash API key consistently", () => {
      const key = "scb_live_abc123xyz";
      const hash1 = hashAPIKey(key);
      const hash2 = hashAPIKey(key);
      
      expect(hash1).toBe(hash2);
    });

    test("should produce different hash for different keys", () => {
      const hash1 = hashAPIKey("scb_live_key1");
      const hash2 = hashAPIKey("scb_live_key2");
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
