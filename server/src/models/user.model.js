const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


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




// Hash password before saving
UserSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (this.role !== "user") {
    this.wallet.balance = 0;
    }
  } catch (error) {
    console.error(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
