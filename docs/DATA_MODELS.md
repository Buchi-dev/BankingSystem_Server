# Data Models Documentation

Complete database schema documentation for all MongoDB collections in the Smart City Banking System.

## Table of Contents

- [Overview](#overview)
- [User Model](#user-model)
- [Transaction Model](#transaction-model)
- [API Key Model](#api-key-model)
- [Bank Model](#bank-model)
- [Relationships](#relationships)
- [Indexes](#indexes)

---

## Overview

The system uses MongoDB with Mongoose ODM for data modeling. All models use strict schema validation and include timestamps for audit trails.

**Database Name:** `banking_system` (configurable)

**Collections:**
- `users` - User accounts (personal and business)
- `transactions` - All financial transactions
- `apikeys` - Business API keys
- `banks` - Singleton bank reserve (one document)

---

## User Model

**Collection:** `users`

### Schema Definition

```javascript
{
  fullName: {
    firstName: String,
    lastName: String,
    middleInitial: String
  },
  role: String,
  accountType: String,
  businessInfo: {
    businessName: String,
    businessType: String,
    websiteUrl: String,
    isVerified: Boolean,
    verifiedAt: Date
  },
  isVerified: Boolean,
  email: String,
  password: String,
  virtualCard: {
    cardNumber: String,
    cvv: String,
    pin: String,
    expiryDate: Date,
    isActive: Boolean,
    issuedAt: Date,
    lastUsed: Date,
    dailyLimit: Number,
    dailySpent: Number,
    lastResetDate: Date,
    cvvAttempts: Number,
    lockoutUntil: Date
  },
  wallet: {
    balance: Decimal128,
    currency: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

#### fullName (Object, Required)
Personal name information for the account holder.

**Fields:**
- **firstName** (String, required)
  - User's first name
  - Length: 2-30 characters
  - Validation: Letters only (`/^[A-Za-z]+$/`)
  - Trimmed automatically
  
- **lastName** (String, required)
  - User's last name
  - Length: 2-30 characters
  - Validation: Letters only (`/^[A-Za-z]+$/`)
  - Trimmed automatically
  
- **middleInitial** (String, optional)
  - Middle name initial
  - Length: Exactly 1 character
  - Validation: Single uppercase letter (`/^[A-Z]?$/`)
  - Automatically converted to uppercase

#### role (String, Required)
User's permission level in the system.

**Values:**
- `user` - Default role, standard permissions
- `staff` - Staff-level permissions (reserved)
- `admin` - Full system access

**Default:** `user`

#### accountType (String, Required)
Type of account determining available features.

**Values:**
- `personal` - Individual user account
- `business` - Merchant/vendor account with API capabilities

**Default:** `personal`

#### businessInfo (Object, Conditional)
Business account information. Required when `accountType === "business"`.

**Fields:**
- **businessName** (String, required for business)
  - Official business name
  - Max length: 100 characters
  - Trimmed automatically
  
- **businessType** (String, required for business)
  - Category of business
  - Allowed values: `food`, `retail`, `services`, `transport`, `utilities`, `other`
  
- **websiteUrl** (String, required for business)
  - Business website URL for CORS whitelisting
  - Max length: 200 characters
  - Validation: Valid HTTP/HTTPS URL
  - Example: `https://example.com`
  
- **isVerified** (Boolean)
  - Admin verification status
  - Default: `false`
  - Must be `true` to generate API keys
  
- **verifiedAt** (Date)
  - Timestamp when admin verified the business
  - Set automatically on verification

#### isVerified (Boolean)
General verification status for the user account.

**Default:** `false`

#### email (String, Required, Unique)
User's email address for authentication.

**Validation:**
- Must be unique across all users
- Must end with `@smu.edu.ph`
- Regex: `/^[\w.-]+@smu\.edu\.ph$/`
- Length: 10-50 characters
- Automatically converted to lowercase

**Examples:**
- Valid: `juan.cruz@smu.edu.ph`
- Invalid: `user@gmail.com`, `USER@SMU.EDU.PH`

#### password (String, Required)
Hashed password for authentication.

**Storage:**
- Never stored in plain text
- Hashed using bcrypt with 10 salt rounds
- Minimum length: 6 characters (plain text before hashing)
- Select: `false` (not returned in queries by default)

**Security:**
- Automatically hashed on save
- Only hashed on modification
- Compared using bcrypt.compare()

#### virtualCard (Object)
Automatically generated virtual card for payments.

**Fields:**
- **cardNumber** (String, unique)
  - 16-digit card number
  - Prefix: `4532` (resembles Visa)
  - Example: `4532123456789012`
  - Unique across all users
  - Sparse index (allows null)
  
- **cvv** (String)
  - 3-digit security code (hashed)
  - Select: `false` (never returned in queries)
  - Stored as bcrypt hash
  - Shown only once during registration
  
- **pin** (String)
  - 4-digit PIN code (hashed)
  - Select: `false` (never returned in queries)
  - Stored as bcrypt hash
  - Shown only once during registration
  
- **expiryDate** (Date)
  - Card expiration date
  - Set to 3 years from issuance
  - Validated on every transaction
  
- **isActive** (Boolean)
  - Card active status
  - Default: `true`
  - Can be deactivated by user or admin
  
- **issuedAt** (Date)
  - Timestamp when card was generated
  - Set automatically on creation
  
- **lastUsed** (Date)
  - Timestamp of most recent transaction
  - Updated on every card usage
  
- **dailyLimit** (Number)
  - Maximum daily spending limit in PHP
  - Default: `50000` (₱50,000)
  - Configurable per user
  
- **dailySpent** (Number)
  - Amount spent today
  - Default: `0`
  - Resets at midnight
  
- **lastResetDate** (Date)
  - Last daily limit reset timestamp
  - Used to determine if new day

- **cvvAttempts** (Number)
  - Number of failed CVV attempts
  - Default: `0`
  - Resets on successful transaction
  - Used for card lockout mechanism

- **lockoutUntil** (Date)
  - Timestamp until card is locked due to failed attempts
  - Default: `null`
  - Card locked when set to future date

#### wallet (Object, Required)
User's digital wallet for balance management.

**Fields:**
- **balance** (Decimal128, required)
  - Current wallet balance
  - Type: Mongoose Decimal128 (precise decimal handling)
  - Constraint: Non-negative (`min: 0`)
  - Default: `0.0`
  
- **currency** (String, required)
  - Currency code
  - Default: `PHP` (Philippine Peso)

#### Timestamps
- **createdAt** (Date) - Account creation timestamp
- **updatedAt** (Date) - Last modification timestamp

### Indexes

```javascript
// Fast card number lookups for payments
{ "virtualCard.cardNumber": 1 }

// Fast email lookups for authentication
{ "email": 1 }

// Business account queries
{ "accountType": 1, "businessInfo.isVerified": 1 }
```

### Methods

#### comparePassword(password)
Compare plain text password with hashed password.

```javascript
const isMatch = await user.comparePassword("password123");
```

#### canSpend(amount)
Check if user can spend amount within daily limit.

```javascript
const canSpend = user.canSpend(1000); // true/false
```

### Pre-save Hooks

```javascript
// Hash password if modified
if (this.isModified("password")) {
  this.password = await bcrypt.hash(this.password, 10);
}

// Generate virtual card if new user
if (this.isNew) {
  this.virtualCard.cardNumber = generateCardNumber();
  this.virtualCard.cvv = await hashCVV(generateCVV());
  // ... etc
}
```

---

## Transaction Model

**Collection:** `transactions`

### Schema Definition

```javascript
{
  user: ObjectId,
  from: ObjectId,
  to: ObjectId,
  type: String,
  category: String,
  amount: Number,
  paymentMethod: String,
  cardUsed: {
    last4: String,
    cardType: String
  },
  merchant: {
    businessId: ObjectId,
    businessName: String,
    apiKeyId: ObjectId
  },
  externalReference: String,
  description: String,
  status: String,
  originalTransaction: ObjectId,
  balanceBefore: Number,
  balanceAfter: Number,
  reference: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

#### user (ObjectId, Conditional)
Reference to the user involved in transaction.

**References:** `users` collection
**Required for:** `deposit`, `withdraw` types
**Not used for:** `transfer`, `payment` types (use `from`/`to` instead)

#### from (ObjectId, Conditional)
Sender in transfer or payment transactions.

**References:** `users` collection
**Required for:** `transfer`, `payment` types
**Indexed:** Yes

#### to (ObjectId, Conditional)
Recipient in transfer or payment transactions.

**References:** `users` collection
**Required for:** `transfer`, `payment` types
**Indexed:** Yes

#### type (String, Required)
Transaction type/category.

**Values:**
- `deposit` - Bank to user wallet
- `withdraw` - User wallet to bank
- `transfer` - User to user (internal)
- `payment` - Customer to business (via API)
- `refund` - Reverse of payment

#### category (String, Auto-generated)
Transaction category for analytics.

**Values:**
- `B2B` - Business to Business
- `B2C` - Business to Consumer
- `C2C` - Consumer to Consumer

**Auto-determination:** Based on sender and receiver account types

#### amount (Number, Required)
Transaction amount in PHP.

**Constraints:**
- Must be greater than 0
- Minimum: `1`
- Stored as Number (converted to Decimal128 in wallet)

#### paymentMethod (String)
Method used for the transaction.

**Values:**
- `wallet` - Direct wallet transaction (default)
- `card` - Virtual card payment
- `api` - External API payment

**Default:** `wallet`

#### cardUsed (Object)
Information about card used in payment (for audit).

**Fields:**
- **last4** (String)
  - Last 4 digits of card number
  - Max length: 4
  - Example: `9012`
  
- **cardType** (String)
  - Type of card
  - Default: `SmartCity`

#### merchant (Object)
Business that processed the payment (for API transactions).

**Fields:**
- **businessId** (ObjectId)
  - Reference to business user
  - References: `users` collection
  
- **businessName** (String)
  - Business name at time of transaction
  - Denormalized for historical accuracy
  
- **apiKeyId** (ObjectId)
  - Reference to API key used
  - References: `apikeys` collection

#### externalReference (String)
External system's reference/order ID.

**Max length:** 100 characters
**Use case:** Merchant's order number, invoice ID, etc.
**Example:** `ORDER-2025-1234`

#### description (String)
Human-readable transaction description.

**Max length:** 200 characters
**Example:** `Coffee and Pastry - Order #1234`

#### status (String, Required)
Current transaction status.

**Values:**
- `pending` - Transaction initiated
- `completed` - Successfully processed
- `failed` - Transaction failed
- `refunded` - Original transaction reversed

**Default:** `completed`

#### originalTransaction (ObjectId)
Reference to original transaction (for refunds).

**References:** `transactions` collection
**Used only when:** `type === "refund"`

#### balanceBefore (Number)
User's balance before transaction.

**Purpose:** Audit trail and dispute resolution

#### balanceAfter (Number)
User's balance after transaction.

**Purpose:** Audit trail and verification

#### reference (String, Unique)
Unique transaction reference ID.

**Format:** `TXN-{timestamp}-{random}`
**Example:** `TXN-2025-1234567890`
**Generation:** Automatic using UUID

#### Timestamps
- **createdAt** (Date) - Transaction timestamp
- **updatedAt** (Date) - Last status update

### Indexes

```javascript
// User transaction history queries
{ user: 1, createdAt: -1 }

// Transfer queries (from/to)
{ from: 1, createdAt: -1 }
{ to: 1, createdAt: -1 }

// Reference lookups
{ reference: 1 }

// Merchant queries
{ "merchant.businessId": 1, createdAt: -1 }
```

### Methods

None (static model, operations in controller)

---

## API Key Model

**Collection:** `apikeys`

### Schema Definition

```javascript
{
  business: ObjectId,
  keyHash: String,
  keyPrefix: String,
  name: String,
  permissions: [String],
  rateLimit: {
    requestsPerMinute: Number,
    requestsPerDay: Number
  },
  usage: {
    totalRequests: Number,
    lastUsed: Date,
    dailyRequests: Number,
    lastResetDate: Date
  },
  transactionLimits: {
    maxAmountPerTransaction: Number,
    dailyTransactionLimit: Number,
    dailyTransactionTotal: Number,
    lastTransactionReset: Date
  },
  allowedOrigins: [String],
  isActive: Boolean,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

#### business (ObjectId, Required)
Reference to the business user that owns this key.

**References:** `users` collection (where `accountType === "business"`)
**Indexed:** Yes
**Populated:** Includes business info on queries

#### keyHash (String, Required, Unique)
Hashed API key for secure storage.

**Hashing:** SHA-256
**Never stored plain:** Original key shown only once
**Format (original):** `scb_live_{64_random_chars}`

#### keyPrefix (String, Required)
First 12 characters of the plain API key for identification.

**Format:** `scb_live_abc`
**Purpose:** Identify key in logs without exposing full key
**Length:** 12 characters

#### name (String, Required)
Human-readable name for the API key.

**Max length:** 50 characters
**Example:** `Production Website Key`
**Purpose:** Organization and management

#### permissions (Array<String>)
Granted permissions for this API key.

**Allowed values:**
- `charge` - Process customer payments
- `refund` - Issue refunds
- `balance` - View business balance
- `transactions` - View transaction history

**Default:** `["charge", "transactions"]`

#### rateLimit (Object)
Request rate limiting configuration.

**Fields:**
- **requestsPerMinute** (Number)
  - Requests allowed per minute
  - Default: `60`
  - Min: `1`, Max: `1000`
  
- **requestsPerDay** (Number)
  - Requests allowed per day
  - Default: `10000`
  - Min: `100`, Max: `100000`

#### usage (Object)
API key usage tracking.

**Fields:**
- **totalRequests** (Number)
  - Total lifetime requests
  - Default: `0`
  - Incremented on each request
  
- **lastUsed** (Date)
  - Timestamp of most recent request
  - Updated on each request
  
- **dailyRequests** (Number)
  - Requests today
  - Default: `0`
  - Resets at midnight
  
- **lastResetDate** (Date)
  - Last daily counter reset
  - Default: Now

#### transactionLimits (Object)
Financial transaction limits.

**Fields:**
- **maxAmountPerTransaction** (Number)
  - Maximum single transaction amount in PHP
  - Default: `100000` (₱100,000)
  
- **dailyTransactionLimit** (Number)
  - Maximum daily transaction total in PHP
  - Default: `500000` (₱500,000)
  
- **dailyTransactionTotal** (Number)
  - Total transacted today
  - Default: `0`
  - Resets at midnight
  
- **lastTransactionReset** (Date)
  - Last daily transaction reset
  - Default: Now

#### allowedOrigins (Array<String>)
CORS whitelist for browser-based requests.

**Format:** Array of URLs
**Example:** `["https://example.com", "https://app.example.com"]`
**Validation:** Valid HTTP/HTTPS URLs
**Empty array:** No CORS restrictions

#### isActive (Boolean)
API key active status.

**Default:** `true`
**Purpose:** Revoke key without deletion

#### expiresAt (Date)
Optional expiration date for the API key.

**Optional:** Can be null (no expiration)
**Validation:** Checked on every request

#### Timestamps
- **createdAt** (Date) - Key creation timestamp
- **updatedAt** (Date) - Last modification

### Indexes

```javascript
// Fast key lookup
{ keyHash: 1 }

// Business key queries
{ business: 1, isActive: 1 }

// Expired key cleanup
{ expiresAt: 1 }
```

### Static Methods

#### findByKey(plainKey)
Find API key by plain text key (hashes and compares).

```javascript
const keyDoc = await APIKey.findByKey("scb_live_abc123...");
```

#### generateKey(businessId, options)
Generate new API key for business.

```javascript
const { key, document } = await APIKey.generateKey(businessId, {
  name: "Production Key",
  permissions: ["charge", "refund"]
});
```

### Instance Methods

#### hasPermission(permission)
Check if key has specific permission.

```javascript
const canCharge = apiKey.hasPermission("charge"); // true/false
```

#### checkRateLimit()
Check if rate limit exceeded.

```javascript
const allowed = apiKey.checkRateLimit(); // true/false
```

#### checkTransactionLimit(amount)
Check if transaction within limits.

```javascript
const { allowed, reason } = apiKey.checkTransactionLimit(5000);
```

#### isOriginAllowed(origin)
Check if origin is whitelisted.

```javascript
const allowed = apiKey.isOriginAllowed("https://example.com");
```

#### isIPAllowed(ip)
Check if IP is whitelisted.

```javascript
const allowed = apiKey.isIPAllowed("203.0.113.1");
```

#### recordUsage()
Increment usage counters.

```javascript
apiKey.recordUsage();
await apiKey.save();
```

---

## Bank Model

**Collection:** `banks`

### Schema Definition

```javascript
{
  bankBalance: Decimal128,
  lastUpdated: Date,
  totalDeposits: Decimal128,
  totalWithdrawals: Decimal128,
  createdAt: Date
}
```

### Field Descriptions

#### bankBalance (Decimal128, Required)
Current bank reserve balance in PHP.

**Type:** Mongoose Decimal128 (precise decimal)
**Default:** `10000000.00` (10 million PHP, configurable)
**Constraint:** Cannot be negative

#### lastUpdated (Date)
Timestamp of last balance update.

**Updated:** On every deposit or withdrawal
**Default:** Current timestamp

#### totalDeposits (Decimal128)
Cumulative total of all deposits issued.

**Purpose:** Statistics and audit
**Default:** `0.00`

#### totalWithdrawals (Decimal128)
Cumulative total of all withdrawals received.

**Purpose:** Statistics and audit
**Default:** `0.00`

#### createdAt (Date)
Bank initialization timestamp.

**Set once:** On first bank creation

### Singleton Pattern

**Important:** Only ONE bank document should exist in the database.

### Static Methods

#### getOrCreateBank(session)
Get the singleton bank instance or create if doesn't exist.

```javascript
const bank = await Bank.getOrCreateBank(session);
```

#### getBalance()
Get current bank balance as number.

```javascript
const balance = await Bank.getBalance(); // 10000000
```

### Instance Methods

#### updateBalance(amount, type, session)
Update bank balance and track totals.

```javascript
await bank.updateBalance(-5000, "deposit", session);
// Deducts 5000 from bank (user deposits)

await bank.updateBalance(2000, "withdrawal", session);
// Adds 2000 to bank (user withdraws)
```

---

## Relationships

### Entity Relationship Diagram

```
┌──────────────┐
│    Users     │
│              │
│  _id         │◄──────────────┐
│  email       │               │
│  role        │               │
│  accountType │               │
│  wallet      │               │
│  virtualCard │               │
└──────┬───────┘               │
       │                       │
       │ 1:N                   │ N:1
       │                       │
       ▼                       │
┌──────────────┐        ┌──────────────┐
│ Transactions │        │   APIKeys    │
│              │        │              │
│  _id         │        │  _id         │
│  user/from/to│        │  business    │──┐
│  type        │        │  keyHash     │  │
│  amount      │        │  permissions │  │
│  merchant    │────────┤  rateLimit   │  │
│  status      │        │  usage       │  │
└──────────────┘        └──────────────┘  │
                                          │
                                          │
                                          │
                        ┌─────────────────┘
                        │
                        ▼
                  ┌──────────────┐
                  │     Bank     │
                  │  (Singleton) │
                  │              │
                  │  bankBalance │
                  │  totals      │
                  └──────────────┘
```

### Relationship Details

1. **User → Transactions** (1:N)
   - One user can have many transactions
   - `user` field references Users._id
   - `from` and `to` fields also reference Users._id

2. **User → APIKeys** (1:N)
   - One business user can have many API keys
   - `business` field references Users._id (where accountType="business")

3. **APIKey → Transactions** (1:N)
   - One API key can process many transactions
   - `merchant.apiKeyId` references APIKeys._id

4. **Transaction → Transaction** (1:1)
   - Refund references original transaction
   - `originalTransaction` references Transactions._id

---

## Indexes

### Performance Optimization

All indexes are designed for query performance:

**Users Collection:**
```javascript
// Authentication queries
{ email: 1 }

// Payment processing
{ "virtualCard.cardNumber": 1 }

// Business queries
{ accountType: 1, "businessInfo.isVerified": 1 }
```

**Transactions Collection:**
```javascript
// User transaction history
{ user: 1, createdAt: -1 }
{ from: 1, createdAt: -1 }
{ to: 1, createdAt: -1 }

// Transaction lookup
{ reference: 1 }

// Business transactions
{ "merchant.businessId": 1, createdAt: -1 }
```

**APIKeys Collection:**
```javascript
// Key authentication
{ keyHash: 1 }

// Business key management
{ business: 1, isActive: 1 }
```

---

## Data Types

### Decimal128 vs Number

**Decimal128** is used for monetary values:
- `wallet.balance`
- `bankBalance`
- `balanceBefore/After`

**Number** is used for:
- `amount` (in transactions)
- Counters and limits

**Conversion:**
```javascript
// Number to Decimal128
mongoose.Types.Decimal128.fromString("1000.50")

// Decimal128 to Number
parseFloat(decimal128Value.toString())
```

---

## Validation

All schemas include comprehensive validation:

- **Required fields**: Enforced at schema level
- **Unique constraints**: Email, card number, API key hash
- **Format validation**: Regex for email, phone, URLs
- **Enum validation**: Role, accountType, transaction type
- **Range validation**: Min/max for amounts and lengths
- **Custom validators**: Business URL format, transaction limits

---

**Last Updated:** December 20, 2025  
**Schema Version:** 2.0.0
