# Internal API Documentation

Complete reference for JWT-authenticated internal API endpoints. These endpoints are used by frontend applications and require authentication via JWT tokens.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Transaction Management](#transaction-management)
- [Business Account Management](#business-account-management)
- [Error Handling](#error-handling)

---

## Authentication

### Overview

All internal API endpoints (except registration and login) require JWT authentication.

**Authentication Header:**
```http
Authorization: Bearer <jwt_token>
```

### Obtaining a Token

Tokens are obtained via the login endpoint and are valid for 7 days (configurable).

---

## User Management

Base path: `/api/users`

### Register New User

Create a new user account with automatic virtual card generation.

**Endpoint:** `POST /api/users/register`

**Authentication:** None (public)

**Request Body:**
```json
{
  "fullName": {
    "firstName": "Juan",
    "lastName": "Cruz",
    "middleInitial": "D"
  },
  "email": "juan.cruz@smu.edu.ph",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `firstName`: Required, 2-30 characters, letters only
- `lastName`: Required, 2-30 characters, letters only
- `middleInitial`: Optional, single uppercase letter
- `email`: Required, must be `@smu.edu.ph` domain
- `password`: Required, minimum 6 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "674a8f9c8e1234567890abcd",
      "fullName": {
        "firstName": "Juan",
        "lastName": "Cruz",
        "middleInitial": "D"
      },
      "email": "juan.cruz@smu.edu.ph",
      "role": "user",
      "accountType": "personal",
      "isVerified": false,
      "virtualCard": {
        "cardNumber": "4532123456789012",
        "expiryDate": "2028-12-20T00:00:00.000Z",
        "isActive": true,
        "dailyLimit": 50000
      },
      "wallet": {
        "balance": "0",
        "currency": "PHP"
      },
      "createdAt": "2025-12-20T08:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cvv": "123",
    "pin": "1234"
  }
}
```

**Notes:**
- CVV and PIN are returned ONLY during registration
- Store these securely - they cannot be retrieved later
- Virtual card is automatically generated and activated

**Error Responses:**
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Only smu.edu.ph email addresses are allowed"
}

// 409 - Duplicate Email
{
  "success": false,
  "message": "Email already exists"
}
```

---

### Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /api/users/login`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "juan.cruz@smu.edu.ph",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "674a8f9c8e1234567890abcd",
      "fullName": {
        "firstName": "Juan",
        "lastName": "Cruz",
        "middleInitial": "D"
      },
      "email": "juan.cruz@smu.edu.ph",
      "role": "user",
      "accountType": "personal",
      "wallet": {
        "balance": "5000.00",
        "currency": "PHP"
      }
    }
  }
}
```

**Error Responses:**
```json
// 401 - Invalid Credentials
{
  "success": false,
  "message": "Invalid email or password"
}

// 404 - User Not Found
{
  "success": false,
  "message": "User not found"
}
```

---

### Get Current User Profile

Retrieve authenticated user's profile information.

**Endpoint:** `GET /api/users/profile`

**Authentication:** Required (JWT)

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "674a8f9c8e1234567890abcd",
    "fullName": {
      "firstName": "Juan",
      "lastName": "Cruz",
      "middleInitial": "D"
    },
    "email": "juan.cruz@smu.edu.ph",
    "role": "user",
    "accountType": "personal",
    "isVerified": false,
    "virtualCard": {
      "cardNumber": "4532123456789012",
      "expiryDate": "2028-12-20T00:00:00.000Z",
      "isActive": true,
      "dailyLimit": 50000,
      "dailySpent": 2500,
      "lastUsed": "2025-12-20T10:15:00.000Z"
    },
    "wallet": {
      "balance": "5000.00",
      "currency": "PHP"
    },
    "createdAt": "2025-12-20T08:30:00.000Z",
    "updatedAt": "2025-12-20T10:15:00.000Z"
  }
}
```

---

### Get All Users (Admin Only)

Retrieve list of all users in the system.

**Endpoint:** `GET /api/users`

