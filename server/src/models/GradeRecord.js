const mongoose = require('mongoose');

const GRADE_POINTS = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0,
};

const subjectGradeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, default: '' },
  credits: { type: Number, required: true, min: 1, max: 6 },
  grade: {
    type: String,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', '-'],
    default: '-',
  },
  internalMarks: { type: Number, default: 0, min: 0, max: 50 },
  externalMarks: { type: Number, default: 0, min: 0, max: 50 },
});

subjectGradeSchema.virtual('gradePoint').get(function () {
  return GRADE_POINTS[this.grade] ?? 0;
});

const gradeRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: String, required: true }, // e.g. "Semester 1", "Semester 3"
    year: { type: Number, enum: [1, 2, 3, 4] },
    subjects: [subjectGradeSchema],
    sgpa: { type: Number, default: 0 },
    cgpa: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

gradeRecordSchema.index({ userId: 1, semester: 1 }, { unique: true });

// Auto-calculate SGPA before save
gradeRecordSchema.pre('save', function () {
  const subjects = this.subjects.filter((s) => s.grade !== '-' && s.grade !== 'F');
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const weightedSum = subjects.reduce((sum, s) => sum + s.credits * (GRADE_POINTS[s.grade] ?? 0), 0);
  this.sgpa = totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : 0;
});

module.exports = mongoose.model('GradeRecord', gradeRecordSchema);
