// model/auditLog.js (preferred file name)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['UPLOAD', 'DOWNLOAD'], required: true },
  file: { type: Schema.Types.ObjectId, ref: 'File' },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  details: String,
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
