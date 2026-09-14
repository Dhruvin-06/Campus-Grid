/**
 * Seed demo users: Admin + Student
 * Usage: node scripts/seedDemo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User     = require('../src/models/User');

const DEMO_USERS = [
  {
    name:       'Admin',
    email:      'admin@campus.edu',
    rollNumber: 'ADMIN0001',
    password:   'admin123',
    role:       'admin',
    branch:     'CSE',
    isVerified: true,
    isActive:   true,
  },
  {
    name:       'Demo Student',
    email:      'student@campus.edu',
    rollNumber: 'STU0001',
    password:   'student123',
    role:       'student',
    branch:     'CSE',
    year:       2,
    isVerified: true,
    isActive:   true,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  for (const data of DEMO_USERS) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      console.log(`[SKIP] ${data.role.toUpperCase()} already exists: ${data.email}`);
      continue;
    }
    const user = await User.create(data);
    console.log(`[OK]   ${data.role.toUpperCase()} created: ${user.email}  |  password: ${data.password}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
