const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB...');
  const User = require('./src/models/User');

  // Remove existing demo accounts
  await User.deleteMany({ rollNumber: { $in: ['ADMIN001', 'CS21B001'] } });

  // Create Admin
  await User.create({
    name: 'Admin User',
    email: 'admin@campus.edu',
    password: 'admin123',
    rollNumber: 'ADMIN001',
    role: 'admin',
    branch: 'CSE',
    year: 4,
    isVerified: true,
    isActive: true,
    skills: ['Management', 'Node.js'],
  });

  // Create Student
  await User.create({
    name: 'Demo Student',
    email: 'student@campus.edu',
    password: 'student123',
    rollNumber: 'CS21B001',
    role: 'student',
    branch: 'CSE',
    year: 3,
    isVerified: true,
    isActive: true,
    skills: ['React', 'Python', 'Machine Learning'],
    interests: ['Open Source', 'AI', 'Web Dev'],
    bio: 'CSE student passionate about technology and innovation.',
  });

  console.log('');
  console.log('SUCCESS: Demo accounts created!');
  console.log('----------------------------------');
  console.log('Admin:   admin@campus.edu   / admin123');
  console.log('Student: student@campus.edu / student123');
  console.log('----------------------------------');
  process.exit(0);
}).catch(e => {
  console.log('ERROR:', e.message);
  process.exit(1);
});