**Authentication:** Required (JWT) + Admin Role

**Request Headers:**
```http
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a8f9c8e1234567890abcd",
      "fullName": {
        "firstName": "Juan",
        "lastName": "Cruz"
      },
      "email": "juan.cruz@smu.edu.ph",
      "role": "user",
      "wallet": {
        "balance": "5000.00"
      }
    }
    // ... more users
  ]
}
```

**Error Responses:**
```json
// 403 - Forbidden
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

---

### Get User by ID (Admin Only)

Retrieve specific user details by ID.

**Endpoint:** `GET /api/users/:id`

**Authentication:** Required (JWT) + Admin Role

**URL Parameters:**
- `id` - User's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "674a8f9c8e1234567890abcd",
    "fullName": {
      "firstName": "Juan",
      "lastName": "Cruz",
      "middleInitial": "D"
    },
    "email": "juan.cruz@smu.edu.ph",
    "role": "user",
    "accountType": "personal",
    "virtualCard": {
      "cardNumber": "4532123456789012",
      "expiryDate": "2028-12-20T00:00:00.000Z",
      "isActive": true
    },
    "wallet": {
      "balance": "5000.00",
      "currency": "PHP"
    }
  }
}
```

---

### Create User (Admin Only)

Create a new user account (admin function).

**Endpoint:** `POST /api/users`

**Authentication:** Required (JWT) + Admin Role

**Request Body:**
```json
{
  "firstName": "Maria",
  "lastName": "Santos",
  "email": "maria.santos@smu.edu.ph",
  "age": 21,
  "gender": "female",
  "middleInitial": "A"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": { /* user object */ }
  }
}
```

---

### Update User (Admin Only)

Update user information.

**Endpoint:** `PUT /api/users/:id`

**Authentication:** Required (JWT) + Admin Role

**URL Parameters:**
- `id` - User's MongoDB ObjectId

**Request Body:**
```json
{
  "firstName": "Maria",
  "lastName": "Santos",
  "email": "maria.santos@smu.edu.ph",
  "age": 22,
  "gender": "female"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* updated user object */ }
}
```

---

### Delete User (Admin Only)

Delete a specific user.

**Endpoint:** `DELETE /api/users/:id`

**Authentication:** Required (JWT) + Admin Role

**URL Parameters:**
- `id` - User's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Transaction Management

Base path: `/api/transactions`

All transaction endpoints require JWT authentication.

### Get User Transactions

Retrieve all transactions for the authenticated user.

**Endpoint:** `GET /api/transactions`

**Authentication:** Required (JWT)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a9012345678901234abcd",
      "type": "transfer",
      "amount": 1000,
      "from": {
        "_id": "674a8f9c8e1234567890abcd",
        "fullName": {
          "firstName": "Juan",
          "lastName": "Cruz"
        }
      },
      "to": {
        "_id": "674a8f9c8e1234567890def0",
        "fullName": {
          "firstName": "Maria",
          "lastName": "Santos"
        }
      },
      "status": "completed",
      "balanceAfter": "4000.00",
      "createdAt": "2025-12-20T10:15:00.000Z"
    },
    {
      "_id": "674a9012345678901234bcde",
      "type": "deposit",
      "amount": 5000,
      "user": "674a8f9c8e1234567890abcd",
      "status": "completed",
      "balanceAfter": "5000.00",
      "createdAt": "2025-12-20T09:00:00.000Z"
    }
    // ... more transactions
  ]
}
```

---

### Transfer Funds

Transfer money between user accounts.

**Endpoint:** `POST /api/transactions/transfer`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "to": "674a8f9c8e1234567890def0",
  "amount": 1000
}
```

