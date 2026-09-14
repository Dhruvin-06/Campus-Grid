const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  note: { type: String, default: '' },
});

const subjectAttendanceSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  teacher: { type: String, trim: true, default: '' },
  totalClasses: { type: Number, default: 0 },
  attendedClasses: { type: Number, default: 0 },
  records: [recordSchema],
});

subjectAttendanceSchema.virtual('percentage').get(function () {
  if (this.totalClasses === 0) return 0;
  return Math.round((this.attendedClasses / this.totalClasses) * 100);
});

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: String, required: true },
    subjects: [subjectAttendanceSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Compound index: one attendance doc per user per semester
attendanceSchema.index({ userId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
