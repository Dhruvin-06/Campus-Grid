/**
 * One-shot script to create an admin user.
 * Usage: node scripts/createAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User     = require('../src/models/User');

const ADMIN = {
  name:       'Admin',
  email:      'admin@campusgrid.com',
  rollNumber: 'ADMIN001',
  password:   'Admin@123',
  role:       'admin',
  branch:     'CSE',
  isVerified: true,
  isActive:   true,
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create(ADMIN);
  console.log('Admin created successfully!');
  console.log('   Email     :', admin.email);
  console.log('   Password  : Admin@123');
  console.log('   Roll No   :', admin.rollNumber);
  process.exit(0);
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