**Validation Rules:**
- `to`: Required, valid MongoDB ObjectId (recipient user ID)
- `amount`: Required, must be greater than 0
- Cannot transfer to yourself
- Sender must have sufficient balance

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transfer successful",
  "data": {
    "transaction": {
      "_id": "674a9012345678901234abcd",
      "type": "transfer",
      "from": "674a8f9c8e1234567890abcd",
      "to": "674a8f9c8e1234567890def0",
      "amount": 1000,
      "status": "completed",
      "balanceAfter": "4000.00",
      "createdAt": "2025-12-20T10:15:00.000Z"
    },
    "newBalance": "4000.00"
  }
}
```

**Error Responses:**
```json
// 400 - Cannot transfer to same account
{
  "success": false,
  "message": "Cannot transfer to the same account"
}

// 400 - Insufficient funds
{
  "success": false,
  "message": "Insufficient funds"
}

// 404 - Recipient not found
{
  "success": false,
  "message": "Recipient not found"
}
```

---

### Deposit Funds

Deposit funds from bank to user wallet.

**Endpoint:** `POST /api/transactions/deposit`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "amount": 5000
}
```

**Validation Rules:**
- `amount`: Required, must be greater than 0
- Bank must have sufficient balance

**Success Response (200):**
```json
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "transaction": {
      "_id": "674a9012345678901234bcde",
      "type": "deposit",
      "user": "674a8f9c8e1234567890abcd",
      "amount": 5000,
      "status": "completed",
      "balanceAfter": "5000.00",
      "createdAt": "2025-12-20T09:00:00.000Z"
    },
    "newBalance": "5000.00"
  }
}
```

---

### Withdraw Funds

Withdraw funds from user wallet to bank.

**Endpoint:** `POST /api/transactions/withdraw`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "amount": 2000
}
```

**Validation Rules:**
- `amount`: Required, must be greater than 0
- User must have sufficient balance

**Success Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal successful",
  "data": {
    "transaction": {
      "_id": "674a9012345678901234cdef",
      "type": "withdraw",
      "user": "674a8f9c8e1234567890abcd",
      "amount": 2000,
      "status": "completed",
      "balanceAfter": "3000.00",
      "createdAt": "2025-12-20T11:00:00.000Z"
    },
    "newBalance": "3000.00"
  }
}
```

**Error Responses:**
```json
// 400 - Insufficient funds
{
  "success": false,
  "message": "Insufficient funds"
}
```

---

### Get Bank Status (Admin Only)

View bank balance and statistics.

**Endpoint:** `GET /api/transactions/bank/status`

