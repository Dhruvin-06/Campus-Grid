const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    branch: {
      type: String,
      required: true,
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other', 'All'],
    },
    year: {
      type: Number,
      enum: [1, 2, 3, 4],
    },
    type: {
      type: String,
      enum: ['notes', 'pyq', 'assignment', 'reference', 'lab_manual', 'other'],
      default: 'notes',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String, // Cloudinary public_id for deletion
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    tags: [{ type: String }],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    approved: {
      type: Boolean,
      default: false, // Admin must approve
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Vector IDs stored in ChromaDB for RAG
    vectorIds: [{ type: String }],
    isEmbedded: {
      type: Boolean,
      default: false,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

resourceSchema.index({ subject: 'text', title: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
