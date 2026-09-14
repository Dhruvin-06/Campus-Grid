const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    type: {
      type: String,
      enum: ['fest', 'hackathon', 'seminar', 'workshop', 'sports', 'cultural', 'other'],
      default: 'other',
    },
    date: { type: Date, required: true },
    endDate: { type: Date },
    venue: { type: String, trim: true, default: '' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxAttendees: { type: Number, default: 0 }, // 0 = unlimited
    banner: { type: String, default: '' },
    registrationLink: { type: String, default: '' },
    tags: [{ type: String }],
    targetBranch: [{ type: String }], // empty = all branches
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, isPublished: 1 });

module.exports = mongoose.model('Event', eventSchema);
