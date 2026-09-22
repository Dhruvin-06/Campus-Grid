const mongoose = require('mongoose');

// ─── Announcement Schema ───────────────────────────────────────────────────────

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['general', 'urgent', 'event', 'holiday', 'exam', 'placement'],
      default: 'general',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'faculty', 'placement', 'specific_branch', 'specific_year'],
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

// ─── CampusPost Schema (student/faculty campus feed posts) ─────────────────────
// Previously named "Blog" — renamed for clarity.

const campusPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    coverImage: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['achievement', 'event', 'project', 'general', 'placement', 'academic'],
      default: 'general',
    },
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

campusPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Announcement = mongoose.model('Announcement', announcementSchema);
const CampusPost = mongoose.model('CampusPost', campusPostSchema);

module.exports = { Announcement, CampusPost };
