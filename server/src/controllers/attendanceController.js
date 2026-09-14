const Attendance = require('../models/Attendance');
const asyncHandler = require('express-async-handler');

// @desc  Get attendance for a semester
// @route GET /api/attendance?semester=Semester+1
const getAttendance = asyncHandler(async (req, res) => {
  const semester = req.query.semester || 'Semester 1';
  let att = await Attendance.findOne({ userId: req.user._id, semester });
  if (!att) {
    att = await Attendance.create({ userId: req.user._id, semester, subjects: [] });
  }
  res.json({ success: true, attendance: att });
});

// @desc  Add a subject to attendance
// @route POST /api/attendance/subjects
const addSubject = asyncHandler(async (req, res) => {
  const { semester, subject, teacher } = req.body;
  const att = await Attendance.findOneAndUpdate(
    { userId: req.user._id, semester },
    { $push: { subjects: { subject, teacher, totalClasses: 0, attendedClasses: 0, records: [] } } },
    { new: true, upsert: true }
  );
  res.status(201).json({ success: true, attendance: att });
});

// @desc  Log attendance for a subject
// @route POST /api/attendance/subjects/:subjectId/log
const logAttendance = asyncHandler(async (req, res) => {
  const { semester, date, status, note } = req.body;
  const att = await Attendance.findOne({ userId: req.user._id, semester });
  if (!att) return res.status(404).json({ success: false, message: 'Attendance record not found' });

  const subj = att.subjects.id(req.params.subjectId);
  if (!subj) return res.status(404).json({ success: false, message: 'Subject not found' });

  subj.records.push({ date: new Date(date), status, note });
  subj.totalClasses += 1;
  if (status === 'present' || status === 'late') subj.attendedClasses += 1;

  await att.save();
  res.json({ success: true, attendance: att });
});

// @desc  Remove a subject
// @route DELETE /api/attendance/subjects/:subjectId
const removeSubject = asyncHandler(async (req, res) => {
  const { semester } = req.query;
  const att = await Attendance.findOneAndUpdate(
    { userId: req.user._id, semester },
    { $pull: { subjects: { _id: req.params.subjectId } } },
    { new: true }
  );
  res.json({ success: true, attendance: att });
});

// @desc  Delete an attendance log entry
// @route DELETE /api/attendance/subjects/:subjectId/log/:recordId
const deleteRecord = asyncHandler(async (req, res) => {
  const { semester } = req.query;
  const att = await Attendance.findOne({ userId: req.user._id, semester });
  if (!att) return res.status(404).json({ success: false, message: 'Not found' });

  const subj = att.subjects.id(req.params.subjectId);
  if (!subj) return res.status(404).json({ success: false, message: 'Subject not found' });

  const record = subj.records.id(req.params.recordId);
  if (record) {
    if (record.status === 'present' || record.status === 'late') subj.attendedClasses = Math.max(0, subj.attendedClasses - 1);
    subj.totalClasses = Math.max(0, subj.totalClasses - 1);
    subj.records.pull(req.params.recordId);
  }
  await att.save();
  res.json({ success: true, attendance: att });
});

module.exports = { getAttendance, addSubject, logAttendance, removeSubject, deleteRecord };
