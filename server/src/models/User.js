const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'placement', 'admin'],
      default: 'student',
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'],
    },
    year: {
      type: Number,
      enum: [1, 2, 3, 4],
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 300,
    },
    skills: [{ type: String }],
    interests: [{ type: String }],
    technicalInterests: [{ type: String }],
    projectInterests: [{ type: String }],
    collaborationPrefs: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    github: { type: String, default: '' },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
    },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifications: [
      {
        message: String,
        type: { type: String, enum: ['info', 'success', 'warning', 'error'] },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Hash password before save (only if password exists and is modified)
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
