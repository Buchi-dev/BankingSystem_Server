/**
 * CORS MIDDLEWARE UNIT TESTS
 * ==========================
 * Tests for dynamic CORS origin validation
 * 
 * Security Focus:
 * - Origin spoofing prevention
 * - Wildcard pattern matching
 * - API key origin validation
 * - Attack vector prevention
 */

const { matchOriginPattern } = require("../../../middlewares/cors.middleware");

describe("CORS Middleware", () => {
  describe("matchOriginPattern - Exact Match", () => {
    test("should match exact origin", () => {
      expect(matchOriginPattern("https://example.com", "https://example.com")).toBe(true);
    });

    test("should match origin with port", () => {
      expect(matchOriginPattern("https://example.com:3000", "https://example.com:3000")).toBe(true);
    });

    test("should NOT match different origins", () => {
      expect(matchOriginPattern("https://evil.com", "https://example.com")).toBe(false);
    });

    test("should NOT match http vs https (protocol mismatch)", () => {
      expect(matchOriginPattern("http://example.com", "https://example.com")).toBe(false);
    });

    test("should NOT match with different ports", () => {
      expect(matchOriginPattern("https://example.com:3000", "https://example.com:4000")).toBe(false);
    });

    test("should NOT match subdomain when exact is expected", () => {
      expect(matchOriginPattern("https://sub.example.com", "https://example.com")).toBe(false);
    });

    test("should NOT match with trailing slash difference", () => {
      expect(matchOriginPattern("https://example.com/", "https://example.com")).toBe(false);
    });
  });

  describe("matchOriginPattern - Wildcard Pattern Matching", () => {
    test("should match single subdomain with wildcard", () => {
      expect(matchOriginPattern("https://app.example.com", "https://*.example.com")).toBe(true);
    });

    test("should match different subdomains with same wildcard", () => {
      expect(matchOriginPattern("https://api.example.com", "https://*.example.com")).toBe(true);
      expect(matchOriginPattern("https://www.example.com", "https://*.example.com")).toBe(true);
      expect(matchOriginPattern("https://staging.example.com", "https://*.example.com")).toBe(true);
      expect(matchOriginPattern("https://dev.example.com", "https://*.example.com")).toBe(true);
    });

    test("should match subdomain with hyphen", () => {
      expect(matchOriginPattern("https://my-app.example.com", "https://*.example.com")).toBe(true);
    });

    test("should match subdomain with numbers", () => {
      expect(matchOriginPattern("https://app123.example.com", "https://*.example.com")).toBe(true);
    });

    test("should NOT match multi-level subdomain with single wildcard", () => {
      // Security: *.example.com should NOT match sub.sub.example.com
      expect(matchOriginPattern("https://a.b.example.com", "https://*.example.com")).toBe(false);
    });

    test("should NOT match root domain with subdomain wildcard", () => {
      expect(matchOriginPattern("https://example.com", "https://*.example.com")).toBe(false);
    });

    test("should NOT match different domain with wildcard", () => {
      expect(matchOriginPattern("https://evil.com", "https://*.example.com")).toBe(false);
    });

    test("should NOT allow protocol downgrade via wildcard", () => {
      expect(matchOriginPattern("http://app.example.com", "https://*.example.com")).toBe(false);
    });

    test("should handle wildcard with port", () => {
      expect(matchOriginPattern("https://app.example.com:3000", "https://*.example.com:3000")).toBe(true);
      expect(matchOriginPattern("https://app.example.com:4000", "https://*.example.com:3000")).toBe(false);
    });
  });

  describe("matchOriginPattern - Edge Cases & Null Safety", () => {
    test("should handle null origin", () => {
      expect(matchOriginPattern(null, "https://example.com")).toBe(false);
    });

    test("should handle undefined origin", () => {
      expect(matchOriginPattern(undefined, "https://example.com")).toBe(false);
    });

    test("should handle empty string origin", () => {
      expect(matchOriginPattern("", "https://example.com")).toBe(false);
    });

    test("should handle null pattern", () => {
      expect(matchOriginPattern("https://example.com", null)).toBe(false);
    });

    test("should handle undefined pattern", () => {
      expect(matchOriginPattern("https://example.com", undefined)).toBe(false);
    });

    test("should handle empty string pattern", () => {
      expect(matchOriginPattern("https://example.com", "")).toBe(false);
    });

    test("should handle both null", () => {
      expect(matchOriginPattern(null, null)).toBe(false);
    });
  });

  describe("matchOriginPattern - Security Attack Vectors", () => {
    test("should NOT match with URL path injection", () => {
      // Attacker tries: https://evil.com/https://example.com
      expect(matchOriginPattern("https://evil.com/https://example.com", "https://example.com")).toBe(false);
    });

    test("should NOT match with @ injection (credential attack)", () => {
      // Attacker tries: https://example.com@evil.com
      expect(matchOriginPattern("https://example.com@evil.com", "https://example.com")).toBe(false);
    });

    test("should NOT match domain suffix attacks", () => {
      // Attacker registers evilexample.com to bypass example.com check
      expect(matchOriginPattern("https://evilexample.com", "https://example.com")).toBe(false);
      expect(matchOriginPattern("https://evil-example.com", "https://example.com")).toBe(false);
      expect(matchOriginPattern("https://notexample.com", "https://example.com")).toBe(false);
    });

    test("should NOT match domain prefix attacks", () => {
      // Attacker tries example.com.evil.com
      expect(matchOriginPattern("https://example.com.evil.com", "https://example.com")).toBe(false);
    });

    test("should NOT match backslash bypass attempt", () => {
      expect(matchOriginPattern("https://evil.com\\@example.com", "https://example.com")).toBe(false);
    });

    test("should NOT match newline injection", () => {
      expect(matchOriginPattern("https://example.com\nhttps://evil.com", "https://example.com")).toBe(false);
    });

    test("should NOT match carriage return injection", () => {
      expect(matchOriginPattern("https://example.com\rhttps://evil.com", "https://example.com")).toBe(false);
    });

    test("should NOT match null byte injection", () => {
      expect(matchOriginPattern("https://evil.com\0https://example.com", "https://example.com")).toBe(false);
    });

    test("should NOT match tab character injection", () => {
      expect(matchOriginPattern("https://example.com\thttps://evil.com", "https://example.com")).toBe(false);
    });

    test("should NOT match unicode homograph attacks", () => {
      // Using similar-looking unicode characters
      expect(matchOriginPattern("https://exаmple.com", "https://example.com")).toBe(false); // Cyrillic 'а'
    });

    test("should NOT match fragment injection", () => {
      expect(matchOriginPattern("https://evil.com#https://example.com", "https://example.com")).toBe(false);
    });

    test("should NOT match query string injection", () => {
      expect(matchOriginPattern("https://evil.com?redirect=https://example.com", "https://example.com")).toBe(false);
    });
  });

  describe("matchOriginPattern - Wildcard Security", () => {
    test("should NOT match wildcard subdomain spoofing", () => {
      // Attacker tries app.example.com.evil.com
      expect(matchOriginPattern("https://app.example.com.evil.com", "https://*.example.com")).toBe(false);
    });

    test("should NOT match wildcard with suffix attack", () => {
      // Attacker registers appexample.com
      expect(matchOriginPattern("https://appexample.com", "https://*.example.com")).toBe(false);
    });

    test("should handle regex special characters in domain safely", () => {
      // Domains with special regex chars shouldn't break matching or cause ReDOS
      expect(matchOriginPattern("https://my-app.example.com", "https://*.example.com")).toBe(true);
      expect(matchOriginPattern("https://my_app.example.com", "https://*.example.com")).toBe(true);
    });

    test("should NOT allow dangerous universal wildcards", () => {
      // These patterns should never match anything
      expect(matchOriginPattern("https://anything.com", "*")).toBe(false);
      expect(matchOriginPattern("https://anything.com", "https://*")).toBe(false);
      expect(matchOriginPattern("https://anything.com", "http://*")).toBe(false);
    });

    test("should NOT match wildcard in middle of domain", () => {
      // Only subdomain wildcards should work, not *.*.com type patterns
      expect(matchOriginPattern("https://app.example.com", "https://app.*.com")).toBe(false);
    });
  });

  describe("matchOriginPattern - Case Sensitivity", () => {
    test("should handle case sensitivity correctly", () => {
      // Domain names should typically be case-insensitive, but exact string match is safer
      // These tests document the current behavior
      expect(matchOriginPattern("https://EXAMPLE.COM", "https://example.com")).toBe(false);
      expect(matchOriginPattern("https://Example.Com", "https://example.com")).toBe(false);
    });

    test("should handle mixed case subdomain", () => {
      expect(matchOriginPattern("https://APP.example.com", "https://*.example.com")).toBe(true);
    });
  });

  describe("matchOriginPattern - Real World Scenarios", () => {
    test("should match typical production origin", () => {
      expect(matchOriginPattern("https://www.myshop.com", "https://www.myshop.com")).toBe(true);
    });

    test("should match typical staging origin with wildcard", () => {
      expect(matchOriginPattern("https://staging.myshop.com", "https://*.myshop.com")).toBe(true);
    });

    test("should match localhost with port for development", () => {
      expect(matchOriginPattern("http://localhost:3000", "http://localhost:3000")).toBe(true);
    });

    test("should NOT match localhost without port when port specified", () => {
      expect(matchOriginPattern("http://localhost", "http://localhost:3000")).toBe(false);
    });

    test("should match 127.0.0.1 for development", () => {
      expect(matchOriginPattern("http://127.0.0.1:5173", "http://127.0.0.1:5173")).toBe(true);
    });

    test("should handle Vercel preview URLs", () => {
      expect(matchOriginPattern("https://myapp-abc123.vercel.app", "https://*.vercel.app")).toBe(true);
    });

    test("should handle Netlify preview URLs", () => {
      expect(matchOriginPattern("https://deploy-preview-123--myapp.netlify.app", "https://*.netlify.app")).toBe(true);
    });

    test("should handle GitHub Pages", () => {
      expect(matchOriginPattern("https://username.github.io", "https://username.github.io")).toBe(true);
    });
  });
});