**Authentication:** Required (JWT) + Admin Role

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": "9995000.00",
    "currency": "PHP",
    "totalDeposits": 50000,
    "totalWithdrawals": 5000,
    "lastUpdated": "2025-12-20T11:00:00.000Z"
  }
}
```

---

## Business Account Management

Base path: `/api/business`

### Register Business Account

Create a new business account with merchant capabilities.

**Endpoint:** `POST /api/business/register`

**Authentication:** None (public)

**Request Body:**
```json
{
  "fullName": {
    "firstName": "Pedro",
    "lastName": "Reyes",
    "middleInitial": "M"
  },
  "email": "pedro.reyes@smu.edu.ph",
  "password": "SecurePass123!",
  "businessInfo": {
    "businessName": "Pedro's Food Stall",
    "businessType": "food",
    "businessAddress": "SMU Campus, Baguio City",
    "businessPhone": "09171234567",
    "websiteUrl": "https://pedrosfood.com"
  }
}
```

**Validation Rules:**
- All `fullName` fields: Same as regular registration
- `email`: Required, must be `@smu.edu.ph` domain
- `password`: Required, minimum 6 characters
- `businessName`: Required, max 100 characters
- `businessType`: Required, one of: `food`, `retail`, `services`, `transport`, `utilities`, `other`
- `businessAddress`: Optional, max 200 characters
- `businessPhone`: Optional, valid Philippine phone format
- `websiteUrl`: Optional, valid HTTP/HTTPS URL

**Success Response (201):**
```json
{
  "success": true,
  "message": "Business account registered successfully. Awaiting admin verification.",
  "data": {
    "user": {
      "_id": "674a8f9c8e1234567890xyz1",
      "fullName": {
        "firstName": "Pedro",
        "lastName": "Reyes"
      },
      "email": "pedro.reyes@smu.edu.ph",
      "role": "user",
      "accountType": "business",
      "businessInfo": {
        "businessName": "Pedro's Food Stall",
        "businessType": "food",
        "isVerified": false
      },
      "wallet": {
        "balance": "0",
        "currency": "PHP"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes:**
- Business accounts start as unverified
- Admin must verify before API keys can be generated
- Business accounts can still receive payments while unverified

---

### Get Business Profile

Retrieve business account information.

**Endpoint:** `GET /api/business/profile`

**Authentication:** Required (JWT) + Business Account Type

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "674a8f9c8e1234567890xyz1",
    "fullName": {
      "firstName": "Pedro",
      "lastName": "Reyes"
    },
    "email": "pedro.reyes@smu.edu.ph",
    "accountType": "business",
    "businessInfo": {
      "businessName": "Pedro's Food Stall",
      "businessType": "food",
      "businessAddress": "SMU Campus, Baguio City",
      "businessPhone": "09171234567",
      "websiteUrl": "https://pedrosfood.com",
      "isVerified": true,
      "verifiedAt": "2025-12-20T08:00:00.000Z"
    },
    "wallet": {
      "balance": "25000.00",
      "currency": "PHP"
    }
  }
}
```

---

### Generate API Key

Create a new API key for external integrations.

**Endpoint:** `POST /api/business/api-keys`

**Authentication:** Required (JWT) + Verified Business Account

**Request Body:**
```json
{
  "name": "Production Website Key",
  "permissions": ["charge", "refund", "transactions"],
  "allowedOrigins": ["https://pedrosfood.com"],
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerDay": 10000
  },
  "transactionLimits": {
    "maxAmountPerTransaction": 50000,
    "dailyTransactionLimit": 500000
  }
}
```

**Validation Rules:**
- `name`: Required, max 50 characters
- `permissions`: Optional array, allowed values: `charge`, `refund`, `balance`, `transactions`
- `allowedOrigins`: Optional array of valid URLs
- `rateLimit`: Optional, custom rate limiting
- `transactionLimits`: Optional, custom transaction limits

**Success Response (201):**
```json
{
  "success": true,
  "message": "API key generated successfully. Store it securely - it won't be shown again!",
  "data": {
    "apiKey": "scb_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
    "keyPrefix": "scb_live_abc",
    "name": "Production Website Key",
    "permissions": ["charge", "refund", "transactions"],
    "rateLimit": {
      "requestsPerMinute": 60,
      "requestsPerDay": 10000
    },
    "createdAt": "2025-12-20T12:00:00.000Z"
  }
}
```

**Important:** The full API key is shown ONLY ONCE. Store it securely.

---

### List API Keys

Get all API keys for the business.

**Endpoint:** `GET /api/business/api-keys`

**Authentication:** Required (JWT) + Business Account Type

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a9012345678901234key1",
      "keyPrefix": "scb_live_abc",
      "name": "Production Website Key",
      "permissions": ["charge", "refund", "transactions"],
      "isActive": true,
      "usage": {
        "totalRequests": 1542,
        "lastUsed": "2025-12-20T11:45:00.000Z",
        "dailyRequests": 234
      },
      "createdAt": "2025-12-20T08:00:00.000Z"
    }
    // ... more keys
  ]
}
```

---

### Revoke API Key

Deactivate an API key.

**Endpoint:** `DELETE /api/business/api-keys/:keyId`

**Authentication:** Required (JWT) + Business Account Type

**URL Parameters:**
- `keyId` - API Key's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

### Get API Key Allowed Origins

Retrieve CORS origins for an API key.

**Endpoint:** `GET /api/business/api-keys/:keyId/origins`

**Authentication:** Required (JWT) + Business Account Type

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "allowedOrigins": [
      "https://pedrosfood.com",
      "https://www.pedrosfood.com"
    ]
  }
}
```

---

### Update API Key Allowed Origins

Replace all allowed origins for an API key.

**Endpoint:** `PUT /api/business/api-keys/:keyId/origins`

**Authentication:** Required (JWT) + Business Account Type

**Request Body:**
```json
{
  "allowedOrigins": [
    "https://pedrosfood.com",
    "https://app.pedrosfood.com"
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Allowed origins updated successfully",
  "data": {
    "allowedOrigins": [
      "https://pedrosfood.com",
      "https://app.pedrosfood.com"
    ]
  }
}
```

---

### Add Allowed Origin

Add a single origin to the whitelist.

**Endpoint:** `POST /api/business/api-keys/:keyId/origins`

**Authentication:** Required (JWT) + Business Account Type

**Request Body:**
```json
{
  "origin": "https://mobile.pedrosfood.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Origin added successfully"
}
```

---

### Remove Allowed Origin

Remove a specific origin from the whitelist.

**Endpoint:** `DELETE /api/business/api-keys/:keyId/origins`

**Authentication:** Required (JWT) + Business Account Type

**Request Body:**
```json
{
  "origin": "https://old-site.pedrosfood.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Origin removed successfully"
}
```

---

### Get Pending Business Verifications (Admin Only)

View all businesses awaiting verification.

**Endpoint:** `GET /api/business/pending`

**Authentication:** Required (JWT) + Admin Role

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a8f9c8e1234567890xyz1",
      "fullName": {
        "firstName": "Pedro",
        "lastName": "Reyes"
      },
      "email": "pedro.reyes@smu.edu.ph",
      "businessInfo": {
        "businessName": "Pedro's Food Stall",
        "businessType": "food",
        "isVerified": false
      },
      "createdAt": "2025-12-19T10:00:00.000Z"
    }
    // ... more pending businesses
  ]
}
```

---

### Get Verified Businesses (Admin Only)

View all verified business accounts.

**Endpoint:** `GET /api/business/verified`

**Authentication:** Required (JWT) + Admin Role

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a8f9c8e1234567890xyz2",
      "fullName": {
        "firstName": "Maria",
        "lastName": "Santos"
      },
      "businessInfo": {
        "businessName": "Maria's Bookstore",
        "businessType": "retail",
        "isVerified": true,
        "verifiedAt": "2025-12-15T09:00:00.000Z"
      }
    }
    // ... more verified businesses
  ]
}
```

---

### Verify Business Account (Admin Only)

Approve a business account for API key generation.

**Endpoint:** `PUT /api/business/:businessId/verify`

**Authentication:** Required (JWT) + Admin Role

**URL Parameters:**
- `businessId` - Business user's MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "Business verified successfully",
  "data": {
    "_id": "674a8f9c8e1234567890xyz1",
    "businessInfo": {
      "businessName": "Pedro's Food Stall",
      "isVerified": true,
      "verifiedAt": "2025-12-20T12:00:00.000Z"
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional information"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request / Validation error
- `401` - Unauthorized / Invalid token
- `403` - Forbidden / Insufficient permissions
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate email)
- `429` - Too many requests / Rate limit exceeded
- `500` - Internal server error

### Authentication Errors

```json
// 401 - No token provided
{
  "success": false,
  "message": "No token provided"
}

// 401 - Invalid token
{
  "success": false,
  "message": "Invalid or expired token"
}

// 403 - Insufficient permissions
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

---

## Rate Limiting

All API endpoints are rate-limited:

- **Global Rate Limit**: 100 requests per minute per IP
- **Speed Limiting**: Requests slowed after 50/minute
- **Business API Keys**: Custom per-key rate limits

When rate limit is exceeded:

```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## Best Practices

1. **Store tokens securely** - Never expose JWT tokens or API keys in client-side code
2. **Handle errors gracefully** - Check response status codes and display user-friendly messages
3. **Validate on client-side** - Pre-validate inputs before sending requests
4. **Use HTTPS** - Always use HTTPS in production
5. **Implement retry logic** - Handle rate limiting with exponential backoff
6. **Log transactions** - Keep audit trails of all financial operations

---

For Public API (external integrations) documentation, see [PUBLIC_API.md](PUBLIC_API.md).
