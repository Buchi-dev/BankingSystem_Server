const User = require("../models/user.model");

/**
 * Seed default staff and admin users.
 * - Uses environment variables when available
 * - Falls back to safe development defaults
 * - Skips creation if the user already exists
 */
const seedDefaultUsers = async () => {
  try {
    // Avoid polluting automated test runs
    if (process.env.NODE_ENV === "test") {
      return;
    }

    const defaultUsers = [
      {
        role: "admin",
        email: process.env.DEFAULT_ADMIN_EMAIL || "admin@smu.edu.ph",
        password: process.env.DEFAULT_ADMIN_PASSWORD || "AdminPass123!",
        fullName: {
          firstName: "System",
          lastName: "Admin",
          middleInitial: "A",
        },
        accountType: "business",
        businessInfo: {
          businessName: "System Administration",
          isVerified: true,
        },
      },
      {
        role: "staff",
        email: process.env.DEFAULT_STAFF_EMAIL || "staff@smu.edu.ph",
        password: process.env.DEFAULT_STAFF_PASSWORD || "StaffPass123!",
        fullName: {
          firstName: "Support",
          lastName: "Staff",
          middleInitial: "S",
        },
        accountType: "business",
        businessInfo: {
          businessName: "Support Operations",
          isVerified: true,
        },
      },
    ];

    for (const userData of defaultUsers) {
      const { email, role } = userData;

      // Ensure we have the minimum required data
      if (!email || !userData.password) {
        console.warn(
          `⚠️ Skipping seeding for ${role} user - missing email or password`
        );
        continue;
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        console.log(
          `ℹ️ ${role.toUpperCase()} user already exists with email ${email}`
        );
        continue;
      }

      const createdUser = await User.create(userData);
      console.log(
        `✅ Seeded ${role.toUpperCase()} user with email ${createdUser.email}`
      );
    }
  } catch (error) {
    console.error("❌ Error seeding default users:", error.message);
  }
};

module.exports = seedDefaultUsers;


