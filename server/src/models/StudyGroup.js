const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    subject: { type: String, required: true, trim: true },
    branch: {
      type: String,
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other', 'All'],
      default: 'All',
    },
    year: { type: Number, enum: [1, 2, 3, 4, 0], default: 0 }, // 0 = all years
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, default: 20 },
    isPublic: { type: Boolean, default: true },
    tags: [{ type: String, trim: true }],
    meetingLink: { type: String, default: '' },
    coverColor: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

studyGroupSchema.index({ branch: 1, year: 1 });
studyGroupSchema.index({ subject: 'text', name: 'text', description: 'text' });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
