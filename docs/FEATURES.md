# Features & Security Documentation

Comprehensive overview of all backend features, security measures, and architectural decisions in the Smart City Banking System.

## Table of Contents

- [Core Features](#core-features)
- [Security Features](#security-features)
- [Authentication Systems](#authentication-systems)
- [Virtual Card System](#virtual-card-system)
- [Business Account System](#business-account-system)
- [Transaction Processing](#transaction-processing)
- [Middleware Stack](#middleware-stack)
- [Rate Limiting](#rate-limiting)
- [Data Validation](#data-validation)
- [Error Handling](#error-handling)

---

## Core Features

### 1. Dual Account Types

#### Personal Accounts
- **Purpose**: Individual users (students, staff)
- **Features**:
  - Virtual card with auto-generated credentials
  - Wallet system for balance management
  - Internal transfers between users
  - Deposits from bank
  - Withdrawals to bank
  - Transaction history
  - Daily spending limits (₱50,000 default)

#### Business Accounts
- **Purpose**: Merchants, vendors, service providers
- **Features**:
  - All personal account features
  - API key generation and management
  - Accept payments from customers
  - Transaction processing capabilities
  - Business verification system
  - Multiple API keys per business
  - CORS origin whitelisting
  - Custom rate limits per API key
  - Transaction analytics

### 2. Role-Based Access Control (RBAC)

Three role levels with hierarchical permissions:

#### User Role
- Default role for all new accounts
- Access to personal account features
- Can perform transfers, deposits, withdrawals
- View own transaction history
- Manage own profile

#### Staff Role
- All user permissions
- (Reserved for future staff-specific features)
- Can be assigned by admin

#### Admin Role
- All user and staff permissions
- View all users in system
- Create/update/delete any user
- View bank status and balance
- Verify business accounts
- Access to all administrative endpoints

### 3. Virtual Card System

Automatic card generation for every user account:

**Card Features:**
- **16-digit card number** (4532 prefix, like Visa)
- **3-digit CVV** (hashed storage, never stored plain)
- **4-digit PIN** (hashed storage, never stored plain)
- **Expiry date** (3 years from issuance)
- **Active/inactive status**
- **Daily spending limits**
- **Transaction tracking**

**Card Security:**
- CVV and PIN shown only once during registration
- All card credentials hashed using bcrypt
- Card numbers indexed for fast lookup
- Automatic expiry checking on transactions
- Daily limit resets at midnight
- Usage tracking (last used timestamp)

### 4. Wallet System

Every account has a wallet:

**Wallet Features:**
- PHP currency (Philippine Peso)
- Decimal precision (Mongoose Decimal128)
- Non-negative balance constraint
- Atomic balance updates (MongoDB transactions)
- Balance snapshots in transaction history
- Real-time balance updates

**Wallet Operations:**
- Deposit from bank
- Withdraw to bank
- Transfer to other users
- Receive transfers
- Receive payments (business accounts)

### 5. Transaction Processing

Comprehensive transaction system with multiple types:

#### Transaction Types

1. **Deposit**: Bank → User Wallet
2. **Withdraw**: User Wallet → Bank
3. **Transfer**: User → User (internal)
4. **Payment**: Customer → Business (via API)
5. **Refund**: Business → Customer (reversal)

#### Transaction Categories

Automatic categorization for analytics:

- **B2B** (Business to Business): Business account to business account
- **B2C** (Business to Consumer): Business account to personal account
- **C2C** (Consumer to Consumer): Personal account to personal account

**Auto-determination:** Based on sender and receiver account types in pre-save hook

#### Transaction Features
- Unique reference IDs for tracking
- Status tracking (pending, completed, failed, refunded)
- Balance snapshots (before/after)
- Full audit trail
- External reference support
- Merchant information (for payments)
- Card masking (last 4 digits only)
- Description/memo field
- Timestamp tracking

---

## Security Features

### 1. Password Security

**Implementation:**
```javascript
// Bcrypt hashing with 10 salt rounds
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

**Features:**
- Bcrypt algorithm (industry standard)
- 10 salt rounds (configurable)
- Automatic hashing on user save
- Password never stored in plain text
- Secure comparison on login

### 2. JWT Authentication

**Token Structure:**
```javascript
{
  id: user._id,
  email: user.email,
  role: user.role,
  accountType: user.accountType
}
```

**Security Measures:**
- HS256 algorithm
- Secret key from environment variables
- 7-day expiration (configurable)
- Signed tokens prevent tampering
- Token validation on every protected route

### 3. API Key Security

**Key Generation:**
- 64-character random string
- `scb_live_` prefix for identification
- Hashed storage (SHA-256)
- Only shown once during creation
- Cryptographically secure random generation

**Key Validation:**
- Hash comparison (never plain text)
- Business verification check
- Active status check
- Permission validation
- Rate limit enforcement

### 4. HTTP Security Headers (Helmet)

Helmet middleware adds security headers:

```javascript
// Implemented headers:
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

**Protection Against:**
- Clickjacking
- MIME sniffing
- XSS attacks
- Protocol downgrade attacks

### 5. NoSQL Injection Prevention

**Express Mongo Sanitize:**
```javascript
// Removes $ and . from user input
app.use(mongoSanitize);
```

**Example Attack Prevented:**
```json
// Malicious input:
{ "email": { "$gt": "" } }

// After sanitization:
{ "email": "" }
```

### 6. XSS Protection

**Sanitize HTML Middleware:**
```javascript
// Sanitizes all string inputs
app.use(sanitize);
```

**Features:**
- Removes malicious HTML tags
- Encodes special characters
- Whitelist-based sanitization
- Applies to all request bodies

### 7. HTTP Parameter Pollution (HPP)

**HPP Middleware:**
```javascript
app.use(hpp());
```

**Protection:**
- Prevents duplicate parameters
- Takes last occurrence of parameter
- Protects against array-based attacks

### 8. CORS Configuration

**Dynamic CORS System:**

```javascript
// Internal routes: permissive for frontend
// Public API: validates against API key origins
```

**Features:**
- Per-API-key origin whitelisting
- Wildcard support in development
- Credential support
- Preflight handling

### 9. Input Validation

**Express Validator:**
- Email format validation
- Password strength checks
- Amount validation (positive numbers)
- Card format validation
- CVV format validation
- Business information validation

**Custom Validators:**
```javascript
// Card number: 16 digits
const cardValidation = validateCardFormat(cardNumber);

// CVV: 3 digits
const cvvValidation = validateCVVFormat(cvv);

// Email: @smu.edu.ph domain only
const emailRegex = /^[\w.-]+@smu\.edu\.ph$/;
```

---

## Authentication Systems

### 1. JWT Authentication (Internal API)

**Flow:**
1. User logs in with email/password
2. Server validates credentials
3. Server generates JWT token
4. Client stores token (localStorage/sessionStorage)
5. Client sends token in Authorization header
6. Middleware validates token on protected routes

**Middleware Implementation:**
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

### 2. API Key Authentication (Public API)

**Flow:**
1. Business generates API key
2. API key stored as hash in database
3. Client sends key in X-API-Key header
4. Middleware hashes and compares with database
5. Business info attached to request
6. Permissions and limits validated

**Middleware Implementation:**
```javascript
const apiAuth = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const keyDocument = await APIKey.findByKey(apiKey);
  
  // Validate business verification
  // Check IP whitelist
  // Check CORS origins
  // Check rate limits
  // Record usage
  
  req.apiKey = keyDocument;
  req.business = keyDocument.business;
  next();
};
```

### 3. Role-Based Middleware

**Role Checking:**
```javascript
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// Usage:
router.get("/admin-only", auth, checkRole("admin"), controller);
```

### 4. Business Account Middleware

**Business Type Checking:**
```javascript
const requireBusiness = (req, res, next) => {
  if (req.user.accountType !== "business") {
    return res.status(403).json({ 
      message: "Business account required" 
    });
  }
  next();
};

const requireVerifiedBusiness = (req, res, next) => {
  if (!req.user.businessInfo?.isVerified) {
    return res.status(403).json({ 
      message: "Business must be verified" 
    });
  }
  next();
};
```

### 5. Permission-Based Middleware

**API Key Permissions:**
```javascript
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey.hasPermission(permission)) {
      return res.status(403).json({
        error: {
          code: "PERMISSION_DENIED",
          message: `API key lacks '${permission}' permission`
        }
      });
    }
    next();
  };
};

// Usage:
router.post("/charge", apiAuth, requirePermission("charge"), controller);
```

---

## Virtual Card System

### Card Generation

**Automatic Generation:**
- Triggered on user registration
- Unique 16-digit number
- CVV and PIN generation
- Expiry date calculation
- Hash storage

**Implementation:**
```javascript
// Generate card number (16 digits, 4532 prefix)
const cardNumber = generateCardNumber(); // "4532123456789012"

// Generate CVV (3 digits)
const cvv = generateCVV(); // "123"
const cvvHash = hashCVV(cvv); // bcrypt hash

// Generate PIN (4 digits)
const pin = generatePIN(); // "1234"
const pinHash = hashPIN(pin); // bcrypt hash

// Calculate expiry (3 years)
const expiryDate = generateExpiryDate(); // Date object
```

### Card Validation

**On Every Transaction:**
1. Card exists and active
2. Card not expired
3. CVV matches (if provided)
4. PIN matches (for ATM-style transactions)
5. Daily limit not exceeded
6. Sufficient balance

**Daily Limit System:**
```javascript
UserSchema.methods.canSpend = function(amount) {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastReset = new Date(this.virtualCard.lastResetDate)
    .setHours(0, 0, 0, 0);
  
  // Reset if new day
  if (today > lastReset) {
    this.virtualCard.dailySpent = 0;
    this.virtualCard.lastResetDate = new Date();
  }
  
  return (this.virtualCard.dailySpent + amount) 
    <= this.virtualCard.dailyLimit;
};
```

### Card Security Features

1. **Hashed Credentials**: CVV and PIN never stored plain
2. **Single Display**: Credentials shown only at registration
3. **Masked Display**: Only last 4 digits shown in transactions
4. **Expiry Enforcement**: Automatic expiry validation
5. **Usage Tracking**: Last used timestamp
6. **Daily Limits**: Configurable spending limits
7. **Active Status**: Can be deactivated
8. **CVV Lockout**: Failed CVV attempts tracking and temporary lockout

### CVV Lockout Mechanism

**Implementation:**
- Tracks failed CVV attempts per card
- Locks card for 15 minutes after 5 failed attempts
- Resets counter on successful transaction
- Prevents brute force attacks on CVV

**Fields:**
- `cvvAttempts`: Number of consecutive failed attempts
- `lockoutUntil`: Timestamp when lockout expires

**Logic:**
```javascript
if (card.cvvAttempts >= 5) {
  const lockoutTime = 15 * 60 * 1000; // 15 minutes
  card.lockoutUntil = new Date(Date.now() + lockoutTime);
}
```

---

## Business Account System

### Business Registration

**Additional Fields:**
- Business name
- Business type (food, retail, services, etc.)
- Business address
- Business phone
- Website URL (for CORS)

**Verification Process:**
1. Business registers
2. Account created with `isVerified: false`
3. Admin reviews business information
4. Admin verifies business
5. Business can generate API keys

### API Key Management

**Key Features:**
- Multiple keys per business
- Named keys for organization
- Permission-based access control
- Custom rate limits per key
- Transaction limits per key
- IP whitelisting
- CORS origin whitelisting
- Usage tracking
- Active/inactive status
- Live/test mode support

**Permissions System:**
- `charge`: Process payments
- `refund`: Issue refunds
- `balance`: Check business balance
- `transactions`: View transaction history

### Origin Whitelisting

**CORS Management:**
```javascript
// Business can manage allowed origins
allowedOrigins: [
  "https://example.com",
  "https://www.example.com",
  "https://app.example.com",
  "https://*.example.com"  // Wildcard support
]

// Middleware validates origin
if (requestOrigin && !keyDocument.isOriginAllowed(requestOrigin)) {
  return res.status(403).json({ 
    error: "Origin not allowed" 
  });
}
```

---

## Transaction Processing

### Atomic Operations

**MongoDB Transactions:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Deduct from sender
  await User.updateOne(
    { _id: senderId },
    { $inc: { "wallet.balance": -amount } },
    { session }
  );
  
  // Add to recipient
  await User.updateOne(
    { _id: recipientId },
    { $inc: { "wallet.balance": amount } },
    { session }
  );
  
  // Create transaction record
  await Transaction.create([transactionData], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Balance Tracking

**Snapshot System:**
```javascript
{
  balanceBefore: "5000.00",
  balanceAfter: "4000.00",
  amount: 1000
}
```

**Benefits:**
- Audit trail
- Dispute resolution
- Balance verification
- Historical tracking

### Transaction States

1. **Pending**: Transaction initiated
2. **Completed**: Successfully processed
3. **Failed**: Error occurred
4. **Refunded**: Original transaction reversed

### Refund System

**Refund Process:**
1. Original transaction lookup
2. Ownership verification
3. Amount validation (partial or full)
4. Balance check (business has funds)
5. Reverse transaction creation
6. Balance restoration
7. Status update (original → refunded)

### Transaction Pre-save Hooks

**Category Auto-determination:**
```javascript
TransactionSchema.pre('save', async function() {
  if (this.isNew) {
    const sender = await User.findById(this.from);
    const receiver = await User.findById(this.to);
    
    if (sender.accountType === 'business' && receiver.accountType === 'business') {
      this.category = 'B2B';
    } else if (sender.accountType === 'business' || receiver.accountType === 'business') {
      this.category = 'B2C';
    } else {
      this.category = 'C2C';
    }
  }
});
```

---

## Middleware Stack

### Request Flow

```
1. Helmet (security headers)
2. MongoSanitize (NoSQL injection prevention)
3. HPP (parameter pollution prevention)
4. Dynamic CORS (origin validation)
5. JSON Parser (body parsing)
6. URL Encoded Parser (form data)
7. Sanitize (XSS prevention)
8. Logger (request logging)
9. Rate Limiter (request throttling)
10. Speed Limiter (request slowing)
11. Route-specific middleware (auth, validation)
12. Controller (business logic)
13. Error Handler (error responses)
```

### Middleware Order Importance

**Critical Order:**
1. Security middleware FIRST (Helmet, sanitization)
2. Body parsing AFTER security
3. Rate limiting BEFORE routes
4. Authentication BEFORE authorization
5. Validation BEFORE controllers
6. Error handler LAST

---

## Rate Limiting

### Global Rate Limiting

**Express Rate Limit:**
```javascript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests, please try again later."
});
```

### Speed Limiting

**Express Slow Down:**
```javascript
const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 50, // Start slowing after 50 requests
  delayMs: 500 // Add 500ms delay per request
});
```

### Per-API-Key Rate Limiting

**Custom Implementation:**
```javascript
APIKeySchema.methods.checkRateLimit = function() {
  const now = new Date();
  const resetDate = new Date(this.usage.lastResetDate);
  
  // Reset daily counter
  if (now.getDate() !== resetDate.getDate()) {
    this.usage.dailyRequests = 0;
    this.usage.lastResetDate = now;
  }
  
  return this.usage.dailyRequests < this.rateLimit.requestsPerDay;
};
```

### Transaction Limits

**Amount-Based Limiting:**
```javascript
// Per transaction limit
if (amount > apiKey.transactionLimits.maxAmountPerTransaction) {
  throw new Error("Transaction amount exceeds limit");
}

// Daily transaction total
if (apiKey.transactionLimits.dailyTransactionTotal + amount 
    > apiKey.transactionLimits.dailyTransactionLimit) {
  throw new Error("Daily transaction limit exceeded");
}
```

---

## Data Validation

### Registration Validation

```javascript
{
  firstName: "Required, 2-30 chars, letters only",
  lastName: "Required, 2-30 chars, letters only",
  middleInitial: "Optional, single uppercase letter",
  email: "Required, @smu.edu.ph domain only",
  password: "Required, minimum 6 characters"
}
```

### Transaction Validation

```javascript
{
  amount: "Required, must be > 0",
  to: "Required for transfers, valid user ID",
  cardNumber: "16 digits, proper format",
  cvv: "3 digits, numeric only"
}
```

### Business Validation

```javascript
{
  businessName: "Required, max 100 chars",
  businessType: "Required, from enum list",
  websiteUrl: "Optional, valid HTTP/HTTPS URL",
  businessPhone: "Optional, Philippine format"
}
```

---

## Error Handling

### Centralized Error Handler

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry"
    });
  }
  
  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
```

### Consistent Error Format

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional information"
  }
}
```

---

## Performance Optimizations

### Database Indexing

```javascript
// Fast card lookups
UserSchema.index({ "virtualCard.cardNumber": 1 });

// Fast email lookups
UserSchema.index({ email: 1 });

// Business queries
UserSchema.index({ 
  accountType: 1, 
  "businessInfo.isVerified": 1 
});

// Transaction queries
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 });
```

### Connection Pooling

```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5
});
```

### Lean Queries

```javascript
// When only reading data (no save needed)
User.findById(id).lean();
```

---

## Logging & Monitoring

### Request Logging

```javascript
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};
```

### Transaction Logging

All transactions automatically logged with:
- Timestamp
- User IDs
- Amount
- Status
- Balance snapshots

### Error Logging

All errors logged to console (production: log service)

---

## Environment Configuration

### Required Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/banking_system
JWT_SECRET=your_secret_key_min_32_characters
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGINS=http://localhost:3000
BANK_INITIAL_BALANCE=10000000
```

### Configuration Best Practices

1. Never commit .env files
2. Use strong, random secrets
3. Different configs per environment
4. Validate environment on startup
5. Use default fallbacks cautiously

---

## Future Enhancements

### Planned Features

1. **Webhooks**: Real-time transaction notifications
2. **2FA**: Two-factor authentication
3. **Email Notifications**: Transaction alerts
4. **Analytics Dashboard**: Business insights
5. **Batch Transactions**: Process multiple at once
6. **Recurring Payments**: Subscription support
7. **Dispute System**: Transaction disputes
8. **KYC Integration**: Enhanced verification
9. **Multi-currency**: Support for other currencies
10. **Mobile SDK**: Native app integration

---

**Last Updated:** December 20, 2025  
**Version:** 2.0.0
