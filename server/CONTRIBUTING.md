# Contributing to Smart City Banking System

Thank you for your interest in contributing to the Smart City Banking System! This document provides guidelines and instructions for contributing to this open-source project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize the community's best interests

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or deliberately disruptive behavior
- Publishing private information without permission
- Unprofessional conduct

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **MongoDB 5.0+** (local or Atlas account)
- **Git** for version control
- A **GitHub account**
- Basic knowledge of **JavaScript**, **Express.js**, and **MongoDB**

### First-Time Contributors

If this is your first contribution:

1. **Star the repository** to show your support
2. **Fork the repository** to your GitHub account
3. **Read the documentation** in the `/docs` folder
4. **Look for "good first issue" labels** for beginner-friendly tasks
5. **Ask questions** in the GitHub Discussions or Issues

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/banking-system.git
cd banking-system/server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (use a separate database for development)
MONGODB_URI=mongodb://localhost:27017/banking_system_dev

# Authentication
JWT_SECRET=your_dev_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Bank
BANK_INITIAL_BALANCE=10000000
```

**Important:** 
- Use a separate database for development (`banking_system_dev`)
- Never commit the `.env` file
- Use different secrets than production

### 4. Start Development Server

```bash
# Start with auto-reload
npm run dev

# Or standard start
npm start
```

The API will be available at `http://localhost:5000`

### 5. Verify Setup

Test that everything works:

```bash
# Run tests
npm test

# Check API health
curl http://localhost:5000
```

---

## Project Structure

Understanding the codebase:

```
server/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   │
│   ├── configs/                  # Configuration files
│   │   └── mongo.config.js       # MongoDB connection setup
│   │
│   ├── controllers/              # Request handlers (business logic)
│   │   ├── user.controller.js
│   │   ├── transaction.controller.js
│   │   ├── business.controller.js
│   │   └── public.transaction.controller.js
│   │
│   ├── middlewares/              # Custom middleware functions
│   │   ├── auth.middleware.js             # JWT authentication
│   │   ├── apiAuth.middleware.js          # API key authentication
│   │   ├── business.middleware.js         # Business account checks
│   │   ├── cors.middleware.js             # Dynamic CORS
│   │   ├── errorHandler.middleware.js     # Global error handler
│   │   ├── loggers.middleware.js          # Request logging
│   │   ├── mongoSanitize.middleware.js    # NoSQL injection prevention
│   │   ├── rateLimit.middleware.js        # Rate limiting
│   │   ├── role.middleware.js             # Role-based access
│   │   ├── sanitize.middleware.js         # XSS prevention
│   │   └── validation.middleware.js       # Input validation
│   │
│   ├── models/                   # Mongoose schemas
│   │   ├── user.model.js         # User/business accounts
│   │   ├── transaction.model.js  # Financial transactions
│   │   ├── apiKey.model.js       # API keys
│   │   └── bank.model.js         # Bank reserve (singleton)
│   │
│   ├── routes/                   # API route definitions
│   │   ├── user.route.js         # User management routes
│   │   ├── transaction.route.js  # Internal transaction routes
│   │   ├── business.route.js     # Business account routes
│   │   └── public.transaction.route.js  # Public API routes
│   │
│   └── utils/                    # Utility functions
│       └── cardGenerator.js      # Card/key generation utilities
│
├── __test__/                     # Test files
│   ├── integration/              # Integration tests
│   │   └── public.api.test.js
│   └── unit/                     # Unit tests
│       ├── controllers/
│       ├── middlewares/
│       └── utils/
│
├── docs/                         # Documentation
│   ├── API.md                    # Internal API docs
│   ├── PUBLIC_API.md             # Public API docs
│   ├── FEATURES.md               # Feature documentation
│   └── DATA_MODELS.md            # Database schemas
│
├── .env                          # Environment variables (not committed)
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── README.md                     # Main documentation
└── CONTRIBUTING.md               # This file
```

### Key Directories

- **controllers/**: Business logic for handling requests
- **middlewares/**: Reusable middleware for authentication, validation, etc.
- **models/**: Database schemas and data access methods
- **routes/**: API endpoint definitions
- **utils/**: Helper functions and utilities

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your changes:

```bash
# Update your fork's main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bug fix branch
git checkout -b fix/bug-description
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Changes

- Write clear, focused commits
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.controller.test.js

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

Ensure:
- All tests pass
- Code coverage doesn't decrease significantly
- No linting errors

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Add user balance validation to prevent negative balances"
```

**Good commit messages:**
- Start with a verb (Add, Fix, Update, Remove)
- Be concise but descriptive
- Reference issue numbers when applicable

**Examples:**
```
Add rate limiting for public API endpoints
Fix card expiry validation in payment processing
Update API documentation with new endpoints
Refactor transaction controller for better error handling
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub (see PR Process below).

---

## Coding Standards

### JavaScript Style

- **ES6+ features**: Use modern JavaScript (async/await, arrow functions, destructuring)
- **CommonJS modules**: Use `require()` and `module.exports`
- **Semicolons**: Use them consistently
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Use double quotes for strings
- **Naming conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and models
  - `UPPER_SNAKE_CASE` for constants

### Code Organization

#### Controllers

Controllers should:
- Handle request/response logic only
- Use try-catch for error handling
- Return consistent response formats
- Validate inputs early

**Example:**
```javascript
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
```

#### Middleware

Middleware should:
- Be single-purpose and reusable
- Call `next()` on success
- Return error responses directly
- Add data to `req` object for downstream use

**Example:**
```javascript
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};
```

#### Models

Models should:
- Include comprehensive validation
- Use appropriate data types
- Include helpful methods
- Document complex fields

**Example:**
```javascript
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[\w.-]+@smu\.edu\.ph$/
  }
});

// Instance method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};
```

### Response Format

**Success responses:**
```javascript
{
  "success": true,
  "message": "Optional success message",
  "data": { /* response data */ }
}
```

**Error responses:**
```javascript
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Optional additional info"
  }
}
```

### Comments and Documentation

- **JSDoc for functions**: Document parameters and return values
- **Inline comments**: Explain complex logic only
- **File headers**: Describe the module's purpose
- **TODO comments**: Mark incomplete or temporary code

**Example:**
```javascript
/**
 * Transfer funds between two users
 * @param {string} fromUserId - Sender's user ID
 * @param {string} toUserId - Recipient's user ID
 * @param {number} amount - Amount to transfer
 * @returns {Promise<Object>} Transaction document
 */
