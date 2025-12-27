const mongoose = require('mongoose');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const bcrypt = require('bcryptjs');

// Seed data for users
const seedUsers = [
  {
    fullName: {
      firstName: 'John',
      lastName: 'Doe',
      middleInitial: 'A'
    },
    email: 'john.doe@smu.edu.ph',
    password: 'password123',
    accountType: 'personal',
    wallet: {
      balance: 1000.00,
      currency: 'PHP'
    },
  },
  {
    fullName: {
      firstName: 'Jane',
      lastName: 'Smith',
      middleInitial: 'B'
    },
    email: 'jane.smith@smu.edu.ph',
    password: 'password123',
    accountType: 'personal',
    wallet: {
      balance: 2500.00,
      currency: 'PHP'
    },
  },
  {
    fullName: {
      firstName: 'Bob',
      lastName: 'Johnson',
      middleInitial: 'C'
    },
    email: 'bob.johnson@smu.edu.ph',
    password: 'password123',
    accountType: 'business',
    businessInfo: {
      businessName: 'Tech Solutions Inc',
      businessType: 'services',
      websiteUrl: 'https://techsolutions.com',
      isVerified: true,
      verifiedAt: new Date()
    },
    wallet: {
      balance: 5000.00,
      currency: 'PHP'
    },
  },
  {
    fullName: {
      firstName: 'Alice',
      lastName: 'Williams',
      middleInitial: 'D'
    },
    email: 'alice.williams@smu.edu.ph',
    password: 'password123',
    accountType: 'business',
    businessInfo: {
      businessName: 'Food Express',
      businessType: 'food',
      websiteUrl: 'https://foodexpress.ph',
      isVerified: false
    },
    wallet: {
      balance: 0.00,
      currency: 'PHP'
    },
    role: 'user'
  }
];

// Seed data for employees
const seedEmployees = [
  {
    fullName: {
      firstName: 'Admin',
      lastName: 'User',
      middleInitial: 'A'
    },
    email: 'admin@smu.edu.ph',
    password: 'admin12345',
    role: 'admin',
    isVerified: true
  },
  {
    fullName: {
      firstName: 'Staff',
      lastName: 'User',
      middleInitial: 'S'
    },
    email: 'staff@smu.edu.ph',
    password: 'staff12345',
    role: 'staff',
    isVerified: true
  },
  {
    fullName: {
      firstName: 'Manager',
      lastName: 'One',
      middleInitial: 'M'
    },
    email: 'manager1@smu.edu.ph',
    password: 'manager123456',
    role: 'staff',
    isVerified: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banking-system');
      console.log('📦 Connected to MongoDB');
    }

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Employee.deleteMany({});

    // Seed users
    console.log('👥 Seeding users...');
    const createdUsers = [];

    for (const userData of seedUsers) {
      try {
        // Hash password manually since we're bypassing the model middleware
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const user = new User({
          ...userData,
          password: hashedPassword
        });

        await user.save();
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.fullName.firstName} ${user.fullName.lastName} (${user.email})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    // Seed employees
    console.log('👨‍💼 Seeding employees...');

    // Get the admin user to set as createdBy for employees
    const adminUser = createdUsers.find(user => user.email === 'john.doe@smu.edu.ph') ||
                     await User.findOne({ email: 'john.doe@smu.edu.ph' });

    for (const employeeData of seedEmployees) {
      try {
        const employee = new Employee({
          ...employeeData,
          createdBy: adminUser ? adminUser._id : null
        });

        await employee.save();
        console.log(`✅ Created employee: ${employee.fullName.firstName} ${employee.fullName.lastName} (${employee.email}) - Role: ${employee.role}`);
      } catch (error) {
        console.error(`❌ Error creating employee ${employeeData.email}:`, error.message);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users created: ${createdUsers.length}`);
    console.log(`   Employees created: ${seedEmployees.length}`);

    console.log('\n🔐 Login Credentials:');
    console.log('Users:');
    seedUsers.forEach(user => {
      console.log(`   ${user.email} - password: ${user.password}`);
    });
    console.log('Employees:');
    seedEmployees.forEach(employee => {
      console.log(`   ${employee.email} - password: ${employee.password} (Role: ${employee.role})`);
    });

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

// Function to clear all data
async function clearDatabase() {
  try {
    console.log('🧹 Clearing all data...');

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banking-system');
    }

    await User.deleteMany({});
    await Employee.deleteMany({});

    console.log('✅ All data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  seedDatabase,
  clearDatabase,
  seedUsers,
  seedEmployees
};

// If run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}