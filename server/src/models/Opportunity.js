const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    // ─── Core Identity ──────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    company: {
      type: String,
      required: [true, 'Company/Organization is required'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['placement', 'internship', 'hackathon'],
      required: [true, 'Opportunity type is required'],
    },

    // ─── Skills & Eligibility ────────────────────────────────────────────────────
    skills: [{ type: String, trim: true }],
    eligibility: { type: String, default: '' },
    branch: {
      type: [String],
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other', 'All'],
      default: ['All'],
    },
    graduationYear: { type: Number },        // e.g. 2025 — who can apply
    minCGPA: { type: Number, default: 0 },   // 0 = no minimum

    // ─── Details ─────────────────────────────────────────────────────────────────
    location: { type: String, default: 'Remote' },
    packageOrStipend: { type: String, default: '' }, // "12 LPA" or "₹20,000/month"
    deadline: { type: Date },
    applicationLink: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },

    // ─── Administration ───────────────────────────────────────────────────────────
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isVerified: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },    // can archive without deleting

    // ─── Engagement ──────────────────────────────────────────────────────────────
    views: { type: Number, default: 0 },
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // bookmarks
  },
  { timestamps: true }
);

// Indexes for fast discovery queries
opportunitySchema.index({ type: 1, isPublished: 1, isActive: 1 });
opportunitySchema.index({ deadline: 1, isPublished: 1 });
opportunitySchema.index({ branch: 1 });
opportunitySchema.index({ skills: 1 });
opportunitySchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
