const GradeRecord = require('../models/GradeRecord');
const asyncHandler = require('express-async-handler');

// @desc  Get all grade records for user
// @route GET /api/grades
const getGrades = asyncHandler(async (req, res) => {
  const records = await GradeRecord.find({ userId: req.user._id }).sort({ semester: 1 });

  // Compute overall CGPA across all semesters
  let totalWeightedGP = 0;
  let totalCredits = 0;
  for (const rec of records) {
    for (const subj of rec.subjects) {
      if (subj.grade !== '-') {
        const gp = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 }[subj.grade] ?? 0;
        totalWeightedGP += subj.credits * gp;
        totalCredits += subj.credits;
      }
    }
  }
  const cgpa = totalCredits > 0 ? Math.round((totalWeightedGP / totalCredits) * 100) / 100 : 0;

  // Patch cgpa on each record (for display purposes we keep it current)
  const updated = records.map((r) => ({ ...r.toObject(), cgpa }));

  res.json({ success: true, records: updated, cgpa });
});

// @desc  Get or create a semester record
// @route GET /api/grades/:semester
const getSemesterRecord = asyncHandler(async (req, res) => {
  let record = await GradeRecord.findOne({ userId: req.user._id, semester: req.params.semester });
  if (!record) {
    record = await GradeRecord.create({ userId: req.user._id, semester: req.params.semester, subjects: [] });
  }
  res.json({ success: true, record });
});

// @desc  Add or update a semester record (replace subjects list)
// @route POST /api/grades
const upsertSemester = asyncHandler(async (req, res) => {
  const { semester, year, subjects } = req.body;
  const record = await GradeRecord.findOneAndUpdate(
    { userId: req.user._id, semester },
    { year, subjects },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, record });
});

// @desc  Delete a semester record
// @route DELETE /api/grades/:semester
const deleteSemester = asyncHandler(async (req, res) => {
  await GradeRecord.findOneAndDelete({ userId: req.user._id, semester: req.params.semester });
  res.json({ success: true, message: 'Semester record deleted' });
});

module.exports = { getGrades, getSemesterRecord, upsertSemester, deleteSemester };
