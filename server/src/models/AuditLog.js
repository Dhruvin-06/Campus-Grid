const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String },
    action: { type: String, required: true }, // e.g. 'USER_BANNED', 'RESOURCE_APPROVED'
    targetModel: { type: String }, // 'User', 'Resource', etc.
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
