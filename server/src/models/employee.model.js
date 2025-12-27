const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define Employee Schema
const EmployeeSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Za-z ]+$/,
        minlength: 2,
        maxlength: 30,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Za-z ]+$/,
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


    // Reference to the admin/staff who created this employee
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Not required for admin (self-referencing)
    },

    // Employee role
    role: {
      type: String,
      enum: ["staff", "admin"],
      default: "staff",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for better query performance
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ createdBy: 1 });
EmployeeSchema.index({ role: 1 });

// Pre-save middleware to hash password
EmployeeSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return;

  // Hash password with cost of 10
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Instance method to compare password
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
EmployeeSchema.virtual("fullNameString").get(function () {
  const { firstName, lastName, middleInitial } = this.fullName;
  return middleInitial
    ? `${firstName} ${middleInitial}. ${lastName}`
    : `${firstName} ${lastName}`;
});

// Ensure virtual fields are serialized
EmployeeSchema.set("toJSON", { virtuals: true });
EmployeeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Employee", EmployeeSchema);