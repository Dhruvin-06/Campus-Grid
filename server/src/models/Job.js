const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
    },
    type: {
      type: String,
      enum: ['placement', 'internship', 'hackathon', 'competition', 'scholarship'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    eligibility: {
      branches: [{ type: String }],
      minCGPA: { type: Number, default: 0 },
      yearOfPassing: [{ type: Number }],
      backlogs: { type: Number, default: 0 },
      otherCriteria: { type: String, default: '' },
    },
    package: {
      type: String, // e.g., "6 LPA", "10-12 LPA"
    },
    stipend: {
      type: String, // for internships
    },
    location: {
      type: String,
    },
    deadline: {
      type: Date,
    },
    applyLink: {
      type: String,
    },
    companyLogo: {
      type: String,
      default: '',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