const transferFunds = async (fromUserId, toUserId, amount) => {
  // Implementation
};
```

---

## Testing Guidelines

### Test Structure

Tests are organized by type:

```
__test__/
├── unit/                         # Unit tests (isolated functions)
│   ├── controllers/
│   ├── middlewares/
│   └── utils/
└── integration/                  # Integration tests (full API)
    └── public.api.test.js
```

### Writing Tests

**Unit Tests** - Test individual functions:

```javascript
const { validateCardFormat } = require("../../src/utils/cardGenerator");

describe("Card Validation", () => {
  test("should validate correct card number", () => {
    const result = validateCardFormat("4532123456789012");
    expect(result.isValid).toBe(true);
  });
  
  test("should reject invalid card number", () => {
    const result = validateCardFormat("1234");
    expect(result.isValid).toBe(false);
  });
});
```

**Integration Tests** - Test full API endpoints:

```javascript
const request = require("supertest");
const app = require("../../src/app");

describe("POST /api/v1/users/register", () => {
  test("should register new user successfully", async () => {
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        fullName: {
          firstName: "Juan",
          lastName: "Cruz"
        },
        email: "juan.cruz@smu.edu.ph",
        password: "password123"
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Test Coverage

Aim for:
- **80%+ overall coverage**
- **100% coverage for critical paths** (authentication, payments, transfers)
- **Test edge cases** (validation errors, insufficient funds, etc.)

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test -- user.controller.test.js
```

---

## Pull Request Process

### Before Submitting

Checklist:
- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new functionality
- [ ] Documentation updated (if applicable)
- [ ] No console.log or debug code left
- [ ] Commit messages are clear and descriptive

### Creating the PR

1. **Push your branch** to your fork
2. **Open a Pull Request** on the main repository
3. **Fill out the PR template** completely
4. **Link related issues** using keywords (Fixes #123)

### PR Title Format

```
[Type] Brief description

Types: Feature, Fix, Docs, Refactor, Test, Chore
```

**Examples:**
- `[Feature] Add API key expiration functionality`
- `[Fix] Correct daily limit reset logic`
- `[Docs] Update PUBLIC_API.md with new endpoints`

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Related Issues
Fixes #123
Related to #456

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes (or documented if yes)
```

### Review Process

1. **Automated checks** run (tests, linting)
2. **Maintainers review** your code
3. **Address feedback** by pushing new commits
4. **Approval** from at least one maintainer
5. **Merge** into main branch

### After Merge

- Delete your feature branch
- Update your fork's main branch
- Celebrate your contribution! 🎉

---

## Reporting Bugs

### Before Reporting

1. **Check existing issues** - Bug might already be reported
2. **Try latest version** - Bug might be fixed
3. **Verify it's reproducible** - Can you consistently reproduce it?

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Call endpoint '...'
2. With data '...'
3. See error

**Expected behavior**
What you expected to happen

**Actual behavior**
What actually happened

**Environment:**
- OS: [e.g., Windows 11]
- Node.js version: [e.g., 18.17.0]
- MongoDB version: [e.g., 6.0]

**Error messages/logs**
```
Paste error messages here
```

**Additional context**
Any other relevant information
```

---

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Describe the problem you're trying to solve

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Other solutions you've thought about

**Use case**
How would this feature be used?

**Additional context**
Mockups, examples, related projects, etc.
```

---

## Development Tips

### Debugging

**Enable detailed logs:**
```javascript
// Add to controller/middleware
console.log("Debug:", { variable, data });
```

**Use MongoDB transactions for data integrity:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Your operations
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

### Testing API Locally

**Using curl:**
```bash
# Register user
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":{"firstName":"Juan","lastName":"Cruz"},"email":"juan@smu.edu.ph","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@smu.edu.ph","password":"pass123"}'

# Authenticated request
curl http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Using Postman:**
1. Import the API endpoints
2. Set up environment variables
3. Create test collections

### Database Management

**Reset development database:**
```javascript
// In MongoDB shell or Compass
use banking_system_dev
db.dropDatabase()
```

**View collections:**
```javascript
show collections
db.users.find().pretty()
db.transactions.find().pretty()
```

---

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check `/docs` folder first

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC License).

---

Thank you for contributing to the Smart City Banking System! Your efforts help make financial technology more accessible and secure. 🚀
