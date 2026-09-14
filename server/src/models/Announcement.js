const mongoose = require('mongoose');

// ─── Announcement Schema ───────────────────────────────────────────────────────

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['general', 'urgent', 'event', 'holiday', 'exam'],
      default: 'general',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'faculty', 'specific_branch', 'specific_year'],
      default: 'all',
    },
    targetBranch: { type: String },
    targetYear: { type: Number },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachmentUrl: { type: String, default: '' },
    expiresAt: { type: Date },
    isPinned: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Blog Schema ───────────────────────────────────────────────────────────────

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    coverImage: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'rejected'],
      default: 'pending_approval',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
const Blog = mongoose.model('Blog', blogSchema);

module.exports = { Announcement, Blog };
