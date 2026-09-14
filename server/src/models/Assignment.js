const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    subject: { type: String, trim: true, default: '' },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    tags: [{ type: String, trim: true }],
    color: { type: String, default: '#6366f1' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

assignmentSchema.index({ userId: 1, status: 1 });
assignmentSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
