# Public API Documentation

External integration API for merchants, vendors, and third-party systems. These endpoints use API key authentication and are designed for server-to-server or secure frontend integrations.

## Table of Contents

- [Authentication](#authentication)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
  - [Verification](#verification)
  - [Payment Processing](#payment-processing)
  - [Transaction Management](#transaction-management)
  - [Card Verification](#card-verification)
  - [Business Balance](#business-balance)
- [Error Handling](#error-handling)
- [Rate Limits & Transaction Limits](#rate-limits--transaction-limits)
- [CORS & Security](#cors--security)
- [Testing](#testing)

---

## Authentication

### API Key Authentication

All Public API endpoints require authentication via API key in the request header:

```http
X-API-Key: scb_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Obtaining an API Key

1. **Register a business account** via `POST /api/business/register`
2. **Wait for admin verification** (required for API key generation)
3. **Generate API key** via `POST /api/business/api-keys`
4. **Configure permissions and origins** for your API key

### API Key Format

```
scb_live_<random_64_character_string>
```

### Security Best Practices

- **Never expose API keys** in client-side code or version control
- **Use environment variables** to store keys
- **Rotate keys regularly** for enhanced security
- **Use HTTPS only** in production
- **Whitelist specific origins** for browser-based requests

---

## Getting Started

### Quick Integration Example (Node.js)

```javascript
const axios = require('axios');

const API_KEY = process.env.SCB_API_KEY;
const API_BASE_URL = 'https://api.smartcitybanking.com/api/public';

// Verify API key is working
async function verifyApiKey() {
  try {
    const response = await axios.get(`${API_BASE_URL}/verify`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    console.log('API Key Valid:', response.data);
  } catch (error) {
    console.error('API Key Invalid:', error.response.data);
  }
}

// Charge a customer's card
async function chargeCard(cardNumber, cvv, amount, description) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/transactions/charge`,
      {
        cardNumber,
        cvv,
        amount,
        description,
        externalReference: `ORDER-${Date.now()}`
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Charge Failed:', error.response.data);
    throw error;
  }
}
```

---

## API Endpoints

Base URL: `/api/public`

### Verification

#### Verify API Key

Test if your API key is valid and properly configured.

**Endpoint:** `GET /api/public/verify`

**Authentication:** API Key required

**Permissions:** None (any valid key)

**Request Headers:**
```http
X-API-Key: scb_live_abc123...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "API key is valid",
  "data": {
    "business": {
      "_id": "674a8f9c8e1234567890xyz1",
      "businessName": "Pedro's Food Stall",
      "businessType": "food",
      "isVerified": true
    },
    "apiKey": {
      "name": "Production Website Key",
      "permissions": ["charge", "refund", "transactions"],
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerDay": 10000
      }
    }
  }
}
```

**Use Cases:**
- Test API key configuration
- Verify CORS origins are working
- Check remaining permissions
- Get business information

---

### Payment Processing

#### Charge Card

Process a payment by charging a customer's virtual card.

**Endpoint:** `POST /api/public/transactions/charge`

**Authentication:** API Key required

**Permissions:** `charge`

**Request Body:**
```json
{
  "cardNumber": "4532123456789012",
  "cvv": "123",
  "amount": 150.50,
  "description": "Coffee and Pastry - Order #1234",
  "externalReference": "ORDER-2025-1234"
}
```

**Request Fields:**
- `cardNumber` (string, required): 16-digit card number
- `cvv` (string, required): 3-digit CVV code
- `amount` (number, required): Amount to charge (minimum: 1)
- `description` (string, optional): Transaction description (max 200 chars)
- `externalReference` (string, optional): Your internal order/reference ID (max 100 chars)

**Validation Rules:**
- Card must exist and be active
- Card must not be expired
- CVV must match
- Amount must not exceed card's daily limit
- Amount must not exceed API key's transaction limit
- User must have sufficient balance

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "transaction": {
      "_id": "674a9012345678901234tx01",
      "reference": "TXN-2025-1234567890",
      "type": "payment",
      "amount": 150.50,
      "status": "completed",
      "description": "Coffee and Pastry - Order #1234",
      "externalReference": "ORDER-2025-1234",
      "customer": {
        "cardLast4": "9012"
      },
      "merchant": {
        "businessName": "Pedro's Food Stall"
      },
      "createdAt": "2025-12-20T12:30:00.000Z"
    },
    "receipt": {
      "transactionId": "674a9012345678901234tx01",
      "reference": "TXN-2025-1234567890",
      "amount": 150.50,
      "currency": "PHP",
      "timestamp": "2025-12-20T12:30:00.000Z"
    }
  }
}
```

**Error Responses:**

```json
// 400 - Invalid card number
{
  "success": false,
  "error": {
    "code": "INVALID_CARD_NUMBER",
    "message": "Card number must be 16 digits"
  }
}

// 400 - Invalid CVV
{
  "success": false,
  "error": {
    "code": "INVALID_CVV",
    "message": "CVV does not match"
  }
}

// 400 - Card expired
{
  "success": false,
  "error": {
    "code": "CARD_EXPIRED",
    "message": "This card has expired"
  }
}

// 400 - Insufficient funds
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient balance to complete transaction"
  }
}

// 400 - Daily limit exceeded
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_EXCEEDED",
    "message": "This transaction would exceed the card's daily limit"
  }
}

// 403 - Transaction limit exceeded
{
  "success": false,
  "error": {
    "code": "TRANSACTION_LIMIT_EXCEEDED",
    "message": "Amount exceeds maximum transaction limit for this API key"
  }
}

// 403 - Permission denied
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "This API key does not have 'charge' permission."
  }
}

// 404 - Card not found
{
  "success": false,
  "error": {
    "code": "CARD_NOT_FOUND",
    "message": "Card not found or inactive"
  }
}
```

---

#### Refund Transaction

Process a refund for a previously charged transaction.

**Endpoint:** `POST /api/public/transactions/refund`

**Authentication:** API Key required

**Permissions:** `refund`

**Request Body:**
```json
{
  "transactionId": "674a9012345678901234tx01",
  "amount": 150.50,
  "reason": "Customer requested refund"
}
```

**Request Fields:**
- `transactionId` (string, required): Original transaction ID to refund
- `amount` (number, optional): Partial refund amount (defaults to full amount)
- `reason` (string, optional): Reason for refund (max 200 chars)

**Validation Rules:**
- Original transaction must exist
- Original transaction must belong to your business
- Cannot refund more than original amount
- Cannot refund already refunded transactions
- Business must have sufficient balance

**Success Response (200):**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund": {
      "_id": "674a9012345678901234rf01",
      "reference": "REF-2025-9876543210",
      "type": "refund",
      "amount": 150.50,
      "status": "completed",
      "reason": "Customer requested refund",
      "originalTransaction": "674a9012345678901234tx01",
      "createdAt": "2025-12-20T14:00:00.000Z"
    },
    "originalTransaction": {
      "_id": "674a9012345678901234tx01",
      "reference": "TXN-2025-1234567890",
      "amount": 150.50
    }
  }
}
```

**Error Responses:**

```json
// 404 - Transaction not found
{
  "success": false,
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction not found"
  }
}

// 400 - Already refunded
{
  "success": false,
  "error": {
    "code": "ALREADY_REFUNDED",
    "message": "This transaction has already been refunded"
  }
}

// 400 - Invalid refund amount
{
  "success": false,
  "error": {
    "code": "INVALID_REFUND_AMOUNT",
    "message": "Refund amount cannot exceed original transaction amount"
  }
}

// 403 - Not your transaction
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_REFUND",
    "message": "You can only refund your own transactions"
  }
}
```

---

### Transaction Management

#### Get Business Transactions

Retrieve transaction history for your business.

**Endpoint:** `GET /api/public/transactions`

**Authentication:** API Key required

**Permissions:** `transactions`

**Query Parameters:**
- `limit` (number, optional): Number of transactions to return (default: 50, max: 100)
- `page` (number, optional): Page number for pagination (default: 1)
- `status` (string, optional): Filter by status (`completed`, `failed`, `refunded`)
- `startDate` (string, optional): Filter transactions from this date (ISO 8601)
- `endDate` (string, optional): Filter transactions until this date (ISO 8601)

**Example Request:**
```http
GET /api/public/transactions?limit=20&page=1&status=completed
X-API-Key: scb_live_abc123...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "674a9012345678901234tx01",
        "reference": "TXN-2025-1234567890",
        "type": "payment",
        "amount": 150.50,
        "status": "completed",
        "description": "Coffee and Pastry",
        "customer": {
          "cardLast4": "9012"
        },
        "createdAt": "2025-12-20T12:30:00.000Z"
      },
      {
        "_id": "674a9012345678901234tx02",
        "reference": "TXN-2025-1234567891",
        "type": "payment",
        "amount": 350.00,
        "status": "completed",
        "description": "Lunch Order",
        "customer": {
          "cardLast4": "5678"
        },
        "createdAt": "2025-12-20T13:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTransactions": 98,
      "limit": 20
    },
    "summary": {
      "totalAmount": 25430.50,
      "completedCount": 95,
      "refundedCount": 3
    }
  }
}
```

---

#### Get Transaction by Reference

Retrieve specific transaction details.

**Endpoint:** `GET /api/public/transactions/:reference`

**Authentication:** API Key required

**Permissions:** `transactions`

**URL Parameters:**
- `reference` - Transaction reference ID (e.g., `TXN-2025-1234567890`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "674a9012345678901234tx01",
    "reference": "TXN-2025-1234567890",
    "type": "payment",
    "amount": 150.50,
    "status": "completed",
    "description": "Coffee and Pastry - Order #1234",
    "externalReference": "ORDER-2025-1234",
    "customer": {
      "cardLast4": "9012",
      "cardType": "SmartCity"
    },
    "merchant": {
      "businessId": "674a8f9c8e1234567890xyz1",
      "businessName": "Pedro's Food Stall"
    },
    "paymentMethod": "card",
    "createdAt": "2025-12-20T12:30:00.000Z",
    "updatedAt": "2025-12-20T12:30:00.000Z"
  }
}
```

---

### Card Verification

#### Verify Card

Verify a card without charging (useful for card validation).

**Endpoint:** `POST /api/public/cards/verify`

**Authentication:** API Key required

**Permissions:** `charge`

**Request Body:**
```json
{
  "cardNumber": "4532123456789012",
  "cvv": "123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Card is valid",
  "data": {
    "cardLast4": "9012",
    "cardType": "SmartCity",
    "isActive": true,
    "expiryDate": "2028-12-20T00:00:00.000Z",
    "dailyLimitRemaining": 47500
  }
}
```

**Error Responses:**

```json
// 404 - Card not found
{
  "success": false,
  "error": {
    "code": "CARD_NOT_FOUND",
    "message": "Card not found or inactive"
  }
}

// 400 - Invalid CVV
{
  "success": false,
  "error": {
    "code": "INVALID_CVV",
    "message": "CVV does not match"
  }
}

// 400 - Card expired
{
  "success": false,
  "error": {
    "code": "CARD_EXPIRED",
    "message": "This card has expired"
  }
}
```

---

### Business Balance

#### Get Business Balance

Check your business wallet balance.

**Endpoint:** `GET /api/public/balance`

**Authentication:** API Key required

**Permissions:** `balance`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": "25430.50",
    "currency": "PHP",
    "lastTransaction": {
      "amount": 150.50,
      "type": "payment",
      "timestamp": "2025-12-20T12:30:00.000Z"
    }
  }
}
```

---

## Error Handling

### Standard Error Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_API_KEY` | 401 | No API key provided in header |
| `INVALID_API_KEY` | 401 | API key is invalid or expired |
| `INVALID_API_KEY_FORMAT` | 401 | API key doesn't match expected format |
| `BUSINESS_NOT_VERIFIED` | 403 | Business account needs admin verification |
| `PERMISSION_DENIED` | 403 | API key lacks required permission |
| `IP_NOT_ALLOWED` | 403 | Request from unauthorized IP address |
| `ORIGIN_NOT_ALLOWED` | 403 | Request origin not in whitelist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_CARD_NUMBER` | 400 | Card number format invalid |
| `CARD_NOT_FOUND` | 404 | Card doesn't exist or is inactive |
| `CARD_EXPIRED` | 400 | Card has expired |
| `INVALID_CVV` | 400 | CVV doesn't match |
| `INSUFFICIENT_FUNDS` | 400 | Customer has insufficient balance |
| `DAILY_LIMIT_EXCEEDED` | 400 | Card daily limit exceeded |
| `TRANSACTION_LIMIT_EXCEEDED` | 403 | Amount exceeds API key limit |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction doesn't exist |
| `ALREADY_REFUNDED` | 400 | Transaction already refunded |
| `INVALID_REFUND_AMOUNT` | 400 | Refund amount exceeds original |

---

## Rate Limits & Transaction Limits

### Rate Limits

Each API key has configurable rate limits:

**Default Limits:**
- **60 requests per minute**
- **10,000 requests per day**

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

When exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Please try again later."
  }
}
```

### Transaction Limits

Each API key has transaction amount limits:

**Default Limits:**
- **₱100,000 per transaction**
- **₱500,000 per day**

Limits reset daily at midnight (UTC+8).

### Best Practices

1. **Implement exponential backoff** when rate limited
2. **Cache responses** when appropriate
3. **Batch requests** when possible
4. **Monitor usage** via the business dashboard
5. **Request limit increases** if needed for your use case

---

## CORS & Security

### CORS Configuration

For browser-based integrations, configure allowed origins in your API key settings.

**Configure via API:**
```javascript
// Add allowed origin
POST /api/business/api-keys/:keyId/origins
{
  "origin": "https://yourdomain.com"
}

// Update all origins
PUT /api/business/api-keys/:keyId/origins
{
  "allowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
  ]
}
```

### IP Whitelisting

Optionally restrict API key usage to specific IP addresses:

```javascript
PUT /api/business/api-keys/:keyId
{
  "allowedIPs": ["203.0.113.1", "203.0.113.2"]
}
```

### HTTPS Only

- **Production**: Always use HTTPS
- **Development**: HTTP allowed for localhost only
- **API keys exposed over HTTP are automatically revoked**

---

## Testing

### Test Mode vs Live Mode

API keys come in two types:

- `scb_test_...` - Test mode (sandbox)
- `scb_live_...` - Live mode (production)

Test mode:
- Uses separate database
- No real money involved
- Higher rate limits for testing
- Auto-resets daily

### Test Card Numbers

Use these card numbers in test mode:

```
Success: 4532 1234 5678 9012 (CVV: 123, PIN: 1234)
Insufficient Funds: 4532 0000 0000 0001 (CVV: 100, PIN: 0000)
Expired Card: 4532 9999 9999 9999 (CVV: 999, PIN: 9999)
Invalid CVV: Use any CVV except the correct one
```

### Testing Checklist

- [ ] Verify API key works (`GET /api/public/verify`)
- [ ] Test successful charge
- [ ] Test insufficient funds error
- [ ] Test invalid CVV error
- [ ] Test expired card error
- [ ] Test refund process
- [ ] Test transaction retrieval
- [ ] Test rate limiting behavior
- [ ] Test CORS configuration
- [ ] Test error handling

### Example Test Script (Node.js + Jest)

```javascript
const axios = require('axios');

const API_KEY = process.env.SCB_TEST_API_KEY;
const API_URL = 'http://localhost:5000/api/public';

describe('Public API Tests', () => {
  test('API key verification', async () => {
    const response = await axios.get(`${API_URL}/verify`, {
      headers: { 'X-API-Key': API_KEY }
    });
    expect(response.data.success).toBe(true);
  });

  test('Charge card successfully', async () => {
    const response = await axios.post(
      `${API_URL}/transactions/charge`,
      {
        cardNumber: '4532123456789012',
        cvv: '123',
        amount: 100,
        description: 'Test charge'
      },
      { headers: { 'X-API-Key': API_KEY } }
    );
    expect(response.data.success).toBe(true);
    expect(response.data.data.transaction.status).toBe('completed');
  });
});
```

---

## Integration Examples

### JavaScript/Node.js Client

```javascript
class SmartCityBankingClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.smartcitybanking.com/api/public';
  }

  async chargeCard(cardNumber, cvv, amount, description) {
    const response = await fetch(`${this.baseURL}/transactions/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ cardNumber, cvv, amount, description })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return await response.json();
  }

  async refund(transactionId, amount, reason) {
    const response = await fetch(`${this.baseURL}/transactions/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ transactionId, amount, reason })
    });

    return await response.json();
  }

  async getTransactions(page = 1, limit = 50) {
    const response = await fetch(
      `${this.baseURL}/transactions?page=${page}&limit=${limit}`,
      {
        headers: { 'X-API-Key': this.apiKey }
      }
    );

    return await response.json();
  }
}

// Usage
const client = new SmartCityBankingClient(process.env.SCB_API_KEY);

try {
  const result = await client.chargeCard(
    '4532123456789012',
    '123',
    150.50,
    'Order #1234'
  );
  console.log('Payment successful:', result.data.transaction.reference);
} catch (error) {
  console.error('Payment failed:', error.message);
}
```

---

## Webhooks (Coming Soon)

Future versions will support webhooks for:
- Transaction confirmations
- Refund notifications
- Balance alerts
- Failed transaction alerts

---

## Support

For API support:
- **Documentation**: See [API.md](API.md) for internal API
- **Issues**: Report bugs on GitHub Issues
- **Email**: support@smartcitybanking.com (if available)

---

**Last Updated:** December 20, 2025  
**API Version:** 2.0.0
