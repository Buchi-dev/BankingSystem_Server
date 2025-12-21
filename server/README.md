# 🏦 Smart City Banking System - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v9.0+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](coverage/)

A secure, enterprise-grade banking backend API built for the Smart City ecosystem. This open-source project provides comprehensive financial transaction management, virtual card systems, and business integration APIs for external merchants and vendors.

## 🌟 Key Features

- **🔐 Dual Authentication System**: JWT tokens for internal users + API keys for external integrations
- **💳 Virtual Card Management**: Auto-generated cards with secure CVV/PIN hashing
- **🏢 Business Account System**: Dedicated accounts for merchants with API key management
- **💰 Transaction Processing**: Deposits, withdrawals, transfers, and external payments
- **🛡️ Enterprise Security**: Helmet, HPP, rate limiting, MongoDB injection prevention, XSS protection
- **🌐 Dynamic CORS**: Origin whitelisting for business API keys
- **📊 Transaction Tracking**: Comprehensive audit trails with balance snapshots
- **⚡ Rate Limiting**: Per-API-key rate limits and transaction limits
- **🔍 Role-Based Access Control**: Admin, staff, and user roles with granular permissions

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete internal API reference (JWT-authenticated endpoints)
- **[Public API Documentation](docs/PUBLIC_API.md)** - External integration API (API key authentication)
- **[Features & Security](docs/FEATURES.md)** - Detailed feature explanations and security measures
- **[Data Models](docs/DATA_MODELS.md)** - Database schemas and relationships
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to this project

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+ (local or Atlas)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/banking-system.git
cd banking-system/server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm run dev
```

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/banking_system
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking_system

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (comma-separated origins for development)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Bank Initial Balance (optional)
BANK_INITIAL_BALANCE=10000000
```

### Running the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

The API will be available at `http://localhost:5000`

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.2+
- **Database**: MongoDB 9.0+ with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + Custom API Key system
- **Security**: 
  - Helmet (HTTP headers)
  - HPP (HTTP Parameter Pollution prevention)
  - express-mongo-sanitize (NoSQL injection prevention)
  - sanitize-html (XSS prevention)
  - bcryptjs (password hashing)
- **Rate Limiting**: express-rate-limit + express-slow-down
- **Validation**: express-validator
- **Testing**: Jest + Supertest
- **Utilities**: uuid, crypto

## 📡 API Overview

### Base URL
```
http://localhost:5000/api
```

### Authentication Types

1. **JWT Authentication** (Internal API)
   - Used for: User management, internal transactions, business management
   - Header: `Authorization: Bearer <token>`
   - Obtain via: `POST /api/v1/users/login`

2. **API Key Authentication** (Public API)
   - Used for: External integrations, merchant payments
   - Header: `X-API-Key: scb_xxxxxxxxxx`
   - Obtain via: Business account dashboard

### Main Endpoints

#### Internal API (JWT Auth)
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/profile` - Get user profile
- `POST /api/v1/transactions/transfer` - Transfer funds
- `POST /api/v1/transactions/deposit` - Deposit from bank
- `POST /api/v1/transactions/withdraw` - Withdraw to bank
- `POST /api/v1/business/register` - Register business account
- `POST /api/v1/business/api-keys` - Generate API key

#### Public API (API Key Auth)
- `GET /api/v1/public/verify` - Verify API key
- `POST /api/v1/public/transactions/charge` - Charge customer card
- `POST /api/v1/public/transactions/refund` - Refund transaction
- `GET /api/v1/public/transactions` - Get transaction history
- `POST /api/v1/public/cards/verify` - Verify card without charging
- `GET /api/v1/public/balance` - Get business balance

See [API Documentation](docs/API.md) and [Public API Documentation](docs/PUBLIC_API.md) for complete details.

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Tokens**: Secure token-based authentication with expiration
- **API Key Hashing**: API keys stored as hashes, never plain text
- **Card Security**: CVV and PIN stored as hashes
- **Input Validation**: Comprehensive validation on all inputs
- **SQL/NoSQL Injection Prevention**: Query sanitization
- **XSS Protection**: HTML sanitization on all text inputs
- **Rate Limiting**: Request throttling per IP and per API key
- **CORS**: Dynamic origin validation for business accounts
- **HTTP Security Headers**: Helmet middleware
- **Parameter Pollution Prevention**: HPP middleware

## 📊 Project Structure

```
server/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── configs/
│   │   └── mongo.config.js       # MongoDB connection
│   ├── controllers/              # Route controllers
│   │   ├── user.controller.js
│   │   ├── transaction.controller.js
│   │   ├── business.controller.js
│   │   └── public.transaction.controller.js
│   ├── middlewares/              # Custom middleware
│   │   ├── auth.middleware.js    # JWT authentication
│   │   ├── apiAuth.middleware.js # API key authentication
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── ...
│   ├── models/                   # Mongoose models
│   │   ├── user.model.js
│   │   ├── transaction.model.js
│   │   ├── apiKey.model.js
│   │   └── bank.model.js
│   ├── routes/                   # API routes
│   │   ├── user.route.js
│   │   ├── transaction.route.js
│   │   ├── business.route.js
│   │   └── public.transaction.route.js
│   └── utils/                    # Utility functions
│       └── cardGenerator.js      # Card/key generation utilities
├── __test__/                     # Test files
├── coverage/                     # Test coverage reports
├── package.json
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Current test coverage: **85%+**

Tests include:
- Unit tests for controllers, middlewares, and utilities
- Integration tests for API endpoints
- Authentication and authorization tests
- Transaction processing tests

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

## 📝 License

This project is licensed under the ISC License.

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/yourusername/banking-system/issues) page to report bugs or request features.

## 📧 Contact

For questions or support, please open an issue or contact the maintainers.

## 🙏 Acknowledgments

Built for the Smart City ecosystem to provide secure financial transaction processing for students and businesses.

---

**Note**: This is an educational/demonstration project for the Smart City ecosystem. For production use, ensure proper security audits and compliance with financial regulations.
