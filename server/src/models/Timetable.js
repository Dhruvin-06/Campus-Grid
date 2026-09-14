const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  subject: { type: String, required: true, trim: true },
  teacher: { type: String, trim: true, default: '' },
  room: { type: String, trim: true, default: '' },
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true },   // e.g. "10:00"
  color: { type: String, default: '#6366f1' },
  type: { type: String, enum: ['lecture', 'lab', 'tutorial', 'free'], default: 'lecture' },
});

const timetableSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    semester: { type: String, default: '' },
    slots: [slotSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);
