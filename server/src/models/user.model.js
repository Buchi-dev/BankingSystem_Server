const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  generateCardNumber,
  generateCVV,
  hashCVV,
  generatePIN,
  hashPIN,
  generateExpiryDate,
  compareCVV,
  comparePIN,
} = require("../utils/cardGenerator");


// Define User Schema
const UserSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Za-z]+$/,
        minlength: 2,
        maxlength: 30,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Za-z]+$/,
        minlength: 2,
        maxlength: 30,
      },
      middleInitial: {
        type: String,
        trim: true,
        match: /^[A-Z]?$/,
        maxlength: 1,
        uppercase: true,
      },
    },
    role: { 
      type: String, 
      enum: ["user", "staff", "admin"], 
      default: "user" 
    },

    // Account type: personal for regular users, business for merchants/vendors
    accountType: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
    },

    // Business information (required for business accounts)
    businessInfo: {
      businessName: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      businessType: {
        type: String,
        enum: ["food", "retail", "services", "transport", "utilities", "other"],
      },
      businessAddress: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      businessPhone: {
        type: String,
        trim: true,
        match: /^(\+63|0)?[0-9]{10}$/,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: {
        type: Date,
      },
    },

    isVerified: { 
      type: Boolean,
      default: false 
    },
    
    email: {
      type: String,
      required: true,
      trim: true,
      match: /^[\w.-]+@smu\.edu\.ph$/,
      unique: true,
      minlength: 10,
      maxlength: 50,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 10,
      select: false,
    },

    // Virtual Card Information
    virtualCard: {
      cardNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while maintaining uniqueness
      },
      cvv: {
        type: String, // Hashed CVV
        select: false,
      },
      pin: {
        type: String, // Hashed PIN
        select: false,
      },
      expiryDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      issuedAt: {
        type: Date,
      },
      lastUsed: {
        type: Date,
      },
      // Daily transaction limits
      dailyLimit: {
        type: Number,
        default: 50000, // PHP 50,000 default daily limit
      },
      dailySpent: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },

    wallet: {
      balance: {
        type: mongoose.Types.Decimal128,
        required: true,
        default: 0.0,
        min: 0,
      },
      currency: {
        type: String,
        required: true,
        default: "PHP",
      },
    },
  },
  { timestamps: true }
);

// Index for fast card number lookups (critical for payment processing)
UserSchema.index({ "virtualCard.cardNumber": 1 });
// Index for business account lookups
UserSchema.index({ accountType: 1, "businessInfo.isVerified": 1 });




// Hash password before saving and generate virtual card
UserSchema.pre("save", async function () {
  try {
    // Hash password if modified
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Set wallet balance to 0 for non-user roles
    if (this.role !== "user") {
      this.wallet.balance = 0;
    }

    // Generate virtual card for new users (personal accounts only)
    if (this.isNew && this.accountType === "personal" && !this.virtualCard?.cardNumber) {
      const plainCVV = generateCVV();
      const plainPIN = generatePIN();

      this.virtualCard = {
        cardNumber: generateCardNumber(),
        cvv: await hashCVV(plainCVV),
        pin: await hashPIN(plainPIN),
        expiryDate: generateExpiryDate(),
        isActive: true,
        issuedAt: new Date(),
        dailyLimit: 50000,
        dailySpent: 0,
        lastResetDate: new Date(),
      };

      // Store plain CVV and PIN temporarily for response (will be shown only once)
      this._plainCVV = plainCVV;
      this._plainPIN = plainPIN;
    }
  } catch (error) {
    console.error(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare CVV
UserSchema.methods.compareCVV = async function (candidateCVV) {
  return await compareCVV(candidateCVV, this.virtualCard.cvv);
};

// Method to compare PIN
UserSchema.methods.comparePIN = async function (candidatePIN) {
  return await comparePIN(candidatePIN, this.virtualCard.pin);
};

// Method to check if card is expired
UserSchema.methods.isCardExpired = function () {
  return new Date() > new Date(this.virtualCard.expiryDate);
};

// Method to check if card is active and valid
UserSchema.methods.isCardValid = function () {
  return (
    this.virtualCard.isActive &&
    !this.isCardExpired() &&
    this.virtualCard.cardNumber
  );
};

// Method to check daily limit
UserSchema.methods.canSpend = function (amount) {
  // Reset daily spent if it's a new day
  const today = new Date().toDateString();
  const lastReset = new Date(this.virtualCard.lastResetDate).toDateString();
  
  if (today !== lastReset) {
    this.virtualCard.dailySpent = 0;
    this.virtualCard.lastResetDate = new Date();
  }

  return (this.virtualCard.dailySpent + amount) <= this.virtualCard.dailyLimit;
};

// Method to update daily spent
UserSchema.methods.recordSpending = function (amount) {
  // Reset if new day
  const today = new Date().toDateString();
  const lastReset = new Date(this.virtualCard.lastResetDate).toDateString();
  
  if (today !== lastReset) {
    this.virtualCard.dailySpent = 0;
    this.virtualCard.lastResetDate = new Date();
  }

  this.virtualCard.dailySpent += amount;
  this.virtualCard.lastUsed = new Date();
};

// Remove password and sensitive card data from JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  
  // Mask card number in responses
  if (obj.virtualCard?.cardNumber) {
    const last4 = obj.virtualCard.cardNumber.slice(-4);
    obj.virtualCard.cardNumber = `**** **** **** ${last4}`;
  }
  
  // Remove CVV and PIN from responses
  if (obj.virtualCard) {
    delete obj.virtualCard.cvv;
    delete obj.virtualCard.pin;
  }
  
  return obj;
};

// Static method to find user by card number (for payment processing)
UserSchema.statics.findByCardNumber = function (cardNumber) {
  return this.findOne({ "virtualCard.cardNumber": cardNumber });
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
